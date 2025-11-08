import API from "../api";

const gradeService = {
  // Get all grades with optional filters
  getAllGrades: async (params = {}) => {
    try {
      const response = await API.get("/api/grades", { params });
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to fetch grades"
      );
    }
  },

  // Get single grade by documentId
  getGradeById: async (documentId) => {
    try {
      const response = await API.get(`/api/grades/${documentId}`);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to fetch grade"
      );
    }
  },

  // Create new grade
  createGrade: async (gradeData) => {
    try {
      const response = await API.post("/api/grades", { data: gradeData });
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to create grade"
      );
    }
  },

  // Update grade by documentId
  updateGrade: async (documentId, gradeData) => {
    try {
      const response = await API.put(`/api/grades/${documentId}`, {
        data: gradeData,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to update grade"
      );
    }
  },

  // Delete grade by documentId
  deleteGrade: async (documentId) => {
    try {
      await API.delete(`/api/grades/${documentId}`);
      return true;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to delete grade"
      );
    }
  },
};

export default gradeService;
