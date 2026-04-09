# Test Cases - Hospital Management System

## Environment

- Backend: `python3 backend/server.py`
- Frontend: `python3 -m http.server 5500`
- Browser URL: `http://localhost:5500`

## Functional Test Cases

1. Add Patient - Valid Data
- Input: valid name, age 30, gender, 10-digit phone
- Expected: success alert, row appears in patient table, patient KPI increments

2. Add Patient - Invalid Phone
- Input: phone with less than 10 digits
- Expected: validation error alert, no DB insert

3. Add Patient - Invalid Age
- Input: age 0 or >120
- Expected: validation error alert, no DB insert

4. Book Appointment - Valid Data
- Input: existing patient ID, doctor ID, date
- Expected: success alert, row appears in appointment table, appointment KPI increments

5. Add Treatment - Valid Data
- Input: existing patient ID, description, non-negative cost
- Expected: success alert, row appears in treatment table, treatment KPI increments

6. API Health Check
- Request: `GET /health`
- Expected: `{"status":"ok"}` response

7. Data Persistence Check
- Steps: add records, restart backend, reload frontend
- Expected: previously inserted data still visible

8. Foreign Key Validation
- Input: appointment/treatment for non-existing patient ID
- Expected: backend returns error (integrity constraint), no insertion
