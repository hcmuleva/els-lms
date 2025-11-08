import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import QuestionBankTab from './QuestionBankTab';
import ExamManagementTab from './ExamManagementTab';
import './TeacherAssessmentPage.css';

const TeacherAssessmentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine initial tab based on URL path
  const getInitialTab = () => {
    if (location.pathname.includes('/exams')) return 'exams';
    return 'questions';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab()); // 'questions' or 'exams'

  return (
    <div className="teacher-assessment-page">
      <div className="page-header">
        <div>
          <h1>Assessment Management</h1>
          <p className="page-subtitle">Manage questions and exams for your courses</p>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/home')}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          <span className="tab-icon">❓</span>
          <span className="tab-label">Question Bank</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'exams' ? 'active' : ''}`}
          onClick={() => setActiveTab('exams')}
        >
          <span className="tab-icon">📋</span>
          <span className="tab-label">Exam Management</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'questions' ? (
          <QuestionBankTab />
        ) : (
          <ExamManagementTab />
        )}
      </div>
    </div>
  );
};

export default TeacherAssessmentPage;
