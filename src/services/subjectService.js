import API from "../api";

/**
 * Subject Service for Strapi v5 API
 * Handles CRUD operations for subjects within courses
 */

const subjectService = {
  /**
   * Get all subjects with optional filters
   * @param {Object} params - Query parameters (page, pageSize, filters, or custom params)
   * @returns {Promise} - Subjects list with metadata
   */
  async getAllSubjects(params = {}) {
    try {
      // If custom filter params are passed (like filters[course][id][$eq]), use them directly
      if (Object.keys(params).some((key) => key.startsWith("filters["))) {
        const response = await API.get("/api/subjects", { params });
        return response.data.data; // Return the data array from Strapi v5 response
      }

      // Otherwise use legacy format
      const { page = 1, pageSize = 100, courseId = null } = params;

      let queryString = `?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}`;

      // Filter by course if provided
      if (courseId) {
        queryString += `&filters[course][documentId][$eq]=${courseId}`;
      }

      const response = await API.get(`/api/subjects${queryString}`);
      return response.data.data; // Return the data array from Strapi v5 response
    } catch (error) {
      console.error("Error fetching subjects:", error);
      throw error;
    }
  },

  /**
   * Get subjects for a specific course
   * @param {string} courseDocumentId - Course document ID
   * @returns {Promise} - Subjects list
   */
  async getSubjectsByCourse(courseDocumentId) {
    try {
      const response = await API.get(
        `/api/subjects?filters[course][documentId][$eq]=${courseDocumentId}&populate=*`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching course subjects:", error);
      throw error;
    }
  },

  /**
   * Get single subject by documentId
   * @param {string} documentId - Subject document ID
   * @returns {Promise} - Subject data
   */
  async getSubjectById(documentId) {
    try {
      const response = await API.get(`/api/subjects/${documentId}?populate=*`);
      return response.data;
    } catch (error) {
      console.error("Error fetching subject:", error);
      throw error;
    }
  },

  /**
   * Create new subject
   * @param {Object} subjectData - Subject data
   * @returns {Promise} - Created subject
   */
  async createSubject(subjectData) {
    try {
      console.log("subjectService.createSubject - Input data:", subjectData);

      // Process relations to use Strapi v5 connect syntax
      const processedData = { ...subjectData };

      // Convert course relation - use connect syntax if provided
      if (processedData.course) {
        processedData.course = { connect: [processedData.course] };
      }

      console.log(
        "subjectService.createSubject - Processed data:",
        processedData
      );

      const response = await API.post("/api/subjects", {
        data: processedData,
      });

      console.log("subjectService.createSubject - Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating subject:", error);
      throw error;
    }
  },

  /**
   * Update subject by documentId
   * @param {string} documentId - Subject document ID
   * @param {Object} subjectData - Updated subject data
   * @returns {Promise} - Updated subject
   */
  async updateSubject(documentId, subjectData) {
    try {
      console.log("subjectService.updateSubject - Input data:", subjectData);

      // Process relations to use Strapi v5 connect syntax
      const processedData = { ...subjectData };

      // Convert course relation - use connect syntax if provided
      if (processedData.course) {
        processedData.course = { connect: [processedData.course] };
      }

      console.log(
        "subjectService.updateSubject - Processed data:",
        processedData
      );

      const response = await API.put(`/api/subjects/${documentId}`, {
        data: processedData,
      });

      console.log("subjectService.updateSubject - Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error updating subject:", error);
      throw error;
    }
  },

  /**
   * Delete subject by documentId
   * @param {string} documentId - Subject document ID
   * @returns {Promise} - Deleted subject
   */
  async deleteSubject(documentId) {
    try {
      const response = await API.delete(`/api/subjects/${documentId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting subject:", error);
      throw error;
    }
  },

  /**
   * Upload subject cover icon
   * @param {File} file - Image file
   * @returns {Promise} - Uploaded file data
   */
  async uploadCoverIcon(file) {
    try {
      const formData = new FormData();
      formData.append("files", file);

      const response = await API.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error uploading cover icon:", error);
      throw error;
    }
  },
};

export default subjectService;
