import { useState, useContext, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import AdminDashboard from "./AdminDashboard";
import TeacherAssignmentPage from "./TeacherAssignmentPage";
import TeacherContentPage from "./TeacherContentPage";
import "./HomePage.css";

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout, currentRole, switchRole } = useContext(AuthContext);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard"); // 'dashboard', 'admin', 'teachers', or 'content'
  const profileRef = useRef(null);
  const roleRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      if (roleRef.current && !roleRef.current.contains(event.target)) {
        setShowRoleDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleRoleChange = (newRole) => {
    switchRole(newRole);
    setShowRoleDropdown(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      superadmin: "Super Admin",
      admin: "Admin",
      teacher: "Teacher",
      student: "Student",
      parent: "Parent",
    };
    return roleMap[role] || role;
  };

  const getRoleColor = (role) => {
    const colorMap = {
      superadmin: "#e74c3c",
      admin: "#3498db",
      teacher: "#9b59b6",
      student: "#2ecc71",
      parent: "#f39c12",
    };
    return colorMap[role] || "#95a5a6";
  };

  // Available roles for the current user
  // For now, all users can switch to any role (will be restricted in production)
  const availableRoles = [
    "superadmin",
    "admin",
    "teacher",
    "student",
    "parent",
  ];

  return (
    <div className="home-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <div className="logo">
            <span className="logo-icon">🎓</span>
            <span className="logo-text">EduPortal</span>
          </div>
        </div>

        <div className="navbar-right">
          {/* Alerts/Notifications */}
          <div className="nav-item">
            <button className="icon-btn" title="Alerts">
              <span className="notification-badge">3</span>
              🔔
            </button>
          </div>

          {/* Role Selector */}
          <div className="nav-item role-selector" ref={roleRef}>
            <button
              className="role-btn"
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              style={{ background: getRoleColor(currentRole) }}
            >
              {getRoleDisplayName(currentRole)}
              <span className="dropdown-arrow">▼</span>
            </button>

            {showRoleDropdown && (
              <div className="dropdown-menu">
                {availableRoles.map((role) => (
                  <button
                    key={role}
                    className={`dropdown-item ${
                      currentRole === role ? "active" : ""
                    }`}
                    onClick={() => handleRoleChange(role)}
                  >
                    {getRoleDisplayName(role)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="nav-item profile-section" ref={profileRef}>
            <button
              className="profile-btn"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              <img
                src={`https://ui-avatars.com/api/?name=${user?.firstName}+${
                  user?.lastName || user?.username
                }&background=667eea&color=fff`}
                alt="Profile"
                className="profile-image"
              />
            </button>

            {showProfileDropdown && (
              <div className="dropdown-menu profile-dropdown">
                <div className="profile-info">
                  <img
                    src={`https://ui-avatars.com/api/?name=${user?.firstName}+${
                      user?.lastName || user?.username
                    }&background=667eea&color=fff&size=60`}
                    alt="Profile"
                    className="profile-image-large"
                  />
                  <div className="profile-details">
                    <div className="profile-name">
                      {user?.firstName} {user?.lastName || user?.username}
                    </div>
                    <div className="profile-email">{user?.email}</div>
                    <div
                      className="profile-role"
                      style={{ background: getRoleColor(currentRole) }}
                    >
                      {getRoleDisplayName(currentRole)}
                    </div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button
                  className="dropdown-item"
                  onClick={() => alert("Profile details coming soon!")}
                >
                  <span className="dropdown-icon">👤</span>
                  Profile Details
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => alert("Settings coming soon!")}
                >
                  <span className="dropdown-icon">⚙️</span>
                  Settings
                </button>
                <div className="dropdown-divider"></div>
                <button
                  className="dropdown-item logout-item"
                  onClick={handleLogout}
                >
                  <span className="dropdown-icon">🚪</span>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {/* Show dashboard or course management based on active section */}
        {activeSection === "dashboard" ? (
          <>
            <div className="welcome-section">
              <h1 className="welcome-title">
                {getGreeting()}, {user?.firstName || user?.username}! 👋
              </h1>
              <p className="welcome-subtitle">
                You are currently viewing as{" "}
                <span
                  className="role-badge"
                  style={{ background: getRoleColor(currentRole) }}
                >
                  {getRoleDisplayName(currentRole)}
                </span>
              </p>
            </div>

            <div className="dashboard-grid">
              {/* Dashboard cards based on role */}
              {currentRole === "superadmin" && (
                <>
                  <div className="dashboard-card">
                    <div className="card-icon">👥</div>
                    <div className="card-content">
                      <h3>Manage Users</h3>
                      <p>Create and manage users across all organizations</p>
                    </div>
                  </div>
                  <div className="dashboard-card">
                    <div className="card-icon">🏢</div>
                    <div className="card-content">
                      <h3>Manage Organizations</h3>
                      <p>Create and configure organizations</p>
                    </div>
                  </div>
                  <div className="dashboard-card">
                    <div className="card-icon">📊</div>
                    <div className="card-content">
                      <h3>System Analytics</h3>
                      <p>View system-wide analytics and reports</p>
                    </div>
                  </div>
                </>
              )}

              {currentRole === "admin" && (
                <>
                  <div
                    className="dashboard-card clickable"
                    onClick={() => setActiveSection("admin")}
                  >
                    <div className="card-icon">⚙️</div>
                    <div className="card-content">
                      <h3>Admin Dashboard</h3>
                      <p>Manage courses, subjects, and grades</p>
                    </div>
                  </div>
                  <div
                    className="dashboard-card clickable"
                    onClick={() => setActiveSection("teachers")}
                  >
                    <div className="card-icon">👨‍🏫</div>
                    <div className="card-content">
                      <h3>Teacher Assignments</h3>
                      <p>Assign teachers to courses</p>
                    </div>
                  </div>
                  <div className="dashboard-card">
                    <div className="card-icon">💳</div>
                    <div className="card-content">
                      <h3>Payment Management</h3>
                      <p>Manage payments and subscriptions</p>
                    </div>
                  </div>
                </>
              )}

              {currentRole === "teacher" && (
                <>
                  <div
                    className="dashboard-card clickable"
                    onClick={() => setActiveSection("content")}
                  >
                    <div className="card-icon">📝</div>
                    <div className="card-content">
                      <h3>Create Content</h3>
                      <p>Create learning materials for students</p>
                    </div>
                  </div>
                  <div
                    className="dashboard-card clickable"
                    onClick={() => navigate("/teacher/questions")}
                  >
                    <div className="card-icon">❓</div>
                    <div className="card-content">
                      <h3>Question Bank</h3>
                      <p>Manage questions and create exams</p>
                    </div>
                  </div>
                  <div
                    className="dashboard-card clickable"
                    onClick={() => navigate("/teacher/exams")}
                  >
                    <div className="card-icon">📋</div>
                    <div className="card-content">
                      <h3>Exams</h3>
                      <p>Create and manage exams</p>
                    </div>
                  </div>
                  <div className="dashboard-card">
                    <div className="card-icon">📈</div>
                    <div className="card-content">
                      <h3>Student Reports</h3>
                      <p>View student performance and analytics</p>
                    </div>
                  </div>
                </>
              )}

              {currentRole === "student" && (
                <>
                  <div className="dashboard-card">
                    <div className="card-icon">📖</div>
                    <div className="card-content">
                      <h3>My Courses</h3>
                      <p>Access learning materials and content</p>
                    </div>
                  </div>
                  <div
                    className="dashboard-card clickable"
                    onClick={() => navigate("/student/exams")}
                  >
                    <div className="card-icon">✏️</div>
                    <div className="card-content">
                      <h3>Exams</h3>
                      <p>Participate in exams and quizzes</p>
                    </div>
                  </div>
                  <div className="dashboard-card">
                    <div className="card-icon">📊</div>
                    <div className="card-content">
                      <h3>My Progress</h3>
                      <p>View your performance and rankings</p>
                    </div>
                  </div>
                  <div className="dashboard-card">
                    <div className="card-icon">📄</div>
                    <div className="card-content">
                      <h3>Assignments</h3>
                      <p>View and submit assignments</p>
                    </div>
                  </div>
                </>
              )}

              {currentRole === "parent" && (
                <>
                  <div className="dashboard-card">
                    <div className="card-icon">👨‍👩‍👧</div>
                    <div className="card-content">
                      <h3>My Children</h3>
                      <p>View your children's profiles</p>
                    </div>
                  </div>
                  <div className="dashboard-card">
                    <div className="card-icon">📈</div>
                    <div className="card-content">
                      <h3>Performance Analytics</h3>
                      <p>Track your child's academic progress</p>
                    </div>
                  </div>
                  <div className="dashboard-card">
                    <div className="card-icon">💰</div>
                    <div className="card-content">
                      <h3>Payment Status</h3>
                      <p>View and manage payments</p>
                    </div>
                  </div>
                  <div className="dashboard-card">
                    <div className="card-icon">📅</div>
                    <div className="card-content">
                      <h3>Subscription</h3>
                      <p>Manage subscription details</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        ) : activeSection === "admin" ? (
          <AdminDashboard
            onBackToDashboard={() => setActiveSection("dashboard")}
          />
        ) : activeSection === "teachers" ? (
          <div>
            <button
              className="btn-back-inline"
              onClick={() => setActiveSection("dashboard")}
            >
              ← Back to Dashboard
            </button>
            <TeacherAssignmentPage />
          </div>
        ) : activeSection === "content" ? (
          <div>
            <button
              className="btn-back-inline"
              onClick={() => setActiveSection("dashboard")}
            >
              ← Back to Dashboard
            </button>
            <TeacherContentPage />
          </div>
        ) : null}
      </main>
    </div>
  );
}
