import API from "../api";

const resultService = {
  // Create exam result using standard Strapi schema payload
  createResult: async (resultData) => {
    console.log("resultService.createResult - Input data:", resultData);

    // Process relations to use Strapi v5 connect syntax
    const processedData = { ...resultData };

    // Convert student relation - use connect syntax
    if (processedData.student) {
      processedData.student = { connect: [processedData.student] };
    }

    // Convert course relation - use connect syntax (optional)
    if (processedData.course) {
      processedData.course = { connect: [processedData.course] };
    }

    // Convert subject relation - use connect syntax (optional)
    if (processedData.subject) {
      processedData.subject = { connect: [processedData.subject] };
    }

    // Convert exam relation - use connect syntax
    if (processedData.exam) {
      processedData.exam = { connect: [processedData.exam] };
    }

    // Convert exam_attempt relation - use connect syntax (oneToOne)
    if (processedData.exam_attempt) {
      processedData.exam_attempt = { connect: [processedData.exam_attempt] };
    }

    console.log("resultService.createResult - Processed data:", processedData);

    const response = await API.post("/api/results", {
      data: processedData,
    });

    console.log("resultService.createResult - Response:", response.data);
    return response.data;
  },

  // Get results by student (using standard Strapi endpoint to avoid server validation error)
  getStudentResults: async (studentId, filters = {}) => {
    try {
      const params = new URLSearchParams();

      // Build Strapi filters
      params.append("filters[student][id][$eq]", studentId);

      if (filters.resultType) {
        params.append("filters[resultType][$eq]", filters.resultType);
      }
      if (filters.course) {
        params.append("filters[course][id][$eq]", filters.course);
      }
      if (filters.subject) {
        params.append("filters[subject][id][$eq]", filters.subject);
      }
      if (filters.isPublished !== undefined) {
        params.append("filters[isPublished][$eq]", filters.isPublished);
      }

      // Populate relations using snake_case for exam_attempt
      params.append("populate[student][fields][0]", "id");
      params.append("populate[student][fields][1]", "username");
      params.append("populate[exam][fields][0]", "id");
      params.append("populate[exam][fields][1]", "title");
      params.append("populate[exam][fields][2]", "examType");
      params.append("populate[course][fields][0]", "id");
      params.append("populate[course][fields][1]", "name");
      params.append("populate[subject][fields][0]", "id");
      params.append("populate[subject][fields][1]", "name");
      params.append("populate[exam_attempt][fields][0]", "id");
      params.append("populate[exam_attempt][fields][1]", "score");
      params.append("populate[exam_attempt][fields][2]", "percentage");
      params.append("populate[exam_attempt][fields][3]", "submittedAt");
      params.append("populate[exam_attempt][fields][4]", "startedAt");
      params.append("populate[exam_attempt][fields][5]", "status");
      params.append("sort[0]", "createdAt:desc");

      const response = await API.get(`/api/results?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching student results:", error);
      throw error;
    }
  },

  // Get student statistics
  getStudentStats: async (studentId) => {
    try {
      const response = await API.get(`/api/results/student/${studentId}/stats`);
      return response.data;
    } catch (error) {
      console.error("Error fetching student statistics:", error);
      throw error;
    }
  },

  // Get single result
  getResult: async (id) => {
    const params = new URLSearchParams();
    params.append("populate[exam][fields][0]", "id");
    params.append("populate[exam][fields][1]", "title");
    params.append("populate[exam][fields][2]", "examType");
    params.append("populate[student][fields][0]", "id");
    params.append("populate[student][fields][1]", "username");
    params.append("populate[course][fields][0]", "id");
    params.append("populate[course][fields][1]", "name");
    params.append("populate[subject][fields][0]", "id");
    params.append("populate[subject][fields][1]", "name");
    params.append("populate[exam_attempt]", "*");

    const response = await API.get(`/api/results/${id}?${params.toString()}`);
    return response.data;
  },

  // Get results by exam (using custom endpoint)
  getExamResults: async (examId, filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.isPublished !== undefined)
        params.append("isPublished", filters.isPublished);

      const queryString = params.toString();
      const url = `/api/results/exam/${examId}${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await API.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching exam results:", error);
      throw error;
    }
  },

  // Get results by course (using custom endpoint)
  getCourseResults: async (courseId, filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.isPublished !== undefined)
        params.append("isPublished", filters.isPublished);

      const queryString = params.toString();
      const url = `/api/results/course/${courseId}${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await API.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching course results:", error);
      throw error;
    }
  },

  // Get results by subject (using custom endpoint)
  getSubjectResults: async (subjectId, filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.isPublished !== undefined)
        params.append("isPublished", filters.isPublished);

      const queryString = params.toString();
      const url = `/api/results/subject/${subjectId}${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await API.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching subject results:", error);
      throw error;
    }
  },

  // Publish result (make visible to student)
  publishResult: async (id) => {
    try {
      const response = await API.put(`/api/results/${id}/publish`);
      return response.data;
    } catch (error) {
      console.error("Error publishing result:", error);
      throw error;
    }
  },

  // Unpublish result (hide from student)
  unpublishResult: async (id) => {
    try {
      const response = await API.put(`/api/results/${id}/unpublish`);
      return response.data;
    } catch (error) {
      console.error("Error unpublishing result:", error);
      throw error;
    }
  },

  // Bulk publish results
  bulkPublishResults: async (ids) => {
    try {
      const response = await API.post("/api/results/bulk-publish", {
        ids: ids,
      });
      return response.data;
    } catch (error) {
      console.error("Error bulk publishing results:", error);
      throw error;
    }
  },

  // Update result
  updateResult: async (id, resultData) => {
    try {
      // Process relations to use documentId for Strapi v5
      const processedData = { ...resultData };

      // Convert student relation if present
      if (processedData.student) {
        processedData.student = processedData.student;
      }

      // Convert course relation if present
      if (processedData.course) {
        processedData.course = processedData.course;
      }

      // Convert subject relation if present
      if (processedData.subject) {
        processedData.subject = processedData.subject;
      }

      // Convert exam relation if present
      if (processedData.exam) {
        processedData.exam = processedData.exam;
      }

      // Convert exam_attempt relation if present
      if (processedData.exam_attempt) {
        processedData.exam_attempt = processedData.exam_attempt;
      }

      const response = await API.put(`/api/results/${id}`, {
        data: processedData,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating result:", error);
      throw error;
    }
  },

  // Delete result
  deleteResult: async (id) => {
    try {
      const response = await API.delete(`/api/results/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting result:", error);
      throw error;
    }
  },
};

export default resultService;
