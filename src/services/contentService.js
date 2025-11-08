import API from "../api";

const contentService = {
  // Get all contents with optional filters
  getAllContents: async (params = {}) => {
    try {
      const response = await API.get("/api/contents", {
        params: {
          populate: "*",
          ...params,
        },
      });
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to fetch contents"
      );
    }
  },

  // Get content by documentId
  getContentById: async (documentId) => {
    try {
      const response = await API.get(`/api/contents/${documentId}?populate=*`);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to fetch content"
      );
    }
  },

  // Get contents by subject
  getContentsBySubject: async (subjectId) => {
    try {
      const response = await API.get("/api/contents", {
        params: {
          "filters[subject][id][$eq]": subjectId,
          populate: "*",
        },
      });
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to fetch subject contents"
      );
    }
  },

  // Get contents by teacher
  getContentsByTeacher: async (teacherId) => {
    try {
      const response = await API.get("/api/contents", {
        params: {
          "filters[teacher][id][$eq]": teacherId,
          populate: "*",
        },
      });
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to fetch teacher contents"
      );
    }
  },

  // Create new content
  createContent: async (contentData) => {
    try {
      console.log("contentService.createContent - Input data:", contentData);

      // Process relations to use Strapi v5 connect syntax
      const processedData = { ...contentData };

      // Convert subject relation - use connect syntax if provided
      if (processedData.subject) {
        processedData.subject = { connect: [processedData.subject] };
      }

      console.log(
        "contentService.createContent - Processed data:",
        processedData
      );

      const response = await API.post("/api/contents", { data: processedData });

      console.log("contentService.createContent - Response:", response.data);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to create content"
      );
    }
  },

  // Update content by documentId
  updateContent: async (documentId, contentData) => {
    try {
      console.log("contentService.updateContent - Input data:", contentData);

      // Process relations to use Strapi v5 connect syntax
      const processedData = { ...contentData };

      // Convert subject relation - use connect syntax if provided
      if (processedData.subject) {
        processedData.subject = { connect: [processedData.subject] };
      }

      console.log(
        "contentService.updateContent - Processed data:",
        processedData
      );

      const response = await API.put(`/api/contents/${documentId}`, {
        data: processedData,
      });

      console.log("contentService.updateContent - Response:", response.data);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to update content"
      );
    }
  },

  // Delete content by documentId
  deleteContent: async (documentId) => {
    try {
      await API.delete(`/api/contents/${documentId}`);
      return true;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to delete content"
      );
    }
  },

  // Upload content attachment/media
  uploadMedia: async (files) => {
    try {
      const formData = new FormData();

      if (Array.isArray(files)) {
        files.forEach((file) => formData.append("files", file));
      } else {
        formData.append("files", files);
      }

      const response = await API.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to upload media"
      );
    }
  },
};

export default contentService;
