import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import examService from "../../services/examService";
import subjectService from "../../services/subjectService";
import gradeService from "../../services/gradeService";
import { AuthContext } from "../../AuthContext";
import "./ExamBrowser.css";

const ExamBrowser = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    subject: "",
    grade: "",
    difficultyLevel: "",
  });

  const [selectedExam, setSelectedExam] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadExams();
  }, [filters]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [subjectsData, gradesData] = await Promise.all([
        subjectService.getAllSubjects(),
        gradeService.getAllGrades(),
      ]);

      setSubjects(subjectsData || []);
      setGrades(gradesData || []);
    } catch (err) {
      console.error("Error loading initial data:", err);
      setError("Failed to load filter options");
    } finally {
      setLoading(false);
    }
  };

  const loadExams = async () => {
    try {
      setLoading(true);
      const filterParams = {};

      if (filters.search) filterParams.search = filters.search;
      if (filters.subject) filterParams.subject = filters.subject;
      if (filters.grade) filterParams.grade = filters.grade;
      if (filters.difficultyLevel)
        filterParams.difficultyLevel = filters.difficultyLevel;

      const response = await examService.getAllExams(filterParams);
      setExams(response.data || []);
      setError(null);
    } catch (err) {
      console.error("Error loading exams:", err);
      setError("Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setFilters((prev) => ({
      ...prev,
      search: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      subject: "",
      grade: "",
      difficultyLevel: "",
    });
  };

  const handleExamClick = (exam) => {
    setSelectedExam(exam);
  };

  const handleStartExam = () => {
    if (selectedExam) {
      navigate(`/student/exam-player/${selectedExam.id}`, {
        state: { exam: selectedExam },
      });
    }
  };

  const closeExamDetails = () => {
    setSelectedExam(null);
  };

  if (loading && exams.length === 0) {
    return (
      <div className="exam-browser-container">
        <div className="loading">Loading exams...</div>
      </div>
    );
  }

  return (
    <div className="exam-browser-container">
      <div className="exam-browser-header">
        <div className="header-content">
          <button
            onClick={() => navigate("/")}
            className="back-button"
            title="Back to Dashboard"
          >
            ← Back to Dashboard
          </button>
          <div className="header-text">
            <h2>Browse Exams</h2>
            <p>Select an exam to view details and start your test</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="exam-filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search exams by title..."
            value={filters.search}
            onChange={handleSearchChange}
            className="search-input"
          />
          <button onClick={loadExams} className="search-button">
            Search
          </button>
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="subject-filter">Subject</label>
            <select
              id="subject-filter"
              value={filters.subject}
              onChange={(e) => handleFilterChange("subject", e.target.value)}
              className="filter-select"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option
                  key={subject.documentId || subject.id}
                  value={subject.documentId || subject.id}
                >
                  {subject.name || subject.title}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="grade-filter">Grade</label>
            <select
              id="grade-filter"
              value={filters.grade}
              onChange={(e) => handleFilterChange("grade", e.target.value)}
              className="filter-select"
            >
              <option value="">All Grades</option>
              {grades.map((grade) => (
                <option
                  key={grade.documentId || grade.id}
                  value={grade.documentId || grade.id}
                >
                  {grade.name || `Grade ${grade.gradeLevel}`}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="difficulty-filter">Difficulty</label>
            <select
              id="difficulty-filter"
              value={filters.difficultyLevel}
              onChange={(e) =>
                handleFilterChange("difficultyLevel", e.target.value)
              }
              className="filter-select"
            >
              <option value="">All Levels</option>
              <option value="1">Level 1 (Easy)</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3 (Medium)</option>
              <option value="4">Level 4</option>
              <option value="5">Level 5 (Hard)</option>
            </select>
          </div>

          <button onClick={clearFilters} className="clear-filters-btn">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Exam List */}
      <div className="exam-list-section">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : exams.length === 0 ? (
          <div className="no-exams">
            <p>No exams found matching your criteria.</p>
          </div>
        ) : (
          <div className="exam-grid">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="exam-card"
                onClick={() => handleExamClick(exam)}
              >
                <div className="exam-card-header">
                  <h3>{exam.title}</h3>
                  {exam.examType && (
                    <span className={`exam-type-badge ${exam.examType}`}>
                      {exam.examType}
                    </span>
                  )}
                </div>

                <div className="exam-card-body">
                  {exam.description && (
                    <p className="exam-description">{exam.description}</p>
                  )}

                  <div className="exam-meta">
                    {exam.subject?.data && (
                      <div className="exam-meta-item">
                        <strong>Subject:</strong> {exam.subject.data.name}
                      </div>
                    )}
                    {exam.totalMarks && (
                      <div className="exam-meta-item">
                        <strong>Total Marks:</strong> {exam.totalMarks}
                      </div>
                    )}
                    {exam.duration && (
                      <div className="exam-meta-item">
                        <strong>Duration:</strong> {exam.duration} minutes
                      </div>
                    )}
                    {exam.questions?.data && (
                      <div className="exam-meta-item">
                        <strong>Questions:</strong> {exam.questions.data.length}
                      </div>
                    )}
                    {exam.difficultyLevel && (
                      <div className="exam-meta-item">
                        <strong>Difficulty:</strong> Level{" "}
                        {exam.difficultyLevel}
                      </div>
                    )}
                  </div>
                </div>

                <div className="exam-card-footer">
                  <button className="view-details-btn">View Details</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exam Details Modal */}
      {selectedExam && (
        <div className="exam-details-modal" onClick={closeExamDetails}>
          <div
            className="exam-details-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="exam-details-header">
              <h2>{selectedExam.title}</h2>
              <button className="close-modal-btn" onClick={closeExamDetails}>
                ×
              </button>
            </div>

            <div className="exam-details-body">
              {selectedExam.description && (
                <div className="detail-section">
                  <h4>Description</h4>
                  <p>{selectedExam.description}</p>
                </div>
              )}

              {selectedExam.instructions && (
                <div className="detail-section">
                  <h4>Instructions</h4>
                  <p>{selectedExam.instructions}</p>
                </div>
              )}

              <div className="detail-section">
                <h4>Exam Information</h4>
                <div className="exam-info-grid">
                  {selectedExam.subject?.data && (
                    <div className="info-item">
                      <strong>Subject:</strong> {selectedExam.subject.data.name}
                    </div>
                  )}
                  {selectedExam.course?.data && (
                    <div className="info-item">
                      <strong>Course:</strong> {selectedExam.course.data.name}
                    </div>
                  )}
                  {selectedExam.totalMarks && (
                    <div className="info-item">
                      <strong>Total Marks:</strong> {selectedExam.totalMarks}
                    </div>
                  )}
                  {selectedExam.passingMarks && (
                    <div className="info-item">
                      <strong>Passing Marks:</strong>{" "}
                      {selectedExam.passingMarks}
                    </div>
                  )}
                  {selectedExam.duration && (
                    <div className="info-item">
                      <strong>Duration:</strong> {selectedExam.duration} minutes
                    </div>
                  )}
                  {selectedExam.questions?.data && (
                    <div className="info-item">
                      <strong>Total Questions:</strong>{" "}
                      {selectedExam.questions.data.length}
                    </div>
                  )}
                  {selectedExam.difficultyLevel && (
                    <div className="info-item">
                      <strong>Difficulty Level:</strong>{" "}
                      {selectedExam.difficultyLevel}
                    </div>
                  )}
                  {selectedExam.examType && (
                    <div className="info-item">
                      <strong>Exam Type:</strong> {selectedExam.examType}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="exam-details-footer">
              <button className="cancel-btn" onClick={closeExamDetails}>
                Cancel
              </button>
              <button className="start-exam-btn" onClick={handleStartExam}>
                Start Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamBrowser;
