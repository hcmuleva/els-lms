import API from "../api";

const examService = {
  // Get all exams with enhanced filters
  getAllExams: async (filters = {}) => {
    try {
      const params = {
        populate: {
          questions: true,
          subject: true,
          course: true,
        },
      };

      // Add filters if provided
      const filterObj = {};
      if (filters.subject) filterObj.subject = { id: { $eq: filters.subject } };
      if (filters.course) filterObj.course = { id: { $eq: filters.course } };
      if (filters.examType) filterObj.examType = { $eq: filters.examType };
      if (filters.difficultyLevel)
        filterObj.difficultyLevel = { $eq: filters.difficultyLevel };
      if (filters.search) {
        filterObj.$or = [
          { title: { $containsi: filters.search } },
          { description: { $containsi: filters.search } },
        ];
      }

      if (Object.keys(filterObj).length > 0) {
        params.filters = filterObj;
      }

      const response = await API.get("/api/exams", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching exams:", error);
      throw error;
    }
  },

  // Get single exam
  getExam: async (id) => {
    try {
      const params = {
        populate: {
          questions: true,
          subject: true,
          course: true,
        },
      };

      const response = await API.get(`/api/exams/${id}`, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching exam:", error);
      throw error;
    }
  },

  // Create exam
  createExam: async (examData) => {
    console.log("examService.createExam - Input data:", examData);

    // Process relations to use Strapi v5 connect syntax
    const processedData = { ...examData };

    // Convert course relation - use connect syntax if provided
    if (processedData.course) {
      processedData.course = { connect: [processedData.course] };
    }

    // Convert subject relation - use connect syntax if provided
    if (processedData.subject) {
      processedData.subject = { connect: [processedData.subject] };
    }

    // Convert questions relation - use connect syntax for array
    if (
      processedData.questions &&
      Array.isArray(processedData.questions) &&
      processedData.questions.length > 0
    ) {
      processedData.questions = { connect: processedData.questions };
    } else {
      // Remove empty questions array to avoid issues
      delete processedData.questions;
    }

    console.log("examService.createExam - Processed data:", processedData);

    const response = await API.post("/api/exams", {
      data: processedData,
    });

    console.log("examService.createExam - Response:", response.data);
    return response.data;
  },

  // Update exam
  updateExam: async (id, examData) => {
    console.log("examService.updateExam - Input data:", examData);

    // Process relations to use Strapi v5 connect syntax
    const processedData = { ...examData };

    // Convert course relation - use connect syntax if provided
    if (processedData.course) {
      processedData.course = { connect: [processedData.course] };
    }

    // Convert subject relation - use connect syntax if provided
    if (processedData.subject) {
      processedData.subject = { connect: [processedData.subject] };
    }

    // Convert questions relation - use connect syntax for array
    if (
      processedData.questions &&
      Array.isArray(processedData.questions) &&
      processedData.questions.length > 0
    ) {
      processedData.questions = { connect: processedData.questions };
    } else if (processedData.questions) {
      // If questions is explicitly set to empty, disconnect all
      processedData.questions = { disconnect: [] };
    }

    console.log("examService.updateExam - Processed data:", processedData);

    const response = await API.put(`/api/exams/${id}`, {
      data: processedData,
    });

    console.log("examService.updateExam - Response:", response.data);
    return response.data;
  },

  // Delete exam
  deleteExam: async (id) => {
    const response = await API.delete(`/api/exams/${id}`);
    return response.data;
  },

  // Get exams by course
  getExamsByCourse: async (courseId) => {
    const params = new URLSearchParams();
    params.append("filters[course][id][$eq]", courseId);
    params.append("populate[questions]", "*");
    params.append("populate[course][fields][0]", "id");
    params.append("populate[course][fields][1]", "name");
    params.append("populate[subject][fields][0]", "id");
    params.append("populate[subject][fields][1]", "name");

    const response = await API.get(`/api/exams?${params.toString()}`);
    return response.data;
  },

  // Get exams by subject
  getExamsBySubject: async (subjectId) => {
    const params = new URLSearchParams();
    params.append("filters[subject][id][$eq]", subjectId);
    params.append("populate[questions]", "*");
    params.append("populate[course][fields][0]", "id");
    params.append("populate[course][fields][1]", "name");
    params.append("populate[subject][fields][0]", "id");
    params.append("populate[subject][fields][1]", "name");

    const response = await API.get(`/api/exams?${params.toString()}`);
    return response.data;
  },

  // Get exam attempts for an exam
  getExamAttempts: async (examId) => {
    const params = new URLSearchParams();
    params.append("filters[exam][id][$eq]", examId);
    params.append("populate[student][fields][0]", "id");
    params.append("populate[student][fields][1]", "username");
    params.append("populate[student][fields][2]", "email");
    params.append("populate[exam][fields][0]", "id");
    params.append("populate[exam][fields][1]", "title");

    const response = await API.get(`/api/exam-attempts?${params.toString()}`);
    return response.data;
  },
};

export default examService;
