# Hospital Management System - Capstone Report

## 1. Abstract

The Hospital Management System is a database-driven web application designed to manage patient records, appointments, and treatment details in a structured way. The project demonstrates practical use of DBMS concepts including schema design, primary and foreign key relationships, normalization, and CRUD-based operations through API endpoints.

## 2. Problem Statement

Manual hospital record handling is slow, error-prone, and difficult to maintain. This project solves the issue by providing a centralized web platform for storing and retrieving patient-related data efficiently.

## 3. Objectives

- Design a relational database for hospital operations.
- Build a backend to process and validate requests.
- Build a user-friendly frontend dashboard.
- Ensure persistent storage and data consistency.
- Demonstrate complete end-to-end DBMS workflow.

## 4. Scope

### In Scope

- Patient registration
- Appointment booking
- Treatment record creation
- Viewing all records in each module
- Basic dashboard analytics (counts)

### Out of Scope

- Multi-user authentication/authorization
- Billing and payment gateway
- Prescription file uploads

## 5. Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Python (`http.server`)
- Database: SQLite

## 6. System Architecture

1. User interacts with web UI.
2. Frontend sends API request to backend.
3. Backend validates data and executes SQL.
4. SQLite stores/retrieves records.
5. Backend returns JSON response.
6. Frontend updates UI tables and KPIs.

## 7. Database Design

### Tables

- `patients(patient_id, name, age, gender, phone)`
- `appointments(appointment_id, patient_id, doctor_id, date)`
- `treatments(treatment_id, patient_id, description, cost)`

### Relationships

- `appointments.patient_id` references `patients.patient_id`
- `treatments.patient_id` references `patients.patient_id`

## 8. Key Features Implemented

- Add patient with validation (age range, phone format)
- Book appointment linked to existing patient
- Add treatment with non-negative cost constraint
- View patients, appointments, and treatments
- KPI cards for total counts
- CORS-enabled REST APIs

## 9. SQL Operations Used

- `CREATE TABLE`
- `INSERT INTO`
- `SELECT ... ORDER BY`
- `FOREIGN KEY` constraints
- `CHECK` constraints

## 10. Testing and Results

The project was tested through browser flows and API requests:

- Patient creation stores records successfully.
- Appointment and treatment creation map correctly to patient IDs.
- Record lists are fetched and displayed in tables.
- Dashboard counts match actual stored rows.

## 11. Conclusion

The project successfully meets DBMS capstone goals by combining database schema design with a fully functional frontend-backend application. It provides a practical and extensible foundation for real-world hospital management workflows.

## 12. Future Enhancements

- Role-based authentication (Admin/Doctor/Staff)
- Edit and delete functionality for complete CRUD
- Billing and invoice module
- Search/filter/sort with pagination
- Deployment to cloud server with managed SQL database
