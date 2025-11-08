# Course Management System - Admin Module

## 📋 Overview

This is a modular, role-based Course CRUD management system built for React with Strapi v5 backend. The architecture is designed to be scalable and reusable across multiple user roles.

## 🏗️ Architecture

### Strapi v5 Integration
- **Document-based API**: Uses `documentId` instead of traditional `id` for all operations
- **Flattened Response**: Direct access to attributes at top level (no nested `data.attributes`)
- **Relational CRUD**: Supports managing relations via entity IDs or documentIds in JSON body

### Component Structure

```
src/
├── services/
│   └── courseService.js          # API service layer for course operations
├── components/
│   └── admin/
│       ├── CourseList.js         # List view with pagination
│       ├── CourseList.css
│       ├── CourseForm.js         # Create/Edit form
│       ├── CourseForm.css
│       ├── CourseView.js         # Detail view modal
│       └── CourseView.css
├── pages/
│   ├── AdminCoursePage.js        # Main orchestrator component
│   ├── AdminCoursePage.css
│   └── HomePage.js               # Dashboard with role-based access
```

## 🎯 Features

### 1. **CourseService** (`services/courseService.js`)
Central service for all course-related API operations:

**Methods:**
- `getAllCourses(params)` - Fetch courses with pagination, filters, sorting
- `getCourseById(documentId)` - Fetch single course by documentId
- `createCourse(courseData)` - Create new course
- `updateCourse(documentId, courseData)` - Update existing course
- `deleteCourse(documentId)` - Delete course
- `uploadCoverIcon(file)` - Upload course cover image
- `parseDescription(description)` - Parse Strapi rich text to plain text
- `formatDescription(text)` - Convert plain text to Strapi rich text format

**Strapi v5 Features:**
```javascript
// Uses documentId in URL path
GET /api/courses/${documentId}?populate=*

// Wraps data in 'data' object for POST/PUT
POST /api/courses
{ data: { name, subtitle, ... } }

// Handles flattened response structure
response.data // Direct access to attributes
```

### 2. **CourseList** Component
Displays courses in a responsive grid with pagination.

**Features:**
- 📊 Pagination support
- 🖼️ Cover image display with fallback
- 🏷️ Age group badges
- ✅ Published/Draft status indicators
- 🔍 View, Edit, Delete actions
- 📱 Responsive design (mobile-friendly)

**Props:**
- `onEdit(course)` - Callback when edit button clicked
- `onView(course)` - Callback when view button clicked
- `onDelete(documentId)` - Callback after successful deletion

### 3. **CourseForm** Component
Create and edit courses with validation.

**Features:**
- ✏️ Create/Edit mode (controlled by `course` prop)
- 📝 Form validation
- 🖼️ Image upload with preview
- 📋 Rich text description field
- 🎯 Age group selector
- 🔗 YouTube URL support
- ⚡ Loading states

**Props:**
- `course` - Existing course data for edit mode (null for create)
- `onSubmit(result)` - Callback with result after successful save
- `onCancel()` - Callback when cancel button clicked

**Form Fields:**
- **Course Name**: Required, max 100 characters
- **Subtitle**: Required, max 150 characters
- **Age Group**: Dropdown (preschool, elementary, middle-school, high-school, adult)
- **Description**: Required, max 1000 characters
- **YouTube URL**: Optional, validated URL
- **Cover Image**: Optional, image file upload

### 4. **CourseView** Component
Full-screen modal for viewing course details.

**Features:**
- 🎨 Beautiful modal overlay
- 📸 Cover image header
- 📋 Comprehensive course information
- ⚙️ Technical details (documentId, timestamps)
- ✏️ Quick edit access
- 📱 Responsive design

**Props:**
- `course` - Course data to display
- `onClose()` - Callback to close modal
- `onEdit(course)` - Callback to switch to edit mode

### 5. **AdminCoursePage** Component
Main orchestrator for course management.

**Features:**
- 🎯 View state management (list/create/edit/view)
- 🔄 Auto-refresh after operations
- 📍 Breadcrumb navigation
- ➕ Create new course button
- 🎨 Consistent UI/UX

**State Management:**
```javascript
const [view, setView] = useState('list'); // 'list', 'create', 'edit', 'view'
const [selectedCourse, setSelectedCourse] = useState(null);
const [refreshKey, setRefreshKey] = useState(0); // Trigger list refresh
```

## 🎨 UI/UX Design

### Color Scheme
- Primary: `#667eea` → `#764ba2` (Gradient)
- Success: `#27ae60`
- Warning: `#f39c12`
- Danger: `#e74c3c`
- Neutral: `#95a5a6`

### Responsive Breakpoints
- Mobile: `< 768px`
- Tablet: `769px - 1024px`
- Desktop: `> 1025px`

### Animations
- Card hover: `translateY(-5px)` with shadow increase
- Button hover: Smooth color transitions
- Modal: Slide-up animation on open

## 🔐 Role-Based Access

