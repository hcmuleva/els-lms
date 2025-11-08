# Project Structure - Role-Based Organization

This project follows a role-based architecture to organize code by user roles (Admin, Teacher, Student, Parent).

## 📁 Directory Structure

```
src/
├── pages/                      # Page components (route-level)
│   ├── admin/                  # Admin role pages
│   │   ├── AdminDashboard.js
│   │   ├── AdminCoursePage.js
│   │   ├── AdminSubjectPage.js
│   │   ├── AdminGradePage.js
│   │   ├── TeacherAssignmentPage.js
│   │   └── index.js           # Barrel export
│   │
│   ├── teacher/               # Teacher role pages
│   │   ├── TeacherContentPage.js
│   │   ├── ContentCreationPage.js
│   │   └── index.js           # Barrel export
│   │
│   ├── student/               # Student role pages (TODO)
│   │   └── index.js
│   │
│   ├── parent/                # Parent role pages (TODO)
│   │   └── index.js
│   │
│   └── common/                # Shared pages (Login, Register, Home)
│       ├── HomePage.js
│       ├── LoginPage.js
│       ├── RegisterPage.js
│       └── index.js           # Barrel export
│
├── components/                # Reusable components
│   ├── admin/                 # Admin-specific components
│   │   ├── CourseList.js
│   │   ├── CourseForm.js
│   │   ├── CourseView.js
│   │   ├── SubjectManager.js
│   │   └── index.js           # Barrel export
│   │
│   ├── teacher/               # Teacher-specific components (TODO)
│   │   └── index.js
│   │
│   ├── student/               # Student-specific components (TODO)
│   │   └── index.js
│   │
│   ├── parent/                # Parent-specific components (TODO)
│   │   └── index.js
│   │
│   └── common/                # Shared components (TODO: Button, Modal, Card, etc.)
│       └── index.js
│
├── services/                  # API service layer
│   ├── courseService.js
│   ├── subjectService.js
│   ├── gradeService.js
│   ├── contentService.js
│   ├── enrolmentService.js
│   └── userService.js
│
├── App.js                     # Root component
├── AuthContext.js             # Authentication context
└── api.js                     # Axios configuration
```

## 🎯 Benefits of This Structure

### 1. **Role-Based Organization**
- Clear separation of concerns by user role
- Easy to locate role-specific features
- Scalable for multi-role applications

### 2. **Barrel Exports (index.js)**
- Cleaner imports: `import { AdminDashboard } from './pages/admin'`
- Single point of export for each module
- Easy to refactor internal structure

### 3. **Logical Grouping**
- **Pages**: Route-level components (one per URL)
- **Components**: Reusable UI components
- **Services**: API communication layer

### 4. **Maintainability**
- New developers can quickly understand the structure
- Easy to add new features to specific roles
- Reduces merge conflicts in team development

## 📝 Import Examples

### Before Refactoring:
```javascript
import AdminDashboard from './pages/AdminDashboard';
import TeacherContentPage from './pages/TeacherContentPage';
import LoginPage from './pages/LoginPage';
```

### After Refactoring:
```javascript
import { AdminDashboard } from './pages/admin';
import { TeacherContentPage } from './pages/teacher';
import { LoginPage, RegisterPage, HomePage } from './pages/common';
```

## 🔄 Adding New Features

### Adding an Admin Feature:
1. Create component in `components/admin/` (if reusable)
2. Create page in `pages/admin/` (if it's a route)
3. Export from respective `index.js`
4. Import where needed

### Adding a Student Feature:
1. Create in `pages/student/` or `components/student/`
2. Export from `index.js`
3. Use in your application

## 📦 Current Implementation Status

✅ **Completed:**
- Admin pages and components organized
- Teacher pages organized
- Common pages organized
- Barrel exports created
- Import paths updated
- Folder structure created

🚧 **TODO:**
- Student role pages and components
- Parent role pages and components
- Common/shared components (Button, Modal, Card, etc.)
- Further refactoring as features are added

## 🎨 Naming Conventions

### Pages (Route Components):
- `AdminDashboard.js` - Admin dashboard
- `TeacherContentPage.js` - Teacher content management
- `StudentCoursePage.js` - Student course view

### Components (Reusable):
- `CourseList.js` - List of courses
- `CourseForm.js` - Form to create/edit courses
- `ContentCard.js` - Card component for content

### Services:
- `courseService.js` - Course API calls
- `userService.js` - User API calls

## 🔧 Migration Notes

All existing code has been refactored to follow this structure:
- Import paths updated from `../pages/` to `../pages/admin/`, etc.
- Service imports updated to `../../services/` from nested folders
- CSS files remain co-located with their components
- No functionality was changed, only organization

---

**Last Updated:** November 7, 2025
**Refactored By:** AI Assistant
**Purpose:** Improve code organization and maintainability
