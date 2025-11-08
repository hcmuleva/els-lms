import API from "../api";

const enrolmentService = {
  // Get all enrolments with populated data
  getAllEnrolments: async (params = {}) => {
    try {
      const response = await API.get("/api/enrolments", {
        params: {
          populate: "*",
          ...params,
        },
      });
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to fetch enrolments"
      );
    }
  },

  // Get enrolment by documentId
  getEnrolmentById: async (documentId) => {
    try {
      const response = await API.get(
        `/api/enrolments/${documentId}?populate=*`
      );
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to fetch enrolment"
      );
    }
  },

  // Get enrolments by course
  getEnrolmentsByCourse: async (courseId) => {
    try {
      const response = await API.get("/api/enrolments", {
        params: {
          "filters[course][id][$eq]": courseId,
          populate: "*",
        },
      });
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to fetch course enrolments"
      );
    }
  },

  // Create new enrolment
  createEnrolment: async (enrolmentData) => {
    try {
      console.log(
        "enrolmentService.createEnrolment - Input data:",
        enrolmentData
      );

      // Process relations to use Strapi v5 connect syntax
      const processedData = { ...enrolmentData };

      // Convert course relation - use connect syntax
      if (processedData.course) {
        processedData.course = { connect: [processedData.course] };
      }

      // Convert students relation - use connect syntax for manyToMany
      if (
        processedData.students &&
        Array.isArray(processedData.students) &&
        processedData.students.length > 0
      ) {
        processedData.students = { connect: processedData.students };
      } else {
        delete processedData.students;
      }

      // Convert teachers relation - use connect syntax for manyToMany
      if (
        processedData.teachers &&
        Array.isArray(processedData.teachers) &&
        processedData.teachers.length > 0
      ) {
        processedData.teachers = { connect: processedData.teachers };
      } else {
        delete processedData.teachers;
      }

      console.log(
        "enrolmentService.createEnrolment - Processed data:",
        processedData
      );

      const response = await API.post("/api/enrolments", {
        data: processedData,
      });

      console.log(
        "enrolmentService.createEnrolment - Response:",
        response.data
      );
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to create enrolment"
      );
    }
  },

  // Update enrolment by documentId
  updateEnrolment: async (documentId, enrolmentData) => {
    try {
      // Process relations to use documentId for Strapi v5
      const processedData = { ...enrolmentData };

      // Convert course relation if present
      if (processedData.course) {
        processedData.course = processedData.course;
      }

      // Convert students relation if present
      if (processedData.students && Array.isArray(processedData.students)) {
        processedData.students = processedData.students;
      }

      // Convert teachers relation if present
      if (processedData.teachers && Array.isArray(processedData.teachers)) {
        processedData.teachers = processedData.teachers;
      }

      const response = await API.put(`/api/enrolments/${documentId}`, {
        data: processedData,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to update enrolment"
      );
    }
  },

  // Assign teachers to course enrolment
  assignTeachers: async (documentId, teacherIds) => {
    try {
      // Ensure teacherIds are in correct format for Strapi v5
      const processedTeacherIds = Array.isArray(teacherIds)
        ? teacherIds
        : [teacherIds];

      const response = await API.put(`/api/enrolments/${documentId}`, {
        data: {
          teachers: processedTeacherIds,
        },
      });
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to assign teachers"
      );
    }
  },

  // Assign students to course enrolment
  assignStudents: async (documentId, studentIds) => {
    try {
      // Ensure studentIds are in correct format for Strapi v5
      const processedStudentIds = Array.isArray(studentIds)
        ? studentIds
        : [studentIds];

      const response = await API.put(`/api/enrolments/${documentId}`, {
        data: {
          students: processedStudentIds,
        },
      });
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to assign students"
      );
    }
  },

  // Assign both teachers and students
  assignUsers: async (documentId, teacherIds, studentIds) => {
    try {
      // Ensure IDs are in correct format for Strapi v5
      const processedTeacherIds = Array.isArray(teacherIds)
        ? teacherIds
        : [teacherIds];
      const processedStudentIds = Array.isArray(studentIds)
        ? studentIds
        : [studentIds];

      const response = await API.put(`/api/enrolments/${documentId}`, {
        data: {
          teachers: processedTeacherIds,
          students: processedStudentIds,
        },
      });
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to assign users"
      );
    }
  },

  // Delete enrolment by documentId
  deleteEnrolment: async (documentId) => {
    try {
      await API.delete(`/api/enrolments/${documentId}`);
      return true;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to delete enrolment"
      );
    }
  },
};

export default enrolmentService;
