# 🔧 ReelCraft Technical Documentation

## System Overview

**ReelCraft** is a Next.js-based web application for automated Instagram Reel generation with custom audio support, user management, and admin controls.

### Technology Stack

#### Frontend
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui with Radix UI primitives
- **State Management**: React Context API + Custom Hooks
- **Forms**: React Hook Form with validation

#### Backend
- **Runtime**: Node.js
- **API**: Next.js API Routes
- **Database**: SQLite with better-sqlite3
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Local filesystem with Docker volume mounting
- **Job Processing**: Background processing with timers

#### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx (optional)
- **Process Management**: PM2 (optional)
- **Version Control**: Git

#### External Services
- **Video Generation**: External API services
- **File Upload**: Multer for multipart handling
- **Audio Processing**: FFmpeg (if needed)

---

## Architecture

### Application Structure

```
reels-ui/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── jobs/          # Job management
│   │   │   ├── reels/         # Reel generation
│   │   │   ├── upload/        # File upload
│   │   │   └── admin/         # Admin endpoints
│   │   ├── admin/             # Admin dashboard
│   │   └── [other pages]      # User-facing pages
│   ├── components/            # Reusable React components
│   ├── contexts/              # React Context providers
│   ├── hooks/                 # Custom React hooks
│   └── lib/                   # Utility functions and services
├── public/                    # Static assets
├── data/                      # SQLite database
├── uploads/                   # User-uploaded files
├── docker-compose.yml         # Docker orchestration
├── Dockerfile                 # Container definition
└── package.json               # Dependencies
```

### Data Flow

1. **User Authentication**: JWT tokens stored in httpOnly cookies
2. **File Upload**: Multipart form data → Server validation → Storage
3. **Reel Generation**: User request → External API → Job tracking → Result storage
4. **Content Management**: Database queries → API responses → UI updates

---

## Database Schema

### Core Tables

#### users
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  avatar TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### reel_categories
```sql
CREATE TABLE reel_categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### reel_types
```sql
CREATE TABLE reel_types (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  name TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  message TEXT,
  caption TEXT,
  external_url TEXT,
  status_url TEXT,
  posting_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES reel_categories(id)
);
```

#### jobs
```sql
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  job_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'posted')),
  result_url TEXT,
  caption TEXT,
  custom_caption TEXT,
  custom_author TEXT,
  use_custom_audio BOOLEAN DEFAULT FALSE,
  custom_audio_url TEXT,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### file_uploads
```sql
CREATE TABLE file_uploads (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  hash TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
  access_count INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Indexes
```sql
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_file_uploads_hash ON file_uploads(hash);
CREATE INDEX idx_file_uploads_user_id ON file_uploads(user_id);
```

---

## API Documentation

### Authentication Endpoints

#### POST /api/auth/login
**Authenticate user and return JWT token**

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe",
    "plan": "free",
    "is_admin": false
  }
}
```

#### POST /api/auth/register
**Create new user account**

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe",
    "plan": "free"
  }
}
```

#### POST /api/auth/verify
**Verify JWT token validity**

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe",
    "plan": "free"
  }
}
```

#### POST /api/auth/logout
**Invalidate user session**

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Content Management Endpoints

#### GET /api/reels/categories
**Get available reel categories**

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `active=true` - Filter active categories only

**Response:**
```json
{
  "categories": [
    {
      "id": "cat1",
      "name": "motivation",
      "title": "Motivational Content",
      "description": "Inspiring content for motivation",
      "icon": "fire",
      "is_active": true
    }
  ]
}
```

#### GET /api/reels/types
**Get reel types for a category**

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `category=<category_id>` - Required: Category ID
- `active=true` - Filter active types only

