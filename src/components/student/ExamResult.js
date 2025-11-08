import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import resultService from "../../services/resultService";
import examAttemptService from "../../services/examAttemptService";
import examService from "../../services/examService";
import "./ExamResult.css";

const toNumberSafe = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeEntity = (entity) => {
  if (entity === null || entity === undefined) return null;

  if (Array.isArray(entity)) {
    return entity.map((item) => normalizeEntity(item));
  }

  if (typeof entity !== "object") {
    return entity;
  }

  if (Object.prototype.hasOwnProperty.call(entity, "data")) {
    const dataValue = entity.data;
    if (Array.isArray(dataValue)) {
      return dataValue.map((item) => normalizeEntity(item));
    }
    if (dataValue !== undefined) {
      return normalizeEntity(dataValue);
    }
  }

  if (Object.prototype.hasOwnProperty.call(entity, "attributes")) {
    const normalizedAttributes = normalizeEntity(entity.attributes);
    return { id: entity.id, ...normalizedAttributes };
  }

  const normalizedObject = {};
  Object.keys(entity).forEach((key) => {
    normalizedObject[key] = normalizeEntity(entity[key]);
  });

  if (entity.id !== undefined && normalizedObject.id === undefined) {
    normalizedObject.id = entity.id;
  }

  return normalizedObject;
};

const buildResultsSummary = (
  attempt,
  fallbackScore = 0,
  fallbackPercentage = 0
) => {
  if (!attempt) {
    return {
      score: toNumberSafe(fallbackScore),
      correct: 0,
      incorrect: 0,
      unanswered: 0,
      totalQuestions: 0,
      percentage: toNumberSafe(fallbackPercentage),
      questionResults: [],
    };
  }

  const answers = Array.isArray(attempt.answers) ? attempt.answers : [];
  const score = toNumberSafe(attempt.score, fallbackScore);
  const percentage = toNumberSafe(attempt.percentage, fallbackPercentage);

  const unanswered = answers.filter((answer) => {
    if (!answer) return true;
    const userAnswer = answer.answer;
    if (userAnswer === null || userAnswer === undefined) return true;
    if (Array.isArray(userAnswer)) return userAnswer.length === 0;
    if (typeof userAnswer === "string") return userAnswer.trim().length === 0;
    return false;
  }).length;

  const correct = answers.filter((answer) => answer?.isCorrect).length;
  const totalQuestions = answers.length;
  const incorrect = Math.max(totalQuestions - correct - unanswered, 0);

  return {
    score,
    correct,
    incorrect,
    unanswered,
    totalQuestions,
    percentage,
    questionResults: answers,
  };
};

const isAnswerEmpty = (answer) => {
  if (answer === null || answer === undefined) return true;
  if (Array.isArray(answer)) return answer.length === 0;
  if (typeof answer === "string") return answer.trim().length === 0;
  return false;
};

const normalizeOptionsArray = (options) => {
  if (!options) return [];

  let parsedOptions = options;
  if (typeof options === "string") {
    try {
      parsedOptions = JSON.parse(options);
    } catch (error) {
      console.error("Failed to parse question options JSON:", error);
      return [];
    }
  }

  if (!Array.isArray(parsedOptions)) return [];

  return parsedOptions.map((option, index) => {
    if (option && typeof option === "object") {
      const normalizedOption = { ...option };
      normalizedOption.id =
        option.id ?? option.label ?? `option-${option.value ?? index}`;
      normalizedOption.label =
        option.label ?? option.id ?? `option-${option.value ?? index}`;
      normalizedOption.text = option.text ?? option.value ?? "";
      normalizedOption.isCorrect = Boolean(
        option.isCorrect ?? option.correct ?? option.is_correct ?? false
      );
      return normalizedOption;
    }

    return {
      id: `option-${index}`,
      label: `option-${index}`,
      text: String(option ?? ""),
      isCorrect: false,
    };
  });
};

