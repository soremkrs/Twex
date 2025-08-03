# 🐦 Twex — A Mini Twitter/X Clone with Full Stack Functionality

**Twex** is a full-stack social media web application inspired by Twitter/X. Built from scratch using **React**, **Node.js**, and **PostgreSQL**, it supports user authentication, posting, replies, likes, bookmarks, follow system, profile customization, and more — including real-time-ish notifications and a dynamic search system.

---

## 🌐 Live Demo

🚀 [https://twex-0u9k.onrender.com/](https://twex-0u9k.onrender.com/) 

---

## 🚀 Technologies Used

### Frontend
- ⚛️ React.js
- 🎨 MUI (Material UI)
- 🌐 Axios (HTTP client)

### Backend
- 🟩 Node.js
- 🚂 Express.js
- 🔐 Passport.js (Local + Google OAuth)
- ☁️ Cloudinary (Image uploads)
- 🧵 Multer (File handling)

### Database
- 🛢️ PostgreSQL
- 📦 pg (Node PostgreSQL client)
- 🧠 Session management (via pgSession)
- 🗄️ SQL schema with `users`, `tweets`, `likes`, `replies`, `follows`, `bookmarks`, etc.

---

## 🧠 Core Features

- 🔐 User Authentication (Local + Google OAuth)
- 📝 Create/Edit/Delete Posts
- 💬 Reply to posts (with original thread shown)
- ❤️ Like & 🏷️ Bookmark system
- 👥 Follow/Unfollow users
- 🔍 Real-time Search for users
- 🧾 Profile Pages (with About, Avatar, Stats)
- 📬 Notification Check System
- 🖼️ Avatars Selection + Post Images (via Cloudinary)
- ✨ Infinite Scroll Feeds
- 📱 Mobile-responsive layout
- 🎛️ Toggle feeds (All, Following, Bookmarks)

---

## Author

- Made by SoremOne
- Inspired by Twitter/X
- Built with ❤️ using React, Node.js, and PostgreSQL

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/soremkrs/twex.git

# Frontend
cd ../client
npm install

# Frontend .env

VITE_API_BASE_URL=YOUR_VITE_API_BASE_URL

# Backend
cd ../server
npm install

# Backend .env

GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=YOUR_GOOGLE_CALLBACK_URL
SESSION_SECRET=YOUR_SESSION_SECRET
PG_USER=YOUR_PG_USER
PG_HOST=YOUR_PG_HOST
PG_DATABASE=YOUR_PG_DATABASE
PG_PASSWORD=YOUR_PG_PASSWORD
PG_PORT=YOUR_PG_PORT
FRONTEND_URL=YOUR_FRONTEND_URL
CLOUDINARY_CLOUD_NAME=YOUR_CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_API_SECRET
PORT=YOUR_PORT
SESSION_COOKIE_SECURE="development (for local) or production(for hosting)"

# Create a new PostgreSQL database (e.g., twex)

# Run the provided SQL script from database.sql file

#⚠️ Important: You need to insert your PostgreSQL credentials db.js file

const db = new pg.Client({
  user: "YOUR_DB_USER",
  host: "YOUR_DB_HOST",
  database: "YOUR_DB_NAME",
  password: "YOUR_DB_PASSWORD",
  port: YOUR_PG_PORT
});

# Start backend (from /server)
node index.js

# Start frontend (from /client)
npm run dev

#Then visit 
http://localhost:5173

---

Let me know if you'd like:
- A `schema.sql` file generated from your DB structure
- Deployment instructions
- Better `.env.example` formatting
- README with embedded screenshots or badges

Ready to help polish or publish!