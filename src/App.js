import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useContext } from "react";
import { LoginPage, RegisterPage, HomePage } from "./pages/common";
import {
  TeacherAssessmentPage,
  CreateQuestionPage,
  CreateExamPage,
} from "./pages/teacher";
import {
  ExamBrowserPage,
  ExamPlayerPage,
  ExamResultPage,
} from "./pages/student";
import { AuthContext } from "./AuthContext";

function App() {
  const { token } = useContext(AuthContext); // ✅ Use context instead of localStorage

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/home" /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={token ? <Navigate to="/home" /> : <RegisterPage />}
        />
        <Route
          path="/home"
          element={token ? <HomePage /> : <Navigate to="/login" />}
        />

        {/* Teacher Routes - Assessment Management (Tabbed Interface) */}
        <Route
          path="/teacher/assessments"
          element={token ? <TeacherAssessmentPage /> : <Navigate to="/login" />}
        />

        {/* Teacher Routes - Question Management */}
        <Route
          path="/teacher/questions"
          element={token ? <TeacherAssessmentPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/teacher/questions/create"
          element={token ? <CreateQuestionPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/teacher/questions/edit/:id"
          element={token ? <CreateQuestionPage /> : <Navigate to="/login" />}
        />

        {/* Teacher Routes - Exam Management */}
        <Route
          path="/teacher/exams"
          element={token ? <TeacherAssessmentPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/teacher/exams/create"
          element={token ? <CreateExamPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/teacher/exams/edit/:id"
          element={token ? <CreateExamPage /> : <Navigate to="/login" />}
        />

        {/* Student Routes - Exam Browser, Player and Results */}
        <Route
          path="/student/exams"
          element={token ? <ExamBrowserPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/student/exam-player/:examId"
          element={token ? <ExamPlayerPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/student/exam-result/:resultId"
          element={token ? <ExamResultPage /> : <Navigate to="/login" />}
        />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
