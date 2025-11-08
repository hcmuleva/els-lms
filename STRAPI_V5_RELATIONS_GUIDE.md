# Strapi v5 Relations Guide - Client Services

This document outlines all the relationship mappings used in the React client services for the LMS application using Strapi v5.

## Important Notes for Strapi v5

1. **DocumentId Usage**: Strapi v5 uses `documentId` as the primary identifier for relationships
2. **Relation Format**: Relations accept both `documentId` (string) and numeric `id` values
3. **Array Relations**: Many-to-many relations expect an array of IDs

## Service-by-Service Relationship Mapping

### 1. Course Service (`courseService.js`)

**Relations:**

- `grade` → `api::grade.grade` (manyToOne)
- `instructor` → `plugin::users-permissions.user` (manyToOne)

**Create/Update Payload:**

```javascript
{
  name: "Course Name",
  grade: gradeDocumentId, // documentId or numeric ID
  instructor: userDocumentId, // documentId or numeric ID
  // ... other fields
}
```

**Schema Relations:**

- `subjects` (oneToMany) - managed by subject side
- `enrolments` (oneToMany) - managed by enrolment side
- `results` (oneToMany) - managed by result side
- `exam` (oneToMany) - managed by exam side
- `question` (oneToMany) - managed by question side

---

### 2. Subject Service (`subjectService.js`)

**Relations:**

- `course` → `api::course.course` (manyToOne)

**Create/Update Payload:**

```javascript
{
  name: "Subject Name",
  course: courseDocumentId, // documentId or numeric ID
  // ... other fields
}
```

**Schema Relations:**

- `contents` (oneToMany) - managed by content side
- `results` (oneToMany) - managed by result side
- `exam` (oneToMany) - managed by exam side
- `question` (oneToMany) - managed by question side

---

### 3. Content Service (`contentService.js`)

**Relations:**

- `subject` → `api::subject.subject` (manyToOne)

**Create/Update Payload:**

```javascript
{
  title: "Content Title",
  subject: subjectDocumentId, // documentId or numeric ID
  // ... other fields
}
```

---

### 4. Question Service (`questionService.js`)

**Relations:**

- `subject` → `api::subject.subject` (manyToOne)
- `course` → `api::course.course` (manyToOne)
- `exams` → `api::exam.exam` (manyToMany)

**Create/Update Payload:**

```javascript
{
  questionText: "Question text",
  subject: subjectDocumentId, // documentId or numeric ID (optional)
  course: courseDocumentId, // documentId or numeric ID (optional)
  // Note: exams relation is managed from exam side
  // ... other fields
}
```

---

### 5. Exam Service (`examService.js`)

**Relations:**

- `course` → `api::course.course` (manyToOne)
- `subject` → `api::subject.subject` (manyToOne)
- `questions` → `api::question.question` (manyToMany)

**Create/Update Payload:**

```javascript
{
  title: "Exam Title",
  course: courseDocumentId, // documentId or numeric ID (optional)
  subject: subjectDocumentId, // documentId or numeric ID (optional)
  questions: [questionId1, questionId2, ...], // array of documentIds or numeric IDs
  // ... other fields
}
```

**Schema Relations:**

- `examAttempts` (oneToMany) - managed by exam-attempt side
- `results` (oneToMany) - managed by result side

---

### 6. Exam Attempt Service (`examAttemptService.js`)

**Relations:**

- `student` → `plugin::users-permissions.user` (manyToOne)
- `exam` → `api::exam.exam` (manyToOne)

**Create/Update Payload:**

```javascript
{
  exam: examDocumentId, // documentId or numeric ID
  student: userDocumentId, // documentId or numeric ID
  attemptNumber: 1,
  startedAt: "2025-11-08T10:00:00.000Z",
  status: "in-progress",
  // ... other fields
}
```

---

### 7. Result Service (`resultService.js`)

**Relations:**

- `student` → `plugin::users-permissions.user` (manyToOne)
- `course` → `api::course.course` (manyToOne) - optional
- `subject` → `api::subject.subject` (manyToOne) - optional
- `exam` → `api::exam.exam` (manyToOne)
- `exam_attempt` → `api::exam-attempt.exam-attempt` (oneToOne)

**Create/Update Payload:**

