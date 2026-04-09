# Hospital Management System - Capstone Project

A complete DBMS capstone project with a responsive website, Python backend APIs, and SQL database persistence.

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Python (`http.server`)
- Database: SQLite (`backend/hospital.db`)

## Modules Implemented

- Authentication System
  - User registration
  - User login/logout
  - Token-based protected APIs
- Patient Management
  - Add new patient
  - View patient list
- Appointment Management
  - Book appointment
  - View appointment list
- Treatment Management
  - Add treatment record
  - View treatment list
- Dashboard KPIs
  - Total Patients
  - Total Appointments
  - Total Treatments

## Project Structure

- `index.html` - Main UI
- `assets/style.css` - Styling
- `assets/script.js` - Frontend logic and API integration
- `backend/server.py` - Backend server and routes
- `backend/schema.sql` - SQL schema (tables + constraints)
- `backend/queries.sql` - Sample SQL operations
- `backend/hospital.db` - Database file (created automatically)
- `CAPSTONE_REPORT.md` - Ready project report content
- `TEST_CASES.md` - Test scenarios for evaluation/demo
- `DEPLOYMENT_NOTES.md` - Run/demo checklist

## Quick Start (Local)

### 1) Start app (single command)

```bash
python3 backend/server.py
```

Open in browser: `http://localhost:8080`

## API Endpoints

- `GET /health`
- `POST /register`
- `POST /login`
- `POST /logout`
- `GET /me`
- `POST /addPatient`
- `GET /getPatients`
- `POST /bookAppointment`
- `GET /getAppointments`
- `POST /addTreatment`
- `GET /getTreatments`

## Database Details

- Schema is defined in `backend/schema.sql`
- Foreign key relation:
  - `appointments.patient_id -> patients.patient_id`
  - `treatments.patient_id -> patients.patient_id`
- Auth tables:
  - `users`
  - `sessions`
- Input validation is enforced both in backend code and SQL constraints.

## Capstone Submission Files

Use these directly for your submission package:

- `CAPSTONE_REPORT.md`
- `TEST_CASES.md`
- `DEPLOYMENT_NOTES.md`

## Deploy on Render (Recommended)

This repo already includes `Dockerfile` and `render.yaml`.

1. Push this project to your GitHub repository.
2. Go to [Render](https://render.com) and click **New +** -> **Blueprint**.
3. Select your GitHub repo and approve deployment.
4. Render reads `render.yaml` and deploys automatically.
5. Open the generated Render URL.

### Important note about database

- Current database is SQLite (`backend/hospital.db`), which may reset on free cloud instances.
- For long-term production data, switch to a managed database (PostgreSQL/MySQL).

## Deploy on GitHub Pages (Frontend Demo Mode)

GitHub Pages cannot run Python backend.  
This project now auto-switches to **localStorage mode** on `github.io`, so it still works with:

- Register/Login
- Add/View Patients
- Add/View Appointments
- Add/View Treatments

### Steps

1. Push latest code to GitHub.
2. Go to repo **Settings** -> **Pages**.
3. Source: select your branch (for example `main`) and root (`/`).
4. Save and open your GitHub Pages URL.
5. Hard refresh once (`Cmd + Shift + R`).