const extractExamQuestions = (examEntity) => {
  if (!examEntity || !examEntity.questions) return [];

  const { questions } = examEntity;

  if (Array.isArray(questions)) {
    return questions;
  }

  if (questions?.data) {
    return normalizeEntity(questions);
  }

  return [];
};

const prepareNormalizedQuestions = (questions = []) =>
  questions.map((question) => {
    const normalizedQuestion = normalizeEntity(question);
    const questionText =
      normalizedQuestion.questionText ??
      normalizedQuestion.title ??
      normalizedQuestion.prompt ??
      "";

    return {
      ...normalizedQuestion,
      questionText,
      options: normalizeOptionsArray(normalizedQuestion.options),
    };
  });

const ensureExamWithQuestions = async (examEntity, examId) => {
  let normalizedExam = examEntity ? normalizeEntity(examEntity) : null;
  let normalizedQuestions = prepareNormalizedQuestions(
    extractExamQuestions(normalizedExam)
  );

  if (normalizedExam && normalizedQuestions.length) {
    return { ...normalizedExam, questions: normalizedQuestions };
  }

  if (!examId) {
    return normalizedExam;
  }

  try {
    const response = await examService.getExam(examId);
    const rawExam = response?.data?.data ?? response?.data ?? response;
    normalizedExam = normalizeEntity(rawExam);
    normalizedQuestions = prepareNormalizedQuestions(
      extractExamQuestions(normalizedExam)
    );

    if (normalizedExam) {
      return { ...normalizedExam, questions: normalizedQuestions };
    }
    return normalizedExam;
  } catch (error) {
    console.error("Error fetching exam details:", error);
    return normalizedExam;
  }
};

