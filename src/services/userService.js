import API from "../api";

const userService = {
  // Get all users with optional role filter
  getAllUsers: async (role = null) => {
    try {
      const params = role ? { "filters[userRole][$eq]": role } : {};

      const response = await API.get("/users", { params });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to fetch users"
      );
    }
  },

  // Get all teachers
  getAllTeachers: async () => {
    return userService.getAllUsers("teacher");
  },

  // Get all students
  getAllStudents: async () => {
    return userService.getAllUsers("student");
  },

  // Get user by id
  getUserById: async (userId) => {
    try {
      const response = await API.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to fetch user"
      );
    }
  },
};

export default userService;
