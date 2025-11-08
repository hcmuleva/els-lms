import React, { useState, useEffect } from 'react';
import subjectService from '../../services/subjectService';
import './SubjectManager.css';

const SubjectManager = ({ courseDocumentId, courseName }) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    category: 'academic'
  });
  const [coverFile, setCoverFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (courseDocumentId) {
      fetchSubjects();
    }
  }, [courseDocumentId]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await subjectService.getSubjectsByCourse(courseDocumentId);
      setSubjects(response.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load subjects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      subtitle: subject.subtitle || '',
      category: subject.category || 'academic'
    });
    if (subject.covericon && subject.covericon.length > 0) {
      setPreviewUrl(`${process.env.REACT_APP_API_URL}${subject.covericon[0].url}`);
    }
    setShowForm(true);
  };

  const handleDelete = async (subject) => {
    if (window.confirm(`Are you sure you want to delete "${subject.name}"?`)) {
      try {
        await subjectService.deleteSubject(subject.documentId);
        fetchSubjects();
      } catch (err) {
        alert('Failed to delete subject');
        console.error(err);
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let coverIconId = null;

      // Upload cover if new file selected
      if (coverFile) {
        const uploadResponse = await subjectService.uploadCoverIcon(coverFile);
        if (uploadResponse && uploadResponse.length > 0) {
          coverIconId = uploadResponse[0].id;
        }
      } else if (editingSubject && editingSubject.covericon && editingSubject.covericon.length > 0) {
        coverIconId = editingSubject.covericon[0].id;
      }

      const subjectData = {
        ...formData,
        course: courseDocumentId,
        covericon: coverIconId ? [coverIconId] : []
      };

      if (editingSubject) {
        await subjectService.updateSubject(editingSubject.documentId, subjectData);
      } else {
        await subjectService.createSubject(subjectData);
      }

      // Reset form and refresh
      resetForm();
      fetchSubjects();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save subject');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', subtitle: '', category: 'academic' });
    setCoverFile(null);
    setPreviewUrl(null);
    setEditingSubject(null);
    setShowForm(false);
    setError(null);
  };

  const getImageUrl = (covericon) => {
    if (!covericon || covericon.length === 0) return null;
    return `${process.env.REACT_APP_API_URL}${covericon[0].url}`;
  };

  if (loading) {
    return (
      <div className="subject-manager-loading">
        <div className="spinner"></div>
        <p>Loading subjects...</p>
      </div>
    );
  }

  return (
    <div className="subject-manager">
      <div className="subject-manager-header">
        <div>
          <h3>📚 Subjects for {courseName}</h3>
          <p className="subject-count">{subjects.length} subject(s)</p>
        </div>
        {!showForm && (
          <button className="btn-add-subject" onClick={() => setShowForm(true)}>
            + Add Subject
          </button>
        )}
      </div>

      {error && (
        <div className="subject-error">
          <p>{error}</p>
        </div>
      )}

      {/* Subject Form */}
      {showForm && (
        <div className="subject-form-container">
          <div className="subject-form-header">
            <h4>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h4>
            <button className="btn-close-form" onClick={resetForm}>✕</button>
          </div>

          <form onSubmit={handleSubmit} className="subject-form">
            <div className="form-row">
              <div className="form-group">
                <label>Subject Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Mathematics"
                  required
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="academic">Academic</option>
                  <option value="competion">Competition</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Subtitle/Description</label>
              <textarea
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Brief description of the subject..."
                rows={3}
                maxLength={500}
              />
              <small>{formData.subtitle.length}/500 characters</small>
            </div>

            <div className="form-group">
              <label>Cover Icon (Optional)</label>
              {previewUrl && (
                <div className="image-preview-small">
                  <img src={previewUrl} alt="Preview" />
                  <button
                    type="button"
                    className="btn-remove-preview"
                    onClick={() => {
                      setPreviewUrl(null);
                      setCoverFile(null);
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" className="btn-save" disabled={saving}>
                {saving ? 'Saving...' : (editingSubject ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Subjects List */}
      {subjects.length === 0 ? (
        <div className="subject-empty">
          <p>No subjects added yet. Click "Add Subject" to get started.</p>
        </div>
      ) : (
        <div className="subject-list">
          {subjects.map((subject) => (
            <div key={subject.documentId} className="subject-item">
              <div className="subject-icon">
                {getImageUrl(subject.covericon) ? (
                  <img src={getImageUrl(subject.covericon)} alt={subject.name} />
                ) : (
                  <span className="subject-placeholder">📖</span>
                )}
              </div>
              
              <div className="subject-details">
                <h4>{subject.name}</h4>
                <p className="subject-subtitle">{subject.subtitle || 'No description'}</p>
                <span className={`subject-category ${subject.category}`}>
                  {subject.category === 'academic' ? '🎓 Academic' : '🏆 Competition'}
                </span>
              </div>

              <div className="subject-actions">
                <button
                  className="btn-edit-subject"
                  onClick={() => handleEdit(subject)}
                  title="Edit Subject"
                >
                  ✏️
                </button>
                <button
                  className="btn-delete-subject"
                  onClick={() => handleDelete(subject)}
                  title="Delete Subject"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubjectManager;
