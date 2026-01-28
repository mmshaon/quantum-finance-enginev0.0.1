# Quantum Finance Engine

Multi-tenant finance, project, HR, and control system for Alpha Ultimate Ltd.

## Stack

- Web: Next.js (apps/web)
- API: Fastify + Prisma (apps/api)
- DB: NeonDB (PostgreSQL)
- Monorepo: Turbo + workspaces

## Quick start

1. Copy \.env.example\ to \.env\ and fill values.
2. Install dependencies:

   \\\ash
   npm install
   \\\

3. Generate Prisma client and run migrations:

   \\\ash
   npm run db:generate
   npm run db:migrate
   \\\

4. Run dev servers:

   \\\ash
   npm run dev:web
   npm run dev:api
   \\\
"@

########################
# database
########################

Write-File "quantum-finance-engine\database\package.json" @"
{
  "name": "qfe-database",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "generate": "prisma generate",
    "migrate": "prisma migrate dev"
  },
  "devDependencies": {
    "prisma": "^6.0.0"
  },
  "dependencies": {
    "@prisma/client": "^6.0.0"
  }
}
