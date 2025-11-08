import API from "../api";

/**
 * Course Service for Strapi v5 API
 * Handles CRUD operations using documentId
 */

const courseService = {
  /**
   * Get all courses with pagination
   * @param {Object} params - Query parameters (page, pageSize, filters, sort)
   * @returns {Promise} - Courses list with metadata
   */
  async getAllCourses(params = {}) {
    try {
      const { page = 1, pageSize = 25, filters = {}, sort = "" } = params;

      let queryString = `?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}`;

      // Add filters if provided
      if (Object.keys(filters).length > 0) {
        Object.keys(filters).forEach((key) => {
          queryString += `&filters[${key}][$eq]=${filters[key]}`;
        });
      }

      // Add sorting if provided
      if (sort) {
        queryString += `&sort=${sort}`;
      }

      const response = await API.get(`/api/courses${queryString}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching courses:", error);
      throw error;
    }
  },

  /**
   * Get single course by documentId
   * @param {string} documentId - Course document ID
   * @returns {Promise} - Course data
   */
  async getCourseById(documentId) {
    try {
      const response = await API.get(`/api/courses/${documentId}?populate=*`);
      return response.data;
    } catch (error) {
      console.error("Error fetching course:", error);
      throw error;
    }
  },

  /**
   * Create new course
   * @param {Object} courseData - Course data
   * @returns {Promise} - Created course
   */
  async createCourse(courseData) {
    try {
      console.log("courseService.createCourse - Input data:", courseData);

      // Process relations to use Strapi v5 connect syntax
      const processedData = { ...courseData };

      // Convert grade relation - use connect syntax if provided
      if (processedData.grade) {
        processedData.grade = { connect: [processedData.grade] };
      }

      // Convert instructor relation - use connect syntax if provided
      if (processedData.instructor) {
        processedData.instructor = { connect: [processedData.instructor] };
      }

      console.log(
        "courseService.createCourse - Processed data:",
        processedData
      );

      const response = await API.post("/api/courses", {
        data: processedData,
      });

      console.log("courseService.createCourse - Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating course:", error);
      throw error;
    }
  },

  /**
   * Update course by documentId
   * @param {string} documentId - Course document ID
   * @param {Object} courseData - Updated course data
   * @returns {Promise} - Updated course
   */
  async updateCourse(documentId, courseData) {
    try {
      console.log("courseService.updateCourse - Input data:", courseData);

      // Process relations to use Strapi v5 connect syntax
      const processedData = { ...courseData };

      // Convert grade relation - use connect syntax if provided
      if (processedData.grade) {
        processedData.grade = { connect: [processedData.grade] };
      }

      // Convert instructor relation - use connect syntax if provided
      if (processedData.instructor) {
        processedData.instructor = { connect: [processedData.instructor] };
      }

      console.log(
        "courseService.updateCourse - Processed data:",
        processedData
      );

      const response = await API.put(`/api/courses/${documentId}`, {
        data: processedData,
      });

      console.log("courseService.updateCourse - Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error updating course:", error);
      throw error;
    }
  },

  /**
   * Delete course by documentId
   * @param {string} documentId - Course document ID
   * @returns {Promise} - Deleted course
   */
  async deleteCourse(documentId) {
    try {
      const response = await API.delete(`/api/courses/${documentId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting course:", error);
      throw error;
    }
  },

  /**
   * Upload course cover icon
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

  /**
   * Parse description rich text from Strapi format
   * @param {Array} description - Strapi rich text format
   * @returns {string} - Plain text
   */
  parseDescription(description) {
    if (!description || !Array.isArray(description)) return "";

    return description
      .map((block) => {
        if (block.children) {
          return block.children.map((child) => child.text || "").join(" ");
        }
        return "";
      })
      .join("\n");
  },

  /**
   * Convert plain text to Strapi rich text format
   * @param {string} text - Plain text
   * @returns {Array} - Strapi rich text format
   */
  formatDescription(text) {
    if (!text) return [];

    return [
      {
        type: "paragraph",
        children: [
          {
            type: "text",
            text: text,
          },
        ],
      },
    ];
  },
};

export default courseService;
