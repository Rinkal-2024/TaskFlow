# MERN Stack Task Manager - Setup Guide

## 🚀 Quick Start

This guide will help you set up and run the MERN Stack Task Manager project on your local machine.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (v8 or higher) - Comes with Node.js
- **MongoDB** (v5 or higher) - [Download here](https://www.mongodb.com/try/download/community)
- **Git** - [Download here](https://git-scm.com/)

### Verify Installation
```bash
node --version    # Should be v18.0.0 or higher
npm --version     # Should be v8.0.0 or higher
mongod --version  # Should be v5.0.0 or higher
git --version     # Any recent version
```

## 🗂️ Project Structure

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
├── README.md
├── SETUP_GUIDE.md
└── .gitignore
```

## 🔧 Installation Steps

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Test-Demo
```

### 2. Backend Setup

#### Navigate to Server Directory
```bash
cd server
```

#### Install Dependencies
```bash
npm install
```

#### Environment Configuration
```bash
# Copy the example environment file
cp env.example .env

# Edit the .env file with your configuration
nano .env  # or use your preferred editor
```

#### Required Environment Variables
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/task-manager

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173
```

#### Build and Start Backend
```bash
# Build TypeScript
npm run build

# Start development server
npm start

# Or run in development mode with auto-reload
npm run watch
```

**Backend should now be running on:** http://localhost:5000

### 3. Frontend Setup

#### Navigate to Client Directory
```bash
cd ../client
```

#### Install Dependencies
```bash
npm install
```

#### Environment Configuration (Optional)
```bash
# Create .env file if needed
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

#### Start Development Server
```bash
npm run dev
```

**Frontend should now be running on:** http://localhost:5173

## 🗄️ Database Setup

### 1. Start MongoDB
```bash
# Start MongoDB service
sudo systemctl start mongod

# Or start manually
mongod --dbpath /path/to/your/data/directory
```

### 2. Verify Connection
```bash
# Connect to MongoDB shell
mongosh

# Check databases
show dbs

# Use task-manager database
use task-manager

# Check collections
show collections

# Exit MongoDB shell
exit
```

### 3. Initial Data (Optional)
The application will create necessary collections automatically when you first register a user.

## 🧪 Testing Setup

### 1. Backend Tests
```bash
cd server

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI/CD
npm run test:ci
```

### 2. Test Database
Tests use a separate database (`task-manager-test`) to avoid interfering with development data.

### 3. Test Coverage
- **Target Coverage**: 90%+
- **Current Coverage**: 140+ tests
- **Coverage Report**: Generated in `server/coverage/` directory

## 🚀 Running the Application

### 1. Start Backend
```bash
cd server
npm start
```

### 2. Start Frontend
```bash
cd client
npm run dev
```

### 3. Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Documentation**: Available at API endpoints

## 👥 First User Setup

### 1. Register Admin User
1. Navigate to http://localhost:5173/register
2. Fill in the registration form:
   - **Email**: admin@example.com
   - **Password**: AdminPass123
   - **First Name**: Admin
   - **Last Name**: User
   - **Role**: admin
3. Click "Register"

### 2. Register Member User
1. Navigate to http://localhost:5173/register
2. Fill in the registration form:
   - **Email**: member@example.com
   - **Password**: MemberPass123
   - **First Name**: Member
   - **Last Name**: User
   - **Role**: member (or leave blank for default)
3. Click "Register"

### 3. Login and Explore
1. Login with either account
2. Explore the dashboard
3. Create some test tasks
4. Test different user roles and permissions

## 🔧 Development Commands

### Backend Commands
```bash
cd server

# Development
npm start          # Build and start
npm run watch      # Watch mode with auto-reload
npm run serve      # Start without building
npm run debug      # Start with debugging

# Building
npm run build      # Build TypeScript
npm run build-ts   # Build TypeScript only

# Code Quality
npm run format     # Format code with Prettier
npm run tslint     # Run TSLint

# Testing
npm test           # Run tests
npm run test:watch # Watch mode tests
npm run test:coverage # Coverage report
```

### Frontend Commands
```bash
cd client

# Development
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build

# Code Quality
npm run lint       # Run ESLint
npm run type-check # TypeScript type checking
```

## 🐛 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```bash
# Error: MongoDB connection failed
# Solution: Ensure MongoDB is running
sudo systemctl status mongod
sudo systemctl start mongod
```

#### 2. Port Already in Use
```bash
# Error: Port 5000 is already in use
# Solution: Change port in .env file or kill existing process
lsof -ti:5000 | xargs kill -9
```

#### 3. CORS Error
```bash
# Error: CORS policy violation
# Solution: Check CLIENT_URL in server .env file
# Ensure it matches your frontend URL
```

#### 4. JWT Secret Error
```bash
# Error: JWT_SECRET is required
# Solution: Set JWT_SECRET in server .env file
```

#### 5. Build Errors
```bash
# Error: TypeScript compilation failed
# Solution: Check for type errors
cd server
npm run build-ts

# Or check frontend types
cd client
npm run type-check
```

### Debug Mode
```bash
# Backend debugging
cd server
npm run debug

# Frontend debugging
# Use browser developer tools
# Check console for errors
```

## 📊 Monitoring and Logs

### Backend Logs
```bash
# View server logs
cd server
tail -f logs/app.log

# Or check console output when running
npm start
```

### Database Monitoring
```bash
# MongoDB shell
mongosh
use task-manager
db.tasks.find().pretty()
db.users.find().pretty()
```

### Frontend Monitoring
- **Browser Console**: Check for JavaScript errors
- **Network Tab**: Monitor API requests
- **React DevTools**: Component state and props

## 🔒 Security Considerations

### Development Environment
- **JWT Secret**: Use a strong, unique secret
- **Database**: Use local MongoDB for development
- **CORS**: Configure for local development only

### Production Environment
- **Environment Variables**: Never commit .env files
- **JWT Secret**: Use strong, randomly generated secrets
- **Database**: Use secure, managed MongoDB instance
- **HTTPS**: Enable SSL/TLS encryption
- **Rate Limiting**: Configure appropriate limits

## 📈 Performance Optimization

### Backend
- **Database Indexing**: Ensure proper indexes on frequently queried fields
- **Caching**: Implement Redis for session storage
- **Compression**: Enable gzip compression
- **Rate Limiting**: Prevent abuse

### Frontend
- **Code Splitting**: Implement lazy loading
- **Bundle Optimization**: Use Vite's build optimization
- **Image Optimization**: Compress and optimize images
- **CDN**: Use CDN for static assets

## 🚀 Deployment

### Backend Deployment
1. **Build the application**:
   ```bash
   cd server
   npm run build
   ```

2. **Set production environment variables**:
   ```env
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/task-manager
   JWT_SECRET=production-jwt-secret
   CLIENT_URL=https://yourdomain.com
   ```

3. **Deploy to your preferred platform**:
   - **Heroku**: Use `Procfile` and Heroku CLI
   - **AWS**: Use Elastic Beanstalk or EC2
   - **DigitalOcean**: Use App Platform or Droplets
   - **Vercel**: Use Vercel CLI

### Frontend Deployment
1. **Build the application**:
   ```bash
   cd client
   npm run build
   ```

2. **Deploy the `dist` folder**:
   - **Netlify**: Drag and drop the `dist` folder
   - **Vercel**: Use Vercel CLI
   - **AWS S3**: Upload to S3 bucket
   - **GitHub Pages**: Push to gh-pages branch

## 📚 Additional Resources

### Documentation
- **README.md**: Project overview and features
- **TEST_SUMMARY.md**: Comprehensive test documentation
- **API Endpoints**: Available at `/api/*` endpoints

### External Resources
- **MongoDB**: [Official Documentation](https://docs.mongodb.com/)
- **Express.js**: [Official Guide](https://expressjs.com/)
- **React**: [Official Documentation](https://reactjs.org/)
- **TypeScript**: [Official Handbook](https://www.typescriptlang.org/docs/)

### Support
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions
- **Contributing**: Follow contribution guidelines

## 🎯 Next Steps

After successful setup:

1. **Explore the Application**: Test all features and user roles
2. **Create Test Data**: Add sample tasks and users
3. **Run Tests**: Ensure all tests pass
4. **Customize**: Modify features according to your needs
5. **Deploy**: Deploy to production environment
6. **Monitor**: Set up monitoring and logging
7. **Scale**: Optimize for production load

---

**Happy Coding! 🚀**

If you encounter any issues during setup, please refer to the troubleshooting section or create an issue in the repository. 