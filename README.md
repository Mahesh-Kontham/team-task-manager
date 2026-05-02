# 🚀 Team Task Manager

A full-stack collaborative task management application that allows teams to manage projects, assign tasks, and track progress using a Kanban-style workflow.

---

## 🛠️ Tech Stack

### Backend

* Node.js + Express.js
* Prisma ORM
* PostgreSQL
* JWT Authentication

### Frontend

* React (Vite)
* TailwindCSS
* React Query
* Axios

---

## ✨ Features

* 🔐 Authentication (Login / Signup)
* 📁 Project creation & management
* 👥 Role-based access control (Admin / Member)
* ✅ Task creation & assignment
* 📅 Due date tracking
* 📊 Drag-and-drop Kanban board
* 🔄 Real-time UI updates (React Query)

---

## ⚙️ Setup Instructions

### 1. Clone the repo

```bash
git clone https://github.com/your-username/team-task-manager.git
cd team-task-manager
```

---

### 2. Setup Backend

```bash
cd server
npm install
```

Create `.env`:

```
DATABASE_URL=your_postgres_url
JWT_SECRET=your_secret
```

Run:

```bash
npx prisma db push
npm run dev
```

---

### 3. Setup Frontend

```bash
cd client
npm install
npm run dev
```

---

---

## 🚀 Future Improvements

* Notifications
* Activity logs
* Search & filters
* Deployment (Railway + Vercel)

---

## 👨‍💻 Author

Mahesh Kontham
