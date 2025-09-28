# 🎬 ReelCraft

**AI-Powered Instagram Reel Generator** - Create engaging video content automatically with custom audio support and intelligent caption generation.

[![Next.js](https://img.shields.io/badge/Next.js-14.0+-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3.0+-blue)](https://www.sqlite.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

### 🚀 **Core Features**

- **Automated Reel Generation**: AI-powered video content creation
- **Multiple Content Categories**: Motivation, Wisdom, Anime, ASMR, and more
- **Custom Audio Support**: Upload and use your own MP3 background music
- **Smart Caption Generation**: AI-generated captions with custom author credits
- **Real-time Status Tracking**: Live progress updates during generation
- **File Deduplication**: Automatic duplicate detection to save storage
- **Auto Cleanup**: Intelligent file management with access-based cleanup

### 🎯 **Content Categories**

- 🔥 **Motivational Content**: Gym motivation, success stories, life lessons
- 🧠 **Wisdom & Proverbs**: Ancient wisdom, philosophical quotes
- 🎨 **Anime Style**: Character quotes, anime facts, art tutorials
- 🎵 **ASMR Content**: Cooking sounds, nature audio, crafting videos

### 🔧 **Technical Features**

- **Modern Tech Stack**: Next.js 14, TypeScript, Tailwind CSS
- **Secure Authentication**: JWT-based user management
- **File Upload System**: MP3 support with automatic cleanup
- **Admin Panel**: Content management and user administration
- **Docker Ready**: Easy deployment with containerization
- **API-First Design**: RESTful API for integrations

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Configuration](#-configuration)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Quick Start

Get ReelCraft up and running in minutes!

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/hassaanshafqatt/reels-ui.git
cd reels-ui

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Initialize the database
npm run db:init

# Start the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## 📦 Installation

### Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/hassaanshafqatt/reels-ui.git
   cd reels-ui
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration:

   ```env
   # Database
   DATABASE_PATH=./data/reelcraft.db

   # Authentication
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=24h

   # File Upload
   MAX_FILE_SIZE=10485760
   UPLOAD_DIR=./public/uploads/audio

   # External APIs (if applicable)
   EXTERNAL_API_KEY=your-api-key
   EXTERNAL_API_URL=https://api.external-service.com
   ```

4. **Database Setup**

   ```bash
   npm run db:init
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

### Production Setup

#### Using Docker (Recommended)

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

#### Manual Production Setup

```bash
# Install production dependencies
npm ci --only=production

# Build the application
npm run build

# Start the production server
npm start
```

## 🎯 Usage

### For End Users

1. **Sign Up**: Create your account with email and password
2. **Choose Content**: Select from available categories (Motivation, Wisdom, Anime, ASMR)
3. **Customize**: Add custom captions, upload audio, or let AI generate content
4. **Generate**: Click "Generate Reel" and watch the progress
5. **Download/Share**: Your reel is ready to post on Instagram!

### For Developers

#### Basic API Usage

```javascript
// Generate a reel
const response = await fetch('/api/reels/gym-motivation', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_JWT_TOKEN',
  },
  body: JSON.stringify({
    generateCaption: true,
    customAuthor: 'Your Name',
  }),
});

const result = await response.json();
console.log('Job ID:', result.jobId);
```

#### Upload Custom Audio

```javascript
const formData = new FormData();
formData.append('audio', audioFile);

const response = await fetch('/api/upload/audio', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer YOUR_JWT_TOKEN',
  },
  body: formData,
});

const result = await response.json();
console.log('Audio URL:', result.file.url);
```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify` - Token verification
- `POST /api/auth/logout` - User logout

### Content Management

- `GET /api/reels/categories` - Get available categories
- `GET /api/reels/types` - Get reel types for a category
- `POST /api/reels/[type]` - Generate a new reel
- `GET /api/reels/status` - Check generation status

### Job Management

- `GET /api/jobs` - Get user's job history
- `DELETE /api/jobs` - Clear job history

### File Management

- `POST /api/upload/audio` - Upload audio file
- `GET /api/uploads/audio/[filename]` - Serve audio file
- `GET /api/uploads/audio/stats` - Get storage statistics
- `POST /api/uploads/audio/cleanup` - Clean up old files

### Admin Endpoints

- `GET /api/admin/users` - User management
- `POST /api/admin/categories` - Create categories
- `POST /api/admin/types` - Create reel types

📖 **Complete API Documentation**: See [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) for detailed API reference.

## ⚙️ Configuration

### Environment Variables

| Variable         | Description                      | Default                  | Required |
| ---------------- | -------------------------------- | ------------------------ | -------- |
| `DATABASE_PATH`  | SQLite database file path        | `./data/reelcraft.db`    | Yes      |
| `JWT_SECRET`     | JWT signing secret               | -                        | Yes      |
| `JWT_EXPIRES_IN` | JWT expiration time              | `24h`                    | No       |
| `MAX_FILE_SIZE`  | Maximum upload file size (bytes) | `10485760`               | No       |
| `UPLOAD_DIR`     | Audio upload directory           | `./public/uploads/audio` | No       |
| `NODE_ENV`       | Environment mode                 | `development`            | No       |
| `PORT`           | Server port                      | `3000`                   | No       |