const mergeQuestionResultsWithDetails = (baseResults, examEntity, attempt) => {
  const safeBase = baseResults || {};
  const attemptAnswers = Array.isArray(attempt?.answers) ? attempt.answers : [];

  const examQuestions = prepareNormalizedQuestions(
    extractExamQuestions(examEntity)
  );

  const questionOrder = [];
  const questionLookup = new Map();
  examQuestions.forEach((question, index) => {
    const key =
      question?.id !== undefined ? String(question.id) : `question-${index}`;
    questionLookup.set(key, question);
    questionOrder.push(key);
  });

  const answerLookup = new Map();
  attemptAnswers.forEach((answer) => {
    const key =
      answer?.questionId !== undefined
        ? String(answer.questionId)
        : answer?.question
        ? String(answer.question)
        : undefined;
    if (key) {
      answerLookup.set(key, answer);
    }
  });

  let workingResults = Array.isArray(safeBase.questionResults)
    ? safeBase.questionResults.map((entry) => ({ ...entry }))
    : [];

  if (!workingResults.length && attemptAnswers.length) {
    workingResults = attemptAnswers.map((answer) => ({ ...answer }));
  }

  if (!workingResults.length && questionOrder.length) {
    workingResults = questionOrder.map((key) => ({
      questionId: Number.isNaN(Number(key)) ? key : Number(key),
      question: "",
      userAnswer: null,
      correctAnswer: null,
      isCorrect: false,
    }));
  }

  const enrichedResults = workingResults.map((entry, index) => {
    const rawQuestionId =
      entry?.questionId ?? entry?.id ?? entry?.question?.id ?? null;
    const questionKey =
      rawQuestionId !== null && rawQuestionId !== undefined
        ? String(rawQuestionId)
        : questionOrder[index] ?? String(index);

    const questionInfo = questionLookup.get(questionKey);
    const attemptAnswer = answerLookup.get(questionKey);

    const userAnswer =
      entry.userAnswer ?? entry.answer ?? attemptAnswer?.answer ?? null;

    const combinedOptions = normalizeOptionsArray(
      entry.options ?? attemptAnswer?.options ?? questionInfo?.options ?? []
    );

    const determineCorrectAnswer = () => {
      if (entry.correctAnswer) return entry.correctAnswer;
      if (attemptAnswer?.correctAnswer) return attemptAnswer.correctAnswer;

      if (combinedOptions.length) {
        const correctOptions = combinedOptions.filter((opt) => opt.isCorrect);
        if (correctOptions.length) {
          return correctOptions
            .map((opt) => {
              const label = opt.label || opt.id || "";
              const labelPrefix = label
                ? `${label.toString().toUpperCase()}: `
                : "";
              return `${labelPrefix}${opt.text ?? ""}`.trim();
            })
            .join(", ");
        }
      }

      if (questionInfo?.correctAnswer) {
        return questionInfo.correctAnswer;
      }

      return null;
    };

    const computedCorrectAnswer = determineCorrectAnswer();
    const explanation = String(
      entry.explanation ??
        attemptAnswer?.explanation ??
        questionInfo?.explanation ??
        ""
    );

    const points =
      entry.points ?? attemptAnswer?.points ?? questionInfo?.points ?? 0;

    const questionText =
      questionInfo?.questionText ?? entry.question ?? `Question ${index + 1}`;
    const questionType =
      questionInfo?.questionType ??
      entry.questionType ??
      attemptAnswer?.questionType ??
      "unknown";

    const isMultipleSelect = Boolean(
      entry.isMultipleSelect ??
        combinedOptions.filter((opt) => opt.isCorrect).length > 1
    );

    const normalizedQuestionId =
      rawQuestionId !== null && rawQuestionId !== undefined
        ? rawQuestionId
        : questionInfo?.id ?? index;

    const isCorrect = Boolean(
      entry.isCorrect ?? attemptAnswer?.isCorrect ?? false
    );

    return {
      ...entry,
      questionId: normalizedQuestionId,
      question: questionText,
      questionType,
      options: combinedOptions,
      isMultipleSelect,
      userAnswer,
      answer: userAnswer,
      correctAnswer: computedCorrectAnswer,
      explanation,
      points,
      isCorrect,
    };
  });

  if (questionOrder.length) {
    const orderIndexMap = new Map();
    questionOrder.forEach((key, position) => {
      if (key !== undefined) {
        orderIndexMap.set(String(key), position);
      }
    });

    enrichedResults.sort((a, b) => {
      const aKey = a?.questionId !== undefined ? String(a.questionId) : "";
      const bKey = b?.questionId !== undefined ? String(b.questionId) : "";
      const aPosition = orderIndexMap.has(aKey)
        ? orderIndexMap.get(aKey)
        : Number.MAX_SAFE_INTEGER;
      const bPosition = orderIndexMap.has(bKey)
        ? orderIndexMap.get(bKey)
        : Number.MAX_SAFE_INTEGER;
      if (aPosition === bPosition) return 0;
      return aPosition - bPosition;
    });
  }

  const correctCount = enrichedResults.filter((item) => item.isCorrect).length;
  const unansweredCount = enrichedResults.filter((item) =>
    isAnswerEmpty(item.userAnswer)
  ).length;
  const totalQuestions = enrichedResults.length;
  const incorrectCount = Math.max(
    totalQuestions - correctCount - unansweredCount,
    0
  );

  const scoreValue =
    safeBase.score !== undefined
      ? toNumberSafe(safeBase.score)
      : toNumberSafe(attempt?.score);
  const percentageValue =
    safeBase.percentage !== undefined
      ? toNumberSafe(safeBase.percentage)
      : toNumberSafe(attempt?.percentage);
  const totalPointsFromExam = Array.isArray(examEntity?.questions)
    ? examEntity.questions.reduce(
        (acc, question) => acc + toNumberSafe(question?.points, 0),
        0
      )
    : 0;

  const totalPointsFromQuestions = enrichedResults.reduce(
    (acc, question) => acc + toNumberSafe(question.points, 0),
    0
  );

  const totalPointsValue =
    safeBase.totalPoints !== undefined
      ? toNumberSafe(safeBase.totalPoints)
      : totalPointsFromExam || totalPointsFromQuestions;

  return {
    ...safeBase,
    score: scoreValue,
    percentage: percentageValue,
    correct: correctCount,
    incorrect: incorrectCount,
    unanswered: unansweredCount,
    totalQuestions,
    totalPoints: totalPointsValue,
    questionResults: enrichedResults,
  };
};

