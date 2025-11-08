import React from 'react';
import courseService from '../../services/courseService';
import './CourseView.css';

const CourseView = ({ course, onClose, onEdit }) => {
  if (!course) return null;

  const getImageUrl = (covericon) => {
    if (!covericon || covericon.length === 0) return null;
    const image = covericon[0];
    return `${process.env.REACT_APP_API_URL}${image.url}`;
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="course-view-overlay" onClick={onClose}>
      <div className="course-view-container" onClick={(e) => e.stopPropagation()}>
        <button className="btn-close-view" onClick={onClose} title="Close">
          ✕
        </button>

        {/* Header with Cover Image */}
        <div className="course-view-header">
          {getImageUrl(course.covericon) ? (
            <img 
              src={getImageUrl(course.covericon)} 
              alt={course.name}
              className="course-view-cover"
            />
          ) : (
            <div className="course-view-no-cover">
              <span>📚</span>
            </div>
          )}
          <div className="course-view-header-overlay">
            <span className="course-view-badge">{course.agegroup || 'N/A'}</span>
            <h1>{course.name}</h1>
            <p className="course-view-subtitle">{course.subtitle}</p>
          </div>
        </div>

        {/* Course Details */}
        <div className="course-view-body">
          {/* Status and Dates */}
          <div className="course-view-meta">
            <div className="meta-item">
              <span className="meta-label">Status:</span>
              <span className={`meta-value status-${course.publishedAt ? 'published' : 'draft'}`}>
                {course.publishedAt ? '✓ Published' : '⚠ Draft'}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Created:</span>
              <span className="meta-value">{formatDate(course.createdAt)}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Updated:</span>
              <span className="meta-value">{formatDate(course.updatedAt)}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Document ID:</span>
              <span className="meta-value document-id">{course.documentId}</span>
            </div>
          </div>

          {/* Description */}
          <div className="course-view-section">
            <h3>📝 Description</h3>
            <div className="course-view-description">
              {courseService.parseDescription(course.description)}
            </div>
          </div>

          {/* YouTube URL */}
          {course.youtube_url && (
            <div className="course-view-section">
              <h3>🎥 Course Video</h3>
              <a 
                href={course.youtube_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="youtube-link"
              >
                {course.youtube_url}
              </a>
            </div>
          )}

          {/* Media Gallery */}
          {(course.course_images || course.course_video) && (
            <div className="course-view-section">
              <h3>🖼️ Media Gallery</h3>
              <div className="media-gallery">
                {course.course_images && course.course_images.length > 0 && (
                  <div className="media-item">
                    <p>Course Images: {course.course_images.length} files</p>
                  </div>
                )}
                {course.course_video && (
                  <div className="media-item">
                    <p>Course Video: Available</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Technical Details */}
          <div className="course-view-section">
            <h3>⚙️ Technical Details</h3>
            <div className="technical-details">
              <div className="detail-row">
                <span className="detail-label">Database ID:</span>
                <span className="detail-value">{course.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Document ID:</span>
                <span className="detail-value">{course.documentId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Age Group:</span>
                <span className="detail-value">{course.agegroup}</span>
              </div>
              {course.publishedAt && (
                <div className="detail-row">
                  <span className="detail-label">Published At:</span>
                  <span className="detail-value">{formatDate(course.publishedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="course-view-footer">
          <button className="btn-view-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn-view-primary" onClick={() => onEdit(course)}>
            ✏️ Edit Course
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseView;
