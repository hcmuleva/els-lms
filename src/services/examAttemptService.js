import API from "../api";

const examAttemptService = {
  // Create a new exam attempt
  createExamAttempt: async (attemptData) => {
    try {
      console.log(
        "examAttemptService.createExamAttempt - Input data:",
        attemptData
      );

      // Process relations to use Strapi v5 connect syntax
      const processedData = { ...attemptData };

      // Convert exam relation - use connect syntax
      if (processedData.exam) {
        processedData.exam = { connect: [processedData.exam] };
      }

      // Convert student relation - use connect syntax
      if (processedData.student) {
        processedData.student = { connect: [processedData.student] };
      }

      console.log(
        "examAttemptService.createExamAttempt - Processed data:",
        processedData
      );

      const response = await API.post("/api/exam-attempts", {
        data: processedData,
      });

      console.log(
        "examAttemptService.createExamAttempt - Response:",
        response.data
      );
      return response.data;
    } catch (error) {
      console.error("Error creating exam attempt:", error);
      throw error;
    }
  },

  // Get single exam attempt
  getExamAttempt: async (id) => {
    try {
      const params = {
        populate: {
          student: {
            fields: ["id", "username", "email"],
          },
          exam: {
            fields: ["id", "title", "examType", "totalPoints", "passingScore"],
          },
        },
      };
      const response = await API.get(`/api/exam-attempts/${id}`, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching exam attempt:", error);
      throw error;
    }
  },

  // Get all exam attempts (with optional filters)
  getExamAttempts: async (filters = {}) => {
    try {
      const params = {
        populate: {
          student: {
            fields: ["id", "username", "email"],
          },
          exam: {
            fields: ["id", "title", "examType"],
          },
        },
      };

      // Add filters if provided
      const filterObj = {};
      if (filters.student) filterObj.student = { id: { $eq: filters.student } };
      if (filters.exam) filterObj.exam = { id: { $eq: filters.exam } };
      if (filters.status) filterObj.status = { $eq: filters.status };

      if (Object.keys(filterObj).length > 0) {
        params.filters = filterObj;
      }

      const response = await API.get("/api/exam-attempts", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching exam attempts:", error);
      throw error;
    }
  },

  // Get exam attempts by student
  getStudentExamAttempts: async (studentId) => {
    try {
      const params = new URLSearchParams();
      params.append("filters[student][id][$eq]", studentId);
      params.append("populate[exam][fields][0]", "id");
      params.append("populate[exam][fields][1]", "title");
      params.append("populate[exam][fields][2]", "examType");
      params.append("populate[student][fields][0]", "id");
      params.append("populate[student][fields][1]", "username");
      params.append("sort[0]", "createdAt:desc");

      const response = await API.get(`/api/exam-attempts?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching student exam attempts:", error);
      throw error;
    }
  },

  // Get exam attempts by exam
  getExamAttemptsByExam: async (examId) => {
    try {
      const params = new URLSearchParams();
      params.append("filters[exam][id][$eq]", examId);
      params.append("populate[student][fields][0]", "id");
      params.append("populate[student][fields][1]", "username");
      params.append("populate[student][fields][2]", "email");
      params.append("populate[exam][fields][0]", "id");
      params.append("populate[exam][fields][1]", "title");
      params.append("sort[0]", "createdAt:desc");

      const response = await API.get(`/api/exam-attempts?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching exam attempts:", error);
      throw error;
    }
  },

  // Update exam attempt (e.g., to submit it)
  updateExamAttempt: async (id, attemptData) => {
    try {
      // Process relations to use documentId for Strapi v5
      const processedData = { ...attemptData };

      // Convert exam relation if present
      if (processedData.exam) {
        processedData.exam = processedData.exam;
      }

      // Convert student relation if present
      if (processedData.student) {
        processedData.student = processedData.student;
      }

      const response = await API.put(`/api/exam-attempts/${id}`, {
        data: processedData,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating exam attempt:", error);
      throw error;
    }
  },

  // Delete exam attempt
  deleteExamAttempt: async (id) => {
    try {
      const response = await API.delete(`/api/exam-attempts/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting exam attempt:", error);
      throw error;
    }
  },
};

export default examAttemptService;
