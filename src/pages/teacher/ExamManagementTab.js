import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import examService from "../../services/examService";
import API from "../../api";
import "./ExamManagementTab.css";

const ExamManagementTab = () => {
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    course: "",
    subject: "",
    examType: "",
    status: "", // upcoming, active, completed
  });

  useEffect(() => {
    fetchCourses();
    fetchSubjects();
    fetchExams();
  }, [filters]);

  const fetchCourses = async () => {
    try {
      const response = await API.get("/api/courses?populate=*");
      const coursesData =
        response.data.data ||
        (Array.isArray(response.data)
          ? response.data
          : [response.data].filter(Boolean));
      setCourses(coursesData);
    } catch (err) {
      console.error("Error loading courses:", err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await API.get("/api/subjects?populate=*");
      const subjectsData =
        response.data.data ||
        (Array.isArray(response.data)
          ? response.data
          : [response.data].filter(Boolean));
      setSubjects(subjectsData);
    } catch (err) {
      console.error("Error loading subjects:", err);
    }
  };

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await examService.getAllExams(filters);
      console.log("Exams API response:", response);

      // Handle multiple response formats
      const examsData =
        response.data ||
        (Array.isArray(response) ? response : [response].filter(Boolean));

      console.log("Parsed exams:", examsData);
      setExams(examsData);
    } catch (err) {
      setError("Failed to load exams");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      course: "",
      subject: "",
      examType: "",
      status: "",
    });
  };

  const handleDelete = async (examId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this exam? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await examService.deleteExam(examId);
      setExams(exams.filter((exam) => exam.id !== examId));
      alert("Exam deleted successfully");
    } catch (err) {
      alert("Failed to delete exam");
      console.error("Error:", err);
    }
  };

  const getExamTypeColor = (type) => {
    const colors = {
      quiz: "#4caf50",
      midterm: "#ff9800",
      final: "#f44336",
      practice: "#2196f3",
      assignment: "#9c27b0",
    };
    return colors[type] || "#999";
  };

  const getExamStatus = (exam) => {
    const now = new Date();
    const startDate = exam.startDate ? new Date(exam.startDate) : null;
    const endDate = exam.endDate ? new Date(exam.endDate) : null;

    if (!startDate || !endDate) return "scheduled";

    if (now < startDate) return "upcoming";
    if (now > endDate) return "completed";
    return "active";
  };

  const getStatusBadge = (status) => {
    const statusInfo = {
      upcoming: { label: "Upcoming", class: "status-upcoming" },
      active: { label: "Active", class: "status-active" },
      completed: { label: "Completed", class: "status-completed" },
      scheduled: { label: "Scheduled", class: "status-scheduled" },
    };
    return statusInfo[status] || statusInfo["scheduled"];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter exams by status if filter is set
  const filteredExams = exams.filter((exam) => {
    if (!filters.status) return true;
    return getExamStatus(exam) === filters.status;
  });

  if (loading && exams.length === 0) {
    return <div className="loading">Loading exams...</div>;
  }

  return (
    <div className="exam-management-tab">
      <div className="tab-header">
        <h2>Exam Management</h2>
        <button
          className="btn-primary"
          onClick={() => navigate("/teacher/exams/create")}
        >
          + Create New Exam
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Course</label>
          <select
            name="course"
            value={filters.course}
            onChange={handleFilterChange}
          >
            <option value="">All Courses</option>
            {courses.map((course) => {
              const courseName =
                course.name || course.attributes?.name || "Unnamed Course";
              // Prioritize documentId for Strapi v5
              const courseId = course.documentId || course.id;
              return (
                <option key={courseId} value={courseId}>
                  {courseName}
                </option>
              );
            })}
          </select>
        </div>

        <div className="filter-group">
          <label>Subject</label>
          <select
            name="subject"
            value={filters.subject}
            onChange={handleFilterChange}
          >
            <option value="">All Subjects</option>
            {subjects.map((subject) => {
              const subjectName =
                subject.name || subject.attributes?.name || "Unnamed Subject";
              // Prioritize documentId for Strapi v5
              const subjectId = subject.documentId || subject.id;
              return (
                <option key={subjectId} value={subjectId}>
                  {subjectName}
                </option>
              );
            })}
          </select>
        </div>

        <div className="filter-group">
          <label>Exam Type</label>
          <select
            name="examType"
            value={filters.examType}
            onChange={handleFilterChange}
          >
            <option value="">All Types</option>
            <option value="quiz">Quiz</option>
            <option value="midterm">Midterm</option>
            <option value="final">Final</option>
            <option value="practice">Practice</option>
            <option value="assignment">Assignment</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>

        <button className="btn-secondary" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      {/* Exams Grid */}
      {error && <div className="error-message">{error}</div>}

      {filteredExams.length === 0 ? (
        <div className="empty-state">
          <p>No exams found</p>
          <button
            className="btn-primary"
            onClick={() => navigate("/teacher/exams/create")}
          >
            Create Your First Exam
          </button>
        </div>
      ) : (
        <div className="exams-grid">
          {filteredExams.map((exam) => {
            const status = getExamStatus(exam);
            const statusBadge = getStatusBadge(status);
            const questionCount =
              exam.questions?.data?.length || exam.questions?.length || 0;

            return (
              <div key={exam.id} className="exam-card">
                <div className="exam-card-header">
                  <span
                    className="exam-type-badge"
                    style={{ backgroundColor: getExamTypeColor(exam.examType) }}
                  >
                    {exam.examType || "quiz"}
                  </span>
                  <span className={`status-badge ${statusBadge.class}`}>
                    {statusBadge.label}
                  </span>
                </div>

                <h3 className="exam-title">{exam.title || "Untitled Exam"}</h3>

                {exam.description && (
                  <div className="exam-description">
                    {exam.description.substring(0, 150)}...
                  </div>
                )}

                <div className="exam-meta">
                  {exam.course?.data && (
                    <div className="meta-item">
                      <strong>Course:</strong>{" "}
                      {exam.course.data.attributes?.name ||
                        exam.course.data.name}
                    </div>
                  )}
                  {exam.course && !exam.course.data && exam.course.name && (
                    <div className="meta-item">
                      <strong>Course:</strong> {exam.course.name}
                    </div>
                  )}
                  {exam.subject?.data && (
                    <div className="meta-item">
                      <strong>Subject:</strong>{" "}
                      {exam.subject.data.attributes?.name ||
                        exam.subject.data.name}
                    </div>
                  )}
                  {exam.subject && !exam.subject.data && exam.subject.name && (
                    <div className="meta-item">
                      <strong>Subject:</strong> {exam.subject.name}
                    </div>
                  )}
                </div>

                <div className="exam-stats">
                  <div className="stat-item">
                    <span className="stat-label">Questions</span>
                    <span className="stat-value">{questionCount}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Duration</span>
                    <span className="stat-value">{exam.duration || 0} min</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Points</span>
                    <span className="stat-value">
                      {exam.totalPoints || 100}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Passing</span>
                    <span className="stat-value">
                      {exam.passingScore || 60}%
                    </span>
                  </div>
                </div>

                <div className="exam-dates">
                  <div className="date-item">
                    <strong>Start:</strong> {formatDate(exam.startDate)}
                  </div>
                  <div className="date-item">
                    <strong>End:</strong> {formatDate(exam.endDate)}
                  </div>
                </div>

                <div className="exam-card-actions">
                  <button
                    className="btn-icon"
                    onClick={() => navigate(`/teacher/exams/${exam.id}`)}
                    title="View Details"
                  >
                    👁️ View
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => navigate(`/teacher/exams/edit/${exam.id}`)}
                    title="Edit Exam"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => handleDelete(exam.id)}
                    title="Delete Exam"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExamManagementTab;