**Response:**
```json
{
  "types": [
    {
      "id": "type1",
      "category_id": "cat1",
      "name": "gym-motivation",
      "title": "Gym Motivation",
      "description": "Workout inspiration content",
      "icon": "dumbbell",
      "message": "Get pumped for your workout!",
      "caption": "Push through the pain...",
      "external_url": "https://api.example.com/generate",
      "status_url": "https://api.example.com/status",
      "posting_url": "https://api.example.com/post",
      "is_active": true
    }
  ]
}
```

#### POST /api/reels/[type]
**Generate a new reel**

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "generateCaption": true,
  "customCaption": "Optional custom caption",
  "customAuthor": "Optional author credit",
  "useCustomAudio": false,
  "customAudioUrl": "optional-audio-url"
}
```

**Response:**
```json
{
  "jobId": "job_123456",
  "status": "pending",
  "message": "Reel generation started"
}
```

### Job Management Endpoints

#### GET /api/jobs
**Get user's job history**

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status=<status>` - Filter by status
- `category=<category>` - Filter by category
- `limit=20` - Limit results
- `offset=0` - Pagination offset

**Response:**
```json
{
  "jobs": [
    {
      "id": "job1",
      "job_id": "job_123456",
      "category": "motivation",
      "type": "gym-motivation",
      "status": "completed",
      "result_url": "https://example.com/video.mp4",
      "caption": "Push through the pain...",
      "created_at": "2025-09-17T10:00:00Z",
      "updated_at": "2025-09-17T10:02:00Z"
    }
  ],
  "total": 1
}
```

#### GET /api/reels/status
**Check job generation status**

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `jobId=<job_id>` - Required: Job ID
- `type=<reel_type>` - Required: Reel type

**Response:**
```json
{
  "status": "completed",
  "result": {
    "video_url": "https://example.com/video.mp4",
    "caption": "Generated caption text",
    "thumbnail_url": "https://example.com/thumbnail.jpg"
  }
}
```

#### DELETE /api/jobs
**Clear job history**

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `category=<category>` - Optional: Clear specific category only

**Response:**
```json
{
  "success": true,
  "deletedCount": 15,
  "message": "Job history cleared"
}
```

### File Upload Endpoints

#### POST /api/upload/audio
**Upload audio file**

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `audio` - Audio file (MP3 format, max 10MB)

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "file123",
    "filename": "audio_123.mp3",
    "original_name": "my-song.mp3",
    "size": 5242880,
    "url": "/uploads/audio/audio_123.mp3"
  }
}
```

#### GET /api/uploads/audio/[filename]
**Serve audio file**

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** Audio file stream

### Admin Endpoints

#### GET /api/admin/users
**Get all users (Admin only)**

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "users": [
    {
      "id": "user1",
      "email": "user@example.com",
      "name": "John Doe",
      "plan": "free",
      "is_admin": false,
      "created_at": "2025-09-17T10:00:00Z"
    }
  ],
  "total": 1
}
```

#### POST /api/admin/categories
**Create new category (Admin only)**

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "name": "new-category",
  "title": "New Category",
  "description": "Description of new category",
  "icon": "star"
}
```

**Response:**
```json
{
  "success": true,
  "category": {
    "id": "cat123",
    "name": "new-category",
    "title": "New Category",
    "is_active": true
  }
}
```

#### GET /api/uploads/audio/stats
**Get file storage statistics**

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalFiles": 25,
  "totalSize": 524288000,
  "totalSizeFormatted": "500 MB",
  "oldestFile": "2025-08-01T00:00:00Z",
  "newestFile": "2025-09-17T10:00:00Z"
}
```

