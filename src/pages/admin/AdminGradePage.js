import React, { useState, useEffect, useCallback } from 'react';
import './AdminGradePage.css';
import gradeService from '../../services/gradeService';

const AdminGradePage = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('list'); // 'list', 'create', 'edit'
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await gradeService.getAllGrades({ sort: 'name:asc' });
      setGrades(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      
      if (view === 'edit' && selectedGrade) {
        await gradeService.updateGrade(selectedGrade.documentId, formData);
      } else {
        await gradeService.createGrade(formData);
      }

      resetForm();
      setView('list');
      fetchGrades();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (grade) => {
    setSelectedGrade(grade);
    setFormData({
      name: grade.name || '',
      description: grade.description || ''
    });
    setView('edit');
  };

  const handleDelete = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this grade? This action cannot be undone.')) {
      try {
        await gradeService.deleteGrade(documentId);
        fetchGrades();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    });
    setSelectedGrade(null);
  };

  const handleCancel = () => {
    resetForm();
    setView('list');
  };

  const getGradeEmoji = (gradeName) => {
    const name = gradeName.toLowerCase();
    if (name.includes('1') || name.includes('one')) return '1️⃣';
    if (name.includes('2') || name.includes('two')) return '2️⃣';
    if (name.includes('3') || name.includes('three')) return '3️⃣';
    if (name.includes('4') || name.includes('four')) return '4️⃣';
    if (name.includes('5') || name.includes('five')) return '5️⃣';
    if (name.includes('6') || name.includes('six')) return '6️⃣';
    if (name.includes('7') || name.includes('seven')) return '7️⃣';
    if (name.includes('8') || name.includes('eight')) return '8️⃣';
    if (name.includes('9') || name.includes('nine')) return '9️⃣';
    if (name.includes('10') || name.includes('ten')) return '🔟';
    if (name.includes('11')) return '🎓';
    if (name.includes('12')) return '🎓';
    if (name.includes('kg') || name.includes('kindergarten')) return '🧸';
    if (name.includes('nursery') || name.includes('pre')) return '👶';
    return '🎓';
  };

  if (loading && view === 'list') {
    return (
      <div className="admin-grade-loading">
        <div className="spinner"></div>
        <p>Loading grades...</p>
      </div>
    );
  }

  return (
    <div className="admin-grade-page">
      {error && (
        <div className="grade-error">
          <p>⚠️ {error}</p>
        </div>
      )}

      {view === 'list' && (
        <>
          <div className="grade-header">
            <div className="grade-header-left">
              <h2>All Grades</h2>
              <p>{grades.length} grades configured</p>
            </div>
            <div className="grade-header-right">
              <button 
                className="btn-create-grade"
                onClick={() => setView('create')}
              >
                ➕ Add Grade
              </button>
            </div>
          </div>

          {grades.length === 0 ? (
            <div className="grade-empty">
              <p>🎓 No grades found. Create your first grade level!</p>
            </div>
          ) : (
            <div className="grade-grid">
              {grades.map(grade => (
                <div key={grade.documentId} className="grade-card">
                  <div className="grade-card-icon">
                    <span className="grade-emoji">{getGradeEmoji(grade.name)}</span>
                  </div>
                  <div className="grade-card-content">
                    <h3>{grade.name}</h3>
                    {grade.description && (
                      <p className="grade-card-description">{grade.description}</p>
                    )}
                  </div>
                  <div className="grade-card-actions">
                    <button 
                      className="btn-edit"
                      onClick={() => handleEdit(grade)}
                      title="Edit grade"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDelete(grade.documentId)}
                      title="Delete grade"
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
        <div className="grade-form-container">
          <div className="grade-form-header">
            <h2>{view === 'edit' ? 'Edit Grade' : 'Create New Grade'}</h2>
            <p>Define a grade level for organizing courses and students</p>
          </div>
          
          <form onSubmit={handleSubmit} className="grade-form">
            <div className="form-group">
              <label>Grade Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g., Grade 1, Class 5, KG-1, etc."
              />
              <small>Use a clear, descriptive name for the grade level</small>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Additional information about this grade level"
                rows="4"
              />
              <small>Optional: Add notes about age range, curriculum, or other relevant details</small>
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
                {view === 'edit' ? 'Update Grade' : 'Create Grade'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminGradePage;
