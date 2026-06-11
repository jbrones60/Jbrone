# Frontend Spec

## Auth
- Login page at /login — email + password form
- On success store JWT in localStorage
- All other routes redirect to /login if no token
- Show logged-in user's name in header
- Logout button clears token

## Main CRM layout
- Header: app name, logged-in user, logout
- Tab bar: Table | Kanban | Stats
- Filter bar (persistent across tabs):
  - Search (name or phone)
  - Category dropdown
  - Assigned to dropdown
  - Status dropdown
  - Priority dropdown
  - Website filter: All | No Website | Has Website

## Table view
Columns: #, Name, Category, Phone, Website (yes/no), Assigned, Priority, Status
- Clicking a row opens Lead Detail modal
- Assigned and Status are inline-editable dropdowns
- Phone is a clickable tel: link
- Paginated: 30 per page

## Lead Detail modal
Shows all lead fields.
Editable: status, assigned_to, priority, notes, follow_up_date
Has a "pitch angle" tip based on whether they have a website.
Save button calls PATCH /api/leads/:id

## Kanban view
Columns: Not Called | Called - No Answer | Interested | Follow Up | Converted
Cards show: name, assigned member, priority dot
Clicking a card opens Lead Detail modal

## Stats view
- Status counts (colored badges)
- Per-member: total assigned, interested count, converted count, progress bar
- Per-category: total, how many called, progress bar
- Today's priority list per member (high priority + follow-ups due today)

## API calls
All in src/api.js
Base URL from import.meta.env.VITE_API_URL
Include JWT in Authorization: Bearer <token> header

## Styling
Dark theme. Font: DM Mono + Space Grotesk (Google Fonts).
Color palette: background #080c14, cards #111827, borders #1e293b.
Accent: blue #3b82f6, green #22c55e, yellow #fbbf24, red #f87171.
No external UI library — plain CSS-in-JS or inline styles.
