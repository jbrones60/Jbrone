# Deployment Spec

## Railway backend service
- Root directory: /backend
- Start command: node index.js
- Environment variables:
  DATABASE_URL=<from Railway Postgres>
  JWT_SECRET=agencycrm2026secret
  PORT=3001
  FRONTEND_URL=<Railway frontend URL>

## Railway frontend service
- Root directory: /frontend
- Build command: npm run build
- Start command: npx serve dist
- Environment variables:
  VITE_API_URL=<Railway backend URL>

## GitHub → Railway auto-deploy
Both services watch the main branch.
Push to main = auto redeploy.
