# Online Examination System

## Overview

ExamSecure is a comprehensive online examination platform designed for educational institutions and organizations to conduct secure, monitored examinations. The system features dual-role authentication (Administrator and Student), comprehensive exam management capabilities, and advanced security measures including fullscreen monitoring and anti-cheating mechanisms.

The platform enables administrators to create, manage, and monitor examinations while providing students with a secure environment to take tests. Built with vanilla JavaScript and a Node.js HTTP server, the system emphasizes simplicity and security.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack**: Vanilla HTML5, CSS3, and JavaScript (ES6+)
- **Architecture Pattern**: Class-based modular design with service-oriented components
- **UI Framework**: Custom CSS with animation support, no external frameworks
- **Responsive Design**: Mobile-first approach with flexible layouts

### Core Service Classes
- **AuthService**: Handles user authentication and session management
- **AdminService**: Manages examination creation, student management, and results
- **StudentService**: Handles exam participation, attempt tracking, and history
- **ExamTimer**: Provides countdown functionality with warning systems
- **FullscreenService**: Enforces exam security through fullscreen monitoring
- **Utils**: Shared utility functions for modals, animations, and data handling

### Authentication System
- **Dual-role authentication**: Separate login flows for administrators and students
- **Password hashing**: Client-side password hashing for basic security
- **Session management**: localStorage-based session persistence
- **Default credentials**: System administrator account (admin@examsecure.com/admin123)

### Data Storage Strategy
- **Client-side storage**: localStorage for user data, exams, and results
- **No database dependency**: Self-contained system for easy deployment
- **Data persistence**: JSON-based data structures stored locally
- **Session tracking**: Login time and user state management

### Security Features
- **Fullscreen enforcement**: Mandatory fullscreen mode during examinations
- **Anti-cheating monitoring**: Detection of tab switching, window focus changes
- **Keyboard shortcuts blocking**: Prevention of common cheating shortcuts
- **Violation tracking**: Warning system with automatic submission on violations
- **Timer-based submissions**: Automatic exam submission when time expires

### Backend Architecture
- **Server**: Node.js HTTP server with static file serving
- **CORS enabled**: Cross-origin resource sharing for API flexibility
- **MIME type handling**: Proper content type serving for static assets
- **Cache control**: Headers to prevent caching of dynamic content

## External Dependencies

### Runtime Dependencies
- **Node.js**: Server runtime environment
- **Built-in Node.js modules**: http, fs, path, url for server functionality

### Browser APIs
- **Fullscreen API**: For exam security enforcement
- **Page Visibility API**: For tab switching detection
- **LocalStorage API**: For client-side data persistence
- **Crypto API**: For password hashing (Web Crypto API)

### Third-party Services
- Currently no external API integrations
- No database server requirements
- No authentication providers
- Self-contained deployment model

### Development Dependencies
- Standard web development tools (HTML5, CSS3, ES6+ JavaScript)
- No build process or bundlers required
- No package managers or dependency management systems