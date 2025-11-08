import React, { useState, useEffect } from 'react';
import courseService from '../../services/courseService';
import './CourseForm.css';

const CourseForm = ({ course, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    description: '',
    agegroup: 'elementary',
    youtube_url: ''
  });
  const [coverFile, setCoverFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ageGroups = [
    { value: 'preschool', label: 'Preschool (3-5 years)' },
    { value: 'elementary', label: 'Elementary (6-10 years)' },
    { value: 'middle-school', label: 'Middle School (11-13 years)' },
    { value: 'high-school', label: 'High School (14-18 years)' },
    { value: 'adult', label: 'Adult (18+ years)' }
  ];

  useEffect(() => {
    if (course) {
      setFormData({
        name: course.name || '',
        subtitle: course.subtitle || '',
        description: courseService.parseDescription(course.description) || '',
        agegroup: course.agegroup || 'elementary',
        youtube_url: course.youtube_url || ''
      });

      // Set preview for existing cover image
      if (course.covericon && course.covericon.length > 0) {
        const imageUrl = `${process.env.REACT_APP_API_URL}${course.covericon[0].url}`;
        setPreviewUrl(imageUrl);
      }
    }
  }, [course]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let coverIconId = null;

      // Upload cover image if new file selected
      if (coverFile) {
        const uploadResponse = await courseService.uploadCoverIcon(coverFile);
        if (uploadResponse && uploadResponse.length > 0) {
          coverIconId = uploadResponse[0].id;
        }
      } else if (course && course.covericon && course.covericon.length > 0) {
        // Keep existing cover icon
        coverIconId = course.covericon[0].id;
      }

      // Prepare course data
      const courseData = {
        name: formData.name,
        subtitle: formData.subtitle,
        description: courseService.formatDescription(formData.description),
        agegroup: formData.agegroup,
        youtube_url: formData.youtube_url || null,
        covericon: coverIconId ? [coverIconId] : []
      };

      let result;
      if (course) {
        // Update existing course
        result = await courseService.updateCourse(course.documentId, courseData);
      } else {
        // Create new course
        result = await courseService.createCourse(courseData);
      }

      if (onSubmit) {
        onSubmit(result);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save course. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="course-form-container">
      <div className="course-form-header">
        <h2>{course ? 'Edit Course' : 'Create New Course'}</h2>
      </div>

      {error && (
        <div className="course-form-error">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="course-form">
        {/* Course Name */}
        <div className="form-group">
          <label htmlFor="name">
            Course Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Introduction to Programming"
            required
            maxLength={100}
          />
          <small className="form-help">Maximum 100 characters</small>
        </div>

        {/* Subtitle */}
        <div className="form-group">
          <label htmlFor="subtitle">
            Subtitle <span className="required">*</span>
          </label>
          <input
            type="text"
            id="subtitle"
            name="subtitle"
            value={formData.subtitle}
            onChange={handleChange}
            placeholder="e.g., Learn coding fundamentals"
            required
            maxLength={150}
          />
          <small className="form-help">Maximum 150 characters</small>
        </div>

        {/* Age Group */}
        <div className="form-group">
          <label htmlFor="agegroup">
            Age Group <span className="required">*</span>
          </label>
          <select
            id="agegroup"
            name="agegroup"
            value={formData.agegroup}
            onChange={handleChange}
            required
          >
            {ageGroups.map(group => (
              <option key={group.value} value={group.value}>
                {group.label}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description">
            Description <span className="required">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide a detailed description of the course..."
            rows={6}
            required
            maxLength={1000}
          />
          <small className="form-help">
            {formData.description.length}/1000 characters
          </small>
        </div>

        {/* YouTube URL */}
        <div className="form-group">
          <label htmlFor="youtube_url">
            YouTube URL (Optional)
          </label>
          <input
            type="url"
            id="youtube_url"
            name="youtube_url"
            value={formData.youtube_url}
            onChange={handleChange}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <small className="form-help">Add a YouTube video for the course intro</small>
        </div>

        {/* Cover Image */}
        <div className="form-group">
          <label htmlFor="covericon">
            Cover Image
          </label>
          
          {previewUrl && (
            <div className="image-preview">
              <img src={previewUrl} alt="Cover preview" />
              <button
                type="button"
                className="btn-remove-image"
                onClick={() => {
                  setPreviewUrl(null);
                  setCoverFile(null);
                }}
              >
                ✕ Remove
              </button>
            </div>
          )}
          
          <input
            type="file"
            id="covericon"
            accept="image/*"
            onChange={handleFileChange}
            className="file-input"
          />
          <small className="form-help">
            Recommended size: 296x170 pixels. Max file size: 2MB
          </small>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                {course ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              course ? 'Update Course' : 'Create Course'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm;
