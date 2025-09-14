# ReelCraft - End User Documentation

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [User Authentication](#user-authentication)
4. [Dashboard Overview](#dashboard-overview)
5. [Creating Reels](#creating-reels)
6. [Managing Generated Content](#managing-generated-content)
7. [Account Management](#account-management)
8. [Admin Features](#admin-features)
9. [Troubleshooting](#troubleshooting)
10. [API Reference](#api-reference)

---

## Overview

ReelCraft is an intelligent social media content creation platform that helps you generate engaging Instagram Reels automatically. The platform offers various content categories like viral motivational content, wisdom-based proverbs, anime-style content, and ASMR reels.

### Key Features
- **Automated Reel Generation**: Create engaging video content with AI assistance
- **Multiple Content Categories**: Viral, Proverbs, Anime, ASMR, and more
- **Account Display**: View and switch between Instagram account interfaces
- **Real-time Status Tracking**: Monitor generation progress with live updates
- **Custom Audio Support**: Upload and use your own background music (MP3 format)
- **Caption Customization**: Generate or create custom captions with author attribution
- **Direct Posting**: Post completed reels to external services

---

## Getting Started

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Stable internet connection
- JavaScript enabled

### Accessing ReelCraft
1. Navigate to the ReelCraft application URL
2. Create an account or log in with existing credentials
3. Complete account verification if required

---

## User Authentication

### Creating an Account

1. **Registration Process**:
   - Click "Sign up for free" on the login page
   - Enter your first name, last name, email, and password
   - Confirm your password
   - Submit the form to create your account

2. **Account Plans**:
   - **Free Plan**: Basic reel generation with limited features
   - **Pro Plan**: Enhanced features and higher generation limits
   - **Enterprise Plan**: Full access with unlimited generation

### Logging In

1. Enter your registered email address
2. Enter your password
3. Optional: Check "Remember me" for convenience
4. Click "Sign In"

### Password Recovery
- Click "Forgot password?" on the login page
- Enter your email address
- Follow the instructions sent to your email

---

## Dashboard Overview

The main dashboard is organized into several sections:

### Navigation Tabs
- **Generate**: Main content creation interface
- **Generated**: View and manage completed reels
- **History**: Track all your content creation history
- **Schedule**: View posting schedule interface (displays static content)

### Account Information
- **User Profile**: Your name and account details  
- **Plan Information**: Current subscription tier (Free/Pro/Enterprise)
- **Account Switcher**: Display interface for Instagram account selection

---

## Creating Reels

### Step 1: Select Content Category

Choose from available categories:

#### 🔥 Viral Reels
High-engagement motivational content designed for maximum reach:
- **Gym Motivation**: Fitness and workout inspiration
- **Success Stories**: Achievement and motivation content
- **Life Lessons**: Inspirational life advice
- **Trending Topics**: Current viral themes

#### 🧠 Proverbs Viral Reels
Wisdom-based content with deep meaning:
- **Ancient Wisdom**: Traditional proverbs and sayings
- **Philosophical Quotes**: Thought-provoking content
- **Life Philosophy**: Deep reflections on existence

#### 🎨 Anime Style Reels
Anime-inspired creative content:
- **Character Quotes**: Famous anime character sayings
- **Anime Facts**: Interesting anime trivia
- **Art Tutorials**: Anime drawing tips

#### 🎵 ASMR Reels
Relaxing and satisfying content:
- **Cooking ASMR**: Satisfying food preparation
- **Nature Sounds**: Calming environmental audio
- **Crafting**: Satisfying creation processes

### Step 2: Configure Generation Options

#### Caption Settings
- **Auto-Generate Caption**: Let AI create engaging captions
- **Custom Caption**: Write your own caption text
- **Author Attribution**: Add custom author credits

#### Audio Options
- **Default Audio**: Use category-appropriate background music
- **Custom Audio**: Upload your own audio file (MP3 format)
- **Audio Toggle**: Enable/disable background audio

#### Advanced Options
- **Content Style**: Choose specific visual styles
- **Duration**: Select reel length (15s, 30s, 60s)
- **Hashtags**: Auto-generate or customize hashtags

### Step 3: Generate Content

1. Click "Generate Reel" button
2. Monitor progress in real-time
3. Wait for generation completion
4. Review the generated content

---

## Managing Generated Content

### Content Status Types

#### 🔄 Processing States
- **Pending**: Queued for generation
- **Processing**: Currently being generated
- **Completed**: Successfully generated and ready

#### ✅ Success States
- **Approved**: Reviewed and approved for posting
- **Posted**: Successfully published to Instagram

#### ❌ Error States
- **Failed**: Generation encountered errors (shows retry option)
- **Rejected**: Content failed quality checks

### Content Actions

#### For Completed Reels:
- **Preview**: View the generated video content in fullscreen mode
- **Post**: Send to external posting services (when configured)
- **Refresh Status**: Check for updates on generation progress
- **View Caption**: See generated captions and descriptions

#### For Failed Reels:
- **Retry Generation**: Use refresh button to check status again
- **View Error Details**: See error messages in the job status card

### Content Management
- **Clear History**: Remove old generation jobs by category or all at once
- **Auto-Polling**: Automatic status updates for in-progress generations
- **Status Tracking**: Real-time updates on generation progress

---

## Account Management

### Profile Settings
- **Personal Information**: Update name, email through account management
- **Password Management**: Change or reset password via login page
- **Account Display**: View current user information and plan

### Instagram Account Display

#### Account Information
- The system displays mock Instagram account data including:
  - Account usernames (e.g., @motivation_hub, @wisdom_daily)
  - Follower counts (e.g., 125K, 89K, 203K)
  - Active account indicator
- **Account Switcher**: Interface component for account selection

### Subscription Information
- **Current Plan**: View your subscription tier (Free/Pro/Enterprise)
- **Plan Limits**: Monitor generation usage within your plan

---

## Admin Features

*Note: These features are only available to users with admin privileges.*

### Content Category Management

#### Creating Categories
1. Navigate to Admin panel
2. Click "Add Category"
3. Fill in category details:
   - Name (internal identifier)
   - Title (display name)
   - Description
   - Icon selection
   - Active status

#### Managing Reel Types
1. Select a category
2. Click "Add Reel Type"
3. Configure type settings:
   - Name and title
   - Description and messaging
   - External API endpoints
   - Status and posting URLs

### System Settings
- **Global Polling**: Admin can enable/disable automatic status checking system-wide
- **Content Management**: Create and manage reel categories and types
- **API Configuration**: Configure external service endpoints for generation and posting

---

## Troubleshooting

### Common Issues

#### Generation Failures
**Problem**: Reel generation fails repeatedly
**Solutions**:
1. Check internet connection stability
2. Verify audio file format (MP3 recommended)
3. Ensure caption length is within limits
4. Try regenerating with different settings
5. Contact support if issues persist

#### Login Problems
**Problem**: Cannot access account
**Solutions**:
1. Verify email and password spelling
2. Clear browser cache and cookies
3. Try incognito/private browsing mode
4. Reset password if necessary
5. Check for account suspension emails

#### Slow Performance
**Problem**: Dashboard loads slowly
**Solutions**:
1. Check internet connection speed
2. Close unnecessary browser tabs
3. Clear browser cache
4. Disable browser extensions temporarily
5. Try a different browser

#### Content Not Appearing
**Problem**: Generated reels don't show up
**Solutions**:
1. Refresh the page manually
2. Check the "Generated" tab
3. Verify generation was completed
4. Check browser console for errors
5. Log out and log back in

### Error Messages

#### "Authentication Failed"
- **Cause**: Token expired or invalid
- **Solution**: Log out and log back in

#### "File Upload Failed"
- **Cause**: Unsupported file format or size
- **Solution**: Use MP3 files under size limits

#### "Generation Limit Reached"  
- **Cause**: May have exceeded usage limits
- **Solution**: Check plan limitations or try again later

#### "Network Error"
- **Cause**: Connection issues
- **Solution**: Check internet and retry

### Getting Help

#### Self-Service Options
1. **Documentation**: Read this user guide
2. **Console Logs**: Check browser developer tools for error details
3. **Status Indicators**: Monitor job status cards for progress updates

#### Support Options
- Contact system administrators for technical issues
- Report bugs through appropriate channels
- Check system status for service availability

---

## API Reference

*For developers and advanced users*

### Authentication Endpoints

#### Login
```
POST /api/auth/login
Body: { email: string, password: string }
Response: { token: string, user: UserObject }
```

#### Register
```
POST /api/auth/register
Body: { email: string, password: string, name: string }
Response: { token: string, user: UserObject }
```

#### Verify Token
```
POST /api/auth/verify
Headers: { Authorization: "Bearer <token>" }
Response: { valid: boolean, user: UserObject }
```

### Content Management Endpoints

#### Get Categories
```
GET /api/reels/categories?active=true
Headers: { Authorization: "Bearer <token>" }
Response: { categories: CategoryObject[] }
```

#### Get Reel Types
```
GET /api/reels/types?category=<id>&active=true
Headers: { Authorization: "Bearer <token>" }
Response: { types: ReelTypeObject[] }
```

#### Generate Reel
```
POST /api/reels/<type>
Headers: { Authorization: "Bearer <token>" }
Body: {
  generateCaption: boolean,
  customCaption?: string,
  customAuthor?: string,
  useCustomAudio?: boolean,
  customAudioUrl?: string
}
Response: { jobId: string, status: string }
```

### Job Management Endpoints

#### Check Job Status
```
GET /api/reels/status?jobId=<id>&type=<type>
Headers: { Authorization: "Bearer <token>" }
Response: { status: string, result?: object, error?: string }
```

#### Get User Jobs
```
GET /api/jobs
Headers: { Authorization: "Bearer <token>" }
Response: { jobs: JobObject[] }
```

#### Post to External Service
```
POST /api/reels/post
Headers: { Authorization: "Bearer <token>" }
Body: {
  jobId: string,
  category: string,
  type: string,
  videoUrl: string,
  caption?: string
}
Response: { success: boolean, message: string }
```

#### Clear Job History
```
DELETE /api/jobs?category=<optional>
Headers: { Authorization: "Bearer <token>" }
Response: { success: boolean, deletedCount: number }
```

### Data Models

#### User Object
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  avatar?: string;
  created_at: string;
}
```

#### Job Object
```typescript
interface Job {
  id: string;
  job_id: string;
  category: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'posted';
  result_url?: string;
  caption?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}
```

#### Category Object
```typescript
interface Category {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: string;
  is_active: boolean;
}
```

#### Reel Type Object
```typescript
interface ReelType {
  id: string;
  category_id: string;
  name: string;
  title: string;
  description: string;
  icon: string;
  message: string;
  caption: string;
  external_url?: string;
  status_url?: string;
  posting_url?: string;
  is_active: boolean;
}
```

---

## Best Practices

### Content Creation
1. **Quality Audio**: Use high-quality MP3 files for custom audio
2. **Clear Captions**: Write clear, engaging captions when using custom options
3. **Monitor Status**: Keep track of generation progress through status updates
4. **Error Handling**: Use refresh options when generation fails
5. **External Services**: Ensure external generation services are properly configured

### Account Management
1. **Security**: Use strong passwords and secure authentication
2. **Regular Monitoring**: Check job history and clean up old entries
3. **Status Awareness**: Understand different job status meanings
4. **Resource Planning**: Monitor your plan usage and limits

### Performance Optimization
1. **Status Polling**: Let automatic polling handle status updates
2. **History Management**: Clear old job history to improve performance
3. **Network Stability**: Use reliable internet for better generation results
4. **Error Recovery**: Use retry mechanisms when available

---

## Glossary

**Caption**: Text description accompanying a video reel
**Generation**: The process of creating video content automatically using external services
**Job**: A content creation task tracked by the system with various status states
**Polling**: Automatic checking of content generation status at regular intervals
**Reel**: Short-form video content created by the platform
**Status**: Current state of a content generation job (pending, processing, completed, failed, etc.)
**Token**: Authentication credential for API access
**Type**: Specific subcategory of content within a category (e.g., gym-motivation, anime-facts)

---

## Support Information

### System Details
- **Application Type**: Next.js web application
- **Database**: SQLite with job tracking and user management
- **Authentication**: JWT-based with session management
- **File Support**: MP3 audio uploads to `/public/uploads/audio/`

### Version Information
- **Current Version**: v0.1.0
- **Last Updated**: September 2025
- **Compatibility**: Modern browsers with JavaScript enabled
- **Architecture**: Server-side rendering with client-side interactivity

---

*This documentation reflects the actual implemented features of the ReelCraft system. Features are based on the current codebase and may be updated as the system evolves.*
