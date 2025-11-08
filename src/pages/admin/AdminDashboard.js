import React, { useState } from 'react';
import './AdminDashboard.css';
import AdminCoursePage from './AdminCoursePage';
import AdminSubjectPage from './AdminSubjectPage';
import AdminGradePage from './AdminGradePage';

const AdminDashboard = ({ onBackToDashboard }) => {
  const [activeTab, setActiveTab] = useState('courses');

  const tabs = [
    { id: 'courses', label: 'Courses', icon: '📚' },
    { id: 'subjects', label: 'Subjects', icon: '📖' },
    { id: 'grades', label: 'Grades', icon: '🎓' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'courses':
        return <AdminCoursePage />;
      case 'subjects':
        return <AdminSubjectPage />;
      case 'grades':
        return <AdminGradePage />;
      default:
        return <AdminCoursePage />;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-left">
          <button className="btn-back" onClick={onBackToDashboard} title="Back to Dashboard">
            ← Back
          </button>
          <div className="admin-title-section">
            <h1>Admin Dashboard</h1>
            <p>Manage courses, subjects, and grades</p>
          </div>
        </div>
      </div>

      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
