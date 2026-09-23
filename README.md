# DRISHTI — AI-Powered Real-Time Monitoring & Inspection Platform
### Smart India Hackathon 2026 • Observe. Verify. Act.

DRISHTI is an enterprise, government-grade real-time monitoring and inspection platform for tracking government-funded NGOs, institutions, schemes, and infrastructure projects.

---

## 🏗️ Architectural Core

The platform operates as a unified full-stack web application serving three distinct, responsive operational workspaces connected to the **SAME backend, SAME PostgreSQL database, SAME authentication system, and SAME immutable audit trail**:

1. **Government Command Center** (Desktop-first responsive):
   - Central Geospatial Surveillance Radar using modern Google Maps JavaScript API with custom dark graphite styling.
   - Cross-scheme tracking (Jal Jeevan Mission, Poshan Abhiyaan, Samagra Shiksha, PMKVY, Ayushman Bharat).
   - Instant "Launch Surprise Inspection" unannounced squad dispatch flow.
   - Algorithmic Risk Intelligence & Early Anomaly Warning with weighted risk factor breakdown.
   - Real-time video telemetry and IP camera feed monitoring with uptime tracking.
   - Statutory Compliance Notices issued directly against field findings.
   - Central state audit log with actor attribution, entity IDs, and state transitions.

2. **NGO / Institution Portal** (Responsive):
   - Organization registration, Darpan ID, and funding grant transparency.
   - Real-time statutory compliance directives response portal.
   - Project milestone progress and beneficiary verification tracking.

3. **Field Inspector Workspace** (Mobile-first responsive):
   - Designed for field smartphones, outdoor lighting, and spotty network connectivity.
   - Mandatory cryptographic GPS geofence lock (100-meter centroid verification).
   - Step-by-step statutory checklist execution with YES / NO / NA toggles.
   - On-site evidence capture (Photo, Video, Document) with SHA-256 hash validation.
   - Real-time field finding filing (Civil Infrastructure, Financial/Ghost vouchers, Attendance mismatch).
   - Formal technical remarks and immutable report submission.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS (Dark Graphite + Restrained Amber theme), Lucide Icons.
- **Maps**: Google Maps JavaScript API (Geospatial markers for NGOs, active inspections, and high-risk clusters).
- **Backend & Database**: Supabase PostgreSQL client architecture with canonical fallbacks for zero-downtime demonstration.
- **Security**: Granular Role-Based Access Control (RBAC) and Row Level Security (RLS) enforcement.

---

## 🚀 Environment Configuration

Create a `.env` file from `.env.example`:

```bash
# Google Maps JavaScript API Key
VITE_GOOGLE_MAPS_API_KEY="AIzaSyD33fZ78Gqsm5pMj2kRreaB3VRBW9DDCqg"

# Supabase PostgreSQL Configuration
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key-here"

# Server Secrets (Do NOT expose service role keys to client)
# SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Gemini API Key for AI Risk Engine
GEMINI_API_KEY="MY_GEMINI_API_KEY"
```

---

## 📦 Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run production build
npm run build
```
