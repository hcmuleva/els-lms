import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import questionService from "../../services/questionService";
import API from "../../api";
import "./CreateQuestionPage.css";

const CreateQuestionPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    questionText: "",
    questionType: "multiple-choice",
    difficultyLevel: "medium",
    points: 1,
    options: [
      { id: "a", text: "", isCorrect: false },
      { id: "b", text: "", isCorrect: false },
      { id: "c", text: "", isCorrect: false },
      { id: "d", text: "", isCorrect: false },
    ],
    correctAnswer: "",
    explanation: "",
    timeLimit: "",
    tags: [],
    subject: "",
    course: "",
  });

  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    fetchData();
    if (isEditing) {
      fetchQuestion();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      console.log("Fetching courses and subjects...");
      const [coursesRes, subjectsRes] = await Promise.all([
        API.get("/api/courses?populate=*"),
        API.get("/api/subjects?populate=*"),
      ]);
      console.log("Courses response:", coursesRes.data);
      console.log("Subjects response:", subjectsRes.data);

      // Handle different response formats
      let coursesData = [];
      let subjectsData = [];

      // Check if response has data property (standard Strapi v4/v5 format)
      if (coursesRes.data.data) {
        coursesData = Array.isArray(coursesRes.data.data)
          ? coursesRes.data.data
          : [coursesRes.data.data];
      }
      // Check if response is directly an array
      else if (Array.isArray(coursesRes.data)) {
        coursesData = coursesRes.data;
      }
      // Check if response is a single object
      else if (coursesRes.data && coursesRes.data.id) {
        coursesData = [coursesRes.data];
      }

      if (subjectsRes.data.data) {
        subjectsData = Array.isArray(subjectsRes.data.data)
          ? subjectsRes.data.data
          : [subjectsRes.data.data];
      } else if (Array.isArray(subjectsRes.data)) {
        subjectsData = subjectsRes.data;
      } else if (subjectsRes.data && subjectsRes.data.id) {
        subjectsData = [subjectsRes.data];
      }

      console.log("Courses data array:", coursesData);
      console.log("Subjects data array:", subjectsData);

      setCourses(coursesData);
      setSubjects(subjectsData);
    } catch (err) {
      console.error("Error loading data:", err);
      console.error("Error details:", err.response?.data);
    }
  };

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      const response = await questionService.getQuestion(id);
      const question = response.data.attributes;

      setFormData({
        questionText: question.questionText || "",
        questionType: question.questionType || "multiple-choice",
        difficultyLevel: question.difficultyLevel || "medium",
        points: question.points || 1,
        options: question.options || formData.options,
        correctAnswer: question.correctAnswer || "",
        explanation: question.explanation || "",
        timeLimit: question.timeLimit || "",
        tags: question.tags || [],
        // Prioritize documentId for Strapi v5
        subject:
          question.subject?.data?.documentId ||
          question.subject?.data?.id ||
          "",
        course:
          question.course?.data?.documentId || question.course?.data?.id || "",
      });
    } catch (err) {
      alert("Failed to load question");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = {
      ...newOptions[index],
      [field]: value,
    };
    setFormData((prev) => ({
      ...prev,
      options: newOptions,
    }));
  };

  const handleCorrectAnswerChange = (index) => {
    const newOptions = formData.options.map((opt, i) => ({
      ...opt,
      isCorrect: i === index,
    }));
    setFormData((prev) => ({
      ...prev,
      options: newOptions,
    }));
  };

  const handleMultipleCorrectAnswerChange = (index) => {
    const newOptions = [...formData.options];
    newOptions[index] = {
      ...newOptions[index],
      isCorrect: !newOptions[index].isCorrect,
    };
    setFormData((prev) => ({
      ...prev,
      options: newOptions,
    }));
  };

  const addOption = () => {
    const letters = "abcdefghijklmnopqrstuvwxyz";
    const newId = letters[formData.options.length];
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, { id: newId, text: "", isCorrect: false }],
    }));
  };

  const removeOption = (index) => {
    if (formData.options.length <= 2) {
      alert("Must have at least 2 options");
      return;
    }
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      options: newOptions,
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.questionText.trim()) {
      alert("Question text is required");
      return;
    }

    if (formData.questionType === "multiple-choice") {
      const hasCorrectAnswer = formData.options.some((opt) => opt.isCorrect);
      if (!hasCorrectAnswer) {
        alert("Please select a correct answer");
        return;
      }

      const hasEmptyOption = formData.options.some((opt) => !opt.text.trim());
      if (hasEmptyOption) {
        alert("All options must have text");
        return;
      }
    }

    try {
      setLoading(true);

      const questionData = {
        questionText: formData.questionText,
        questionType: formData.questionType,
        difficultyLevel: formData.difficultyLevel,
        points: parseInt(formData.points),
        explanation: formData.explanation,
        timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : null,
        tags: formData.tags,
        subject: formData.subject || null,
        course: formData.course || null,
      };

      if (
        formData.questionType === "multiple-choice" ||
        formData.questionType === "true-false"
      ) {
        questionData.options = formData.options;
      } else {
        questionData.correctAnswer = formData.correctAnswer;
      }

      if (isEditing) {
        await questionService.updateQuestion(id, questionData);
        alert("Question updated successfully!");
      } else {
        await questionService.createQuestion(questionData);
        alert("Question created successfully!");
      }

      navigate("/teacher/questions");
    } catch (err) {
      alert("Failed to save question");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-question-page">
      <div className="page-header">
        <h1>{isEditing ? "Edit Question" : "Create New Question"}</h1>
        <button
          className="btn-secondary"
          onClick={() => navigate("/teacher/questions")}
        >
          ← Back to Question Bank
        </button>
      </div>

      <form onSubmit={handleSubmit} className="question-form">
        {/* Basic Information */}
        <div className="form-section">
          <h2>Basic Information</h2>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Question Text *</label>
              <textarea
                name="questionText"
                value={formData.questionText}
                onChange={handleInputChange}
                rows="5"
                placeholder="Enter your question here..."
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Question Type *</label>
              <select
                name="questionType"
                value={formData.questionType}
                onChange={handleInputChange}
                required
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="true-false">True/False</option>
                <option value="short-answer">Short Answer</option>
                <option value="essay">Essay</option>
                <option value="fill-in-blank">Fill in the Blank</option>
              </select>
            </div>

            <div className="form-group">
              <label>Difficulty Level *</label>
              <select
                name="difficultyLevel"
                value={formData.difficultyLevel}
                onChange={handleInputChange}
                required
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            <div className="form-group">
              <label>Points *</label>
              <input
                type="number"
                name="points"
                value={formData.points}
                onChange={handleInputChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>Time Limit (seconds)</label>
              <input
                type="number"
                name="timeLimit"
                value={formData.timeLimit}
                onChange={handleInputChange}
                min="0"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Course</label>
              <select
                name="course"
                value={formData.course}
                onChange={handleInputChange}
              >
                <option value="">Select Course (Optional)</option>
                {courses.map((course) => {
                  console.log("Course item:", course);
                  // Handle both formats: direct properties and attributes wrapper
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

            <div className="form-group">
              <label>Subject</label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
              >
                <option value="">Select Subject (Optional)</option>
                {subjects.map((subject) => {
                  console.log("Subject item:", subject);
                  // Handle both formats: direct properties and attributes wrapper
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
        </div>

        {/* Answer Options */}
        {(formData.questionType === "multiple-choice" ||
          formData.questionType === "true-false") && (
          <div className="form-section">
            <h2>Answer Options</h2>
            <p className="helper-text">
              {formData.questionType === "true-false"
                ? "Select the correct answer by clicking the radio button"
                : "Select one or more correct answers by clicking the checkboxes"}
            </p>

            {formData.options.map((option, index) => (
              <div key={option.id} className="option-row">
                {formData.questionType === "true-false" ? (
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={option.isCorrect}
                    onChange={() => handleCorrectAnswerChange(index)}
                  />
                ) : (
                  <input
                    type="checkbox"
                    checked={option.isCorrect}
                    onChange={() => handleMultipleCorrectAnswerChange(index)}
                  />
                )}
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) =>
                    handleOptionChange(index, "text", e.target.value)
                  }
                  placeholder={`Option ${option.id.toUpperCase()}`}
                  required
                />
                {formData.questionType === "multiple-choice" &&
                  formData.options.length > 2 && (
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removeOption(index)}
                    >
                      ✕
                    </button>
                  )}
              </div>
            ))}

            {formData.questionType === "multiple-choice" && (
              <button
                type="button"
                className="btn-add-option"
                onClick={addOption}
              >
                + Add Option
              </button>
            )}
          </div>
        )}

        {/* Text Answer */}
        {(formData.questionType === "short-answer" ||
          formData.questionType === "essay" ||
          formData.questionType === "fill-in-blank") && (
          <div className="form-section">
            <h2>Correct Answer</h2>
            <div className="form-group full-width">
              <label>Enter the correct answer or sample answer</label>
              <textarea
                name="correctAnswer"
                value={formData.correctAnswer}
                onChange={handleInputChange}
                rows="4"
                placeholder="Enter the correct answer..."
              />
            </div>
          </div>
        )}

        {/* Explanation */}
        <div className="form-section">
          <h2>Explanation (Optional)</h2>
          <div className="form-group full-width">
            <label>Provide an explanation for the correct answer</label>
            <textarea
              name="explanation"
              value={formData.explanation}
              onChange={handleInputChange}
              rows="4"
              placeholder="This will be shown to students after they answer..."
            />
          </div>
        </div>

        {/* Tags */}
        <div className="form-section">
          <h2>Tags (Optional)</h2>
          <div className="tags-input">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), addTag())
              }
              placeholder="Add tags (press Enter)"
            />
            <button type="button" onClick={addTag} className="btn-add-tag">
              Add Tag
            </button>
          </div>
          <div className="tags-list">
            {formData.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
                <button type="button" onClick={() => removeTag(tag)}>
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/teacher/questions")}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading
              ? "Saving..."
              : isEditing
              ? "Update Question"
              : "Create Question"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuestionPage;
