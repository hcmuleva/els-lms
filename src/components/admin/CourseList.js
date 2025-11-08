import React, { useState, useEffect, useCallback } from 'react';
import courseService from '../../services/courseService';
import './CourseList.css';

const CourseList = ({ onEdit, onDelete, onView }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    pageCount: 1,
    total: 0
  });

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await courseService.getAllCourses({
        page: pagination.page,
        pageSize: pagination.pageSize,
        sort: 'createdAt:desc'
      });

      setCourses(response.data);
      setPagination(prev => ({
        ...prev,
        ...response.meta.pagination
      }));
      setError(null);
    } catch (err) {
      setError('Failed to load courses. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleDelete = async (documentId, courseName) => {
    if (window.confirm(`Are you sure you want to delete "${courseName}"?`)) {
      try {
        await courseService.deleteCourse(documentId);
        fetchCourses(); // Refresh list
        if (onDelete) onDelete(documentId);
      } catch (err) {
        alert('Failed to delete course. Please try again.');
        console.error(err);
      }
    }
  };

  const getImageUrl = (covericon) => {
    if (!covericon || covericon.length === 0) return null;
    const image = covericon[0];
    return `${process.env.REACT_APP_API_URL}${image.url}`;
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  if (loading) {
    return (
      <div className="course-list-loading">
        <div className="spinner"></div>
        <p>Loading courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="course-list-error">
        <p>{error}</p>
        <button onClick={fetchCourses}>Retry</button>
      </div>
    );
  }

  return (
    <div className="course-list-container">
      <div className="course-list-header">
        <h2>Courses</h2>
        <div className="course-list-stats">
          <span>Total: {pagination.total} courses</span>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="course-list-empty">
          <p>No courses found. Create your first course!</p>
        </div>
      ) : (
        <>
          <div className="course-list-grid">
            {courses.map((course) => (
              <div key={course.documentId} className="course-card">
                <div className="course-card-image">
                  {getImageUrl(course.covericon) ? (
                    <img 
                      src={getImageUrl(course.covericon)} 
                      alt={course.name}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/296x170?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="course-card-no-image">
                      <span>📚</span>
                    </div>
                  )}
                  <div className="course-card-badge">{course.agegroup || 'N/A'}</div>
                </div>

                <div className="course-card-content">
                  <h3>{course.name}</h3>
                  <p className="course-card-subtitle">{course.subtitle || 'No subtitle'}</p>
                  <p className="course-card-description">
                    {courseService.parseDescription(course.description).substring(0, 100)}
                    {courseService.parseDescription(course.description).length > 100 && '...'}
                  </p>
                  
                  <div className="course-card-meta">
                    <span className="course-card-date">
                      Created: {new Date(course.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`course-card-status ${course.publishedAt ? 'published' : 'draft'}`}>
                      {course.publishedAt ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>

                <div className="course-card-actions">
                  <button 
                    className="btn-view" 
                    onClick={() => onView && onView(course)}
                    title="View Course"
                  >
                    👁️ View
                  </button>
                  <button 
                    className="btn-edit" 
                    onClick={() => onEdit && onEdit(course)}
                    title="Edit Course"
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    className="btn-delete" 
                    onClick={() => handleDelete(course.documentId, course.name)}
                    title="Delete Course"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pagination.pageCount > 1 && (
            <div className="course-list-pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn-pagination"
              >
                ← Previous
              </button>
              
              <span className="pagination-info">
                Page {pagination.page} of {pagination.pageCount}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pageCount}
                className="btn-pagination"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CourseList;
