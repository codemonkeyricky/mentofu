# @src/client/ - Client Module Documentation

This directory contains the client-side code for the Mentofu educational platform, including the main application interface, 3D forest background, and interactive quiz modules.

## Overview

The client module provides the frontend experience for the educational platform, featuring:
- Interactive 3D forest background with dynamic grass and fireflies
- Authentication system (login/register)
- Quiz interface with multiple math and spelling quiz types
- Progress tracking and results display
- Responsive design with modern UI components

## File Structure

```
@src/client/
├── index.html          # Main HTML structure with all screens
├── forest.ts           # 3D forest background with grass and fireflies
├── GrassMaterial.ts    # Custom shader material for grass rendering
├── FireflySystem.ts    # System for managing animated fireflies
├── style.css           # Global CSS styles
├── public/             # Public assets directory
│   ├── css/
│   ├── js/             # JavaScript modules
│   └── images/
└── vite-env.d.ts       # TypeScript definitions
```

## Core Components

### 1. 3D Forest Background (`forest.ts`)
The main 3D scene implementation using Three.js that creates an immersive forest environment with:
- Interactive grass with wind animation
- Dynamic fireflies with pulsing and floating effects
- Realistic lighting and shadows
- Orbit controls for camera movement
- Configurable visual parameters through GUI

### 2. Grass Material (`GrassMaterial.ts`)
Custom shader material for the grass with features:
- Wind animation using noise textures
- Dynamic coloring with base and tip colors
- Shadow calculations
- Fog effects
- Performance optimized with instanced rendering

### 3. Firefly System (`FireflySystem.ts`)
System for managing animated fireflies with:
- Particle-based rendering
- Floating and pulsing animations
- Color variation
- Configurable brightness and size
- Additive blending for glowing effect

### 4. Quiz Modules (`public/js/modules/`)
Multiple quiz implementations that extend from a base class:
- `math-quiz.js` - Multiplication quiz
- `division-quiz.js` - Division quiz
- `fraction-quiz.js` - Fraction comparison quiz
- `bodmas-quiz.js` - Order of operations quiz
- `factors-quiz.js` - Factors quiz
- `spelling-quiz.js` - Spelling quiz
- `quiz-base.js` - Base class with shared functionality

## Authentication Flow

The application implements a complete authentication flow:
1. Auth Screen - Welcome and feature overview
2. Login Screen - Credentials entry
3. Register Screen - New user registration

Authentication is handled through JWT tokens stored in localStorage and sent with API requests.

## Quiz System Architecture

### Quiz Flow
1. **Start Quiz**: Fetches new session from backend API
2. **Render Questions**: Displays quiz questions with validation
3. **Submit Answers**: Sends answers to backend for evaluation
4. **Display Results**: Shows score and performance details

### Key Features
- Real-time progress tracking
- Input validation and error handling
- Responsive UI with animations
- Professional feedback and notifications
- Session management with backend

## API Integration

The client communicates with the server through REST API endpoints:
- `/session/simple-math` - Math quiz sessions
- `/session/simple-math-2` - Division quiz sessions
- `/session/simple-math-3` - Fraction quiz sessions
- `/session/simple-math-4` - BODMAS quiz sessions
- `/session/simple-math-5` - Factors quiz sessions
- `/session/simple-words` - Spelling quiz sessions
- `/auth/login` - User authentication
- `/auth/register` - User registration
- `/credit/claim` - Credit claiming

## Styling and UI Components

The application uses:
- Custom CSS for responsive design
- Bootstrap 5 for UI components
- Font Awesome for icons
- Google Fonts for typography
- Animation libraries for smooth transitions

## Security Considerations

- Authentication tokens are stored in localStorage (client-side)
- API requests include JWT tokens in Authorization headers
- Input validation occurs on both client and server
- All communication should be over HTTPS in production

## Development Notes

### Running the Application
```bash
npm run dev
```

### Build Process
```bash
npm run build
```

### Testing
Unit tests are available for various modules and can be run with:
```bash
npm test
```

## Dependencies

This module depends on several third-party libraries:
- Three.js for 3D rendering
- stats-gl for performance monitoring
- dat.gui for debugging controls
- Chart.js for data visualization
- Bootstrap 5 for UI components
- Font Awesome for icons