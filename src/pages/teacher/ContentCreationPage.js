import React, { useState, useEffect, useCallback, useContext } from "react";
import "./ContentCreationPage.css";
import contentService from "../../services/contentService";
import subjectService from "../../services/subjectService";
import { AuthContext } from "../../AuthContext";

const ContentCreationPage = () => {
  const { user } = useContext(AuthContext);
  const [contents, setContents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("list"); // 'list', 'create', 'edit'
  const [selectedContent, setSelectedContent] = useState(null);
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content_type: "video",
    content_url: "",
    subject: "",
    difficulty_level: "beginner",
  });
  const [mediaFile, setMediaFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  const contentTypes = [
    { value: "video", label: "🎥 Video", icon: "🎥" },
    { value: "pdf", label: "📄 PDF Document", icon: "📄" },
    { value: "presentation", label: "📊 Presentation", icon: "📊" },
    { value: "article", label: "📝 Article", icon: "📝" },
    { value: "audio", label: "🎵 Audio", icon: "🎵" },
    { value: "interactive", label: "🎮 Interactive", icon: "🎮" },
    { value: "quiz", label: "❓ Quiz", icon: "❓" },
    { value: "assignment", label: "📋 Assignment", icon: "📋" },
  ];

  const difficultyLevels = [
    { value: "beginner", label: "Beginner", color: "#2ecc71" },
    { value: "intermediate", label: "Intermediate", color: "#f39c12" },
    { value: "advanced", label: "Advanced", color: "#e74c3c" },
  ];

  const fetchContents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch contents created by this teacher
      const contentData = await contentService.getContentsByTeacher(user.id);
      setContents(Array.isArray(contentData) ? contentData : []);
    } catch (err) {
      setError(err.message);
      setContents([]);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  const fetchSubjects = useCallback(async () => {
    try {
      const subjectData = await subjectService.getAllSubjects({
        populate: "course",
      });
      setSubjects(Array.isArray(subjectData) ? subjectData : []);
    } catch (err) {
      console.error("Error fetching subjects:", err);
      setSubjects([]);
    }
  }, []);

  useEffect(() => {
    fetchContents();
    fetchSubjects();
  }, [fetchContents, fetchSubjects]);

  const filteredContents = contents.filter((content) => {
    const matchesSubject =
      filterSubject === "all" ||
      (content.subject?.documentId || content.subject?.id) === filterSubject;
    const matchesType =
      filterType === "all" || content.content_type === filterType;
    return matchesSubject && matchesType;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setUploadProgress(true);

      let mediaId = selectedContent?.media?.documentId;

      // Upload media file if provided
      if (mediaFile) {
        const uploadedMedia = await contentService.uploadMedia(mediaFile);
        mediaId = uploadedMedia.documentId;
      }

      const contentData = {
        title: formData.title,
        description: formData.description,
        content_type: formData.content_type,
        content_url: formData.content_url,
        subject: formData.subject,
        difficulty_level: formData.difficulty_level,
        teacher: user.id,
        ...(mediaId && { media: mediaId }),
      };

      if (view === "edit" && selectedContent) {
        await contentService.updateContent(
          selectedContent.documentId,
          contentData
        );
      } else {
        await contentService.createContent(contentData);
      }

      resetForm();
      setView("list");
      fetchContents();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadProgress(false);
    }
  };

  const handleEdit = (content) => {
    setSelectedContent(content);
    setFormData({
      title: content.title || "",
      description: content.description || "",
      content_type: content.content_type || "video",
      content_url: content.content_url || "",
      // Prioritize documentId for Strapi v5
      subject: content.subject?.documentId || content.subject?.id || "",
      difficulty_level: content.difficulty_level || "beginner",
    });
    setView("edit");
  };

  const handleDelete = async (documentId) => {
    if (window.confirm("Are you sure you want to delete this content?")) {
      try {
        await contentService.deleteContent(documentId);
        fetchContents();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      content_type: "video",
      content_url: "",
      subject: "",
      difficulty_level: "beginner",
    });
    setMediaFile(null);
    setSelectedContent(null);
  };

  const handleCancel = () => {
    resetForm();
    setView("list");
  };

  const getContentTypeIcon = (type) => {
    const contentType = contentTypes.find((ct) => ct.value === type);
    return contentType ? contentType.icon : "📄";
  };

  const getDifficultyColor = (level) => {
    const difficulty = difficultyLevels.find((d) => d.value === level);
    return difficulty ? difficulty.color : "#95a5a6";
  };

  if (loading && view === "list") {
    return (
      <div className="content-creation-loading">
        <div className="spinner"></div>
        <p>Loading contents...</p>
      </div>
    );
  }

  return (
    <div className="content-creation-page">
      {error && (
        <div className="content-error">
          <p>⚠️ {error}</p>
        </div>
      )}

      {view === "list" && (
        <>
          <div className="content-header">
            <div className="content-header-left">
              <h2>📚 My Learning Content</h2>
              <p>{filteredContents.length} content items created</p>
            </div>
            <div className="content-header-right">
              <select
                className="filter-select"
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
              >
                <option value="all">All Subjects</option>
                {subjects.map((subject) => (
                  <option
                    key={subject.documentId}
                    value={subject.documentId || subject.id}
                  >
                    {subject.name}
                  </option>
                ))}
              </select>
              <select
                className="filter-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                {contentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <button
                className="btn-create-content"
                onClick={() => setView("create")}
              >
                ➕ Create Content
              </button>
            </div>
          </div>

          {filteredContents.length === 0 ? (
            <div className="content-empty">
              <p>
                📚 No content found. Start creating engaging learning materials!
              </p>
            </div>
          ) : (
            <div className="content-grid">
              {filteredContents.map((content) => (
                <div key={content.documentId} className="content-card">
                  <div className="content-card-header">
                    <span className="content-type-icon">
                      {getContentTypeIcon(content.content_type)}
                    </span>
                    <span
                      className="difficulty-badge"
                      style={{
                        background: getDifficultyColor(
                          content.difficulty_level
                        ),
                      }}
                    >
                      {content.difficulty_level}
                    </span>
                  </div>
                  <div className="content-card-body">
                    <h3>{content.title}</h3>
                    <p className="content-description">{content.description}</p>
                    <div className="content-meta">
                      <span className="content-subject">
                        📖 {content.subject?.name || "No subject"}
                      </span>
                      <span className="content-type-label">
                        {contentTypes.find(
                          (ct) => ct.value === content.content_type
                        )?.label || content.content_type}
                      </span>
                    </div>
                  </div>
                  <div className="content-card-footer">
                    <button
                      className="btn-edit-content"
                      onClick={() => handleEdit(content)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn-delete-content"
                      onClick={() => handleDelete(content.documentId)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {(view === "create" || view === "edit") && (
        <div className="content-form-container">
          <div className="content-form-header">
            <h2>
              {view === "edit" ? "✏️ Edit Content" : "➕ Create New Content"}
            </h2>
            <p>Create engaging learning materials for your students</p>
          </div>

          <form onSubmit={handleSubmit} className="content-form">
            <div className="form-group">
              <label>Content Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="e.g., Introduction to Algebra"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Content Type *</label>
                <select
                  name="content_type"
                  value={formData.content_type}
                  onChange={handleInputChange}
                  required
                >
                  {contentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Difficulty Level *</label>
                <select
                  name="difficulty_level"
                  value={formData.difficulty_level}
                  onChange={handleInputChange}
                  required
                >
                  {difficultyLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Subject *</label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a subject</option>
                {subjects.map((subject) => (
                  <option
                    key={subject.documentId}
                    value={subject.documentId || subject.id}
                  >
                    {subject.name}{" "}
                    {subject.course ? `(${subject.course.name})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                placeholder="Provide a detailed description of the content"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label>Content URL (YouTube, Google Drive, etc.)</label>
              <input
                type="url"
                name="content_url"
                value={formData.content_url}
                onChange={handleInputChange}
                placeholder="https://youtube.com/watch?v=..."
              />
              <small>Provide a link to external content (optional)</small>
            </div>

            <div className="form-group">
              <label>Upload Media File (optional)</label>
              <input type="file" accept="*/*" onChange={handleMediaChange} />
              <small>Upload PDF, video, audio, or other files</small>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleCancel}
                disabled={uploadProgress}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-save"
                disabled={uploadProgress}
              >
                {uploadProgress
                  ? "Uploading..."
                  : view === "edit"
                  ? "Update Content"
                  : "Create Content"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ContentCreationPage;
