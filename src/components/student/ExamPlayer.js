import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import examService from "../../services/examService";
import questionService from "../../services/questionService";
import examAttemptService from "../../services/examAttemptService";
import resultService from "../../services/resultService";
import { AuthContext } from "../../AuthContext";
import "./ExamPlayer.css";

const ExamPlayer = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const normalizeExamEntity = (examEntity) => {
    if (!examEntity) return null;
    if (examEntity.attributes && typeof examEntity.attributes === "object") {
      return { id: examEntity.id, ...examEntity.attributes };
    }
    return examEntity;
  };

  const extractRelationId = (relation) => {
    if (!relation) return null;
    if (typeof relation === "string") return relation; // Handle documentId strings
    if (typeof relation === "number") return relation;
    if (Array.isArray(relation)) {
      return relation.length > 0 ? extractRelationId(relation[0]) : null;
    }
    // Prioritize documentId for Strapi v5
    if (relation.documentId) return relation.documentId;
    if (relation.id) return relation.id;
    if (relation.data) return extractRelationId(relation.data);
    return null;
  };

  const evaluateGradeAndGpa = (percentage) => {
    const pct = Number(percentage) || 0;

    if (pct >= 90) return { grade: "A+", gpa: 4.0 };
    if (pct >= 85) return { grade: "A", gpa: 3.7 };
    if (pct >= 80) return { grade: "B+", gpa: 3.3 };
    if (pct >= 75) return { grade: "B", gpa: 3.0 };
    if (pct >= 70) return { grade: "C+", gpa: 2.7 };
    if (pct >= 65) return { grade: "C", gpa: 2.3 };
    if (pct >= 60) return { grade: "D+", gpa: 2.0 };
    if (pct >= 55) return { grade: "D", gpa: 1.7 };
    return { grade: "F", gpa: 0 };
  };

  const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  useEffect(() => {
    loadExam();
  }, [examId]);

  useEffect(() => {
    if (exam && exam.duration) {
      setTimeRemaining(exam.duration * 60); // Convert minutes to seconds
    }
  }, [exam]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishExam(true); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const loadExam = async () => {
    try {
      setLoading(true);

      // Try to get exam from location state first
      let examData = location.state?.exam;

      if (!examData) {
        const response = await examService.getExam(examId);
        examData = response.data;
      }

      setExam(examData);

      // Load questions - handle different data structures
      let examQuestions = [];

      if (examData.questions?.data && Array.isArray(examData.questions.data)) {
        // Questions populated with data wrapper
        examQuestions = examData.questions.data;
      } else if (Array.isArray(examData.questions)) {
        // Questions already an array
        examQuestions = examData.questions;
      } else if (examData.questions) {
        // Single question object
        examQuestions = [examData.questions];
      }

      console.log(
        "Loaded questions for exam:",
        examId,
        "Count:",
        examQuestions.length
      );
      setQuestions(examQuestions);

      if (examQuestions.length === 0) {
        setError("This exam has no questions. Please contact your teacher.");
      } else {
        setError(null);
      }
    } catch (err) {
      console.error("Error loading exam:", err);
      setError("Failed to load exam. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer, isMultipleSelect = false) => {
    if (isMultipleSelect) {
      // For multiple-select questions, toggle the answer in an array
      setAnswers((prev) => {
        const currentAnswers = prev[questionId] || [];
        const isSelected = currentAnswers.includes(answer);

        if (isSelected) {
          // Remove the answer
          return {
            ...prev,
            [questionId]: currentAnswers.filter((a) => a !== answer),
          };
        } else {
          // Add the answer
          return {
            ...prev,
            [questionId]: [...currentAnswers, answer],
          };
        }
      });
    } else {
      // For single-select questions, replace the answer
      setAnswers((prev) => ({
        ...prev,
        [questionId]: answer,
      }));
    }
  };

  const handleMarkForReview = (questionId) => {
    setMarkedForReview((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleQuestionNavigation = (index) => {
    setCurrentQuestionIndex(index);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const calculateScore = () => {
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    const questionResults = [];

    questions.forEach((question) => {
      const userAnswer = answers[question.id];
      let isCorrect = false;
      let correctAnswer = question.correctAnswer;

      // Handle multiple-choice questions with options array
      if (question.questionType === "multiple-choice" && question.options) {
        // Check if it's a multiple-select question (multiple correct answers)
        const correctOptions = question.options.filter((opt) => opt.isCorrect);
        const isMultipleSelect = correctOptions.length > 1;

        if (isMultipleSelect) {
          // For multiple-select: user must select ALL correct answers and NO incorrect ones
          const correctIds = correctOptions.map((opt) => opt.label || opt.id);
          const userAnswers = Array.isArray(userAnswer) ? userAnswer : [];

          // Check if arrays match (same elements, ignoring order)
          const sortedCorrect = [...correctIds].sort();
          const sortedUser = [...userAnswers].sort();
          isCorrect =
            JSON.stringify(sortedCorrect) === JSON.stringify(sortedUser);

          correctAnswer = correctIds.join(", ");
        } else {
          // For single-select: find the one correct answer
          const correctOption = correctOptions[0];
          if (correctOption) {
            correctAnswer = correctOption.label || correctOption.id;
          }
          // Check if user answer is correct
          if (userAnswer) {
            const selectedOption = question.options.find(
              (opt) => (opt.label || opt.id) === userAnswer
            );
            isCorrect = selectedOption?.isCorrect === true;
          }
        }
      } else {
        // For true-false and short-answer, compare directly
        isCorrect = userAnswer === correctAnswer;
      }

      if (
        !userAnswer ||
        (Array.isArray(userAnswer) && userAnswer.length === 0)
      ) {
        unanswered++;
      } else if (isCorrect) {
        correct++;
      } else {
        incorrect++;
      }

      questionResults.push({
        questionId: question.id,
        question: question.questionText || question.title,
        userAnswer: userAnswer || null,
        correctAnswer: correctAnswer,
        isCorrect: isCorrect,
        explanation: question.explanation || "",
        questionType: question.questionType,
        options: question.options || null,
        isMultipleSelect: question.options
          ? question.options.filter((opt) => opt.isCorrect).length > 1
          : false,
      });
    });

    const totalQuestions = questions.length;
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
    let earnedPoints = 0;

    questions.forEach((question) => {
      const userAnswer = answers[question.id];
      let isCorrect = false;

      if (question.questionType === "multiple-choice" && question.options) {
        const correctOptions = question.options.filter((opt) => opt.isCorrect);
        const isMultipleSelect = correctOptions.length > 1;

        if (isMultipleSelect) {
          const correctIds = correctOptions.map((opt) => opt.label || opt.id);
          const userAnswers = Array.isArray(userAnswer) ? userAnswer : [];
          const sortedCorrect = [...correctIds].sort();
          const sortedUser = [...userAnswers].sort();
          isCorrect =
            JSON.stringify(sortedCorrect) === JSON.stringify(sortedUser);
        } else {
          const selectedOption = question.options.find(
            (opt) => (opt.label || opt.id) === userAnswer
          );
          isCorrect = selectedOption?.isCorrect === true;
        }
      } else {
        isCorrect = userAnswer === question.correctAnswer;
      }

      if (isCorrect) {
        earnedPoints += question.points || 1;
      }
    });

    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    return {
      score: earnedPoints,
      correct,
      incorrect,
      unanswered,
      totalQuestions,
      totalPoints,
      percentage,
      questionResults,
    };
  };

  const handleFinishExam = async (autoSubmit = false) => {
    if (!autoSubmit) {
      const confirmed = window.confirm(
        "Are you sure you want to finish the exam? You cannot change your answers after submission."
      );
      if (!confirmed) return;
    }

    try {
      setSubmitting(true);

      const results = calculateScore();
      const normalizedExam = normalizeExamEntity(exam);

      // Extract IDs safely - prioritize documentId for Strapi v5
      const examIdValue =
        normalizedExam?.documentId ||
        normalizedExam?.id ||
        exam?.documentId ||
        exam?.id ||
        examId;
      const studentIdValue = user?.id || user?.documentId; // Users use numeric ID, not documentId

      console.log("User object:", user, "Student ID:", studentIdValue);

      if (!examIdValue) {
        throw new Error("Exam ID is missing");
      }
      if (!studentIdValue) {
        throw new Error("Student ID is missing");
      }

      console.log("Exam ID:", examIdValue, "Student ID:", studentIdValue);

      // Prepare answers in the format expected by exam-attempt
      const formattedAnswers = questions.map((question) => {
        const userAnswer = answers[question.id];
        let isCorrect = false;

        if (question.questionType === "multiple-choice" && question.options) {
          const correctOptions = question.options.filter(
            (opt) => opt.isCorrect
          );
          const isMultipleSelect = correctOptions.length > 1;

          if (isMultipleSelect) {
            const correctIds = correctOptions.map((opt) => opt.label || opt.id);
            const userAnswers = Array.isArray(userAnswer) ? userAnswer : [];
            const sortedCorrect = [...correctIds].sort();
            const sortedUser = [...userAnswers].sort();
            isCorrect =
              JSON.stringify(sortedCorrect) === JSON.stringify(sortedUser);
          } else {
            const selectedOption = question.options.find(
              (opt) => (opt.label || opt.id) === userAnswer
            );
            isCorrect = selectedOption?.isCorrect === true;
          }
        } else {
          isCorrect = userAnswer === question.correctAnswer;
        }

        return {
          questionId: question.id,
          answer: userAnswer || null,
          isCorrect: isCorrect,
          points: isCorrect ? question.points || 1 : 0,
        };
      });

      // Calculate time taken
      const examDuration = normalizedExam?.duration ?? exam?.duration;
      const timeTaken = examDuration
        ? examDuration * 60 - (timeRemaining || 0)
        : null;

      const passingScoreThreshold = toNumber(
        normalizedExam?.passingScore ?? exam?.passingScore ?? 60,
        60
      );

      // Create exam attempt
      const examAttemptData = {
        exam: examIdValue, // Keep as documentId string
        student: studentIdValue, // Keep as documentId string
        attemptNumber: 1, // You may want to calculate this based on previous attempts
        startedAt: new Date(Date.now() - (timeTaken || 0) * 1000).toISOString(),
        submittedAt: new Date().toISOString(),
        status: "submitted",
        score: toNumber(results.score),
        percentage: toNumber(results.percentage),
        passed: results.percentage >= passingScoreThreshold,
        timeTaken: timeTaken,
        answers: formattedAnswers,
      };

      console.log("Creating exam attempt with data:", examAttemptData);

      // Save exam attempt to server
      const savedExamAttempt = await examAttemptService.createExamAttempt(
        examAttemptData
      );

      console.log("Saved exam attempt:", savedExamAttempt);

      const { grade, gpa } = evaluateGradeAndGpa(results.percentage);
      const scoreValue = Number(toNumber(results.score).toFixed(2));
      const percentageValue = Number(toNumber(results.percentage).toFixed(2));
      const gpaValue = Number(toNumber(gpa).toFixed(2));
      const maxScoreValue = toNumber(
        normalizedExam?.totalPoints ?? results.totalPoints ?? questions.length,
        results.totalPoints || questions.length
      );
      const maxScoreNormalized = Number.isFinite(maxScoreValue)
        ? Number(maxScoreValue.toFixed(2))
        : toNumber(results.totalPoints || questions.length, questions.length);

      const courseRelation = normalizeExamEntity(
        normalizedExam?.course?.data ??
          normalizedExam?.course ??
          exam?.course?.data ??
          exam?.course
      );
      const subjectRelation = normalizeExamEntity(
        normalizedExam?.subject?.data ??
          normalizedExam?.subject ??
          exam?.subject?.data ??
          exam?.subject
      );
      const courseId = extractRelationId(courseRelation);
      const subjectId = extractRelationId(subjectRelation);
      const savedAttemptId =
        savedExamAttempt?.data?.documentId ||
        savedExamAttempt?.data?.id ||
        savedExamAttempt?.documentId ||
        savedExamAttempt?.id;

      console.log(
        "Course ID:",
        courseId,
        "Subject ID:",
        subjectId,
        "Attempt ID:",
        savedAttemptId
      );

      const resultPayload = {
        resultType: "exam",
        score: scoreValue,
        maxScore: maxScoreNormalized,
        percentage: percentageValue,
        grade,
        gpa: gpaValue,
        passed: results.percentage >= passingScoreThreshold,
        isPublished: true, // Auto-publish results so students can see them
        student: studentIdValue, // Keep as documentId string
        exam: examIdValue, // Keep as documentId string
        exam_attempt: savedAttemptId, // Keep as documentId string
      };

      if (courseId) {
        resultPayload.course = courseId; // Keep as documentId string
      }

      if (subjectId) {
        resultPayload.subject = subjectId; // Keep as documentId string
      }

      console.log("Creating result with payload:", resultPayload);

      const savedResult = await resultService.createResult(resultPayload);
      const createdResultData = savedResult?.data?.attributes
        ? { id: savedResult.data.id, ...savedResult.data.attributes }
        : savedResult?.data ?? savedResult;

      navigate(`/student/exam-result/${createdResultData.id}`, {
        state: {
          result: createdResultData,
          examAttempt: savedExamAttempt.data,
          results: results,
          exam: normalizeExamEntity(exam),
        },
      });
    } catch (err) {
      console.error("Error submitting exam:", err);
      alert("Failed to submit exam. Please try again.");
      setSubmitting(false);
    }
  };

  const handleExit = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    navigate("/student/exams");
  };

  const cancelExit = () => {
    setShowExitConfirm(false);
  };

  if (loading) {
    return (
      <div className="exam-player-container">
        <div className="loading">Loading exam...</div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="exam-player-container">
        <div className="error-message">{error || "Exam not found"}</div>
        <button onClick={() => navigate("/student/exams")} className="back-btn">
          Back to Exams
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="exam-player-container">
        <div className="error-message">
          No questions available for this exam.
        </div>
        <button onClick={() => navigate("/student/exams")} className="back-btn">
          Back to Exams
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="exam-player-container">
      {/* Header */}
      <div className="exam-player-header">
        <div className="exam-info">
          <h2>{exam.title}</h2>
          <p>
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>

        <div className="exam-controls">
          {timeRemaining !== null && (
            <div className={`timer ${timeRemaining < 300 ? "warning" : ""}`}>
              <span className="timer-icon">⏱</span>
              <span className="timer-text">{formatTime(timeRemaining)}</span>
            </div>
          )}
          <button onClick={handleExit} className="exit-btn">
            Exit
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="exam-player-content">
        {/* Question Panel */}
        <div className="question-panel">
          <div className="question-header">
            <h3>Question {currentQuestionIndex + 1}</h3>
            {currentQuestion.marks && (
              <span className="question-marks">
                Marks: {currentQuestion.marks}
              </span>
            )}
          </div>

          <div className="question-text">
            <div
              dangerouslySetInnerHTML={{
                __html: currentQuestion.questionText || currentQuestion.title,
              }}
            />
          </div>

          {/* Options */}
          <div className="options-container">
            {currentQuestion.questionType === "multiple-choice" &&
            currentQuestion.options ? (
              (() => {
                // Check if it's multiple-select (multiple correct answers)
                const correctOptions = currentQuestion.options.filter(
                  (opt) => opt.isCorrect
                );
                const isMultipleSelect = correctOptions.length > 1;
                const currentAnswers = answers[currentQuestion.id];
                const userAnswers = Array.isArray(currentAnswers)
                  ? currentAnswers
                  : [];

                return (
                  <>
                    {isMultipleSelect && (
                      <div className="multiple-select-hint">
                        <span className="hint-icon">ℹ️</span>
                        <span>
                          Select all correct answers (Multiple answers possible)
                        </span>
                      </div>
                    )}
                    {currentQuestion.options.map((option) => {
                      const optionId = option.label || option.id;
                      const isSelected = isMultipleSelect
                        ? userAnswers.includes(optionId)
                        : currentAnswers === optionId;

                      return (
                        <div
                          key={optionId}
                          className={`option ${isSelected ? "selected" : ""} ${
                            isMultipleSelect ? "multiple-select" : ""
                          }`}
                          onClick={() =>
                            handleAnswerChange(
                              currentQuestion.id,
                              optionId,
                              isMultipleSelect
                            )
                          }
                        >
                          <div className="option-selector">
                            {isMultipleSelect ? (
                              <div
                                className={`checkbox ${
                                  isSelected ? "checked" : ""
                                }`}
                              >
                                {isSelected && "✓"}
                              </div>
                            ) : (
                              <div
                                className={`radio ${
                                  isSelected ? "checked" : ""
                                }`}
                              >
                                {isSelected && "●"}
                              </div>
                            )}
                          </div>
                          <div className="option-label">
                            {optionId.toUpperCase()}
                          </div>
                          <div className="option-text">{option.text}</div>
                        </div>
                      );
                    })}
                  </>
                );
              })()
            ) : currentQuestion.questionType === "true-false" ? (
              <>
                <div
                  className={`option ${
                    answers[currentQuestion.id] === "true" ? "selected" : ""
                  }`}
                  onClick={() => handleAnswerChange(currentQuestion.id, "true")}
                >
                  <div className="option-label">TRUE</div>
                  <div className="option-text">True</div>
                </div>
                <div
                  className={`option ${
                    answers[currentQuestion.id] === "false" ? "selected" : ""
                  }`}
                  onClick={() =>
                    handleAnswerChange(currentQuestion.id, "false")
                  }
                >
                  <div className="option-label">FALSE</div>
                  <div className="option-text">False</div>
                </div>
              </>
            ) : (
              <div className="text-answer">
                <textarea
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) =>
                    handleAnswerChange(currentQuestion.id, e.target.value)
                  }
                  placeholder={
                    currentQuestion.questionType === "essay"
                      ? "Write your detailed answer here..."
                      : "Type your answer here..."
                  }
                  rows={currentQuestion.questionType === "essay" ? 10 : 5}
                  className={
                    currentQuestion.questionType === "essay"
                      ? "essay-answer"
                      : ""
                  }
                />
              </div>
            )}
          </div>

          {/* Question Actions */}
          <div className="question-actions">
            <button
              onClick={() => handleMarkForReview(currentQuestion.id)}
              className={`mark-review-btn ${
                markedForReview[currentQuestion.id] ? "marked" : ""
              }`}
            >
              {markedForReview[currentQuestion.id]
                ? "✓ Marked for Review"
                : "Mark for Review"}
            </button>

            <button
              onClick={() => {
                const currentAnswers = answers[currentQuestion.id];
                // Clear array or single value
                handleAnswerChange(
                  currentQuestion.id,
                  Array.isArray(currentAnswers) ? [] : null
                );
              }}
              className="clear-answer-btn"
              disabled={
                !answers[currentQuestion.id] ||
                (Array.isArray(answers[currentQuestion.id]) &&
                  answers[currentQuestion.id].length === 0)
              }
            >
              Clear Answer
            </button>
          </div>

          {/* Navigation Buttons */}
          <div className="question-navigation">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="nav-btn prev-btn"
            >
              ← Previous
            </button>

            {isLastQuestion ? (
              <button
                onClick={() => handleFinishExam(false)}
                className="finish-btn"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Finish Exam"}
              </button>
            ) : (
              <button onClick={handleNext} className="nav-btn next-btn">
                Next →
              </button>
            )}
          </div>
        </div>

        {/* Question Palette */}
        <div className="question-palette">
          <h4>Question Palette</h4>
          <div className="palette-legend">
            <div className="legend-item">
              <span className="legend-box answered"></span>
              <span>Answered</span>
            </div>
            <div className="legend-item">
              <span className="legend-box marked"></span>
              <span>Marked</span>
            </div>
            <div className="legend-item">
              <span className="legend-box unanswered"></span>
              <span>Not Answered</span>
            </div>
          </div>

          <div className="palette-grid">
            {questions.map((question, index) => {
              const answer = answers[question.id];
              const isAnswered = Array.isArray(answer)
                ? answer.length > 0
                : !!answer;
              const isMarked = markedForReview[question.id];
              const isCurrent = index === currentQuestionIndex;

              return (
                <button
                  key={question.id}
                  onClick={() => handleQuestionNavigation(index)}
                  className={`palette-item ${isCurrent ? "current" : ""} ${
                    isAnswered ? "answered" : ""
                  } ${isMarked ? "marked" : ""}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <div className="palette-summary">
            <p>
              Answered:{" "}
              {
                Object.keys(answers).filter((k) => {
                  const answer = answers[k];
                  return Array.isArray(answer) ? answer.length > 0 : !!answer;
                }).length
              }{" "}
              / {questions.length}
            </p>
            <p>
              Marked:{" "}
              {
                Object.keys(markedForReview).filter((k) => markedForReview[k])
                  .length
              }
            </p>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="modal-overlay" onClick={cancelExit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Exit Exam?</h3>
            <p>
              Are you sure you want to exit? Your progress will not be saved and
              you will need to start the exam again.
            </p>
            <div className="modal-actions">
              <button onClick={cancelExit} className="cancel-btn">
                Cancel
              </button>
              <button onClick={confirmExit} className="confirm-btn">
                Exit Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamPlayer;
