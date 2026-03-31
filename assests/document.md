# DEFFENSO ACADEMY - WEBSITE DOCUMENTATION

**Document Version:** 1.0  
**Last Updated:** 2025-01-01  
**Project:** DEFFENSO Hackers Academy Website & LMS Platform

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Website Structure](#2-website-structure)
3. [LMS Integration & Architecture](#3-lms-integration--architecture)
4. [Backend Structure (Firebase)](#4-backend-structure-firebase)
5. [Admin Panel](#5-admin-panel)
6. [Student LMS Portal](#6-student-lms-portal)
7. [Authentication System](#7-authentication-system)
8. [Security Features](#8-security-features)
9. [Database Schema](#9-database-schema)
10. [File Structure](#10-file-structure)
11. [Key Features](#11-key-features)
12. [Design System](#12-design-system)

---

## 1. PROJECT OVERVIEW

**DEFFENSO Academy** is a comprehensive cybersecurity training platform that combines:

- **Public-facing website** for marketing, events, and brand presence
- **Learning Management System (LMS)** for course delivery and student progress tracking
- **Admin Panel** for course and student management
- **Events registration system** with EmailJS integration

**Primary Purpose:** To provide structured cybersecurity education through courses, workshops, CTF competitions, and recorded training sessions with progress tracking and quiz-based assessment.

**Technology Stack:**
- **Frontend:** Pure HTML5, CSS3, JavaScript (Vanilla)
- **Backend/Database:** Firebase (Firestore, Authentication)
- **Hosting:** Firebase Hosting (configured via firebase.json)
- **Email Service:** EmailJS for event registrations
- **Styling:** Custom CSS with cyberpunk/hacker aesthetic theme

---

## 2. WEBSITE STRUCTURE

### Public Pages

| File | Purpose | Key Features |
|------|---------|--------------|
| `index.html` | Main landing page | SEO-optimized, hero sections, programs overview, footer with location |
| `event.html` | Events & Competitions | Event listing, filtering (live/upcoming/completed), registration modal, EmailJS integration |
| `privacy.html` | Privacy Policy | Legal document with data protection statements |
| `term&con.html` | Terms & Conditions | Member agreement, code of conduct, ethical guidelines |

### LMS Portal (`lms/` directory)

| File | Purpose |
|------|---------|
| `login.html` | Secure login portal with Firebase Auth |
| `dashboard.html` | Student dashboard with course listing and progress |
| `admin.html` | Admin control panel for managing courses/students |
| `firebase-config.js` | Firebase initialization and configuration |
| `data-manager.js` | Abstraction layer for Firebase/Local storage operations |

---

## 3. LMS INTEGRATION & ARCHITECTURE

### Dual-Mode Data Manager

The `data-manager.js` implements a **hybrid architecture** supporting both:
1. **Local Mode** (Legacy): Uses `localStorage` and `sessionStorage` for development/testing
2. **Firebase Mode** (Production): Uses Firestore and Firebase Auth for real deployment

**Auto-detection logic:**
```javascript
isFirestore() {
  return typeof window.db !== 'undefined' && window.auth && window.auth.currentUser;
}
```

### Core Data Operations

The `DataManager` object provides:

#### User Management
- `getProfile()` - Fetch user profile data
- `login(email, password)` - Authenticate via Firebase Auth, create profile if new
- `logout()` - Sign out and clear session

#### Course Management
- `getCourses()` - Retrieve all courses from Firestore
- `saveCourse(course)` - Create or update course (with timestamps)
- `deleteCourse(courseId)` - Remove course

#### Progress Tracking
- `getProgress()` - Get user's video watch progress and quiz results
- `saveProgress(videoId, data)` - Save completion status and quiz scores
- `getAllStudentProgress()` - Admin-only: retrieve all student progress

---

## 4. BACKEND STRUCTURE (FIREBASE)

### Firebase Configuration

**Project ID:** `deffenso-academy-lms-v1`  
**Auth Domain:** `deffenso-academy-lms-v1.firebaseapp.com`  
**Storage Bucket:** `deffenso-academy-lms-v1.firebasestorage.app`

**Services Used:**
- **Authentication** - Email/Password provider
- **Firestore** - NoSQL document database
- **Hosting** - Static web hosting with SPA routing

### Firestore Structure

```
users/{userId}
  ├─ email: string
  ├─ name: string
  ├─ role: "admin" | "student"
  ├─ createdAt: timestamp

courses/{courseId}
  ├─ title: string
  ├─ description: string
  ├─ videos: array<videoObject>
  │   └─ { id, title, youtubeUrl, passScore, quiz: [] }
  ├─ createdAt: timestamp
  ├─ updated_at: timestamp

progress/{userId}
  ├─ {videoId}: {
  │   ├─ watched: boolean
  │   ├─ quizPassed: boolean
  │   ├─ score: number
  │   └─ updated_at: timestamp
  ├─ (for each video the user has progress on)
```

### Security Rules (from Guide.md)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Courses: Everyone can read, only Admin can write
    match /courses/{courseId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Progress: Users can only read/write their OWN progress
    match /progress/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Users: Self-registration not allowed (admin creates users)
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 5. ADMIN PANEL

**Location:** `lms/admin.html`

### Access Control
- Only users with `role: 'admin'` can access
- Role-based redirect in `admin.html`:
```javascript
const user = JSON.parse(sess || '{}');
if (user.role !== 'admin') { window.location.href = 'dashboard.html'; }
```

### Features

#### 1. Overview Dashboard
- Stats: Total courses, videos, quizzes, students
- Quick action buttons
- Recent courses list

#### 2. Course Management
- Create new courses (title, description)
- Add videos to courses (YouTube URL, pass score)
- Edit existing videos
- Delete courses/videos
- View course structure

#### 3. Quiz Editor
- 10-question format (all 10 slots available)
- Each question has:
  - Question text
  - 4 multiple-choice options (A, B, C, D)
  - Correct answer selector
- Auto-saves to Firestore

#### 4. Student Management
- View all enrolled students
- See student progress (passed quizzes / total)
- Remove students (Firestore user deletion)
- Note: Firebase Auth user creation must be done via Firebase Console

### Admin UI Theme
- **Color scheme:** Orange/amber accents (vs blue for students)
- Notification badge "ADMIN" in navbar
- Private shell/terminal aesthetic maintained

---

## 6. STUDENT LMS PORTAL

**Location:** `lms/dashboard.html`

### Access Flow
1. `login.html` → Firebase Auth → redirect to `dashboard.html`
2. Role check: `if (user.role === 'admin') redirect to admin.html`

### Main Features

#### 1. Course Enrollment & Display
- Courses assigned by admin appear automatically
- Course cards showing:
  - Title & description
  - Progress bar (completed videos / total)
  - Video list with status indicators

#### 2. Video Player & Progress
- YouTube embedded videos (iframe)
- Autoplay disabled for security
- Progress tracking on video completion
- Sequential unlock system:
  - Video 0 always unlocked
  - Subsequent videos require:
    - Previous video watched AND
    - Previous quiz passed (80% threshold)

#### 3. Quiz System
**Quiz Rules:**
- Each video can have associated quiz
- 10 multiple-choice questions (single correct answer)
- Pass threshold: 8/10 (80%)
- Instant feedback after completion
- Review incorrect answers shown
- Retry unlimited times until pass

**Quiz Flow:**
1. Start screen with warnings (only watch video first)
2. Question-by-question navigation
3. Results page with:
   - Score (e.g., "8/10")
   - Percentage ("80% ACCURACY")
   - Verdict based on performance
   - Incorrect answer review
   - Retry button
   - "Next Module" unlock on success

#### 4. Progress Tracking
- Course-level stats (X/Y videos complete)
- Session Archive for recorded classes (unlocked based on quiz completion)
- Visual indicators:
  - ✅ Green check = quiz passed
  - 🔵 Blue dot = video watched, quiz pending
  - 🔒 Locked = prerequisite not met

#### 5. Session Archive (Recorded Classes)
**Pre-built modules** (3 included):
1. Basic Commands (Ethical Hacking)
2. Scanning & Enumeration (Network Tools)
3. OSINT Foundations
4. APK Analysis (Reverse Engineering)

**Unlock chain:** Must pass quiz to unlock next module

---

## 7. AUTHENTICATION SYSTEM

### Firebase Auth Implementation

**Configuration:** In `lms/firebase-config.js`
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDBxy-YvtpUXKzpJPz5qQ2MFH_i1ba0kWw",
  authDomain: "deffenso-academy-lms-v1.firebaseapp.com",
  projectId: "deffenso-academy-lms-v1",
  storageBucket: "deffenso-academy-lms-v1.firebasestorage.app",
  messagingSenderId: "333169056174",
  appId: "1:333169056174:web:dc3cbe29e4db1f3419503f"
};
```

**Login Flow (`login.html`):**
1. User enters email/password
2. `DataManager.login()` called
3. Firebase Auth `signInWithEmailAndPassword()`
4. Fetch user profile from `users/{uid}` collection
5. If profile doesn't exist, create default student profile
6. Store session in `sessionStorage`:
```javascript
{
  id: user.uid,
  email: user.email,
  name: profile.name,
  role: profile.role || 'student'
}
```
7. Redirect based on role (admin → admin.html, student → dashboard.html)

**Logout:** Clears session storage and Firebase Auth

### User Role System

**Two roles defined:**
1. **admin** - Full access to admin panel, can manage courses/students
2. **student** - Access to dashboard and assigned courses only

**Role assignment:**
- Initially set when user profile created in Firestore
- Admin must manually edit user document to change role
- No self-service role elevation

---

## 8. SECURITY FEATURES

### Data Isolation
- **Per-user progress:** All progress stored under `progress/{userId}` where `userId` = Firebase UID
- **Firestore rules:** Users can only read/write their own progress document
- **Admin separation:** Admin panel has separate UI and role-based access

### Session Management
- Session stored in `sessionStorage` (cleared on browser close)
- Auth guard on each protected page
- Auto-redirect to login if no valid session

### Content Security
- YouTube embeds use `strict-origin-when-cross-origin` referrer policy
- No user-generated HTML rendering (prevents XSS)
-所有输入在显示前都进行了转义（通过innerText或文本内容）

### Monitoring & Privacy (from privacy.html)
- **No Expectation of Privacy:** Academy reserves right to monitor member activities
- **Activity tracking:** Login times, accessed resources, tool usage logged
- **Compliance:** Data shared with law enforcement if illegal activity suspected
- **Retention:** Activity records may be retained indefinitely for security incidents

---

## 9. DATABASE SCHEMA

### Collection: `users`

```javascript
{
  id: string (Firebase UID)
  email: string
  name: string
  role: "admin" | "student"
  createdAt: timestamp
}
```

**Sample:**
```javascript
{
  id: "abc123",
  email: "calvin@deffenso.in",
  name: "Calvin Shejin George",
  role: "admin",
  createdAt: Timestamp
}
```

### Collection: `courses`

```javascript
{
  id: string (auto-generated)
  title: string
  description: string
  videos: array<{
    id: string
    title: string
    youtubeUrl: string
    passScore: number (default 70)
    quiz: array<questionObject>
    createdAt: timestamp
  }>
  createdAt: timestamp
  updated_at: timestamp
}
```

**Sample:**
```javascript
{
  id: "course_001",
  title: "DEFFENSO JUNIOR ETHICAL HACKER (DJEH)",
  description: "Foundation course covering...",
  videos: [
    {
      id: "vid_001",
      title: "Module 01: Networking Basics",
      youtubeUrl: "https://www.youtube.com/watch?v=abc123",
      passScore: 8,
      quiz: [
        {
          question: "What is an IP address?",
          options: ["...", "...", "...", "..."],
          correct: 1  // 0-indexed
        }
      ],
      createdAt: Timestamp
    }
  ],
  createdAt: Timestamp,
  updated_at: Timestamp
}
```

### Collection: `progress`

```javascript
{
  {userId}: {  // Document ID = Firebase UID
    {videoId}: {
      watched: boolean
      quizPassed: boolean
      score: number
      updated_at: timestamp
    }
  }
}
```

**Sample:**
```javascript
{
  "abc123_course_001_vid_001": {
    watched: true,
    quizPassed: true,
    score: 9,
    updated_at: Timestamp
  }
}
```

---

## 10. FILE STRUCTURE

```
deffenso-website/
│
├── index.html                    # Main landing page
├── event.html                    # Events listing & registration
├── privacy.html                  # Privacy policy
├── term&con.html                 # Terms & conditions
├── robots.txt                    # SEO robots file
├── firebase.json                 # Firebase hosting config
├── readme.md                     # Project readme
│
├── assests/                      # Static assets
│   ├── logos/
│   │   ├── logo.png
│   │   └── text logo.png
│   ├── Gallary/                  # Gallery images
│   ├── event poster/             # Event poster images
│   ├── founders/                 # Founder photos
│   ├── tools/                    # Tool screenshots
│   └── Brochure/                 # Marketing materials
│
└── lms/                          # Learning Management System
    ├── login.html                # Authentication portal
    ├── dashboard.html            # Student dashboard
    ├── admin.html                # Admin panel
    ├── firebase-config.js        # Firebase initialization
    ├── data-manager.js           # Data abstraction layer
    ├── Guide.md                  # Production scaling guide
    └── credentails.md            # Sample user credentials

```

---

## 11. KEY FEATURES

### Public Website Features
- **SEO Optimization:** Meta tags, Open Graph, Twitter Cards
- **Responsive Design:** Mobile-first, works on all devices
- **Dark Cyberpunk Theme:** Custom design system with matrix-style aesthetics
- **Event Management:** Dynamic event cards, category filtering, EmailJS registration
- **Animated UI:** Glitch effects, scanlines, status indicators
- **Legal Compliance:** Privacy policy, terms & conditions pages

### LMS Portal Features
- **Secure Authentication:** Firebase Auth with role-based access
- **Course Management:** Structured lessons with video + quiz per module
- **Progress Tracking:** Per-user progress stored in Firebase
- **Sequential Unlocking:** Prerequisite-based lesson access
- **Quiz Engine:** 10-question format with pass/fail and review
- **Session Archive:** Pre-built recorded classes with unlock progression
- **Real-time Sync:** Changes visible across devices (Firebase)
- **Admin Dashboard:** Full CRUD for courses and student management

### Admin Features
- **Course Builder:** Create courses, add videos, set pass scores
- **Quiz Editor:** Full 10-question quiz builder with correct answer selection
- **Student Oversight:** View all student progress, delete accounts
- **Quick Actions:** One-click navigation to common tasks

---

## 12. DESIGN SYSTEM

### Color Palette

```css
--void: #030303          /* Primary background */
--void-1: #0A0A0A       /* Card backgrounds */
--void-2: #111111       /* Secondary surfaces */
--cream: #E2D9C8        /* Primary text */
--cream-2: #A89E8D      /* Secondary text */
--cream-3: #5A5249      /* Muted text */
--blue: #007BFF         /* Primary accent */
--blue-hi: #3DA5FF      /* Hover accent */
--green: #00FF41        /* Success/online */
--amber: #FFB700        /* Admin/accent */
--red: #FF4444          /* Errors */
--wire: #1E1E1E         /* Borders */
```

### Typography
- **Primary Font:** `IBM Plex Mono` (monospace) - body text, forms
- **Display Font:** `Bebas Neue` (sans-serif) - headings, titles

### Design Principles
1. **Terminal Aesthetic:** Command-line inspired interface
2. **Minimal Animations:** Subtle glitch effects, scanlines, pulses
3. **Status Indicators:** Live dots, signal bars, blinking cursors
4. **Corner Brackets:** Decorative borders on cards
5. **Low Contrast:** Muted colors for reduced eye strain
6. **Grid Overlays:** Subtle technical backgrounds
7. **Monospace Consistent:** All text elements use monospace except display headings

### Components
- **Event Cards:** Terminal window style with titlebar, poster, status strip
- **Sidebar Navigation:** Fixed left panel with section headers
- **Modals:** Semi-transparent overlay with centered card
- **Buttons:** Gradient slides (events) or solid colors with hover effects
- **Progress Bars:** Thin blue lines with smooth transitions
- **Badges:** Bracket-enclosed labels with color coding

---

## CONCLUSION

DEFFENSO Academy is a **production-ready cybersecurity training platform** with:
- ✅ Complete frontend implementation
- ✅ Firebase backend integration
- ✅ Role-based access control (admin/student)
- ✅ Course management and progress tracking
- ✅ Quiz-based assessment system
- ✅ Responsive design with unique cyberpunk aesthetic
- ✅ Legal compliance (privacy, terms)
- ✅ Admin controls for content creation
- ✅ Student portal with unlock progression

**Deployment Status:** Configured for Firebase Hosting with `firebase.json` rewrites for SPA routing.

**Next Steps for Full Launch:**
1. Deploy to Firebase Hosting (`firebase deploy`)
2. Create admin accounts via Firebase Console
3. Build initial course catalog using admin panel
4. Invite students by creating user records
5. Train admins on course builder and quiz editor

---

*End of Documentation*