### Admin Role Integration
Located in `HomePage.js`:

```javascript
{currentRole === "admin" && (
  <div 
    className="dashboard-card clickable" 
    onClick={() => setActiveSection("courses")}
  >
    <div className="card-icon">📚</div>
    <div className="card-content">
      <h3>Manage Courses</h3>
      <p>Create and manage courses for students</p>
    </div>
  </div>
)}
```

When clicked, switches from dashboard to course management:
```javascript
{activeSection === "courses" ? (
  <AdminCoursePage />
) : (
  // Dashboard cards
)}
```

## 🔌 API Integration

### Strapi v5 Course Model Structure

```javascript
{
  "id": 4,
  "documentId": "qc6oa5fsi2mtdc0h82iqgb2p",  // Primary identifier
  "createdAt": "2025-11-07T06:16:06.313Z",
  "updatedAt": "2025-11-07T06:17:31.651Z",
  "publishedAt": "2025-11-07T06:17:31.657Z",
  "name": "Course Name",
  "agegroup": "high-school",
  "subtitle": "Course Subtitle",
  "description": [
    {
      "type": "paragraph",
      "children": [
        { "type": "text", "text": "Course description" }
      ]
    }
  ],
  "youtube_url": "https://youtube.com/...",
  "covericon": [
    {
      "id": 1,
      "documentId": "...",
      "name": "image.jpeg",
      "url": "/uploads/image.jpeg",
      "formats": { "thumbnail": {...} }
    }
  ]
}
```

### Key Strapi v5 Changes
1. **documentId**: Use this for all single-item operations (GET, PUT, DELETE)
2. **Flattened structure**: No `data.attributes`, access properties directly
3. **Rich text**: Description uses nested array structure
4. **Relations**: covericon is array of media objects

## 📦 Dependencies

```json
{
  "axios": "^1.12.2",
  "react": "^19.2.0",
  "react-router-dom": "^6.30.1"
}
```

## 🚀 Usage Example

### 1. Create New Course
```javascript
const courseData = {
  name: "Introduction to Programming",
  subtitle: "Learn coding fundamentals",
  agegroup: "high-school",
  description: [{ type: "paragraph", children: [{ type: "text", text: "..." }] }],
  youtube_url: "https://youtube.com/...",
  covericon: [imageId]
};

await courseService.createCourse(courseData);
```

### 2. Update Existing Course
```javascript
await courseService.updateCourse(documentId, {
  name: "Updated Course Name",
  subtitle: "Updated subtitle"
});
```

### 3. Delete Course
```javascript
await courseService.deleteCourse(documentId);
```

## 🛠️ Extending for Other Roles

The architecture is modular and can be extended for other roles:

### Teacher View (Read-Only Courses)
```javascript
// src/pages/TeacherCoursePage.js
import CourseList from '../components/admin/CourseList';
import CourseView from '../components/admin/CourseView';

// Remove create/edit, keep view only
```

### Student View (Course Catalog)
```javascript
// src/pages/StudentCoursePage.js
// Custom list view with enrollment features
// Reuse CourseView for details
```

## 🔒 Permissions Required

### Strapi Permissions for Admin Role
Navigate to: **Settings → Users & Permissions Plugin → Roles → Authenticated**

Enable permissions for **Course**:
- ✅ `find` - List courses
- ✅ `findOne` - View single course
- ✅ `create` - Create new course
- ✅ `update` - Edit course
- ✅ `delete` - Delete course

Enable permissions for **Upload**:
- ✅ `upload` - Upload cover images

## 🐛 Error Handling

### Service Level
```javascript
try {
  const response = await courseService.getAllCourses();
  return response.data;
} catch (error) {
  console.error('Error fetching courses:', error);
  throw error; // Re-throw for component to handle
}
```

### Component Level
```javascript
const [error, setError] = useState(null);

try {
  await fetchCourses();
  setError(null);
} catch (err) {
  setError('Failed to load courses. Please try again.');
}
```

## 📈 Performance Optimization

1. **Pagination**: Loads 10-25 items at a time
2. **Image optimization**: Uses Strapi's thumbnail format when available
3. **Lazy loading**: Components render only when active
4. **Refresh key**: Prevents unnecessary re-renders

## 🎯 Best Practices

1. ✅ Always use `documentId` for operations, not `id`
2. ✅ Wrap data in `{ data: {...} }` for POST/PUT requests
3. ✅ Use `populate=*` to include relations
4. ✅ Handle rich text with helper functions
5. ✅ Validate forms before submission
6. ✅ Show loading states during operations
7. ✅ Provide user feedback (success/error messages)
8. ✅ Implement optimistic updates where appropriate

## 📝 Next Steps

1. Add search and filter functionality
2. Implement bulk operations
3. Add course duplication feature
4. Create course preview mode
5. Add analytics dashboard
6. Implement course categories/tags
7. Add instructor assignment
8. Create course enrollment system

---

**Built with ❤️ for multi-role educational platforms**
