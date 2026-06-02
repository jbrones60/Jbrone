# Agency CRM

Read all specs in .claude/specs/ before writing any code.

## Build order
1. backend/db.js
2. backend/routes/auth.js
3. backend/routes/leads.js
4. backend/index.js
5. backend/seed.js
6. frontend/src/api.js
7. frontend/src/pages/Login.jsx
8. frontend/src/components/Stats.jsx
9. frontend/src/components/Kanban.jsx
10. frontend/src/components/Table.jsx
11. frontend/src/App.jsx

## Rules
- No TypeScript
- No external UI libraries (no MUI, no Tailwind)
- Inline styles only on frontend
- All API calls go through src/api.js, never fetch() directly in components
- Backend routes must validate JWT on every request except /api/auth/login
- Always use parameterized queries in pg — never string interpolation
