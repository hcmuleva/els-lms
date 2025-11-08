import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../AuthContext";
import "./LoginPage.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        navigate("/home", { replace: true });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Demo credentials helper
  const fillDemoCredentials = (role) => {
    const demoUsers = {
      superadmin: { email: "superadmin1", password: "welcome123" },
      admin: { email: "admin1", password: "welcome123" },
      teacher: { email: "teacher1", password: "welcome123" },
      student: { email: "student1", password: "welcome123" },
      parent: { email: "parent1", password: "welcome123" },
    };

    setEmail(demoUsers[role].email);
    setPassword(demoUsers[role].password);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Sign in to continue to your account</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email or Username</label>
            <input
              id="email"
              type="text"
              placeholder="Enter your email or username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>

        <div className="demo-credentials">
          <p className="demo-title">Demo Credentials:</p>
          <div className="demo-buttons">
            <button onClick={() => fillDemoCredentials("superadmin")} className="demo-btn">Superadmin</button>
            <button onClick={() => fillDemoCredentials("admin")} className="demo-btn">Admin</button>
            <button onClick={() => fillDemoCredentials("teacher")} className="demo-btn">Teacher</button>
            <button onClick={() => fillDemoCredentials("student")} className="demo-btn">Student</button>
            <button onClick={() => fillDemoCredentials("parent")} className="demo-btn">Parent</button>
          </div>
        </div>
      </div>
    </div>
  );
}
