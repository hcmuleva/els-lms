import { createContext, useState, useEffect } from "react";
import API from "./api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem("currentRole") || user?.role || null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  useEffect(() => {
    if (currentRole) {
      localStorage.setItem("currentRole", currentRole);
    } else {
      localStorage.removeItem("currentRole");
    }
  }, [currentRole]);

  // Login with Strapi API
  const login = async (identifier, password) => {
    try {
      const response = await API.post("/api/auth/local", {
        identifier,
        password,
      });

      const { jwt, user: userData } = response.data;

      // Store token and user data
      setToken(jwt);
      const userWithRole = {
        ...userData,
        role: userData.userRole || userData.role || "student", // Use userRole from Strapi, fallback to role or student
      };
      setUser(userWithRole);
      setCurrentRole(userWithRole.role);

      return { success: true, user: userWithRole };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: error.response?.data?.error?.message || "Invalid credentials",
      };
    }
  };

  // Register with Strapi API
  const register = async (username, email, password, userRole = "student") => {
    try {
      const response = await API.post("/api/auth/local/register", {
        username,
        email,
        password,
        userRole, // Include userRole in registration
      });

      console.log("Registration successful:", response.data);

      return {
        success: true,
        message: "Registration successful! Please login.",
      };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        message: error.response?.data?.error?.message || "Registration failed",
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setCurrentRole(null);
    localStorage.clear();
  };

  const switchRole = (newRole) => {
    setCurrentRole(newRole);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        setToken,
        user,
        setUser,
        currentRole,
        setCurrentRole,
        login,
        register,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
