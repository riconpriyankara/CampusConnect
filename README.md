# Campus Connect

I built Campus Connect to solve a common problem at college: notes are scattered across WhatsApp groups, finding second-hand textbooks is annoying, and nobody knows where to ask course doubts without spamming class chats.

It is a full MERN stack app that brings peer-reviewed notes sharing, a textbook marketplace, a doubt forum, and campus events into one place.

---

## Tech Stack

- Frontend: React (Vite), React Router DOM (v6), Axios, Lucide React
- Backend: Node.js, Express.js
- Database: MongoDB (with Mongoose)
- Auth: JWT stored in localStorage + custom middleware
- Password Security: bcrypt
- File Uploads: Multer (PDFs saved to `uploads/notes/`, images saved to `uploads/profiles/`, `uploads/books/`, and `uploads/banners/`)
- Styling: Custom Vanilla CSS with CSS Variables

---

## Project Structure

```text
Campus Connect/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── .env.example
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── pages/
    │   ├── services/
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── vite.config.js
    └── package.json
```

---

## Setup & Running Locally

### Prerequisites
- Node.js (version >= 18.0.0)
- MongoDB instance running locally (`mongodb://127.0.0.1:27017/campus_connect`) or MongoDB Atlas URI.

### Step 1: Backend Setup

1. Go to the backend directory:
   ```bash
   cd backend
   ```
2. Create `.env` file:
   ```bash
   cp .env.example .env
   ```
3. Environment variables in `.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/campus_connect
   JWT_SECRET=campusconnect_secret_key_2026_development
   JWT_EXPIRE=30d
   NODE_ENV=development
   ```
4. Install backend dependencies:
   ```bash
   npm install
   ```

### Step 2: Seed Database Mock Data

Populate the database with sample notes, textbooks, doubts, and events:
```bash
npm run seed
```

**Seed Accounts:**
- Admin: `admin@campusconnect.edu` (Password: `admin123`)
- Student 1: `aisha@campusconnect.edu` (Password: `student123`)
- Student 2: `vikram@campusconnect.edu` (Password: `student123`)
- Student 3: `rohan@campusconnect.edu` (Password: `student123`)

### Step 3: Run Backend Server

```bash
npm run dev
```

The backend server runs on `http://localhost:5000`.

### Step 4: Frontend Setup

1. In a new terminal, go to frontend:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000` in your browser.

---

## REST API Reference

All requests to protected routes require header:
`Authorization: Bearer <jwt_token>`

### Authentication Routes
- `POST /api/auth/register` - Registers a new profile (supports avatar file upload in `profilePic` multipart form)
- `POST /api/auth/login` - Authenticates user & returns token
- `GET /api/auth/profile` - Fetches authenticated user's timeline bookmarks and details
- `PUT /api/auth/profile` - Modifies profile fields (Name, Dept, Year, Bio, Profile Picture)
- `GET /api/auth/notifications` - Fetches notifications history list and unread badge count
- `PUT /api/auth/notifications/read` - Marks all notifications as read

### Notes Library Routes
- `POST /api/notes` - Uploads note PDF (requires `file` field upload)
- `GET /api/notes` - Queries notes listing (supports parameters `search`, `department`, `semester`, `page`)
- `GET /api/notes/:id` - Fetches specific note, updates user's recently viewed list
- `POST /api/notes/:id/bookmark` - Toggles saving note bookmark
- `POST /api/notes/:id/download` - Increments note downloads count
- `DELETE /api/notes/:id` - Deletes note (only author or admin)

### Book Marketplace Routes
- `POST /api/books` - Publishes textbook for sale (requires `image` field cover upload)
- `GET /api/books` - Queries marketplace listings (supports `search`, `department`, `semester`, `condition`, `status`, `page`)
- `GET /api/books/:id` - Fetches detailed seller contact bio and meeting guidelines
- `POST /api/books/:id/save` - Toggles textbook bookmark
- `PUT /api/books/:id/status` - Toggles status between `available` and `sold` (only listing owner)
- `DELETE /api/books/:id` - Deletes marketplace listing (only seller or admin)

### Doubt Discussions Routes
- `POST /api/doubts` - Posts a new question (Accepts Title, Description, Tags)
- `GET /api/doubts` - Queries discussion lists (supports `search`, `tag`, sorting by `latest` | `trending` | `most_answered`, `page`)
- `GET /api/doubts/:id` - Fetches doubt details and its chronological responses
- `POST /api/doubts/:id/upvote` - Toggles upvote on question
- `POST /api/doubts/:id/answers` - Posts an answer reply to the thread
- `POST /api/doubts/answers/:id/upvote` - Likes an answer reply
- `PUT /api/doubts/answers/:id/accept` - Marks an answer as accepted (only question author)
- `DELETE /api/doubts/:id` - Deletes question thread (only author or admin)

### Campus Events Routes
- `POST /api/events` - Organizes campus event (requires `banner` field upload)
- `GET /api/events` - Queries campus event calendar (supports `search`, `upcoming` filter boolean)
- `GET /api/events/:id` - Fetches event location, date and description
- `POST /api/events/:id/bookmark` - Subscribes or bookmarks event
- `DELETE /api/events/:id` - Deletes event (only organizer or admin)

### Administrative Moderation Routes
- `GET /api/admin/stats` - Computes system counts for notes, books, events, doubts, users, and reports
- `GET /api/admin/reports` - Lists all flagged posts reports
- `POST /api/admin/reports` - Files a flag report on content (Note, Book, Event, Doubt, Answer)
- `PUT /api/admin/reports/:id/resolve` - Dismisses a report item
- `DELETE /api/admin/reports/:id/content` - Deletes flagged content permanently
- `GET /api/admin/users` - Lists all registered students
- `DELETE /api/admin/users/:id` - Bans user profile and purges their uploads

---

## Notes & Future Ideas

I originally planned to build real-time buyer-seller chat over WebSockets, but currently it uses the seller contact bio details. Might add real-time messaging or push notifications in a future update.