#### POST /api/uploads/audio/cleanup
**Clean up old audio files**

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "olderThanDays": 7,
  "maxFiles": 100
}
```

**Response:**
```json
{
  "success": true,
  "deletedCount": 5,
  "freedSpace": 26214400,
  "message": "Cleanup completed"
}
```

---

## Authentication System

### JWT Implementation

**Token Structure:**
```javascript
{
  "userId": "user123",
  "email": "user@example.com",
  "isAdmin": false,
  "iat": 1632000000,
  "exp": 1632086400
}
```

**Token Configuration:**
- **Algorithm**: HS256
- **Expiration**: 24 hours
- **Secret**: Environment variable `JWT_SECRET`
- **Storage**: httpOnly cookies

### Password Security

**Hashing:**
- **Algorithm**: bcrypt
- **Rounds**: 12
- **Salt**: Auto-generated per password

**Validation:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### Session Management

**Cookie Settings:**
```javascript
{
  name: 'auth-token',
  value: token,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}
```

---

## File Handling System

### Upload Configuration

**Multer Settings:**
```javascript
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'audio/mpeg') {
      cb(null, true);
    } else {
      cb(new Error('Only MP3 files allowed'));
    }
  },
  storage: multer.diskStorage({
    destination: './public/uploads/audio',
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp3`;
      cb(null, uniqueName);
    }
  })
});
```

### File Deduplication

**SHA-256 Hashing:**
```javascript
const crypto = require('crypto');

function calculateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}
```

**Duplicate Detection:**
```javascript
async function findExistingFileByHash(hash) {
  return db.prepare('SELECT * FROM file_uploads WHERE hash = ?').get(hash);
}
```

### Automatic Cleanup

**Access Tracking:**
```javascript
// Track file access
app.get('/api/uploads/audio/:filename', (req, res) => {
  const { filename } = req.params;

  // Update access time and count
  db.prepare(`
    UPDATE file_uploads
    SET last_accessed = CURRENT_TIMESTAMP, access_count = access_count + 1
    WHERE filename = ?
  `).run(filename);

  // Schedule deletion after 1 hour
  scheduleFileDeletion(filename, 60 * 60 * 1000); // 1 hour
});
```

**Cleanup Process:**
```javascript
function scheduleFileDeletion(filename, delay) {
  setTimeout(async () => {
    try {
      const filePath = path.join('./public/uploads/audio', filename);

      // Check if file still exists and hasn't been accessed recently
      const stats = await fs.promises.stat(filePath);
      const lastAccess = new Date(stats.atime);
      const now = new Date();

      if (now - lastAccess > delay) {
        await fs.promises.unlink(filePath);
        db.prepare('DELETE FROM file_uploads WHERE filename = ?').run(filename);
        console.log(`Cleaned up file: ${filename}`);
      }
    } catch (error) {
      console.error(`Error cleaning up ${filename}:`, error);
    }
  }, delay);
}
```

---

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

# Install dependencies
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start application
CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  reels-ui:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - reels_uploads:/app/public/uploads
    environment:
      - NODE_ENV=production
      - JWT_SECRET=your-secret-key
      - DATABASE_URL=/app/data/reelcraft.db
    restart: unless-stopped

volumes:
  reels_uploads:
```

### Environment Variables

```bash
# Application
NODE_ENV=production
PORT=3000

# Database
DATABASE_PATH=./data/reelcraft.db

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# File Upload
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR=./public/uploads/audio

# External APIs (if applicable)
EXTERNAL_API_KEY=your-api-key
EXTERNAL_API_URL=https://api.external-service.com
```

---

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- SQLite3 (optional, for local development)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/reels-ui.git
cd reels-ui

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Initialize database
npm run db:init

# Start development server
npm run dev
```

### Available Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:init": "node scripts/init-db.js",
    "db:migrate": "node scripts/migrate-db.js",
    "test": "jest",
    "docker:build": "docker build -t reels-ui .",
    "docker:run": "docker run -p 3000:3000 reels-ui"
  }
}
```

### Database Initialization

```javascript
// scripts/init-db.js
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database('./data/reelcraft.db');

// Read and execute schema
const schema = fs.readFileSync('./schema.sql', 'utf8');
db.exec(schema);

// Seed initial data
const seedData = require('./seed-data.json');
const insertCategory = db.prepare('INSERT INTO reel_categories (id, name, title, description, icon) VALUES (?, ?, ?, ?, ?)');

