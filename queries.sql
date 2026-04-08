-- Insert patient
INSERT INTO patients(name, age, gender, phone)
VALUES ('Rahul Verma', 29, 'Male', '9876543210');

-- Get all patients
SELECT patient_id, name, age, gender, phone
FROM patients
ORDER BY patient_id DESC;

-- Book appointment
INSERT INTO appointments(patient_id, doctor_id, date)
VALUES (1, 7, '2026-04-10');

-- Get appointments
SELECT appointment_id, patient_id, doctor_id, date
FROM appointments
ORDER BY appointment_id DESC;

-- Add treatment
INSERT INTO treatments(patient_id, description, cost)
VALUES (1, 'General checkup and medication', 850.0);

-- Get treatments
SELECT treatment_id, patient_id, description, cost
FROM treatments
ORDER BY treatment_id DESC;
