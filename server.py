import json
import sqlite3
import hashlib
import secrets
import os
import mimetypes
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import urlparse

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
DB_PATH = BASE_DIR / "hospital.db"
SCHEMA_PATH = BASE_DIR / "schema.sql"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    with get_connection() as conn:
        schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
        conn.executescript(schema_sql)


def row_to_dict(row):
    return {key: row[key] for key in row.keys()}


class HospitalHandler(BaseHTTPRequestHandler):
    def _set_headers(self, code=200, content_type="application/json"):
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def _read_json_body(self):
        length = int(self.headers.get("Content-Length", 0))
        if length == 0:
            return {}
        body = self.rfile.read(length).decode("utf-8")
        return json.loads(body)

    def _write_json(self, payload, code=200):
        self._set_headers(code=code)
        self.wfile.write(json.dumps(payload).encode("utf-8"))

    def _write_file(self, file_path):
        if not file_path.exists() or not file_path.is_file():
            self._write_json({"error": "Not found"}, code=404)
            return
        content_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.end_headers()
        self.wfile.write(file_path.read_bytes())

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_GET(self):
        path = urlparse(self.path).path
        try:
            if path == "/health":
                self._write_json({"status": "ok"})
                return
            if path == "/me":
                self.get_me()
                return
            if path == "/getPatients":
                self.require_auth()
                self.get_patients()
                return
            if path == "/getAppointments":
                self.require_auth()
                self.get_appointments()
                return
            if path == "/getTreatments":
                self.require_auth()
                self.get_treatments()
                return
            if path == "/" or path == "/index.html":
                self._write_file(ROOT_DIR / "index.html")
                return
            if path.startswith("/assets/"):
                safe_rel = path.lstrip("/")
                self._write_file(ROOT_DIR / safe_rel)
                return
            self._write_json({"error": "Route not found"}, code=404)
        except Exception as exc:
            self._write_json({"error": str(exc)}, code=500)

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            if path == "/register":
                self.register()
                return
            if path == "/login":
                self.login()
                return
            if path == "/logout":
                self.logout()
                return
            if path == "/addPatient":
                self.require_auth()
                self.add_patient()
                return
            if path == "/bookAppointment":
                self.require_auth()
                self.book_appointment()
                return
            if path == "/addTreatment":
                self.require_auth()
                self.add_treatment()
                return
            self._write_json({"error": "Route not found"}, code=404)
        except sqlite3.IntegrityError as exc:
            self._write_json({"error": str(exc)}, code=400)
        except PermissionError as exc:
            self._write_json({"error": str(exc)}, code=401)
        except ValueError as exc:
            self._write_json({"error": str(exc)}, code=400)
        except Exception as exc:
            self._write_json({"error": str(exc)}, code=500)

    def hash_password(self, password):
        return hashlib.sha256(password.encode("utf-8")).hexdigest()

    def get_auth_token(self):
        authorization = self.headers.get("Authorization", "")
        if authorization.startswith("Bearer "):
            return authorization[7:].strip()
        return ""

    def get_user_from_token(self, token):
        if not token:
            return None
        with get_connection() as conn:
            row = conn.execute(
                """
                SELECT u.user_id, u.full_name, u.email
                FROM sessions s
                JOIN users u ON s.user_id = u.user_id
                WHERE s.token = ?
                """,
                (token,),
            ).fetchone()
            return row_to_dict(row) if row else None

    def require_auth(self):
        token = self.get_auth_token()
        user = self.get_user_from_token(token)
        if not user:
            raise PermissionError("Unauthorized. Please login first.")
        return user

    def register(self):
        data = self._read_json_body()
        full_name = (data.get("full_name") or "").strip()
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""

        if not full_name:
            raise ValueError("full_name is required")
        if "@" not in email or "." not in email:
            raise ValueError("valid email is required")
        if len(password) < 6:
            raise ValueError("password must be at least 6 characters")

        password_hash = self.hash_password(password)
        with get_connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO users(full_name, email, password_hash)
                VALUES(?, ?, ?)
                """,
                (full_name, email, password_hash),
            )
            user_id = cursor.lastrowid
        self._write_json({"message": "User registered", "user_id": user_id}, code=201)

    def login(self):
        data = self._read_json_body()
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""
        if not email or not password:
            raise ValueError("email and password are required")

        with get_connection() as conn:
            row = conn.execute(
                """
                SELECT user_id, full_name, email, password_hash
                FROM users
                WHERE email = ?
                """,
                (email,),
            ).fetchone()

            if not row:
                raise ValueError("Invalid credentials")

            user = row_to_dict(row)
            if self.hash_password(password) != user["password_hash"]:
                raise ValueError("Invalid credentials")

            token = secrets.token_hex(24)
            conn.execute(
                """
                INSERT INTO sessions(user_id, token)
                VALUES(?, ?)
                """,
                (user["user_id"], token),
            )

        self._write_json(
            {
                "message": "Login successful",
                "token": token,
                "user": {
                    "user_id": user["user_id"],
                    "full_name": user["full_name"],
                    "email": user["email"],
                },
            }
        )

    def logout(self):
        token = self.get_auth_token()
        if not token:
            self._write_json({"message": "Logged out"})
            return

        with get_connection() as conn:
            conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        self._write_json({"message": "Logged out"})

    def get_me(self):
        token = self.get_auth_token()
        user = self.get_user_from_token(token)
        if not user:
            self._write_json({"authenticated": False})
            return
        self._write_json({"authenticated": True, "user": user})

    def add_patient(self):
        data = self._read_json_body()
        name = (data.get("name") or "").strip()
        age = int(data.get("age", 0))
        gender = (data.get("gender") or "").strip()
        phone = (data.get("phone") or "").strip()

        if not name:
            raise ValueError("name is required")
        if age < 1 or age > 120:
            raise ValueError("age must be between 1 and 120")
        if len(phone) != 10 or not phone.isdigit():
            raise ValueError("phone must be 10 digits")

        with get_connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO patients(name, age, gender, phone)
                VALUES(?, ?, ?, ?)
                """,
                (name, age, gender, phone),
            )
            patient_id = cursor.lastrowid
        self._write_json({"message": "Patient added", "patient_id": patient_id}, code=201)

    def get_patients(self):
        with get_connection() as conn:
            rows = conn.execute(
                """
                SELECT patient_id, name, age, gender, phone
                FROM patients
                ORDER BY patient_id DESC
                """
            ).fetchall()
        self._write_json([row_to_dict(row) for row in rows])

    def book_appointment(self):
        data = self._read_json_body()
        patient_id = int(data.get("patient_id", 0))
        doctor_id = int(data.get("doctor_id", 0))
        date_value = (data.get("date") or "").strip()

        if patient_id <= 0 or doctor_id <= 0:
            raise ValueError("patient_id and doctor_id must be positive numbers")
        if not date_value:
            raise ValueError("date is required")

        with get_connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO appointments(patient_id, doctor_id, date)
                VALUES(?, ?, ?)
                """,
                (patient_id, doctor_id, date_value),
            )
            appointment_id = cursor.lastrowid
        self._write_json({"message": "Appointment booked", "appointment_id": appointment_id}, code=201)

    def get_appointments(self):
        with get_connection() as conn:
            rows = conn.execute(
                """
                SELECT appointment_id, patient_id, doctor_id, date
                FROM appointments
                ORDER BY appointment_id DESC
                """
            ).fetchall()
        self._write_json([row_to_dict(row) for row in rows])

    def add_treatment(self):
        data = self._read_json_body()
        patient_id = int(data.get("patient_id", 0))
        description = (data.get("description") or "").strip()
        cost = float(data.get("cost", 0))

        if patient_id <= 0:
            raise ValueError("patient_id must be a positive number")
        if not description:
            raise ValueError("description is required")
        if cost < 0:
            raise ValueError("cost cannot be negative")

        with get_connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO treatments(patient_id, description, cost)
                VALUES(?, ?, ?)
                """,
                (patient_id, description, cost),
            )
            treatment_id = cursor.lastrowid
        self._write_json({"message": "Treatment added", "treatment_id": treatment_id}, code=201)

    def get_treatments(self):
        with get_connection() as conn:
            rows = conn.execute(
                """
                SELECT treatment_id, patient_id, description, cost
                FROM treatments
                ORDER BY treatment_id DESC
                """
            ).fetchall()
        self._write_json([row_to_dict(row) for row in rows])


def run():
    init_db()
    port = int(os.getenv("PORT", "8080"))
    server = HTTPServer(("0.0.0.0", port), HospitalHandler)
    print(f"Backend running at http://0.0.0.0:{port}")
    server.serve_forever()


if __name__ == "__main__":
    run()
