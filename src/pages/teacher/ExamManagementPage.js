import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import examService from "../../services/examService";
import API from "../../api";
import "./ExamManagementPage.css";

const ExamManagementPage = () => {
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
  });

  useEffect(() => {
    fetchCourses();
    fetchSubjects();
    fetchExams();
  }, [filters]);

  const fetchCourses = async () => {
    try {
      console.log("Fetching courses...");
      const response = await API.get("/api/courses?populate=*");
      console.log("Courses response:", response.data);
      setCourses(response.data.data || []);
    } catch (err) {
      console.error("Error loading courses:", err);
      console.error("Error details:", err.response?.data);
    }
  };

  const fetchSubjects = async () => {
    try {
      console.log("Fetching subjects...");
      const response = await API.get("/api/subjects?populate=*");
      console.log("Subjects response:", response.data);
      setSubjects(response.data.data || []);
    } catch (err) {
      console.error("Error loading subjects:", err);
      console.error("Error details:", err.response?.data);
    }
  };

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await examService.getAllExams(filters);
      setExams(response.data || []);
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
    const startDate = exam.attributes?.startDate
      ? new Date(exam.attributes.startDate)
      : null;
    const endDate = exam.attributes?.endDate
      ? new Date(exam.attributes.endDate)
      : null;

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

  if (loading) {
    return (
      <div className="exam-management-page">
        <div className="loading">Loading exams...</div>
      </div>
    );
  }

  return (
    <div className="exam-management-page">
      <div className="page-header">
        <h1>Exam Management</h1>
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
            {courses.map((course) => (
              <option
                key={course.documentId || course.id}
                value={course.documentId || course.id}
              >
                {course.attributes?.name}
              </option>
            ))}
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
            {subjects.map((subject) => (
              <option
                key={subject.documentId || subject.id}
                value={subject.documentId || subject.id}
              >
                {subject.attributes?.name}
              </option>
            ))}
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
      </div>

      {/* Exams Grid */}
      {error && <div className="error-message">{error}</div>}

      {exams.length === 0 ? (
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
          {exams.map((exam) => {
            const status = getExamStatus(exam);
            const statusBadge = getStatusBadge(status);
            const questionCount = exam.attributes?.questions?.data?.length || 0;

            return (
              <div key={exam.id} className="exam-card">
                <div className="exam-card-header">
                  <span
                    className="exam-type-badge"
                    style={{
                      backgroundColor: getExamTypeColor(
                        exam.attributes?.examType
                      ),
                    }}
                  >
                    {exam.attributes?.examType || "quiz"}
                  </span>
                  <span className={`status-badge ${statusBadge.class}`}>
                    {statusBadge.label}
                  </span>
                </div>

                <h3 className="exam-title">
                  {exam.attributes?.title || "Untitled Exam"}
                </h3>

                {exam.attributes?.description && (
                  <div
                    className="exam-description"
                    dangerouslySetInnerHTML={{
                      __html:
                        exam.attributes.description.substring(0, 150) + "...",
                    }}
                  />
                )}

                <div className="exam-meta">
                  {exam.attributes?.course?.data && (
                    <div className="meta-item">
                      <strong>Course:</strong>{" "}
                      {exam.attributes.course.data.attributes?.name}
                    </div>
                  )}
                  {exam.attributes?.subject?.data && (
                    <div className="meta-item">
                      <strong>Subject:</strong>{" "}
                      {exam.attributes.subject.data.attributes?.name}
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
                    <span className="stat-value">
                      {exam.attributes?.duration || 0} min
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Points</span>
                    <span className="stat-value">
                      {exam.attributes?.totalPoints || 100}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Passing</span>
                    <span className="stat-value">
                      {exam.attributes?.passingScore || 60}%
                    </span>
                  </div>
                </div>

                <div className="exam-dates">
                  <div className="date-item">
                    <strong>Start:</strong>{" "}
                    {formatDate(exam.attributes?.startDate)}
                  </div>
                  <div className="date-item">
                    <strong>End:</strong> {formatDate(exam.attributes?.endDate)}
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

export default ExamManagementPage;