### Database Configuration

The application uses SQLite with the following optimizations:

- WAL mode for better concurrency
- Prepared statements for performance
- Automatic cleanup of old files
- File deduplication using SHA-256 hashing

## 🐳 Deployment

### Docker Deployment

```yaml
# docker-compose.yml
version: '3.8'

services:
  reels-ui:
    build: .
    ports:
      - '3000:3000'
    volumes:
      - ./data:/app/data
      - reels_uploads:/app/public/uploads
    environment:
      - NODE_ENV=production
      - JWT_SECRET=your-secret-key
    restart: unless-stopped

volumes:
  reels_uploads:
```

## CI/CD

This repository includes GitHub Actions workflows under `.github/workflows/`:

- `ci.yml` — runs on every push and pull request. It installs dependencies, lints, runs tests (if present), builds the Next.js app and uploads the build artifact.
- `docker-deploy.yml` — builds a multi-platform Docker image using Buildx, caches layers in GitHub Actions cache, pushes the image to GitHub Container Registry (GHCR) and optionally deploys to a remote host via SSH.

Required GitHub secrets for publishing/deploying (add under repository Settings → Secrets):

- `GITHUB_TOKEN` — automatically provided by Actions; used for GHCR login.
- `SSH_PRIVATE_KEY` — (optional) private key for SSH deploy.
- `SSH_HOST` and `SSH_USER` — (optional) remote host and username for SSH deploy.

Customize `docker-deploy.yml` if you prefer Docker Hub or another registry; replace the login step and `IMAGE_NAME` accordingly.

```

### Production Checklist

- [ ] Environment variables configured
- [ ] SSL certificates obtained
- [ ] Database backups scheduled
- [ ] File storage configured
- [ ] Monitoring tools set up
- [ ] CDN configured (optional)

## 🏗️ Project Structure

```

reels-ui/
├── src/
│ ├── app/ # Next.js App Router
│ │ ├── api/ # API Routes
│ │ │ ├── auth/ # Authentication
│ │ │ ├── jobs/ # Job management
│ │ │ ├── reels/ # Content generation
│ │ │ └── upload/ # File uploads
│ │ ├── admin/ # Admin dashboard
│ │ └── [user pages] # User-facing pages
│ ├── components/ # Reusable React components
│ ├── contexts/ # React Context providers
│ ├── hooks/ # Custom React hooks
│ └── lib/ # Utility functions
├── public/ # Static assets
├── data/ # SQLite database
├── uploads/ # User-uploaded files
├── docker-compose.yml # Docker orchestration
├── Dockerfile # Container definition
└── package.json # Dependencies

````

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint
````

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Add tests for new features**
5. **Ensure all tests pass**
   ```bash
   npm test
   ```
6. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
7. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
8. **Open a Pull Request**

### Development Guidelines

- Use TypeScript for all new code
- Follow ESLint configuration
- Write descriptive commit messages
- Add tests for new features
- Update documentation as needed

## 📖 Documentation

- **[User Guide](USER_DOCUMENTATION.md)** - End-user documentation
- **[Technical Documentation](TECHNICAL_DOCUMENTATION.md)** - Developer documentation
- **[Docker Guide](DOCKER.md)** - Docker deployment guide
- **[API Reference](TECHNICAL_DOCUMENTATION.md#api-documentation)** - Complete API documentation

## 🔒 Security

- JWT-based authentication with secure tokens
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- Secure file upload handling
- HTTPS enforcement in production

## 📊 Performance

- **Database Optimization**: WAL mode, prepared statements, indexes
- **File Management**: Automatic cleanup, deduplication, compression
- **Caching**: API response caching, static asset optimization
- **Monitoring**: Response time tracking, error logging

## 🐛 Troubleshooting

### Common Issues

**Database Connection Issues**

```bash
# Check database file
ls -la data/reelcraft.db

# Verify permissions
chmod 644 data/reelcraft.db
```

**File Upload Problems**

```bash
# Check upload directory
ls -la public/uploads/audio/

# Verify permissions
chmod 755 public/uploads/audio/
```

**Authentication Issues**

```bash
# Check JWT secret
echo $JWT_SECRET

# Verify token format
curl -H "Authorization: Bearer YOUR_TOKEN" /api/auth/verify
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting and deployment
- All contributors and users

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/hassaanshafqatt/reels-ui/issues)
- **Discussions**: [GitHub Discussions](https://github.com/hassaanshafqatt/reels-ui/discussions)
- **Documentation**: [User Guide](USER_DOCUMENTATION.md) | [Technical Docs](TECHNICAL_DOCUMENTATION.md)

---

<div align="center">

**Made with ❤️ for content creators**

[⭐ Star us on GitHub](https://github.com/hassaanshafqatt/reels-ui) • [🐛 Report Issues](https://github.com/hassaanshafqatt/reels-ui/issues) • [💬 Join Discussions](https://github.com/hassaanshafqatt/reels-ui/discussions)

</div>