seedData.categories.forEach(category => {
  insertCategory.run(category.id, category.name, category.title, category.description, category.icon);
});

console.log('Database initialized successfully');
```

---

## Error Handling

### API Error Responses

**Standard Error Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

**Common Error Codes:**
- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - Invalid or missing credentials
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND_ERROR` - Resource not found
- `RATE_LIMIT_ERROR` - Too many requests
- `INTERNAL_ERROR` - Server error

### Error Handling Middleware

```javascript
// middleware/error-handler.js
export default function errorHandler(err, req, res, next) {
  console.error(err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: err.errors
      }
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Invalid token'
      }
    });
  }

  // Default error
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }
  });
}
```

---

## Performance Optimization

### Database Optimization

**Connection Pooling:**
```javascript
// lib/database.js
const Database = require('better-sqlite3');

class DatabaseConnection {
  constructor() {
    this.db = new Database('./data/reelcraft.db', {
      verbose: console.log,
      fileMustExist: false
    });

    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = 1000000');
    this.db.pragma('temp_store = memory');
  }

  // Prepared statements for better performance
  getUserById = this.db.prepare('SELECT * FROM users WHERE id = ?');
  getJobsByUser = this.db.prepare('SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?');
}
```

### Caching Strategy

**API Response Caching:**
```javascript
// lib/cache.js
const NodeCache = require('node-cache');

const cache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 60 // Check for expired keys every 60 seconds
});

function getCachedData(key, fetchFunction) {
  const cached = cache.get(key);
  if (cached) {
    return Promise.resolve(cached);
  }

  return fetchFunction().then(data => {
    cache.set(key, data);
    return data;
  });
}

module.exports = { cache, getCachedData };
```

### File Serving Optimization

**Static File Compression:**
```javascript
// next.config.js
module.exports = {
  compress: true,
  images: {
    formats: ['image/webp', 'image/avif']
  },
  experimental: {
    optimizeCss: true
  }
}
```

---

## Security Considerations

### Input Validation

**Request Validation:**
```javascript
// lib/validation.js
const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

const reelGenerationSchema = Joi.object({
  generateCaption: Joi.boolean(),
  customCaption: Joi.string().max(500).when('generateCaption', {
    is: false,
    then: Joi.required()
  }),
  customAuthor: Joi.string().max(100),
  useCustomAudio: Joi.boolean(),
  customAudioUrl: Joi.string().uri().when('useCustomAudio', {
    is: true,
    then: Joi.required()
  })
});

function validateRequest(schema, data) {
  const { error, value } = schema.validate(data);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }
  return value;
}
```

### Rate Limiting

**API Rate Limiting:**
```javascript
// middleware/rate-limit.js
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many requests, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * * 1000,
  max: 5, // Limit login attempts
  message: {
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many login attempts, please try again later'
    }
  }
});
```

### Security Headers

**Helmet Configuration:**
```javascript
// middleware/security.js
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.external-service.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

## Monitoring and Logging

### Application Logging

**Winston Logger Configuration:**
```javascript
// lib/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'reels-ui' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### Error Tracking

**Global Error Handler:**
```javascript
// lib/error-tracking.js
const logger = require('./logger');

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
```

### Performance Monitoring

**Response Time Middleware:**
```javascript
// middleware/response-time.js
const responseTime = require('response-time');

app.use(responseTime((req, res, time) => {
  if (time > 1000) { // Log slow requests
    logger.warn(`Slow request: ${req.method} ${req.url} took ${time}ms`);
  }
}));
```

---

## Testing Strategy

### Unit Tests

**Component Testing:**
```javascript
// __tests__/components/LoginForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import LoginForm from '../../components/LoginForm';

describe('LoginForm', () => {
  it('renders login form', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    const mockLogin = jest.fn();
    render(<LoginForm onLogin={mockLogin} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });
});
```

