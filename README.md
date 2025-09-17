# MERN Stack Task Manager

A full-stack task management application built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring role-based authentication, real-time task management, and comprehensive analytics.

## 🚀 Features

### Core Functionality
- **User Authentication & Authorization**
  - JWT-based authentication with secure token storage
  - Role-based access control (Admin & Member)
  - User registration and login system

- **Task Management**
  - Create, read, update, and delete tasks
  - Task status workflow (Todo → In Progress → Done)
  - Priority levels (Low, Medium, High, Urgent)
  - Due date management with overdue detection
  - Tag-based organization
  - Assignee management

- **Advanced Features**
  - Real-time status updates with quick change dropdowns
  - Comprehensive search and filtering
  - Pagination with customizable items per page
  - Activity logging for all task operations
  - Role-based dashboard views

### Role-Based Access Control

#### Admin Users
- Manage all tasks across the system
- View and manage user accounts
- Access comprehensive system analytics
- Monitor team performance metrics
- View system health and data quality

#### Member Users
- Manage only assigned tasks
- Personal task dashboard with progress tracking
- Task completion statistics and streaks
- Limited to self-assignment for new tasks

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express-validator with custom middleware
- **Security**: bcrypt for password hashing, CORS protection
- **Testing**: Jest with Supertest for API testing

### Frontend
- **Framework**: React 18 with TypeScript
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6
- **Styling**: Tailwind CSS with custom components
- **Icons**: Lucide React
- **Build Tool**: Vite

### Development Tools
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript
- **Package Management**: npm
- **Version Control**: Git

## 📁 Project Structure

```
Test-Demo/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts (Auth)
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Utility functions
│   ├── package.json
│   └── vite.config.ts
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Custom middleware
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API route definitions
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Utility functions
│   │   └── validation/    # Input validation schemas
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm (v8 or higher)
- MongoDB (v5 or higher)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Test-Demo
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   cp env.example .env
   # Edit .env with your configuration
   npm run build
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd client
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## ⚙️ Environment Configuration

### Backend (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/task-manager

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🧪 Testing

### Backend Tests
Run the test suite to ensure API functionality:

```bash
cd server
npm test
```

Tests cover:
- Authentication endpoints
- Task CRUD operations
- User management
- Input validation
- Error handling

### Test Coverage
- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **Validation Tests**: Input validation and sanitization
- **Error Handling**: Proper error responses and status codes

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PATCH /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/verify` - Verify JWT token

### Tasks
- `GET /api/tasks` - Get tasks with filtering and pagination
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task by ID
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Users (Admin Only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id/role` - Update user role
- `DELETE /api/users/:id` - Delete user

### Statistics
- `GET /api/stats/overview` - Task overview statistics
- `GET /api/stats/user` - User-specific statistics
- `GET /api/stats/team` - Team performance (Admin)
- `GET /api/stats/system` - System health (Admin)

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Comprehensive validation using express-validator
- **CORS Protection**: Configurable cross-origin resource sharing
- **Rate Limiting**: Protection against brute force attacks
- **Role-Based Access**: Granular permission control
- **Data Sanitization**: Protection against injection attacks

## 🎯 Key Implementation Decisions

### Architecture Patterns
- **MVC Pattern**: Clear separation of concerns
- **Repository Pattern**: Database abstraction layer
- **Middleware Pattern**: Reusable request processing
- **Service Layer**: Business logic encapsulation

### State Management
- **React Query**: Server state management with caching
- **Context API**: Global state (authentication)
- **Local State**: Component-specific state

### Error Handling
- **Centralized Error Handling**: Consistent error responses
- **Validation Errors**: Detailed input validation feedback
- **HTTP Status Codes**: Proper REST API status codes
- **Error Logging**: Comprehensive error tracking

## 🚧 Development Workflow

### Code Quality
- **TypeScript**: Static type checking
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **Git Hooks**: Pre-commit validation

### Testing Strategy
- **Test-Driven Development**: Write tests before implementation
- **Coverage Requirements**: Minimum 80% test coverage
- **Integration Testing**: End-to-end API testing
- **Mocking**: External service mocking

## 📈 Performance Considerations

- **Database Indexing**: Optimized MongoDB queries
- **Pagination**: Efficient data loading
- **Caching**: React Query caching strategy
- **Bundle Optimization**: Vite build optimization
- **Lazy Loading**: Component code splitting

## 🔮 Future Enhancements

- **Real-time Updates**: WebSocket integration
- **File Attachments**: Task file management
- **Email Notifications**: Automated reminders
- **Mobile App**: React Native version
- **Advanced Analytics**: Machine learning insights
- **Team Collaboration**: Real-time task sharing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


**Built with ❤️ using the MERN Stack** 