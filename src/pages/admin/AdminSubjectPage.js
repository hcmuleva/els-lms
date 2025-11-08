import React, { useState, useEffect, useCallback } from 'react';
import './AdminSubjectPage.css';
import subjectService from '../../services/subjectService';
import courseService from '../../services/courseService';

const AdminSubjectPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('list'); // 'list', 'create', 'edit'
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    category: 'academic',
    course: ''
  });
  const [coverFile, setCoverFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = filterCourse !== 'all' 
        ? { 'filters[course][id][$eq]': filterCourse, populate: 'course' }
        : { populate: 'course' };
      const data = await subjectService.getAllSubjects(params);
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [filterCourse]);

  const fetchCourses = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:1337/api/courses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      setCourses(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setCourses([]);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
    fetchCourses();
  }, [fetchSubjects, fetchCourses]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      
      let coverIconId = selectedSubject?.covericon?.documentId;
      
      if (coverFile) {
        const uploadedImage = await subjectService.uploadCoverIcon(coverFile);
        coverIconId = uploadedImage.documentId;
      }

      const subjectData = {
        name: formData.name,
        subtitle: formData.subtitle,
        category: formData.category,
        course: formData.course,
        ...(coverIconId && { covericon: coverIconId })
      };

      if (view === 'edit' && selectedSubject) {
        await subjectService.updateSubject(selectedSubject.documentId, subjectData);
      } else {
        await subjectService.createSubject(subjectData);
      }

      resetForm();
      setView('list');
      fetchSubjects();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (subject) => {
    setSelectedSubject(subject);
    setFormData({
      name: subject.name || '',
      subtitle: subject.subtitle || '',
      category: subject.category || 'academic',
      course: subject.course?.documentId || ''
    });
    if (subject.covericon?.url) {
      setPreviewUrl(`http://localhost:1337${subject.covericon.url}`);
    }
    setView('edit');
  };

  const handleDelete = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await subjectService.deleteSubject(documentId);
        fetchSubjects();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subtitle: '',
      category: 'academic',
      course: ''
    });
    setCoverFile(null);
    setPreviewUrl('');
    setSelectedSubject(null);
  };

  const handleCancel = () => {
    resetForm();
    setView('list');
  };

  if (loading && view === 'list') {
    return (
      <div className="admin-subject-loading">
        <div className="spinner"></div>
        <p>Loading subjects...</p>
      </div>
    );
  }

  return (
    <div className="admin-subject-page">
      {error && (
        <div className="subject-error">
          <p>⚠️ {error}</p>
        </div>
      )}

      {view === 'list' && (
        <>
          <div className="subject-header">
            <div className="subject-header-left">
              <h2>All Subjects</h2>
              <p>{subjects.length} subjects found</p>
            </div>
            <div className="subject-header-right">
              <select 
                className="filter-select"
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
              >
                <option value="all">All Courses</option>
                {courses.map(course => (
                  <option key={course.documentId} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
              <button 
                className="btn-create-subject"
                onClick={() => setView('create')}
              >
                ➕ Add Subject
              </button>
            </div>
          </div>

          {subjects.length === 0 ? (
            <div className="subject-empty">
              <p>📚 No subjects found. Create your first subject!</p>
            </div>
          ) : (
            <div className="subject-grid">
              {subjects.map(subject => (
                <div key={subject.documentId} className="subject-card">
                  <div className="subject-card-icon">
                    {subject.covericon?.url ? (
                      <img 
                        src={`http://localhost:1337${subject.covericon.url}`}
                        alt={subject.name}
                      />
                    ) : (
                      <span className="subject-placeholder">📖</span>
                    )}
                  </div>
                  <div className="subject-card-content">
                    <h3>{subject.name}</h3>
                    <p className="subject-card-subtitle">{subject.subtitle}</p>
                    <div className="subject-card-meta">
                      <span className={`subject-category ${subject.category}`}>
                        {subject.category}
                      </span>
                      {subject.course && (
                        <span className="subject-course">
                          📚 {subject.course.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="subject-card-actions">
                    <button 
                      className="btn-edit"
                      onClick={() => handleEdit(subject)}
                      title="Edit subject"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDelete(subject.documentId)}
                      title="Delete subject"
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

      {(view === 'create' || view === 'edit') && (
        <div className="subject-form-container">
          <div className="subject-form-header">
            <h2>{view === 'edit' ? 'Edit Subject' : 'Create New Subject'}</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="subject-form">
            <div className="form-row">
              <div className="form-group">
                <label>Subject Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Mathematics"
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="academic">Academic</option>
                  <option value="competion">Competition</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Course *</label>
              <select
                name="course"
                value={formData.course}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a course</option>
                {courses.map(course => (
                  <option key={course.documentId} value={course.documentId}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Subtitle</label>
              <textarea
                name="subtitle"
                value={formData.subtitle}
                onChange={handleInputChange}
                placeholder="Brief description of the subject"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Cover Icon</label>
              {previewUrl && (
                <div className="image-preview">
                  <img src={previewUrl} alt="Preview" />
                  <button
                    type="button"
                    className="btn-remove-preview"
                    onClick={() => {
                      setPreviewUrl('');
                      setCoverFile(null);
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-cancel"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-save"
              >
                {view === 'edit' ? 'Update Subject' : 'Create Subject'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminSubjectPage;
