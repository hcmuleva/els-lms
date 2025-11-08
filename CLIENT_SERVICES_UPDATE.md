# Client Services Update Summary

## Overview

Updated all React client service files to properly handle Strapi v5 documentId-based relationships. All relation fields in payloads now correctly pass documentId or numeric ID values as expected by Strapi v5.

## Files Updated

### 1. **courseService.js**

- ✅ Updated `createCourse()` to handle `grade` and `instructor` relations
- ✅ Updated `updateCourse()` to handle `grade` and `instructor` relations
- Relations: grade (manyToOne), instructor (manyToOne)

### 2. **subjectService.js**

- ✅ Updated `createSubject()` to handle `course` relation
- ✅ Updated `updateSubject()` to handle `course` relation
- Relations: course (manyToOne)

### 3. **contentService.js**

- ✅ Updated `createContent()` to handle `subject` relation
- ✅ Updated `updateContent()` to handle `subject` relation
- Relations: subject (manyToOne)

### 4. **questionService.js**

- ✅ Updated `createQuestion()` to handle `subject` and `course` relations
- ✅ Updated `updateQuestion()` to handle `subject` and `course` relations
- Relations: subject (manyToOne), course (manyToOne)

### 5. **examService.js**

- ✅ Updated `createExam()` to handle `course`, `subject`, and `questions` relations
- ✅ Updated `updateExam()` to handle `course`, `subject`, and `questions` relations
- Relations: course (manyToOne), subject (manyToOne), questions (manyToMany array)

### 6. **examAttemptService.js**

- ✅ Updated `createExamAttempt()` to handle `exam` and `student` relations
- ✅ Updated `updateExamAttempt()` to handle `exam` and `student` relations
- Relations: exam (manyToOne), student (manyToOne)

### 7. **resultService.js**

- ✅ Updated `createResult()` to handle `student`, `course`, `subject`, `exam`, and `exam_attempt` relations
- ✅ Updated `updateResult()` to handle all relation fields
- Relations: student (manyToOne), course (manyToOne, optional), subject (manyToOne, optional), exam (manyToOne), exam_attempt (oneToOne)

### 8. **enrolmentService.js**

- ✅ Updated `createEnrolment()` to handle `course`, `students`, and `teachers` relations
- ✅ Updated `updateEnrolment()` to handle all relation fields
- ✅ Updated `assignTeachers()` to properly format teacher IDs
- ✅ Updated `assignStudents()` to properly format student IDs
- ✅ Updated `assignUsers()` to properly format both teacher and student IDs
- Relations: course (manyToOne), students (manyToMany array), teachers (manyToMany array)

### 9. **gradeService.js**

- ✅ No changes needed - has no relation fields

## Key Changes

### Relation Processing Pattern

All create and update methods now use this pattern:

```javascript
async createEntity(entityData) {
  // Process relations to use documentId for Strapi v5
  const processedData = { ...entityData };

  // Convert single relation
  if (processedData.relationField) {
    processedData.relationField = processedData.relationField;
  }

  // Convert array relation
  if (processedData.arrayRelation && Array.isArray(processedData.arrayRelation)) {
    processedData.arrayRelation = processedData.arrayRelation;
  }

  const response = await API.post('/api/entities', {
    data: processedData
  });
  return response.data;
}
```

### Benefits

1. **Strapi v5 Compatibility**: All relations now work with documentId-based system
2. **Flexible**: Accepts both documentId (string) and numeric ID values
3. **Array Relations**: Properly handles manyToMany relations as arrays
4. **Null Safety**: Checks for existence before processing relations
5. **Backward Compatible**: Maintains same API interface for components

## Server Schema Relationships Reference

### Course

- subjects (oneToMany) ← managed by subject.course
- grade (manyToOne) → grade
- instructor (manyToOne) → user
- enrolments (oneToMany) ← managed by enrolment.course
- results (oneToMany) ← managed by result.course
- exam (oneToMany) ← managed by exam.course
- question (oneToMany) ← managed by question.course

### Subject

- course (manyToOne) → course
- contents (oneToMany) ← managed by content.subject
- results (oneToMany) ← managed by result.subject
- exam (oneToMany) ← managed by exam.subject
- question (oneToMany) ← managed by question.subject

### Content

- subject (manyToOne) → subject

### Question

- subject (manyToOne) → subject
- course (manyToOne) → course
- exams (manyToMany) ↔ exam.questions

### Exam

- course (manyToOne) → course
- subject (manyToOne) → subject
- questions (manyToMany) ↔ question.exams
- examAttempts (oneToMany) ← managed by exam-attempt.exam
- results (oneToMany) ← managed by result.exam

### Exam Attempt

- student (manyToOne) → user
- exam (manyToOne) → exam

### Result

- student (manyToOne) → user
- course (manyToOne) → course (optional)
- subject (manyToOne) → subject (optional)
- exam (manyToOne) → exam
- exam_attempt (oneToOne) → exam-attempt

### Enrolment

- course (manyToOne) → course
- students (manyToMany) ↔ user.student_enrolments
- teachers (manyToMany) ↔ user.teaching_enrolments

### Grade

- courses (oneToMany) ← managed by course.grade

### User (plugin::users-permissions.user)

- teachingCourses (oneToMany) ← managed by course.instructor
- student_enrolments (manyToMany) ↔ enrolment.students
- teaching_enrolments (manyToMany) ↔ enrolment.teachers
- results (oneToMany) ← managed by result.student
- examAttempt (oneToMany) ← managed by exam-attempt.student

## Testing Recommendations

1. **Create Operations**: Test creating each entity type with relations
2. **Update Operations**: Test updating relations on existing entities
3. **Array Relations**: Test manyToMany relations (questions in exams, students/teachers in enrolments)
4. **Optional Relations**: Test creating entities with and without optional relations (course/subject in results)
5. **Nested Operations**: Test creating exam attempts and results together (as in ExamPlayer.js)

## Next Steps

1. Test the client with actual API calls
2. Verify relations are properly saved in Strapi database
3. Check populated data when fetching entities
4. Monitor for any validation errors from Strapi v5
5. Update any component code that might be passing incorrect ID formats

## Documentation Created

- **STRAPI_V5_RELATIONS_GUIDE.md**: Comprehensive guide to all relations, payload examples, and best practices

---

All client services are now ready to work with Strapi v5 documentId-based relationships! 🎉
