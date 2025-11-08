import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import questionService from "../../services/questionService";
import API from "../../api";
import "./QuestionBankPage.css";

const QuestionBankPage = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({
    course: "",
    subject: "",
    questionType: "",
    difficultyLevel: "",
  });
  console.log("Current questions:", questions);
  // Load courses and subjects
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching courses and subjects...");
        const [coursesRes, subjectsRes] = await Promise.all([
          API.get("/api/courses?populate=*"),
          API.get("/api/subjects?populate=*"),
        ]);
        console.log("Courses response:", coursesRes.data);
        console.log("Subjects response:", subjectsRes.data);
        setCourses(coursesRes.data.data || []);
        setSubjects(subjectsRes.data.data || []);
      } catch (err) {
        console.error("Error loading data:", err);
        console.error("Error details:", err.response?.data);
      }
    };
    fetchData();
  }, []);

  // Load questions
  useEffect(() => {
    fetchQuestions();
  }, [filters]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await questionService.getAllQuestions(filters);
      setQuestions(response.data || []);
      setError(null);
    } catch (err) {
      setError("Failed to load questions");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return;
    }

    try {
      await questionService.deleteQuestion(id);
      fetchQuestions();
    } catch (err) {
      alert("Failed to delete question");
      console.error("Error:", err);
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
      questionType: "",
      difficultyLevel: "",
    });
  };

  const getDifficultyColor = (level) => {
    const colors = {
      easy: "#4caf50",
      medium: "#ff9800",
      hard: "#f44336",
      expert: "#9c27b0",
    };
    return colors[level] || "#757575";
  };

  return (
    <div className="question-bank-page">
      <div className="page-header">
        <h1>Question Bank</h1>
        <button
          className="btn-primary"
          onClick={() => navigate("/teacher/questions/create")}
        >
          + Create Question
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
                {course?.name}
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
                {subject?.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Question Type</label>
          <select
            name="questionType"
            value={filters.questionType}
            onChange={handleFilterChange}
          >
            <option value="">All Types</option>
            <option value="multiple-choice">Multiple Choice</option>
            <option value="true-false">True/False</option>
            <option value="short-answer">Short Answer</option>
            <option value="essay">Essay</option>
            <option value="fill-in-blank">Fill in the Blank</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Difficulty</label>
          <select
            name="difficultyLevel"
            value={filters.difficultyLevel}
            onChange={handleFilterChange}
          >
            <option value="">All Levels</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="expert">Expert</option>
          </select>
        </div>

        <button className="btn-secondary" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      {/* Questions List */}
      <div className="questions-container">
        {loading ? (
          <div className="loading">Loading questions...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : questions.length === 0 ? (
          <div className="empty-state">
            <p>No questions found. Create your first question!</p>
          </div>
        ) : (
          <div className="questions-grid">
            {questions.map((question) => (
              <div key={question.id} className="question-card">
                <div className="question-header">
                  <span
                    className="difficulty-badge"
                    style={{
                      backgroundColor: getDifficultyColor(
                        question?.difficultyLevel
                      ),
                    }}
                  >
                    {question?.difficultyLevel}
                  </span>
                  <span className="question-type">
                    {question?.questionType}
                  </span>
                  <span className="points-badge">{question?.points} pts</span>
                </div>

                <div className="question-content">
                  <div
                    className="question-text"
                    dangerouslySetInnerHTML={{
                      __html: question?.questionText?.substring(0, 200) || "",
                    }}
                  />

                  {/* Display options for multiple-choice and true-false */}
                  {(question?.questionType === "multiple-choice" ||
                    question?.questionType === "true-false") &&
                    question?.options &&
                    question.options.length > 0 && (
                      <div className="question-options">
                        {question.options.map((option, idx) => (
                          <div
                            key={idx}
                            className={`option-item ${
                              option.isCorrect ? "correct-option" : ""
                            }`}
                          >
                            <span className="option-label">
                              {option.id?.toUpperCase() ||
                                String.fromCharCode(65 + idx)}
                              .
                            </span>
                            <span className="option-text">{option.text}</span>
                            {option.isCorrect && (
                              <span className="correct-indicator">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                <div className="question-meta">
                  {question?.course?.data && (
                    <span className="meta-item">
                      📚 {question.course.data.attributes?.name}
                    </span>
                  )}
                  {question?.subject?.data && (
                    <span className="meta-item">
                      📖 {question.subject.data.attributes?.name}
                    </span>
                  )}
                </div>

                <div className="question-actions">
                  <button
                    className="btn-icon"
                    onClick={() =>
                      navigate(`/teacher/questions/${question.id}`)
                    }
                    title="View"
                  >
                    👁️
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() =>
                      navigate(`/teacher/questions/edit/${question.id}`)
                    }
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => handleDelete(question.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionBankPage;
