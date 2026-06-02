# Backend Spec

## Database tables

### leads
- id SERIAL PRIMARY KEY
- name TEXT
- type TEXT
- address TEXT
- phone TEXT
- website TEXT (nullable)
- category TEXT  -- 'schools' | 'Real Estate' | 'interior designs' | 'law' | 'CA'
- status TEXT DEFAULT 'Not Called'
  -- values: Not Called | Called - No Answer | Interested | Not Interested | Follow Up | Converted | Closed Deal
- assigned_to TEXT DEFAULT 'Ravi'
- priority TEXT DEFAULT 'low'  -- high | medium | low
- notes TEXT DEFAULT ''
- last_called TIMESTAMP
- follow_up_date DATE
- created_at TIMESTAMP DEFAULT NOW()
- has_website BOOLEAN GENERATED ALWAYS AS (website IS NOT NULL AND website != '') STORED

### users
- id SERIAL PRIMARY KEY
- name TEXT
- email TEXT UNIQUE
- password TEXT (bcrypt hashed)

## API Routes

### Auth
POST /api/auth/login
  body: { email, password }
  returns: { token, user: { id, name, email } }

### Leads
GET /api/leads
  query params: category, assigned_to, status, priority, website (has|none), search
  returns: array of leads

GET /api/leads/stats
  returns: { byStatus, byMember, byCategory }

PATCH /api/leads/:id
  body: { status, assigned_to, priority, notes, follow_up_date }
  sets last_called = NOW() automatically
  returns: updated lead

## Seed users (hardcoded)
- Ravi / ravi@agency.com / password: ravi123
- Priya / priya@agency.com / password: priya123
- Suresh / suresh@agency.com / password: suresh123

## Environment variables needed
DATABASE_URL, JWT_SECRET, PORT, FRONTEND_URL
