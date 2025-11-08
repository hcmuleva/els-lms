# Strapi v5 Connect Syntax Fix

## Issue

Relations were not being saved when creating exams (and other entities) because the client was passing raw IDs instead of using Strapi v5's `connect` syntax.

## Root Cause

Strapi v5 requires relations to be wrapped in a `connect` object:

```javascript
// ❌ Wrong - doesn't save relations
{
  course: 123;
}

// ✅ Correct - saves relations
{
  course: {
    connect: [123];
  }
}
```

## Solution Applied

Updated all service files to use Strapi v5 `connect` syntax for relations.

### Pattern for manyToOne Relations

```javascript
if (processedData.relation) {
  processedData.relation = { connect: [processedData.relation] };
}
```

### Pattern for manyToMany Relations

```javascript
if (
  processedData.relations &&
  Array.isArray(processedData.relations) &&
  processedData.relations.length > 0
) {
  processedData.relations = { connect: processedData.relations };
} else {
  delete processedData.relations;
}
```

## Updated Files

### ✅ examService.js

- `createExam()` - course, subject, questions relations
- `updateExam()` - course, subject, questions relations
- **This fixes the main issue with exam creation**

### ✅ questionService.js

- `createQuestion()` - subject, course relations
- `updateQuestion()` - subject, course relations

### ✅ courseService.js

- `createCourse()` - grade, instructor relations
- `updateCourse()` - grade, instructor relations

### ✅ subjectService.js

- `createSubject()` - course relation
- `updateSubject()` - course relation

### ✅ contentService.js

- `createContent()` - subject relation
- `updateContent()` - subject relation

### ✅ resultService.js

- `createResult()` - student, course, subject, exam, exam_attempt relations

### ✅ examAttemptService.js

- `createExamAttempt()` - exam, student relations

### ✅ enrolmentService.js

- `createEnrolment()` - course, students (array), teachers (array) relations

## Relation Types Handled

| Relation Type | Syntax                         | Example                                 |
| ------------- | ------------------------------ | --------------------------------------- |
| manyToOne     | `{ connect: [id] }`            | `{ course: { connect: [123] } }`        |
| oneToOne      | `{ connect: [id] }`            | `{ exam_attempt: { connect: [456] } }`  |
| manyToMany    | `{ connect: [id1, id2, ...] }` | `{ questions: { connect: [1, 2, 3] } }` |

## Testing

### Exam Creation Test

```javascript
const examData = {
  title: "Final Exam",
  examType: "final",
  duration: 120,
  totalPoints: 100,
  passingScore: 60,
  course: 5, // Will be converted to { connect: [5] }
  subject: 10, // Will be converted to { connect: [10] }
  questions: [1, 2, 3], // Will be converted to { connect: [1, 2, 3] }
};

await examService.createExam(examData);
// ✅ Now saves all relations correctly
```

### Question Creation Test

```javascript
const questionData = {
  questionText: "What is React?",
  questionType: "multiple-choice",
  subject: 10,  // Will be converted to { connect: [10] }
  course: 5,    // Will be converted to { connect: [5] }
  options: [...]
};

await questionService.createQuestion(questionData);
// ✅ Now saves all relations correctly
```

## Debug Logging

All services now include console.log statements to help debug:

- Input data before processing
- Processed data after applying connect syntax
- API response

Example:

```javascript
console.log("examService.createExam - Input data:", examData);
console.log("examService.createExam - Processed data:", processedData);
console.log("examService.createExam - Response:", response.data);
```

## Benefits

1. ✅ Relations are properly saved in database
2. ✅ Works with both numeric IDs and documentIds
3. ✅ Handles optional relations gracefully
4. ✅ Validates array relations before sending
5. ✅ Clear debug logging for troubleshooting

## Migration Notes

- No changes needed in component code
- Services handle the transformation automatically
- Existing code continues to work as-is

## Important

The `connect` syntax is **required** for Strapi v5. Simply passing IDs will not create the relationships.

---

**Status**: All services fixed ✅  
**Date**: 2025-11-08  
**Issue**: Exam relations not saving  
**Solution**: Use Strapi v5 connect syntax
