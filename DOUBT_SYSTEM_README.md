# Doubt System for Smart Learning Dashboard

## Overview
The doubt system allows students to submit questions with image attachments to their instructors, and instructors can respond to these doubts. The system includes real-time notifications and comprehensive filtering capabilities.

## Features

### For Students
- **Submit Doubts**: Create new doubts with title, description, priority level, and tags
- **Image Attachments**: Upload up to 5 images (PNG, JPG, GIF) up to 5MB each
- **Priority Levels**: Mark doubts as low, medium, or high priority
- **Urgent Flag**: Mark critical doubts as urgent for faster instructor attention
- **View Responses**: See instructor answers and mark doubts as resolved
- **Filtering**: Filter doubts by course, status, and search terms
- **Delete**: Remove pending doubts before they're answered

### For Instructors
- **View All Doubts**: See doubts from all their courses with comprehensive filtering
- **Answer Doubts**: Provide detailed responses to student questions
- **Status Management**: Update doubt status (pending, answered, resolved)
- **Filtering**: Filter by course, classroom, status, priority, and search terms
- **Notifications**: Real-time alerts when new doubts are submitted
- **Priority Handling**: Identify and respond to urgent doubts quickly

### Notification System
- **Real-time Alerts**: Instant notifications for new doubts and answers
- **Priority-based**: Urgent doubts trigger high-priority notifications
- **Action Links**: Click notifications to navigate directly to related content
- **Mark as Read**: Track read/unread status
- **Bulk Actions**: Mark all notifications as read

## API Endpoints

### Doubts
- `POST /api/doubts` - Create new doubt (student only)
- `GET /api/doubts/instructor` - Get instructor doubts with filters
- `GET /api/doubts/student` - Get student doubts with filters
- `GET /api/doubts/:id` - Get specific doubt details
- `PUT /api/doubts/:id/answer` - Answer a doubt (instructor only)
- `PUT /api/doubts/:id/status` - Update doubt status (instructor only)
- `DELETE /api/doubts/:id` - Delete doubt (student only, pending only)

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete notification
- `GET /api/notifications/count` - Get unread notification count

## Database Models

### Doubt Model
```javascript
{
  student: ObjectId,        // Reference to User
  course: ObjectId,         // Reference to Course
  classroom: ObjectId,      // Reference to Classroom
  title: String,            // Doubt title
  description: String,      // Detailed description
  images: [{                // Array of image attachments
    url: String,
    fileName: String,
    uploadedAt: Date
  }],
  status: String,           // 'pending', 'answered', 'resolved'
  priority: String,         // 'low', 'medium', 'high'
  tags: [String],           // Array of tags
  isUrgent: Boolean,        // Urgent flag
  answer: {                 // Instructor's response
    instructor: ObjectId,
    text: String,
    answeredAt: Date
  }
}
```

### Notification Model
```javascript
{
  recipient: ObjectId,      // Reference to User
  type: String,             // 'doubt', 'enrollment', 'live_session', etc.
  title: String,            // Notification title
  message: String,          // Notification message
  relatedData: {            // Related data references
    doubt: ObjectId,
    course: ObjectId,
    classroom: ObjectId,
    student: ObjectId
  },
  isRead: Boolean,          // Read status
  priority: String,         // 'low', 'medium', 'high', 'urgent'
  actionUrl: String         // URL to navigate to
}
```

## Frontend Routes

### Student Routes
- `/student/doubts` - Student doubts page
- `/notifications` - Notifications page

### Instructor Routes
- `/instructor/doubts` - Instructor doubts management page
- `/notifications` - Notifications page

## Usage Examples

### Student Submitting a Doubt
1. Navigate to `/student/doubts`
2. Click "New Doubt" button
3. Select course from dropdown
4. Enter title and description
5. Set priority level and tags
6. Upload images (optional)
7. Mark as urgent if needed
8. Click "Submit Doubt"

### Instructor Answering a Doubt
1. Navigate to `/instructor/doubts`
2. View pending doubts in the list
3. Click "Answer" button on a doubt
4. Enter detailed response
5. Click "Submit Answer"
6. Optionally mark as resolved

### Managing Notifications
1. Click notification bell in header
2. View all notifications with read/unread status
3. Click "View Details" to navigate to related content
4. Mark individual notifications as read
5. Use "Mark All as Read" for bulk action

## File Upload Configuration

### Image Requirements
- **Formats**: PNG, JPG, GIF
- **Size Limit**: 5MB per image
- **Quantity**: Maximum 5 images per doubt
- **Storage**: Files stored in `server/uploads/doubts/`

### Multer Configuration
```javascript
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});
```

## Security Features

### Authentication
- All doubt operations require valid JWT token
- Role-based access control (student/instructor)
- Users can only access their own doubts or doubts from their courses

### Validation
- Course enrollment verification for students
- Course ownership verification for instructors
- File type and size validation
- Required field validation

### Data Isolation
- Students only see their own doubts
- Instructors only see doubts from their courses
- Proper population of related data with access control

## Performance Optimizations

### Database Indexes
```javascript
// Efficient querying for common operations
DoubtSchema.index({ course: 1, status: 1 });
DoubtSchema.index({ classroom: 1, status: 1 });
DoubtSchema.index({ student: 1, createdAt: -1 });
DoubtSchema.index({ 'answer.instructor': 1 });
```

### Pagination
- Configurable page size (default: 10 for doubts, 20 for notifications)
- Efficient skip/limit queries
- Total count for pagination controls

### Image Optimization
- Client-side image preview
- Efficient file upload handling
- Proper cleanup of temporary files

## Future Enhancements

### Planned Features
- **Real-time Updates**: WebSocket integration for live doubt updates
- **Email Notifications**: Email alerts for urgent doubts
- **Doubt Categories**: Predefined categories for better organization
- **Response Templates**: Reusable answer templates for instructors
- **Analytics**: Doubt response time and resolution metrics
- **Mobile App**: Native mobile application support

### Technical Improvements
- **Image Compression**: Automatic image optimization
- **CDN Integration**: Cloud storage for better performance
- **Search Enhancement**: Full-text search with Elasticsearch
- **Caching**: Redis caching for frequently accessed data
- **API Rate Limiting**: Prevent abuse and ensure fair usage

## Troubleshooting

### Common Issues
1. **Image Upload Fails**: Check file size and format
2. **Permission Denied**: Verify user role and course enrollment
3. **Notification Not Showing**: Check authentication and API endpoints
4. **Filter Not Working**: Verify filter parameters and API response

### Debug Steps
1. Check browser console for JavaScript errors
2. Verify API endpoints in Network tab
3. Check server logs for backend errors
4. Validate JWT token and user permissions
5. Confirm database connections and model relationships

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.