```javascript
{
  resultType: "exam",
  student: userDocumentId, // documentId or numeric ID
  exam: examDocumentId, // documentId or numeric ID
  exam_attempt: examAttemptDocumentId, // documentId or numeric ID
  course: courseDocumentId, // documentId or numeric ID (optional)
  subject: subjectDocumentId, // documentId or numeric ID (optional)
  score: 85,
  maxScore: 100,
  percentage: 85.0,
  passed: true,
  // ... other fields
}
```

---

### 8. Enrolment Service (`enrolmentService.js`)

**Relations:**

- `course` → `api::course.course` (manyToOne)
- `students` → `plugin::users-permissions.user` (manyToMany)
- `teachers` → `plugin::users-permissions.user` (manyToMany)

**Create/Update Payload:**

```javascript
{
  course: courseDocumentId, // documentId or numeric ID
  students: [studentId1, studentId2, ...], // array of documentIds or numeric IDs
  teachers: [teacherId1, teacherId2, ...], // array of documentIds or numeric IDs
  enrolment_status: "active",
  // ... other fields
}
```

---

### 9. Grade Service (`gradeService.js`)

**No Relations** - This is a simple content type with no relation fields to manage.

**Schema Relations:**

- `courses` (oneToMany) - managed by course side

---

## User Schema Relations (Read Only)

The `plugin::users-permissions.user` schema has these relations:

- `teachingCourses` → `api::course.course` (oneToMany) - courses where user is instructor
- `student_enrolments` → `api::enrolment.enrolment` (manyToMany) - student enrolments
- `teaching_enrolments` → `api::enrolment.enrolment` (manyToMany) - teaching enrolments
- `results` → `api::result.result` (oneToMany) - student results
- `examAttempt` → `api::exam-attempt.exam-attempt` (oneToMany) - exam attempts

These are managed from the respective content type sides.

---

## Best Practices

1. **Always validate relation IDs** before sending to API
2. **Check for null/undefined** values before including relations
3. **Use optional chaining** when accessing nested relation data
4. **Handle both formats**: Services accept both `documentId` and numeric `id`
5. **Array relations**: Always ensure arrays are properly formatted
6. **Error handling**: Wrap all API calls in try-catch blocks

## Example Usage

### Creating a Question with Relations

```javascript
const questionData = {
  questionText: "What is 2+2?",
  questionType: "multiple-choice",
  difficultyLevel: "easy",
  points: 1,
  options: [
    { id: "a", text: "3", isCorrect: false },
    { id: "b", text: "4", isCorrect: true },
    { id: "c", text: "5", isCorrect: false },
  ],
  subject: subjectDocId, // from subject selection
  course: courseDocId, // from course selection
};

await questionService.createQuestion(questionData);
```

### Creating an Exam Attempt and Result

```javascript
// 1. Create exam attempt
const attemptData = {
  exam: examDocId,
  student: currentUser.id,
  attemptNumber: 1,
  startedAt: new Date().toISOString(),
  submittedAt: new Date().toISOString(),
  status: "submitted",
  score: 85,
  percentage: 85.0,
  passed: true,
  timeTaken: 1800,
  answers: answersArray,
};

const savedAttempt = await examAttemptService.createExamAttempt(attemptData);

// 2. Create result linked to attempt
const resultData = {
  resultType: "exam",
  student: currentUser.id,
  exam: examDocId,
  exam_attempt: savedAttempt.data.id,
  course: courseDocId, // if available
  subject: subjectDocId, // if available
  score: 85,
  maxScore: 100,
  percentage: 85.0,
  grade: "A",
  gpa: 4.0,
  passed: true,
  isPublished: false,
};

await resultService.createResult(resultData);
```

---

## Changes Applied

All services have been updated to properly handle Strapi v5 `documentId` relations:

✅ **courseService.js** - grade, instructor relations
✅ **subjectService.js** - course relation
✅ **contentService.js** - subject relation
✅ **questionService.js** - subject, course relations
✅ **examService.js** - course, subject, questions relations
✅ **examAttemptService.js** - exam, student relations
✅ **resultService.js** - student, course, subject, exam, exam_attempt relations
✅ **enrolmentService.js** - course, students, teachers relations

The services now properly process relation data before sending to the Strapi v5 API, ensuring compatibility with the documentId-based relationship system.