const ExamResult = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [result, setResult] = useState(null);
  const [examAttempt, setExamAttempt] = useState(null);
  const [results, setResults] = useState(null);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");

  useEffect(() => {
    loadResult();
  }, [resultId]);

  const loadResult = async () => {
    try {
      setLoading(true);

      let normalizedResultData = null;
      let normalizedAttemptData = null;
      let normalizedExamData = null;
      let baseResults = null;

      if (location.state?.result) {
        const stateResultRaw =
          location.state.result?.data ?? location.state.result;
        normalizedResultData = normalizeEntity(stateResultRaw);

        const stateAttemptRaw =
          location.state.examAttempt?.data ?? location.state.examAttempt;
        if (stateAttemptRaw) {
          normalizedAttemptData = normalizeEntity(stateAttemptRaw);
        }

        if (location.state.results) {
          baseResults = location.state.results;
        }

        if (!baseResults) {
          baseResults = buildResultsSummary(
            normalizedAttemptData,
            normalizedResultData?.score,
            normalizedResultData?.percentage
          );
        }

        const stateExamRaw =
          location.state.exam?.data ??
          location.state.exam ??
          normalizedResultData?.exam ??
          normalizedAttemptData?.exam ??
          null;
        if (stateExamRaw) {
          normalizedExamData = normalizeEntity(stateExamRaw);
        }
      } else {
        const response = await resultService.getResult(resultId);
        const rawResult = response?.data?.data ?? response?.data ?? response;
        normalizedResultData = normalizeEntity(rawResult);

        if (normalizedResultData?.exam) {
          normalizedExamData = normalizeEntity(normalizedResultData.exam);
        }

        const normalizedExamAttemptRef = normalizedResultData?.exam_attempt;
        if (normalizedExamAttemptRef?.id) {
          const attemptResponse = await examAttemptService.getExamAttempt(
            normalizedExamAttemptRef.id
          );
          const rawAttempt =
            attemptResponse?.data?.data ??
            attemptResponse?.data ??
            attemptResponse;
          normalizedAttemptData = normalizeEntity(rawAttempt);
        }

        if (!normalizedExamData && normalizedAttemptData?.exam) {
          normalizedExamData = normalizeEntity(normalizedAttemptData.exam);
        }

        baseResults = buildResultsSummary(
          normalizedAttemptData,
          normalizedResultData?.score,
          normalizedResultData?.percentage
        );
      }

      if (!normalizedExamData && normalizedAttemptData?.exam) {
        normalizedExamData = normalizeEntity(normalizedAttemptData.exam);
      }

      if (!normalizedExamData && normalizedResultData?.exam) {
        normalizedExamData = normalizeEntity(normalizedResultData.exam);
      }

      const candidateExamId =
        normalizedExamData?.id ??
        normalizedResultData?.exam?.id ??
        normalizedAttemptData?.exam?.id ??
        null;

      const examWithQuestions = await ensureExamWithQuestions(
        normalizedExamData,
        candidateExamId
      );

      const finalExamData = examWithQuestions ?? normalizedExamData ?? null;

      const finalResults = mergeQuestionResultsWithDetails(
        baseResults,
        finalExamData,
        normalizedAttemptData
      );

      setResult(normalizedResultData);
      setExamAttempt(normalizedAttemptData);
      setExam(finalExamData);
      setResults(finalResults);
      setError(null);
    } catch (err) {
      console.error("Error loading result:", err);
      setError("Failed to load exam result");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToExams = () => {
    navigate("/student/exams");
  };

  const handleRetakeExam = () => {
    if (normalizedExam) {
      navigate(`/student/exam-player/${normalizedExam.id}`, {
        state: { exam: normalizedExam },
      });
    }
  };

  if (loading) {
    return (
      <div className="exam-result-container">
        <div className="loading">Loading results...</div>
      </div>
    );
  }

  if (error || !result || !results) {
    return (
      <div className="exam-result-container">
        <div className="error-message">{error || "Result not found"}</div>
        <button onClick={handleBackToExams} className="back-btn">
          Back to Exams
        </button>
      </div>
    );
  }

  const normalizedExam = exam ?? null;
  const percentageValue = toNumberSafe(
    results?.percentage ?? result?.percentage,
    0
  );
  const scoreValue = toNumberSafe(results?.score ?? result?.score, 0);
  const maxScoreValue = toNumberSafe(
    result?.maxScore ?? results?.totalPoints ?? results?.totalQuestions,
    results?.totalQuestions ?? 0
  );
  const totalQuestions = results?.totalQuestions ?? 0;
  const correctCount = results?.correct ?? 0;
  const incorrectCount = results?.incorrect ?? 0;
  const unansweredCount = results?.unanswered ?? 0;
  const passThreshold = toNumberSafe(
    normalizedExam?.passingScore ?? normalizedExam?.passingPercentage,
    60
  );
  const isPassed =
    result?.passed !== undefined && result?.passed !== null
      ? Boolean(result.passed)
      : percentageValue >= passThreshold;

  return (
    <div className="exam-result-container">
      {/* Header */}
      <div className="result-header">
        <div className="result-header-content">
          <h1>Exam Results</h1>
          {exam && <h2>{exam.title}</h2>}
        </div>

        <div className={`result-status ${isPassed ? "passed" : "failed"}`}>
          {isPassed ? "✓ Passed" : "✗ Failed"}
        </div>
      </div>

      {/* Score Card */}
      <div className="score-card">
        <div className="score-card-main">
          <div className="score-circle">
            <svg viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="20"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke={isPassed ? "#4caf50" : "#f44336"}
                strokeWidth="20"
                strokeDasharray={`${(percentageValue / 100) * 565.48} 565.48`}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div className="score-text">
              <div className="percentage">{percentageValue.toFixed(1)}%</div>
              <div className="score-details">
                {scoreValue.toFixed(1)} / {maxScoreValue}
              </div>
            </div>
          </div>
        </div>

        <div className="score-card-stats">
          <div className="stat-item correct">
            <div className="stat-icon">✓</div>
            <div className="stat-details">
              <div className="stat-value">{correctCount}</div>
              <div className="stat-label">Correct</div>
            </div>
          </div>

          <div className="stat-item incorrect">
            <div className="stat-icon">✗</div>
            <div className="stat-details">
              <div className="stat-value">{incorrectCount}</div>
              <div className="stat-label">Incorrect</div>
            </div>
          </div>

          <div className="stat-item unanswered">
            <div className="stat-icon">−</div>
            <div className="stat-details">
              <div className="stat-value">{unansweredCount}</div>
              <div className="stat-label">Unanswered</div>
            </div>
          </div>

          <div className="stat-item total">
            <div className="stat-icon">#</div>
            <div className="stat-details">
              <div className="stat-value">{totalQuestions}</div>
              <div className="stat-label">Total Questions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="result-tabs">
        <button
          className={`tab ${activeTab === "summary" ? "active" : ""}`}
          onClick={() => setActiveTab("summary")}
        >
          Summary
        </button>
        <button
          className={`tab ${activeTab === "questions" ? "active" : ""}`}
          onClick={() => setActiveTab("questions")}
        >
          Question Review
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "summary" ? (
          <div className="summary-tab">
            <div className="summary-card">
              <h3>Exam Information</h3>
              <div className="summary-grid">
                {normalizedExam && (
                  <>
                    <div className="summary-item">
                      <strong>Exam Title:</strong>
                      <span>{normalizedExam.title}</span>
                    </div>
                    {normalizedExam.subject && (
                      <div className="summary-item">
                        <strong>Subject:</strong>
                        <span>
                          {normalizedExam.subject.name ||
                            normalizedExam.subject.title ||
                            normalizedExam.subject.code ||
                            normalizedExam.subject.id}
                        </span>
                      </div>
                    )}
                    {normalizedExam.examType && (
                      <div className="summary-item">
                        <strong>Exam Type:</strong>
                        <span>{normalizedExam.examType}</span>
                      </div>
                    )}
                    {normalizedExam.course && (
                      <div className="summary-item">
                        <strong>Course:</strong>
                        <span>
                          {normalizedExam.course.name ||
                            normalizedExam.course.title ||
                            normalizedExam.course.code ||
                            normalizedExam.course.id}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {examAttempt?.submittedAt && (
                  <div className="summary-item">
                    <strong>Submitted At:</strong>
                    <span>
                      {new Date(examAttempt.submittedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {examAttempt?.timeTaken && (
                  <div className="summary-item">
                    <strong>Time Taken:</strong>
                    <span>
                      {Math.floor(examAttempt.timeTaken / 60)} minutes
                    </span>
                  </div>
                )}
                {result?.grade && (
                  <div className="summary-item">
                    <strong>Grade:</strong>
                    <span>{result.grade}</span>
                  </div>
                )}
                {result?.gpa !== undefined && result?.gpa !== null && (
                  <div className="summary-item">
                    <strong>GPA:</strong>
                    <span>{toNumberSafe(result.gpa).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="summary-card">
              <h3>Performance Analysis</h3>
              <div className="performance-bars">
                <div className="performance-item">
                  <div className="performance-label">
                    <span>Correct Answers</span>
                    <span className="performance-value">
                      {correctCount} / {totalQuestions}
                    </span>
                  </div>
                  <div className="performance-bar">
                    <div
                      className="performance-fill correct"
                      style={{
                        width:
                          totalQuestions > 0
                            ? `${(correctCount / totalQuestions) * 100}%`
                            : "0%",
                      }}
                    ></div>
                  </div>
                </div>

                <div className="performance-item">
                  <div className="performance-label">
                    <span>Incorrect Answers</span>
                    <span className="performance-value">
                      {incorrectCount} / {totalQuestions}
                    </span>
                  </div>
                  <div className="performance-bar">
                    <div
                      className="performance-fill incorrect"
                      style={{
                        width:
                          totalQuestions > 0
                            ? `${(incorrectCount / totalQuestions) * 100}%`
                            : "0%",
                      }}
                    ></div>
                  </div>
                </div>

                <div className="performance-item">
                  <div className="performance-label">
                    <span>Unanswered</span>
                    <span className="performance-value">
                      {unansweredCount} / {totalQuestions}
                    </span>
                  </div>
                  <div className="performance-bar">
                    <div
                      className="performance-fill unanswered"
                      style={{
                        width:
                          totalQuestions > 0
                            ? `${(unansweredCount / totalQuestions) * 100}%`
                            : "0%",
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {normalizedExam?.passingScore && (
              <div className="summary-card">
                <h3>Pass Criteria</h3>
                <div className="pass-criteria">
                  <div className="criteria-item">
                    <strong>Passing Score:</strong>
                    <span>{normalizedExam.passingScore}%</span>
                  </div>
                  <div className="criteria-item">
                    <strong>Your Score:</strong>
                    <span className={isPassed ? "passed-text" : "failed-text"}>
                      {scoreValue.toFixed(1)} / {maxScoreValue}
                    </span>
                  </div>
                  <div className="criteria-item">
                    <strong>Status:</strong>
                    <span className={isPassed ? "passed-text" : "failed-text"}>
                      {isPassed ? "Passed ✓" : "Failed ✗"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="questions-tab">
            <div className="questions-filter">
              <button className="filter-btn all active">All Questions</button>
              <button className="filter-btn correct">
                Correct ({correctCount})
              </button>
              <button className="filter-btn incorrect">
                Incorrect ({incorrectCount})
              </button>
              <button className="filter-btn unanswered">
                Unanswered ({unansweredCount})
              </button>
            </div>

            <div className="questions-list">
              {results.questionResults &&
                results.questionResults.map((qResult, index) => {
                  const userAnswerEmpty = isAnswerEmpty(qResult.userAnswer);
                  const questionType = qResult.questionType || "unknown";
                  const options = Array.isArray(qResult.options)
                    ? qResult.options
                    : [];
                  const isMultipleChoice = questionType === "multiple-choice";
                  const isMultipleSelect = Boolean(
                    qResult.isMultipleSelect ||
                      options.filter((opt) => opt.isCorrect).length > 1
                  );
                  const questionHtml = qResult.question
                    ? String(qResult.question)
                    : `Question ${index + 1}`;

                  const formatTrueFalse = (value) => {
                    if (typeof value === "string") {
                      return value.toLowerCase() === "true" ? "True" : "False";
                    }
                    return value ? "True" : "False";
                  };

                  const formatGenericAnswer = (value) => {
                    if (Array.isArray(value)) {
                      return value.join(", ");
                    }
                    if (value === null || value === undefined) return "";
                    return String(value);
                  };

                  const formatOptionLabel = (option) =>
                    `${(option.label || option.id || "")
                      .toString()
                      .toUpperCase()}: ${option.text || ""}`;

                  const renderUserAnswer = () => {
                    if (userAnswerEmpty) return "";

                    if (isMultipleChoice) {
                      if (!options.length) {
                        return formatGenericAnswer(qResult.userAnswer);
                      }

                      if (
                        isMultipleSelect &&
                        Array.isArray(qResult.userAnswer)
                      ) {
                        return qResult.userAnswer
                          .map((ans) => {
                            const selectedOption = options.find(
                              (opt) => (opt.label || opt.id) === ans
                            );
                            return selectedOption
                              ? formatOptionLabel(selectedOption)
                              : String(ans);
                          })
                          .join(", ");
                      }

                      const selectedOption = options.find(
                        (opt) => (opt.label || opt.id) === qResult.userAnswer
                      );
                      return selectedOption
                        ? formatOptionLabel(selectedOption)
                        : formatGenericAnswer(qResult.userAnswer);
                    }

                    if (questionType === "true-false") {
                      return formatTrueFalse(qResult.userAnswer);
                    }

                    return formatGenericAnswer(qResult.userAnswer);
                  };

                  const renderCorrectAnswer = () => {
                    if (isMultipleChoice) {
                      if (!options.length) {
                        return qResult.correctAnswer ?? "Not available";
                      }

                      const correctOptions = options.filter(
                        (opt) => opt.isCorrect
                      );
                      if (correctOptions.length === 0) {
                        return qResult.correctAnswer ?? "Not available";
                      }

                      if (correctOptions.length > 1) {
                        return correctOptions
                          .map((opt) => formatOptionLabel(opt))
                          .join(", ");
                      }

                      return formatOptionLabel(correctOptions[0]);
                    }

                    if (questionType === "true-false") {
                      return formatTrueFalse(qResult.correctAnswer);
                    }

                    return qResult.correctAnswer ?? "Not available";
                  };

                  const cardStatusClass = userAnswerEmpty
                    ? "unanswered"
                    : qResult.isCorrect
                    ? "correct"
                    : "incorrect";

                  return (
                    <div
                      key={`${qResult.questionId || index}`}
                      className={`question-review-card ${cardStatusClass}`}
                    >
                      <div className="question-review-header">
                        <div className="question-number">
                          Question {index + 1}
                        </div>
                        <div
                          className={`question-status ${
                            userAnswerEmpty
                              ? "unanswered-badge"
                              : qResult.isCorrect
                              ? "correct-badge"
                              : "incorrect-badge"
                          }`}
                        >
                          {userAnswerEmpty
                            ? "Not Answered"
                            : qResult.isCorrect
                            ? "Correct ✓"
                            : "Incorrect ✗"}
                        </div>
                      </div>

                      <div className="question-review-body">
                        <div className="question-review-text">
                          <div
                            dangerouslySetInnerHTML={{ __html: questionHtml }}
                          />
                        </div>

                        {isMultipleChoice && options.length > 0 && (
                          <div className="options-review">
                            {isMultipleSelect && (
                              <div className="multiple-select-badge">
                                Multiple Correct Answers
                              </div>
                            )}
                            {options.map((option) => {
                              const optionId = option.label || option.id;
                              const userSelections = Array.isArray(
                                qResult.userAnswer
                              )
                                ? qResult.userAnswer
                                : [qResult.userAnswer];
                              const isUserAnswer =
                                userSelections.includes(optionId);
                              const isCorrectAnswer = option.isCorrect;

                              return (
                                <div
                                  key={`${optionId}`}
                                  className={`option-review ${
                                    isCorrectAnswer ? "correct-option" : ""
                                  } ${
                                    isUserAnswer && !isCorrectAnswer
                                      ? "wrong-option"
                                      : ""
                                  } ${isUserAnswer ? "user-selected" : ""}`}
                                >
                                  <div className="option-selector-review">
                                    {isMultipleSelect ? (
                                      <div
                                        className={`checkbox-review ${
                                          isUserAnswer ? "checked" : ""
                                        }`}
                                      >
                                        {isUserAnswer && "✓"}
                                      </div>
                                    ) : (
                                      <div
                                        className={`radio-review ${
                                          isUserAnswer ? "checked" : ""
                                        }`}
                                      >
                                        {isUserAnswer && "●"}
                                      </div>
                                    )}
                                  </div>
                                  <div className="option-label-review">
                                    {optionId?.toString().toUpperCase()}
                                  </div>
                                  <div className="option-text-review">
                                    {option.text}
                                    {isCorrectAnswer && (
                                      <span className="correct-indicator">
                                        {" "}
                                        ✓
                                      </span>
                                    )}
                                    {isUserAnswer && !isCorrectAnswer && (
                                      <span className="wrong-indicator">
                                        {" "}
                                        ✗
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="answer-section">
                          {!userAnswerEmpty ? (
                            <>
                              <div
                                className={`answer-item ${
                                  qResult.isCorrect ? "correct" : "wrong"
                                }`}
                              >
                                <strong>Your Answer:</strong>
                                <span>{renderUserAnswer()}</span>
                              </div>
                              {!qResult.isCorrect && (
                                <div className="answer-item correct">
                                  <strong>Correct Answer:</strong>
                                  <span>{renderCorrectAnswer()}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="answer-item unanswered">
                              <strong>You did not answer this question.</strong>
                              <div className="answer-item correct">
                                <strong>Correct Answer:</strong>
                                <span>{renderCorrectAnswer()}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {qResult.explanation && (
                          <div className="explanation-section">
                            <strong>Explanation:</strong>
                            <div
                              dangerouslySetInnerHTML={{
                                __html: String(qResult.explanation),
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="result-actions">
        <button onClick={handleBackToExams} className="action-btn secondary">
          Back to Exams
        </button>
        {normalizedExam && (
          <button onClick={handleRetakeExam} className="action-btn primary">
            Retake Exam
          </button>
        )}
      </div>
    </div>
  );
};

export default ExamResult;
