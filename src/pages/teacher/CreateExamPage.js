import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import examService from "../../services/examService";
import questionService from "../../services/questionService";
import API from "../../api";
import "./CreateExamPage.css";

const CreateExamPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [currentStep, setCurrentStep] = useState(1);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    examType: "quiz",
    duration: 60,
    totalPoints: 100,
    passingScore: 60,
    startDate: "",
    endDate: "",
    maxAttempts: 1,
    shuffleQuestions: false,
    showResults: true,
    showCorrectAnswers: true,
    instructions: "",
    course: "",
    subject: "",
    questions: [],
  });

  const [questionFilters, setQuestionFilters] = useState({
    subject: "",
    course: "",
    questionType: "",
    difficultyLevel: "",
  });

  useEffect(() => {
    fetchCourses();
    fetchSubjects();
    if (isEditing) {
      fetchExam();
    }
  }, [id]);

  useEffect(() => {
    if (currentStep === 2) {
      fetchQuestions();
    }
  }, [currentStep, questionFilters]);

  const fetchCourses = async () => {
    try {
      console.log("Fetching courses...");
      const response = await API.get("/api/courses?populate=*");
      console.log("Courses response:", response.data);

      // Handle multiple response formats
      const coursesData =
        response.data.data ||
        (Array.isArray(response.data)
          ? response.data
          : [response.data].filter(Boolean));

      console.log("Parsed courses:", coursesData);
      setCourses(coursesData);
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

      // Handle multiple response formats
      const subjectsData =
        response.data.data ||
        (Array.isArray(response.data)
          ? response.data
          : [response.data].filter(Boolean));

      console.log("Parsed subjects:", subjectsData);
      setSubjects(subjectsData);
    } catch (err) {
      console.error("Error loading subjects:", err);
      console.error("Error details:", err.response?.data);
    }
  };

  const fetchExam = async () => {
    try {
      setLoading(true);
      const response = await examService.getExam(id);
      console.log("Fetch exam response:", response);

      // Handle different response formats
      const exam = response.data || response;
      console.log("Parsed exam:", exam);

      // Handle course - prioritize documentId for Strapi v5
      let courseId = "";
      if (exam.course) {
        if (exam.course.data) {
          courseId = exam.course.data.documentId || exam.course.data.id || "";
        } else if (exam.course.documentId || exam.course.id) {
          courseId = exam.course.documentId || exam.course.id || "";
        }
      }

      // Handle subject - prioritize documentId for Strapi v5
      let subjectId = "";
      if (exam.subject) {
        if (exam.subject.data) {
          subjectId =
            exam.subject.data.documentId || exam.subject.data.id || "";
        } else if (exam.subject.documentId || exam.subject.id) {
          subjectId = exam.subject.documentId || exam.subject.id || "";
        }
      }

      // Handle questions - prioritize documentId for Strapi v5
      let questionIds = [];
      if (exam.questions) {
        if (exam.questions.data) {
          questionIds = exam.questions.data.map((q) => q.documentId || q.id);
        } else if (Array.isArray(exam.questions)) {
          questionIds = exam.questions.map((q) => q.documentId || q.id);
        }
      }

      setFormData({
        title: exam.title || "",
        description: exam.description || "",
        examType: exam.examType || "quiz",
        duration: exam.duration || 60,
        totalPoints: exam.totalPoints || 100,
        passingScore: exam.passingScore || 60,
        startDate: exam.startDate ? exam.startDate.substring(0, 16) : "",
        endDate: exam.endDate ? exam.endDate.substring(0, 16) : "",
        maxAttempts: exam.maxAttempts || 1,
        shuffleQuestions: exam.shuffleQuestions || false,
        showResults: exam.showResults !== undefined ? exam.showResults : true,
        showCorrectAnswers:
          exam.showCorrectAnswers !== undefined
            ? exam.showCorrectAnswers
            : true,
        instructions: exam.instructions || "",
        course: courseId,
        subject: subjectId,
        questions: questionIds,
      });

      console.log("Form data set:", {
        courseId,
        subjectId,
        questionIds,
      });
    } catch (err) {
      alert("Failed to load exam");
      console.error("Error:", err);
      console.error("Error response:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await questionService.getAllQuestions(questionFilters);
      setAvailableQuestions(response.data || []);
    } catch (err) {
      console.error("Error loading questions:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleQuestionFilterChange = (e) => {
    const { name, value } = e.target;
    setQuestionFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleQuestionSelection = (questionId) => {
    setFormData((prev) => {
      const isSelected = prev.questions.includes(questionId);
      return {
        ...prev,
        questions: isSelected
          ? prev.questions.filter((id) => id !== questionId)
          : [...prev.questions, questionId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      alert("Exam title is required");
      return;
    }

    if (formData.questions.length === 0) {
      alert("Please select at least one question");
      return;
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        alert("End date must be after start date");
        return;
      }
    }

    try {
      setLoading(true);

      const examData = {
        title: formData.title,
        description: formData.description,
        examType: formData.examType,
        duration: parseInt(formData.duration),
        totalPoints: parseInt(formData.totalPoints),
        passingScore: parseInt(formData.passingScore),
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        maxAttempts: parseInt(formData.maxAttempts),
        shuffleQuestions: formData.shuffleQuestions,
        showResults: formData.showResults,
        showCorrectAnswers: formData.showCorrectAnswers,
        instructions: formData.instructions,
        // Keep question IDs as strings (documentId)
        questions: formData.questions.filter((q) => q),
      };

      // Only add course/subject if they have valid values - keep as strings (documentId)
      if (formData.course && formData.course !== "") {
        examData.course = formData.course;
      }
      if (formData.subject && formData.subject !== "") {
        examData.subject = formData.subject;
      }

      console.log("Submitting exam data:", examData);

      let result;
      if (isEditing) {
        result = await examService.updateExam(id, examData);
        console.log("Update result:", result);
        alert("Exam updated successfully!");
      } else {
        result = await examService.createExam(examData);
        console.log("Create result:", result);
        alert("Exam created successfully!");
      }

      navigate("/teacher/exams");
    } catch (err) {
      console.error("Failed to save exam:", err);
      console.error("Error response:", err.response?.data);
      alert(
        `Failed to save exam: ${
          err.response?.data?.error?.message || err.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && !formData.title.trim()) {
      alert("Please enter exam title");
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const getDifficultyColor = (level) => {
    const colors = {
      easy: "#4caf50",
      medium: "#ff9800",
      hard: "#f44336",
      expert: "#9c27b0",
    };
    return colors[level] || "#999";
  };

  if (loading && isEditing) {
    return (
      <div className="create-exam-page">
        <div className="loading">Loading exam...</div>
      </div>
    );
  }

  return (
    <div className="create-exam-page">
      <div className="page-header">
        <h1>{isEditing ? "Edit Exam" : "Create New Exam"}</h1>
        <button
          className="btn-secondary"
          onClick={() => navigate("/teacher/exams")}
        >
          ← Back to Exams
        </button>
      </div>

      {/* Progress Steps */}
      <div className="progress-steps">
        <div className={`step ${currentStep >= 1 ? "active" : ""}`}>
          <div className="step-number">1</div>
          <div className="step-label">Basic Details</div>
        </div>
        <div className={`step ${currentStep >= 2 ? "active" : ""}`}>
          <div className="step-number">2</div>
          <div className="step-label">Select Questions</div>
        </div>
        <div className={`step ${currentStep >= 3 ? "active" : ""}`}>
          <div className="step-number">3</div>
          <div className="step-label">Settings & Review</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="exam-form">
        {/* Step 1: Basic Details */}
        {currentStep === 1 && (
          <div className="form-step">
            <h2>Basic Information</h2>

            <div className="form-group">
              <label>Exam Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Midterm Exam - Introduction to Programming"
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                placeholder="Provide a brief description of the exam..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Exam Type *</label>
                <select
                  name="examType"
                  value={formData.examType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="quiz">Quiz</option>
                  <option value="midterm">Midterm</option>
                  <option value="final">Final</option>
                  <option value="practice">Practice</option>
                  <option value="assignment">Assignment</option>
                </select>
              </div>

              <div className="form-group">
                <label>Course</label>
                <select
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                >
                  <option value="">Select Course (Optional)</option>
                  {courses.map((course) => {
                    const courseName =
                      course.name ||
                      course.attributes?.name ||
                      "Unnamed Course";
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

              <div className="form-group">
                <label>Subject</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                >
                  <option value="">Select Subject (Optional)</option>
                  {subjects.map((subject) => {
                    const subjectName =
                      subject.name ||
                      subject.attributes?.name ||
                      "Unnamed Subject";
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
            </div>

            <div className="form-group">
              <label>Instructions</label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleInputChange}
                rows="4"
                placeholder="Instructions for students taking the exam..."
              />
            </div>
          </div>
        )}

        {/* Step 2: Select Questions */}
        {currentStep === 2 && (
          <div className="form-step">
            <h2>Select Questions ({formData.questions.length} selected)</h2>

            {/* Question Filters */}
            <div className="question-filters">
              <select
                name="course"
                value={questionFilters.course}
                onChange={handleQuestionFilterChange}
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

              <select
                name="subject"
                value={questionFilters.subject}
                onChange={handleQuestionFilterChange}
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => {
                  const subjectName =
                    subject.name ||
                    subject.attributes?.name ||
                    "Unnamed Subject";
                  // Prioritize documentId for Strapi v5
                  const subjectId = subject.documentId || subject.id;
                  return (
                    <option key={subjectId} value={subjectId}>
                      {subjectName}
                    </option>
                  );
                })}
              </select>

              <select
                name="questionType"
                value={questionFilters.questionType}
                onChange={handleQuestionFilterChange}
              >
                <option value="">All Types</option>
                <option value="multiple-choice">Multiple Choice</option>
                <option value="true-false">True/False</option>
                <option value="short-answer">Short Answer</option>
                <option value="essay">Essay</option>
                <option value="fill-in-blank">Fill in the Blank</option>
              </select>

              <select
                name="difficultyLevel"
                value={questionFilters.difficultyLevel}
                onChange={handleQuestionFilterChange}
              >
                <option value="">All Difficulty Levels</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            {/* Questions List */}
            <div className="questions-list">
              {availableQuestions.length === 0 ? (
                <div className="empty-state">No questions found</div>
              ) : (
                availableQuestions.map((question) => {
                  // Prioritize documentId for Strapi v5
                  const questionId = question.documentId || question.id;
                  const isSelected = formData.questions.includes(questionId);

                  return (
                    <div
                      key={questionId}
                      className={`question-item ${
                        isSelected ? "selected" : ""
                      }`}
                      onClick={() => toggleQuestionSelection(questionId)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                      />
                      <div className="question-content">
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
                          <span className="question-points">
                            {question?.points} pts
                          </span>
                        </div>
                        <div
                          className="question-text"
                          dangerouslySetInnerHTML={{
                            __html:
                              question?.questionText?.substring(0, 200) + "...",
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Step 3: Settings & Review */}
        {currentStep === 3 && (
          <div className="form-step">
            <h2>Exam Settings</h2>

            <div className="form-row">
              <div className="form-group">
                <label>Duration (minutes) *</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Total Points *</label>
                <input
                  type="number"
                  name="totalPoints"
                  value={formData.totalPoints}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Passing Score (%) *</label>
                <input
                  type="number"
                  name="passingScore"
                  value={formData.passingScore}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  required
                />
              </div>

              <div className="form-group">
                <label>Max Attempts *</label>
                <input
                  type="number"
                  name="maxAttempts"
                  value={formData.maxAttempts}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date & Time</label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>End Date & Time</label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="shuffleQuestions"
                  checked={formData.shuffleQuestions}
                  onChange={handleInputChange}
                />
                Shuffle Questions
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="showResults"
                  checked={formData.showResults}
                  onChange={handleInputChange}
                />
                Show Results to Students
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="showCorrectAnswers"
                  checked={formData.showCorrectAnswers}
                  onChange={handleInputChange}
                />
                Show Correct Answers After Submission
              </label>
            </div>

            {/* Review Summary */}
            <div className="review-summary">
              <h3>Review Your Exam</h3>
              <div className="summary-item">
                <strong>Title:</strong> {formData.title}
              </div>
              <div className="summary-item">
                <strong>Type:</strong> {formData.examType}
              </div>
              <div className="summary-item">
                <strong>Questions:</strong> {formData.questions.length} selected
              </div>
              <div className="summary-item">
                <strong>Duration:</strong> {formData.duration} minutes
              </div>
              <div className="summary-item">
                <strong>Total Points:</strong> {formData.totalPoints}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="form-navigation">
          {currentStep > 1 && (
            <button type="button" className="btn-secondary" onClick={prevStep}>
              ← Previous
            </button>
          )}
          <div className="nav-spacer"></div>
          {currentStep < 3 ? (
            <button type="button" className="btn-primary" onClick={nextStep}>
              Next →
            </button>
          ) : (
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading
                ? "Saving..."
                : isEditing
                ? "Update Exam"
                : "Create Exam"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreateExamPage;
