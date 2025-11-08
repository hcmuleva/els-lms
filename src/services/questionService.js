import API from "../api";

const questionService = {
  // Get all questions
  getAllQuestions: async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.subject)
      params.append("filters[subject][id][$eq]", filters.subject);
    if (filters.course)
      params.append("filters[course][id][$eq]", filters.course);
    if (filters.questionType)
      params.append("filters[questionType][$eq]", filters.questionType);
    if (filters.difficultyLevel)
      params.append("filters[difficultyLevel][$eq]", filters.difficultyLevel);

    params.append("populate", "*");

    const response = await API.get(`/api/questions?${params.toString()}`);
    return response.data;
  },

  // Get single question
  getQuestion: async (id) => {
    const response = await API.get(`/api/questions/${id}?populate=*`);
    return response.data;
  },

  // Create question
  createQuestion: async (questionData) => {
    console.log("questionService.createQuestion - Input data:", questionData);

    // Process relations to use Strapi v5 connect syntax
    const processedData = { ...questionData };

    // Convert subject relation - use connect syntax if provided
    if (processedData.subject) {
      processedData.subject = { connect: [processedData.subject] };
    }

    // Convert course relation - use connect syntax if provided
    if (processedData.course) {
      processedData.course = { connect: [processedData.course] };
    }

    // Convert exams relation if provided - use connect syntax for array
    if (
      processedData.exams &&
      Array.isArray(processedData.exams) &&
      processedData.exams.length > 0
    ) {
      processedData.exams = { connect: processedData.exams };
    } else {
      delete processedData.exams;
    }

    console.log(
      "questionService.createQuestion - Processed data:",
      processedData
    );

    const response = await API.post("/api/questions", {
      data: processedData,
    });

    console.log("questionService.createQuestion - Response:", response.data);
    return response.data;
  }, // Update question
  updateQuestion: async (id, questionData) => {
    console.log("questionService.updateQuestion - Input data:", questionData);

    // Process relations to use Strapi v5 connect syntax
    const processedData = { ...questionData };

    // Convert subject relation - use connect syntax if provided
    if (processedData.subject) {
      processedData.subject = { connect: [processedData.subject] };
    }

    // Convert course relation - use connect syntax if provided
    if (processedData.course) {
      processedData.course = { connect: [processedData.course] };
    }

    // Convert exams relation if provided
    if (
      processedData.exams &&
      Array.isArray(processedData.exams) &&
      processedData.exams.length > 0
    ) {
      processedData.exams = { connect: processedData.exams };
    }

    console.log(
      "questionService.updateQuestion - Processed data:",
      processedData
    );

    const response = await API.put(`/api/questions/${id}`, {
      data: processedData,
    });

    console.log("questionService.updateQuestion - Response:", response.data);
    return response.data;
  },

  // Delete question
  deleteQuestion: async (id) => {
    const response = await API.delete(`/api/questions/${id}`);
    return response.data;
  },

  // Get questions by subject
  getQuestionsBySubject: async (subjectId) => {
    const response = await API.get(
      `/api/questions?filters[subject][id][$eq]=${subjectId}&populate=*`
    );
    return response.data;
  },

  // Get questions by course
  getQuestionsByCourse: async (courseId) => {
    const response = await API.get(
      `/api/questions?filters[course][id][$eq]=${courseId}&populate=*`
    );
    return response.data;
  },
};

export default questionService;
