import React, { useState } from 'react';
import CourseList from '../../components/admin/CourseList';
import CourseForm from '../../components/admin/CourseForm';
import CourseView from '../../components/admin/CourseView';
import './AdminCoursePage.css';

const AdminCoursePage = () => {
  const [view, setView] = useState('list'); // 'list', 'create', 'edit', 'view'
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateNew = () => {
    setSelectedCourse(null);
    setView('create');
  };

  const handleEdit = (course) => {
    setSelectedCourse(course);
    setView('edit');
  };

  const handleView = (course) => {
    setSelectedCourse(course);
    setView('view');
  };

  const handleFormSubmit = (result) => {
    // Success - return to list and refresh
    setView('list');
    setSelectedCourse(null);
    setRefreshKey(prev => prev + 1); // Trigger list refresh
    
    // Show success message
    const action = view === 'edit' ? 'updated' : 'created';
    alert(`Course ${action} successfully!`);
  };

  const handleCancel = () => {
    setView('list');
    setSelectedCourse(null);
  };

  const handleCloseView = () => {
    setView('list');
    setSelectedCourse(null);
  };

  const handleDelete = (documentId) => {
    setRefreshKey(prev => prev + 1); // Trigger list refresh
  };

  return (
    <div className="admin-course-page">
      {/* Page Header */}
      <div className="admin-course-header">
        <div className="header-content">
          <div className="header-title">
            <h1>📚 Course Management</h1>
            <p>Create, edit, and manage all courses</p>
          </div>
          {view === 'list' && (
            <button className="btn-create-course" onClick={handleCreateNew}>
              + Create New Course
            </button>
          )}
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {view !== 'list' && (
        <div className="admin-breadcrumb">
          <button onClick={() => setView('list')} className="breadcrumb-link">
            Courses
          </button>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">
            {view === 'create' && 'Create New Course'}
            {view === 'edit' && `Edit: ${selectedCourse?.name}`}
            {view === 'view' && `View: ${selectedCourse?.name}`}
          </span>
        </div>
      )}

      {/* Main Content */}
      <div className="admin-course-content">
        {view === 'list' && (
          <CourseList
            key={refreshKey}
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDelete}
          />
        )}

        {(view === 'create' || view === 'edit') && (
          <CourseForm
            course={selectedCourse}
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
          />
        )}

        {view === 'view' && (
          <CourseView
            course={selectedCourse}
            onClose={handleCloseView}
            onEdit={handleEdit}
          />
        )}
      </div>
    </div>
  );
};

export default AdminCoursePage;
