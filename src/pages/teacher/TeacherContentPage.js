import React, { useState, useEffect, useCallback } from "react";
import "./TeacherContentPage.css";
import contentService from "../../services/contentService";
import subjectService from "../../services/subjectService";

const TeacherContentPage = () => {
  const [contents, setContents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("list"); // 'list', 'create', 'edit'
  const [selectedContent, setSelectedContent] = useState(null);
  const [filterSubject, setFilterSubject] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    contentype: "plaintext", // plaintext, richtext, richtext_markdown, images, videos, youtube, msoffice
    youtubeurl: "",
    plaintext: "",
    richtext: "",
    richtext_markdown: "",
    subject: "",
  });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreview, setMediaPreview] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch contents
      const params =
        filterSubject !== "all"
          ? { "filters[subject][id][$eq]": filterSubject }
          : {};
      const contentData = await contentService.getAllContents(params);
      setContents(Array.isArray(contentData) ? contentData : []);

      // Fetch subjects
      const subjectData = await subjectService.getAllSubjects({
        populate: "course",
      });
      setSubjects(Array.isArray(subjectData) ? subjectData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterSubject]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    setMediaFiles(files);

    // Create preview URLs
    const previews = files.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("image/") ? "image" : "video",
      name: file.name,
    }));
    setMediaPreview(previews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);

      let uploadedMediaIds = [];

      // Upload media files if present (for images, videos, msoffice)
      if (
        mediaFiles.length > 0 &&
        ["images", "videos", "msoffice"].includes(formData.contentype)
      ) {
        const uploadedMedia = await contentService.uploadMedia(mediaFiles);
        uploadedMediaIds = uploadedMedia.map((media) => media.id);
      }

      const contentData = {
        title: formData.title,
        subtitle: formData.subtitle,
        contentype: formData.contentype,
        subject: formData.subject || null,
      };

      // Add content based on type
      if (formData.contentype === "youtube") {
        contentData.youtubeurl = formData.youtubeurl;
      } else if (formData.contentype === "plaintext") {
        contentData.plaintext = formData.plaintext;
      } else if (formData.contentype === "richtext") {
        contentData.richtext = formData.richtext;
      } else if (formData.contentype === "richtext_markdown") {
        contentData.richtext_markdown = formData.richtext_markdown;
      } else if (
        formData.contentype === "images" &&
        uploadedMediaIds.length > 0
      ) {
        contentData.images = uploadedMediaIds;
      } else if (
        formData.contentype === "videos" &&
        uploadedMediaIds.length > 0
      ) {
        contentData.videos = uploadedMediaIds;
      } else if (
        formData.contentype === "msoffice" &&
        uploadedMediaIds.length > 0
      ) {
        contentData.msoffice = uploadedMediaIds;
      }

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
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (content) => {
    setSelectedContent(content);
    setFormData({
      title: content.title || "",
      subtitle: content.subtitle || "",
      contentype: content.contentype || "plaintext",
      youtubeurl: content.youtubeurl || "",
      plaintext: content.plaintext || "",
      richtext: content.richtext || "",
      richtext_markdown: content.richtext_markdown || "",
      // Prioritize documentId for Strapi v5
      subject: content.subject?.documentId || content.subject?.id || "",
    });

    // Set media preview from existing content
    if (content.images?.length > 0) {
      const imagePreviews = content.images.map((img) => ({
        url: `http://localhost:1337${img.url}`,
        type: "image",
        name: img.name,
      }));
      setMediaPreview(imagePreviews);
    } else if (content.videos?.length > 0) {
      const videoPreviews = content.videos.map((vid) => ({
        url: `http://localhost:1337${vid.url}`,
        type: "video",
        name: vid.name,
      }));
      setMediaPreview(videoPreviews);
    } else if (content.msoffice?.length > 0) {
      const officePreviews = content.msoffice.map((file) => ({
        url: `http://localhost:1337${file.url}`,
        type: "document",
        name: file.name,
      }));
      setMediaPreview(officePreviews);
    }

    setView("edit");
  };

  const handleDelete = async (documentId) => {
    if (window.confirm("Are you sure you want to delete this content?")) {
      try {
        await contentService.deleteContent(documentId);
        fetchData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      contentype: "plaintext",
      youtubeurl: "",
      plaintext: "",
      richtext: "",
      richtext_markdown: "",
      subject: "",
    });
    setMediaFiles([]);
    setMediaPreview([]);
    setSelectedContent(null);
  };

  const handleCancel = () => {
    resetForm();
    setView("list");
  };

  const getContentTypeIcon = (type) => {
    const icons = {
      plaintext: "📝",
      richtext: "📄",
      richtext_markdown: "📋",
      images: "🖼️",
      videos: "🎥",
      youtube: "▶️",
      msoffice: "📊",
    };
    return icons[type] || "📝";
  };

  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };
  if (loading && view === "list") {
    return (
      <div className="teacher-content-loading">
        <div className="spinner"></div>
        <p>Loading contents...</p>
      </div>
    );
  }

  return (
    <div className="teacher-content-page">
      {error && (
        <div className="content-error">
          <p>⚠️ {error}</p>
        </div>
      )}

      {view === "list" && (
        <>
          <div className="content-header">
            <div className="content-header-left">
              <h2>My Contents</h2>
              <p>{contents.length} contents created</p>
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
                    {subject.name}{" "}
                    {subject.course?.name && `- ${subject.course.name}`}
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

          {contents.length === 0 ? (
            <div className="content-empty">
              <p>📚 No contents found. Create your first content!</p>
            </div>
          ) : (
            <div className="content-grid">
              {contents.map((content) => (
                <div key={content.documentId} className="content-card">
                  <div className="content-card-header">
                    <span className="content-type-badge">
                      {getContentTypeIcon(content.contentype)}{" "}
                      {content.contentype || "content"}
                    </span>
                  </div>

                  {content.contentype === "youtube" && content.youtubeurl && (
                    <div className="content-thumbnail">
                      <iframe
                        width="100%"
                        height="180"
                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(
                          content.youtubeurl
                        )}`}
                        title={content.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}

                  {content.images?.length > 0 && (
                    <div className="content-thumbnail">
                      <img
                        src={`http://localhost:1337${content.images[0].url}`}
                        alt={content.title}
                      />
                    </div>
                  )}

                  {content.videos?.length > 0 && (
                    <div className="content-thumbnail video-thumb">
                      <span className="play-icon">▶️</span>
                    </div>
                  )}

                  {content.msoffice?.length > 0 && (
                    <div
                      className="content-thumbnail"
                      style={{ background: "#f0f0f0", color: "#666" }}
                    >
                      <span style={{ fontSize: "48px" }}>📊</span>
                    </div>
                  )}

                  {(content.contentype === "plaintext" ||
                    content.contentype === "richtext" ||
                    content.contentype === "richtext_markdown") && (
                    <div
                      className="content-thumbnail"
                      style={{
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                        padding: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span style={{ fontSize: "48px" }}>
                        {getContentTypeIcon(content.contentype)}
                      </span>
                    </div>
                  )}

                  <div className="content-card-body">
                    <h3>{content.title}</h3>
                    <p className="content-subtitle">{content.subtitle}</p>
                    {content.subject && (
                      <span className="subject-tag">
                        📖 {content.subject.name}
                      </span>
                    )}
                  </div>

                  <div className="content-card-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(content)}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(content.documentId)}
                    >
                      🗑️
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
            <h2>{view === "edit" ? "Edit Content" : "Create New Content"}</h2>
          </div>

          <form onSubmit={handleSubmit} className="content-form">
            <div className="form-row">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Introduction to Algebra"
                />
              </div>

              <div className="form-group">
                <label>Content Type *</label>
                <select
                  name="contentype"
                  value={formData.contentype}
                  onChange={handleInputChange}
                  required
                >
                  <option value="plaintext">Plain Text</option>
                  <option value="richtext">Rich Text</option>
                  <option value="richtext_markdown">
                    Rich Text (Markdown)
                  </option>
                  <option value="images">Images</option>
                  <option value="videos">Videos</option>
                  <option value="youtube">YouTube</option>
                  <option value="msoffice">MS Office</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Subtitle</label>
              <textarea
                name="subtitle"
                value={formData.subtitle}
                onChange={handleInputChange}
                placeholder="Brief description of the content"
                rows="2"
              />
            </div>

            <div className="form-group">
              <label>Subject</label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
              >
                <option value="">Select a subject</option>
                {subjects.map((subject) => (
                  <option
                    key={subject.documentId}
                    value={subject.documentId || subject.id}
                  >
                    {subject.name}{" "}
                    {subject.course?.name && `- ${subject.course.name}`}
                  </option>
                ))}
              </select>
            </div>

            {formData.contentype === "youtube" && (
              <>
                <div className="form-group">
                  <label>YouTube URL *</label>
                  <input
                    type="url"
                    name="youtubeurl"
                    value={formData.youtubeurl}
                    onChange={handleInputChange}
                    required={formData.contentype === "youtube"}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
                {formData.youtubeurl &&
                  getYouTubeVideoId(formData.youtubeurl) && (
                    <div className="form-group">
                      <label>Preview</label>
                      <div
                        style={{
                          position: "relative",
                          paddingBottom: "56.25%",
                          height: 0,
                          overflow: "hidden",
                          maxWidth: "100%",
                          background: "#000",
                          borderRadius: "8px",
                        }}
                      >
                        <iframe
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                          }}
                          src={`https://www.youtube.com/embed/${getYouTubeVideoId(
                            formData.youtubeurl
                          )}`}
                          title="YouTube Preview"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    </div>
                  )}
              </>
            )}

            {formData.contentype === "plaintext" && (
              <div className="form-group">
                <label>Plain Text Content *</label>
                <textarea
                  name="plaintext"
                  value={formData.plaintext}
                  onChange={handleInputChange}
                  required={formData.contentype === "plaintext"}
                  placeholder="Enter your plain text content here..."
                  rows="8"
                />
              </div>
            )}

            {formData.contentype === "richtext" && (
              <div className="form-group">
                <label>Rich Text Content *</label>
                <textarea
                  name="richtext"
                  value={formData.richtext}
                  onChange={handleInputChange}
                  required={formData.contentype === "richtext"}
                  placeholder="Enter your rich text content here..."
                  rows="8"
                />
              </div>
            )}

            {formData.contentype === "richtext_markdown" && (
              <div className="form-group">
                <label>Markdown Content *</label>
                <textarea
                  name="richtext_markdown"
                  value={formData.richtext_markdown}
                  onChange={handleInputChange}
                  required={formData.contentype === "richtext_markdown"}
                  placeholder="# Heading&#10;## Subheading&#10;Enter your markdown content here..."
                  rows="8"
                />
              </div>
            )}

            {(formData.contentype === "videos" ||
              formData.contentype === "images" ||
              formData.contentype === "msoffice") && (
              <div className="form-group">
                <label>
                  {formData.contentype === "videos" && "Upload Videos *"}
                  {formData.contentype === "images" && "Upload Images *"}
                  {formData.contentype === "msoffice" &&
                    "Upload Office Files *"}
                </label>
                <input
                  type="file"
                  accept={
                    formData.contentype === "videos"
                      ? "video/*"
                      : formData.contentype === "images"
                      ? "image/*"
                      : ".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf"
                  }
                  onChange={handleMediaChange}
                  multiple
                />

                {mediaPreview.length > 0 && (
                  <div className="media-preview-grid">
                    {mediaPreview.map((preview, index) => (
                      <div key={index} className="media-preview-item">
                        {preview.type === "image" ? (
                          <img src={preview.url} alt={preview.name} />
                        ) : (
                          <div className="video-preview">
                            <span className="video-icon">🎥</span>
                            <span className="video-name">{preview.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button type="submit" className="btn-save">
                {view === "edit" ? "Update Content" : "Create Content"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TeacherContentPage;
