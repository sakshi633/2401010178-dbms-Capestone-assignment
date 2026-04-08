# Deployment and Demo Notes

## Pre-Demo Checklist

- Confirm Python 3 is installed.
- Keep two terminals ready:
  - Terminal 1 for backend
  - Terminal 2 for frontend static server
- Ensure ports are free:
  - `8080` (backend)
  - `5500` (frontend)

## Run Steps

1. Start backend:

```bash
python3 backend/server.py
```

2. Start frontend:

```bash
python3 -m http.server 5500
```

3. Open:

`http://localhost:5500`

## Suggested Demo Flow (5-7 min)

1. Show dashboard and module tabs.
2. Add one patient and explain validation.
3. Book one appointment using that patient ID.
4. Add one treatment record.
5. Open patient/appointment/treatment list tabs.
6. Show KPI cards updating automatically.
7. Briefly show SQL schema and explain table relations.

## Viva/Presentation Talking Points

- Why relational model is suitable for hospital records.
- Primary key and foreign key usage for integrity.
- Why constraints (`CHECK`, `NOT NULL`, `FOREIGN KEY`) are important.
- API layer responsibility (validation, JSON handling, SQL execution).
- How this can scale with auth, billing, and analytics modules.
