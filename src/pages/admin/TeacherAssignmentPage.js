import React, { useState, useEffect, useCallback } from 'react';
import './TeacherAssignmentPage.css';
import enrolmentService from '../../services/enrolmentService';
import userService from '../../services/userService';
import courseService from '../../services/courseService';
import AssignmentTreeView from '../../components/admin/AssignmentTreeView';

const TeacherAssignmentPage = () => {
  const [enrolments, setEnrolments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [filterCourse, setFilterCourse] = useState('all');
  const [activeTab, setActiveTab] = useState('teachers'); // 'teachers' or 'students'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'tree'

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all enrolments
      const enrolmentData = await enrolmentService.getAllEnrolments();
      setEnrolments(Array.isArray(enrolmentData) ? enrolmentData : []);

      // Fetch all teachers
      const teacherData = await userService.getAllTeachers();
      setTeachers(Array.isArray(teacherData) ? teacherData : []);

      // Fetch all students
      const studentData = await userService.getAllStudents();
      setStudents(Array.isArray(studentData) ? studentData : []);

      // Fetch all courses
      const response = await fetch('http://localhost:1337/api/courses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      setCourses(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredEnrolments = filterCourse === 'all' 
    ? enrolments 
    : enrolments.filter(e => e.course?.id === parseInt(filterCourse));

  const handleAssignTeachers = (enrolment) => {
    setSelectedCourse(enrolment);
    setSelectedTeachers(enrolment.teachers?.map(t => t.id) || []);
    setSelectedStudents(enrolment.students?.map(s => s.id) || []);
    setActiveTab('teachers');
    setShowAssignModal(true);
  };

  const handleTeacherToggle = (teacherId) => {
    setSelectedTeachers(prev => 
      prev.includes(teacherId) 
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const handleStudentToggle = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSaveAssignment = async () => {
    try {
      setError(null);
      await enrolmentService.assignUsersToEnrolment(
        selectedCourse.documentId, 
        selectedTeachers,
        selectedStudents
      );
      setShowAssignModal(false);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelAssignment = () => {
    setShowAssignModal(false);
    setSelectedCourse(null);
    setSelectedTeachers([]);
    setSelectedStudents([]);
    setActiveTab('teachers');
  };

  if (loading) {
    return (
      <div className="teacher-assignment-loading">
        <div className="spinner"></div>
        <p>Loading teacher assignments...</p>
      </div>
    );
  }

  return (
    <div className="teacher-assignment-page">
      {error && (
        <div className="assignment-error">
          <p>⚠️ {error}</p>
        </div>
      )}

      <div className="assignment-header">
        <div className="assignment-header-left">
          <h2>Course Assignments</h2>
          <p>{filteredEnrolments.length} course enrolments found</p>
        </div>
        <div className="assignment-header-right">
          <div className="view-mode-toggle">
            <button 
              className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Card View"
            >
              📋 Cards
            </button>
            <button 
              className={`view-btn ${viewMode === 'tree' ? 'active' : ''}`}
              onClick={() => setViewMode('tree')}
              title="Tree View"
            >
              🌳 Tree
            </button>
          </div>
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
        </div>
      </div>

      {filteredEnrolments.length === 0 ? (
        <div className="assignment-empty">
          <p>👨‍🏫 No course enrolments found. Enrolments are required to assign teachers.</p>
        </div>
      ) : viewMode === 'tree' ? (
        <AssignmentTreeView enrolments={filteredEnrolments} />
      ) : (
        <div className="assignment-list">
          {filteredEnrolments.map(enrolment => (
            <div key={enrolment.documentId} className="assignment-card">
              <div className="assignment-course-info">
                <h3>{enrolment.course?.name || 'Unknown Course'}</h3>
                <p className="course-subtitle">{enrolment.course?.subtitle}</p>
                <div className="enrolment-stats">
                  <span className="stat-item">
                    👥 {enrolment.students?.length || 0} Students
                  </span>
                  <span className="stat-item">
                    👨‍🏫 {enrolment.teachers?.length || 0} Teachers
                  </span>
                  <span className={`status-badge ${enrolment.enrolment_status}`}>
                    {enrolment.enrolment_status || 'pending'}
                  </span>
                </div>
              </div>

              <div className="assigned-users-section">
                <div className="assigned-teachers">
                  <h4>Assigned Teachers</h4>
                  {enrolment.teachers?.length > 0 ? (
                    <div className="teacher-list">
                      {enrolment.teachers.map(teacher => (
                        <div key={teacher.id} className="teacher-chip">
                          <span className="teacher-avatar">
                            {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                          </span>
                          <span className="teacher-name">
                            {teacher.firstName} {teacher.lastName}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-teachers">No teachers assigned yet</p>
                  )}
                </div>

                <div className="assigned-students">
                  <h4>Assigned Students</h4>
                  {enrolment.students?.length > 0 ? (
                    <div className="teacher-list">
                      {enrolment.students.map(student => (
                        <div key={student.id} className="teacher-chip student-chip">
                          <span className="teacher-avatar student-avatar">
                            {student.firstName?.[0]}{student.lastName?.[0]}
                          </span>
                          <span className="teacher-name">
                            {student.firstName} {student.lastName}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-teachers">No students assigned yet</p>
                  )}
                </div>
              </div>

              <button 
                className="btn-assign-teachers"
                onClick={() => handleAssignTeachers(enrolment)}
              >
                ✏️ Manage Assignments
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={handleCancelAssignment}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Course Assignments</h2>
              <button className="btn-close-modal" onClick={handleCancelAssignment}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="course-info-section">
                <h3>{selectedCourse?.course?.name}</h3>
                <p>{selectedCourse?.course?.subtitle}</p>
              </div>

              {/* Tab Navigation */}
              <div className="assignment-tabs">
                <button 
                  className={`tab-btn ${activeTab === 'teachers' ? 'active' : ''}`}
                  onClick={() => setActiveTab('teachers')}
                >
                  👨‍🏫 Teachers ({selectedTeachers.length})
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
                  onClick={() => setActiveTab('students')}
                >
                  👨‍🎓 Students ({selectedStudents.length})
                </button>
              </div>

              {/* Teachers Tab */}
              {activeTab === 'teachers' && (
                <div className="teacher-selection">
                  <h4>Select Teachers ({selectedTeachers.length} selected)</h4>
                  <div className="teacher-grid">
                    {teachers.map(teacher => (
                      <div 
                        key={teacher.id} 
                        className={`teacher-option ${selectedTeachers.includes(teacher.id) ? 'selected' : ''}`}
                        onClick={() => handleTeacherToggle(teacher.id)}
                      >
                        <div className="teacher-option-avatar">
                          {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                        </div>
                        <div className="teacher-option-info">
                          <div className="teacher-option-name">
                            {teacher.firstName} {teacher.lastName}
                          </div>
                          <div className="teacher-option-email">{teacher.email}</div>
                        </div>
                        <div className="teacher-option-check">
                          {selectedTeachers.includes(teacher.id) ? '✓' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Students Tab */}
              {activeTab === 'students' && (
                <div className="teacher-selection">
                  <h4>Select Students ({selectedStudents.length} selected)</h4>
                  <div className="teacher-grid">
                    {students.map(student => (
                      <div 
                        key={student.id} 
                        className={`teacher-option ${selectedStudents.includes(student.id) ? 'selected' : ''}`}
                        onClick={() => handleStudentToggle(student.id)}
                      >
                        <div className="teacher-option-avatar student-avatar">
                          {student.firstName?.[0]}{student.lastName?.[0]}
                        </div>
                        <div className="teacher-option-info">
                          <div className="teacher-option-name">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="teacher-option-email">{student.email}</div>
                        </div>
                        <div className="teacher-option-check">
                          {selectedStudents.includes(student.id) ? '✓' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCancelAssignment}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleSaveAssignment}>
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignmentPage;
