# Quick Reference Guide - Role-Based Architecture

## 🎯 Quick Navigation

### Admin Features
- **Location:** `src/pages/admin/` and `src/components/admin/`
- **Pages:**
  - `AdminDashboard` - Main admin dashboard with tabs
  - `AdminCoursePage` - Course management
  - `AdminSubjectPage` - Subject management
  - `AdminGradePage` - Grade management
  - `TeacherAssignmentPage` - Assign teachers/students to courses
- **Components:**
  - `CourseList` - Display list of courses
  - `CourseForm` - Create/edit course form
  - `CourseView` - View course details
  - `SubjectManager` - Manage subjects

### Teacher Features
- **Location:** `src/pages/teacher/` and `src/components/teacher/`
- **Pages:**
  - `TeacherContentPage` - Create/manage learning content
  - `ContentCreationPage` - Alternative content creation interface
- **Content Types Supported:**
  - Plain Text
  - Rich Text
  - Rich Text (Markdown)
  - Images
  - Videos
  - YouTube (with embedded player)
  - MS Office files

### Common Features
- **Location:** `src/pages/common/`
- **Pages:**
  - `HomePage` - Main dashboard (role-based routing)
  - `LoginPage` - User authentication
  - `RegisterPage` - User registration

### Services (API Layer)
- **Location:** `src/services/`
- **Available Services:**
  - `courseService` - Course CRUD operations
  - `subjectService` - Subject CRUD operations
  - `gradeService` - Grade CRUD operations
  - `contentService` - Content CRUD + media upload
  - `enrolmentService` - Teacher/student assignments
  - `userService` - User management

## 📝 Import Cheat Sheet

### Importing Pages:
```javascript
// Admin pages
import { AdminDashboard, AdminCoursePage, TeacherAssignmentPage } from './pages/admin';

// Teacher pages
import { TeacherContentPage } from './pages/teacher';

// Common pages
import { HomePage, LoginPage, RegisterPage } from './pages/common';
```

### Importing Components:
```javascript
// Admin components
import { CourseList, CourseForm, CourseView } from './components/admin';

// Teacher components (TODO)
import { } from './components/teacher';

// Common components (TODO)
import { } from './components/common';
```

### Importing Services:
```javascript
import courseService from './services/courseService';
import contentService from './services/contentService';
import userService from './services/userService';
```

## 🔧 Common Tasks

### Adding a New Admin Page:
1. Create `NewPage.js` in `src/pages/admin/`
2. Create `NewPage.css` in same folder
3. Add export to `src/pages/admin/index.js`:
   ```javascript
   export { default as NewPage } from './NewPage';
   ```
4. Import in your component:
   ```javascript
   import { NewPage } from './pages/admin';
   ```

### Adding a New Service:
1. Create `newService.js` in `src/services/`
2. Use Axios instance from `api.js`
3. Export service object with methods
4. Import where needed:
   ```javascript
   import newService from './services/newService';
   ```

### Adding a New Reusable Component:
1. Determine role (admin/teacher/student/parent/common)
2. Create in appropriate `components/[role]/` folder
3. Export from `index.js` in that folder
4. Import using barrel export

## 🎨 File Naming Conventions

- **Pages:** `PascalCase` + descriptive (e.g., `AdminDashboard.js`)
- **Components:** `PascalCase` (e.g., `CourseList.js`)
- **Services:** `camelCase` + Service suffix (e.g., `courseService.js`)
- **CSS:** Same name as JS file (e.g., `AdminDashboard.css`)
- **Barrel exports:** Always `index.js`

## 🚀 Role-Based Access

Current role routing is handled in `HomePage.js`:

```javascript
{currentRole === "admin" && (
  <div className="dashboard-card" onClick={() => setActiveSection("admin")}>
    <h3>Admin Dashboard</h3>
  </div>
)}

{currentRole === "teacher" && (
  <div className="dashboard-card" onClick={() => setActiveSection("content")}>
    <h3>Create Content</h3>
  </div>
)}
```

## 📊 Current Status by Role

### ✅ Admin (Fully Implemented)
- Dashboard with tabs
- Course management
- Subject management
- Grade management
- Teacher/student assignments

### ✅ Teacher (Partially Implemented)
- Content creation (all 7 types)
- Content management
- Subject association

### ⏳ Student (Not Implemented)
- Course enrollment
- Content viewing
- Assignment submission
- Progress tracking

### ⏳ Parent (Not Implemented)
- Child profiles
- Progress monitoring
- Payment management

## 🔗 Key Relationships

```
Course → has many → Subjects
Subject → belongs to → Course
Grade → independent entity
Enrolment → links → Course + Teachers + Students
Content → belongs to → Subject
Content → has many → Media (images/videos/files)
User → has → Role (admin/teacher/student/parent)
```

## 🛠️ Development Workflow

1. **Plan Feature:** Determine which role it belongs to
2. **Create Service:** If new API calls are needed
3. **Create Component:** If reusable UI is needed
4. **Create Page:** For new routes
5. **Update Barrel Export:** Add to appropriate `index.js`
6. **Update Routes:** If new route is needed
7. **Test:** Verify imports and functionality

## 📚 Additional Resources

- See `PROJECT_STRUCTURE.md` for detailed architecture
- Check individual service files for API documentation
- Review `AuthContext.js` for role management
- See `api.js` for Axios configuration

---

**Happy Coding! 🎉**
