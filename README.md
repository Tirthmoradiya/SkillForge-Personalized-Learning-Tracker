# SkillForge: Personalized Learning Tracker

SkillForge is a modern, full-stack learning platform that empowers users to track their learning progress, take AI-powered quizzes, and receive real-time notifications—all with a beautiful, accessible UI and robust admin controls.

---

## 🚀 Features

- **User Learning Paths**: Create and track custom learning journeys (e.g., Web Dev, ML)
- **Interactive Path Visualization**: Visualize progress with dynamic graphs
- **Resource Management**: Curated resources and practice problems per topic
- **AI Assistant**: Personalized topic suggestions and learning resources (Google Gemini API)
- **Quiz System**: Topic-specific quizzes with progress tracking, confetti, and accessibility
- **Admin Panel**: Manage users, courses, topics, and notifications with role-based access
- **Analytics Dashboard**: User signups, engagement, retention, course completion, and popular topics with charts, date filtering, and CSV export
- **Notification System**: Real-time, broadcast and per-user notifications with read tracking
- **Modern UI/UX**: Responsive, dark mode, toasts, animations, and accessibility
- **Seeder**: Populate the database with sample users, courses, and quiz scores
- **Robust Security**: JWT authentication, bcrypt password hashing, input validation

---

## 🧑‍💻 Tech Stack

- **Frontend**: React (Vite), TailwindCSS, React Flow
- **Backend**: Node.js, Express
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT
- **AI Integration**: Google Gemini API

---

## 📊 Admin & Analytics

- **User Management**: List, edit, delete, and change user roles
- **Course/Topic Management**: Inline editing, file upload for topics, create courses from .txt files
- **Analytics**: Visualize user signups, engagement, retention, course completion, and popular topics
- **Notification Broadcast**: Send notifications to all users, with per-user read tracking
- **Role-Based Access**: Secure admin endpoints and UI

---

## 🔔 Notification System

- **Real-Time Sync**: Global event system for instant updates
- **Per-User Read Tracking**: `readBy` array in notifications
- **UI**: Notification bell with unread dot, dropdown menu, and click-to-mark-as-read

---

## 📝 Quiz Feature

- **Eligibility**: Available for 100%-completed courses
- **AI-Generated**: Quizzes powered by Gemini API
- **Progress Tracking**: Save/update scores, progress bars, confetti for completion
- **Accessibility**: Keyboard navigation, color contrast, and screen reader support

---

## 👤 Profile & Settings

- **Profile Analytics**: View personal progress and notifications
- **Change Password**: Secure, modern UI with visibility toggles
- **Settings**: Consistent, accessible design

---

## 🛡️ Security & Robustness

- **JWT Authentication**: Secure API access
- **Password Hashing**: bcrypt
- **Input Validation**: Prevents malformed data
- **Defensive Coding**: Handles missing/malformed data gracefully

---

## 🏗️ Project Structure

```
pro_project123/
├── src/                  # Frontend source code
│   ├── components/       # React components
│   ├── pages/            # Page components
│   ├── hooks/            # Custom hooks
│   ├── context/          # Context providers
│   └── assets/           # Static assets
├── server/               # Backend source code
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── controllers/      # Route controllers
│   └── seed.js           # Seeder script
└── public/               # Public assets
```

---

## ⚡ Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Google Gemini API key

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd pro_project123
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment variables:**
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_gemini_api_key
   ```
4. **Start the frontend:**
   ```bash
   npm run dev
   ```
5. **Start the backend:**
   ```bash
   node server/index.js
   ```
6. **Seed the database:**
   ```bash
   node server/seed.js
   ```
7. **Start both simulteneously**
   ```bash
   cd server && npm start
   ```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Change ports as you like.
---

## ☁️ Deployment

- **Frontend**: Vercel
- **Backend**: Render
- **Database**: MongoDB Atlas

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

## 📄 License

MIT License. See LICENSE file for details.
