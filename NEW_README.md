# CureConnect — Digital Health Platform with Drug Interaction & Adherence Intelligence

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (required for full features)

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

### 3. Set up Environment Variables
Create `.env` file in server directory:
```env
MONGO_URI=mongodb://localhost:27017/cureconnect
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173
```

### 4. Seed the Database
```bash
cd server
node seed.js
```

### 5. Start the Server (Backend)
```bash
cd server
node index.js
```
→ API runs at **http://localhost:5000**

### 6. Start the Client (Frontend)
```bash
cd client
npm run dev
```
→ Opens at **http://localhost:5173**

---

## 🎨 Features

### Core Platform
- **Cinematic Landing Page** — 3-stage animated intro
- **Persona Selection** — Patient vs Doctor glassmorphism cards
- **Auth System** — Register/Login with JWT
- **Patient Dashboard** — Health score, vitals, ECG, medications, AI chatbot, Emergency SOS
- **Doctor Dashboard** — Patient list, appointment schedule, digital prescription pad, analytics, AI diagnostics
- **Blockchain badge** — Verified health records
- **Responsive sidebar** — Collapsible with tooltips

### Drug Interaction & Adherence Intelligence Module

#### 🔍 Drug Interaction System
- **Real-time checking** — Automatic interaction detection when prescribing multiple medicines
- **Severity levels** — Major (red), Moderate (orange), Minor (yellow) alerts
- **Interactive warnings** — Click to acknowledge warnings before saving
- **Patient allergy checks** — Automatic detection of patient allergies vs prescribed drugs

#### 💊 Prescription Module
- **Smart prescription pad** — Doctor selects patient, adds medicines with dosage/frequency/duration
- **Interaction validation** — Cannot save prescription with severe interactions without confirmation
- **Confirmation dialogs** — Explicit confirmation required for high-risk combinations

#### 📊 Medication Adherence Tracker
- **Today's medications** — Patient dashboard shows current day's medicines
- **One-click marking** — [Taken] or [Missed] buttons for each medication
- **Adherence logs** — Complete history stored in MongoDB
- **Compliance scoring** — Real-time calculation of adherence percentage

#### 📈 Compliance Score Engine
- **Dynamic scoring** — (Taken doses / Total scheduled doses) × 100
- **Performance levels** — Excellent (90-100%), Good (75-89%), Poor (50-74%), Critical (<50%)
- **Progress visualization** — Progress bar and statistics in patient dashboard

#### 👨‍⚕️ Admin/Doctor Insights
- **Patient analytics** — List of non-adherent patients needing attention
- **Compliance trends** — Charts showing adherence patterns over time
- **Risky combinations** — Top drug interaction warnings detected
- **Performance metrics** — Average compliance, total logs, patient counts

#### 🛡️ Security & UX
- **Role-based access** — Doctor/Patient/Admin permissions
- **Toast notifications** — Success/error feedback for all actions
- **Loading states** — Spinners and progress indicators
- **Error handling** — Comprehensive error boundaries and fallbacks
- **Medicine autocomplete** — Search and select from drug database

## 🛠 Tech Stack
- **Frontend**: React + Vite, Framer Motion, Recharts, Lucide React, React Hot Toast, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB/Mongoose, JWT
- **Database**: MongoDB with Mongoose schemas
- **Real-time**: Socket.io for live updates

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` — User registration
- `POST /api/auth/login` — User login

### Prescriptions
- `GET /api/prescriptions` — Get user's prescriptions
- `POST /api/prescriptions` — Create new prescription
- `POST /api/prescriptions/check-interactions` — Check drug interactions

### Adherence
- `POST /api/adherence/mark` — Mark medication as taken/missed
- `GET /api/adherence/logs` — Get adherence logs
- `GET /api/adherence/compliance` — Get compliance score
- `GET /api/adherence/:patientId` — Get specific patient logs (doctor)
- `GET /api/adherence/compliance/:patientId` — Get specific patient compliance (doctor)
- `GET /api/adherence/analytics` — Get adherence analytics (doctor)

### Drug Interactions
- `POST /api/interactions/check` — Check interactions for medications
- `GET /api/interactions` — Get all interactions (admin)

## 🗃 Database Schemas

### DrugInteraction
```javascript
{
  drug1: String,
  drug2: String,
  severity: 'major' | 'moderate' | 'minor',
  description: String,
  source: String,
  evidenceLevel: 'high' | 'moderate' | 'low'
}
```

### AdherenceLog
```javascript
{
  patient: ObjectId,
  prescription: ObjectId,
  medication: {
    name: String,
    dosage: String,
    frequency: String
  },
  scheduledTime: Date,
  takenAt: Date,
  status: 'taken' | 'missed' | 'skipped' | 'late',
  notes: String
}
```

### Prescription
```javascript
{
  patient: ObjectId,
  doctor: ObjectId,
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String
  }],
  interactionWarnings: [{
    severity: String,
    description: String,
    drugs: [String],
    acknowledged: Boolean
  }],
  adherenceScore: Number
}
```

## 🎯 Demo Accounts

### Doctors
- **Dr. Sarah Chen** — dr.chen@cureconnect.com
- **Dr. Raj Kumar** — dr.kumar@cureconnect.com
- **Dr. Priya Mehta** — dr.mehta@cureconnect.com

### Patients
- **James Walker** — james.walker@test.com
- **Emma Reynolds** — emma.r@test.com
- **Marcus Chen** — marcus@test.com

**Password for all accounts**: `demo_password123`

## 🚀 Production Deployment

1. **Environment Setup**
   ```bash
   # Set production environment variables
   MONGO_URI=mongodb://production-db-url
   JWT_SECRET=strong-production-secret
   FRONTEND_URL=https://yourdomain.com
   ```

2. **Build Frontend**
   ```bash
   cd client
   npm run build
   ```

3. **Start Production Server**
   ```bash
   cd server
   NODE_ENV=production node index.js
   ```

## 📝 License
MIT License - feel free to use for healthcare projects!