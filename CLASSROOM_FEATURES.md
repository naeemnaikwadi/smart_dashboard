# Classroom Management Features

## Overview
This application now includes comprehensive classroom management functionality that allows instructors to create virtual classrooms and students to join them using unique entry codes.

## Features Implemented

### For Instructors

#### 1. Create Classroom
- **Location**: `/create-classroom`
- **Features**:
  - Create classrooms with name, description, date, and course
  - Optional Excel file upload for student list
  - Automatic generation of unique 6-character entry codes
  - Real-time validation and error handling
  - Success feedback with entry code display

#### 2. View Classrooms
- **Location**: `/classrooms` or `/instructor-courses` (Classrooms tab)
- **Features**:
  - Display all classrooms created by the instructor
  - Show classroom details including entry codes
  - Delete classrooms with confirmation
  - Student count display
  - Responsive grid layout

#### 3. Excel Student Import
- **Features**:
  - Upload Excel files (.xlsx, .xls) with student data
  - Support for columns: `name`, `email`, `studentId`
  - Automatic parsing and validation
  - Downloadable template for correct formatting
  - Error handling for invalid files

### For Students

#### 1. Join Classroom
- **Location**: `/join-classroom`
- **Features**:
  - Enter 6-character entry code to find classrooms
  - View classroom details before joining
  - Real-time validation of entry codes
  - Instructor information display
  - Student count and course details

## Technical Implementation

### Backend (Server)

#### Models
- **Classroom Model** (`server/models/Classroom.js`):
  - Fields: name, description, date, course, instructor, entryCode, students
  - Unique entry codes with automatic generation
  - Student array with name, email, and studentId

#### API Routes (`server/routes/classrooms.js`)
- `POST /api/classrooms` - Create classroom with Excel upload
- `GET /api/classrooms/instructor/:id` - Get instructor's classrooms
- `GET /api/classrooms/join/:code` - Find classroom by entry code
- `DELETE /api/classrooms/:id` - Delete classroom

#### Dependencies
- `xlsx` - Excel file parsing
- `multer` - File upload handling
- `mongoose` - Database operations

### Frontend (Client)

#### Components
- **CreateClassroom** - Classroom creation form with Excel upload
- **Classrooms** - Display instructor's classrooms
- **JoinClassroom** - Student interface for joining classrooms
- **ExcelTemplate** - Downloadable template component
- **InstructorCourses** - Updated to show both courses and classrooms

#### Features
- Form validation and error handling
- Loading states and success messages
- Responsive design with Tailwind CSS
- Real-time API integration
- File upload with progress feedback

## Usage Instructions

### For Instructors

1. **Create a Classroom**:
   - Navigate to `/create-classroom`
   - Fill in required fields (name, description, date, course)
   - Optionally upload Excel file with student list
   - Click "Create Classroom"
   - Note the generated entry code

2. **Manage Classrooms**:
   - View all classrooms at `/classrooms`
   - Share entry codes with students
   - Delete classrooms as needed

3. **Excel Template**:
   - Download the template from the create classroom page
   - Use columns: name, email, studentId
   - Upload the filled template when creating classrooms

### For Students

1. **Join a Classroom**:
   - Navigate to `/join-classroom`
   - Enter the 6-character entry code provided by instructor
   - Review classroom details
   - Click "Confirm Join"

## Entry Code System

- **Format**: 6 characters (letters and numbers)
- **Uniqueness**: Automatically generated and verified
- **Usage**: Students enter codes to find and join classrooms
- **Security**: Codes are unique per classroom

## File Structure

```
server/
├── models/
│   └── Classroom.js          # Classroom database model
├── routes/
│   └── classrooms.js         # Classroom API routes
└── package.json              # Updated with xlsx dependency

client/src/
├── pages/
│   ├── CreateClassroom.jsx   # Classroom creation form
│   ├── Classrooms.jsx        # Classroom listing
│   └── JoinClassroom.jsx     # Student join interface
├── components/
│   └── ExcelTemplate.jsx     # Excel template download
└── App.js                    # Updated with new routes
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/classrooms` | Create new classroom |
| GET | `/api/classrooms/instructor/:id` | Get instructor's classrooms |
| GET | `/api/classrooms/join/:code` | Find classroom by entry code |
| DELETE | `/api/classrooms/:id` | Delete classroom |

## Security Features

- Authentication required for classroom creation and management
- Instructor can only delete their own classrooms
- Entry codes are unique and randomly generated
- File upload validation and size limits
- Input sanitization and validation

## Future Enhancements

- Student enrollment tracking
- Classroom attendance monitoring
- Real-time notifications
- Classroom analytics and reports
- Integration with live sessions
- Bulk student management 