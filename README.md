# CureConnect — Digital Health Platform

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (optional — server works without it in demo mode)

---

### 1. Install Client Dependencies
```bash
cd client
npm install
```

### 2. Install Server Dependencies
```bash
cd server
npm install
```

### 3. Start the Client (Frontend)
```bash
cd client
npm run dev
```
→ Opens at **http://localhost:5173**

### 4. Start the Server (Backend) — Optional for full features
```bash
cd server
node index.js
```
→ API runs at **http://localhost:5000**

---

## 🎨 Features
- **Cinematic Landing Page** — 3-stage animated intro
- **Persona Selection** — Patient vs Doctor glassmorphism cards
- **Auth System** — Register/Login with JWT
- **Patient Dashboard** — Health score, vitals, ECG, medications, AI chatbot, Emergency SOS
- **Doctor Dashboard** — Patient list, appointment schedule, digital prescription pad, analytics, AI diagnostics
- **Blockchain badge** — Verified health records
- **Responsive sidebar** — Collapsible with tooltips

## 🛠 Tech Stack
- **Frontend**: React + Vite, Framer Motion, Recharts, Lucide React
- **Backend**: Node.js, Express, MongoDB/Mongoose, JWT
- **Design**: Custom CSS variables, glassmorphism, cyberpunk medical aesthetic