### API Testing

**Endpoint Testing:**
```javascript
// __tests__/api/auth.test.js
const { createMocks } = require('node-mocks-http');
const handler = require('../../pages/api/auth/login');

describe('/api/auth/login', () => {
  it('returns 200 for valid credentials', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('token');
    expect(data).toHaveProperty('user');
  });

  it('returns 401 for invalid credentials', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
  });
});
```

### Integration Tests

**Database Integration:**
```javascript
// __tests__/integration/database.test.js
const Database = require('better-sqlite3');
const { initDatabase, seedDatabase } = require('../../lib/database');

describe('Database Integration', () => {
  let db;

  beforeEach(() => {
    db = new Database(':memory:');
    initDatabase(db);
    seedDatabase(db);
  });

  afterEach(() => {
    db.close();
  });

  it('creates user successfully', () => {
    const createUser = db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)');

    const result = createUser.run('user1', 'test@example.com', 'hashedpassword', 'Test User');

    expect(result.changes).toBe(1);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get('user1');
    expect(user.email).toBe('test@example.com');
  });
});
```

---

## Deployment Checklist

### Pre-deployment
- [ ] Environment variables configured
- [ ] Database schema created and seeded
- [ ] SSL certificates obtained (for production)
- [ ] Domain configured
- [ ] CDN setup (optional)
- [ ] Monitoring tools configured

### Deployment Steps
1. **Build Application:**
   ```bash
   npm run build
   ```

2. **Run Tests:**
   ```bash
   npm test
   ```

3. **Create Docker Image:**
   ```bash
   docker build -t reels-ui:latest .
   ```

4. **Deploy to Server:**
   ```bash
   docker-compose up -d
   ```

5. **Run Database Migrations:**
   ```bash
   docker-compose exec reels-ui npm run db:migrate
   ```

6. **Verify Deployment:**
   - Check application logs
   - Test key functionality
   - Verify database connections
   - Test file uploads

### Post-deployment
- [ ] SSL certificate renewal configured
- [ ] Backup strategy implemented
- [ ] Monitoring alerts set up
- [ ] Performance benchmarks established
- [ ] Documentation updated

---

## Troubleshooting Guide

### Common Issues

#### Database Connection Issues
**Symptoms:** Application fails to start, database errors in logs
**Solutions:**
1. Check database file permissions
2. Verify database path in environment variables
3. Ensure SQLite is installed
4. Check database file integrity

#### File Upload Failures
**Symptoms:** Upload requests fail, file not saved
**Solutions:**
1. Check upload directory permissions
2. Verify file size limits
3. Check available disk space
4. Validate file type restrictions

#### Authentication Problems
**Symptoms:** Login fails, invalid token errors
**Solutions:**
1. Verify JWT secret consistency
2. Check token expiration settings
3. Validate password hashing
4. Check database user records

#### Performance Issues
**Symptoms:** Slow response times, high memory usage
**Solutions:**
1. Enable database query logging
2. Check for memory leaks
3. Optimize database queries
4. Implement caching where appropriate

### Debug Commands

```bash
# Check application logs
docker-compose logs -f reels-ui

# Check database integrity
sqlite3 data/reelcraft.db ".integrity_check"

# Test API endpoints
curl -X GET "http://localhost:3000/api/health" -H "Authorization: Bearer <token>"

# Monitor system resources
docker stats

# Check file permissions
ls -la public/uploads/audio/
```

---

## Contributing Guidelines

### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for code formatting
- Write descriptive commit messages

### Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Ensure all tests pass
5. Update documentation if needed
6. Submit pull request

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Testing
- `chore`: Maintenance

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

For technical support or questions:
- **Issues**: [GitHub Issues](https://github.com/yourusername/reels-ui/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/reels-ui/discussions)
- **Email**: technical-support@example.com

---

*This technical documentation is maintained alongside the codebase. Please update it when making significant changes to the system architecture or APIs.*