# Supabase Self-Hosted Setup Guide

This guide will help you set up a self-hosted Supabase instance using Docker.

## Prerequisites

- Docker Desktop installed ([Download here](https://www.docker.com/products/docker-desktop))
- Docker Compose (included with Docker Desktop)
- At least 4GB of RAM available for Docker

## Setup Steps

### 1. Clone Supabase Repository

Open a terminal in a separate directory (not in this project):

```bash
cd ~/Code  # Or wherever you want to store Supabase
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# IMPORTANT: Edit .env and set these values:
# - POSTGRES_PASSWORD (change from default)
# - JWT_SECRET (generate a secure secret)
# - ANON_KEY and SERVICE_ROLE_KEY (will be auto-generated on first start)
```

**Minimal required changes in `.env`:**
- Set `POSTGRES_PASSWORD=yourSecurePassword`
- All other defaults can be kept for local development

### 3. Start Supabase

```bash
docker compose up -d
```

This will download and start all Supabase services. First start takes 5-10 minutes.

### 4. Verify Installation

Check that all containers are running:

```bash
docker compose ps
```

You should see containers for:
- `supabase-db` (PostgreSQL database)
- `supabase-studio` (Admin UI)
- `supabase-kong` (API Gateway)
- And several other services

### 5. Access Supabase

- **Supabase Studio** (Admin UI): http://localhost:54323
- **Database**: `postgresql://postgres:[YOUR_PASSWORD]@localhost:54322/postgres`

### 6. Update TripLedger Environment Variables

Back in your TripLedger project, update `.env.local`:

```env
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@localhost:54322/postgres"
DIRECT_URL="postgresql://postgres:[YOUR_PASSWORD]@localhost:54322/postgres"
```

Replace `[YOUR_PASSWORD]` with the password you set in step 2.

## Managing Supabase

### Stop Supabase
```bash
cd ~/Code/supabase/docker
docker compose stop
```

### Start Supabase (after first setup)
```bash
cd ~/Code/supabase/docker
docker compose start
```

### View Logs
```bash
cd ~/Code/supabase/docker
docker compose logs -f
```

### Remove Everything (Fresh Start)
```bash
cd ~/Code/supabase/docker
docker compose down -v  # WARNING: This deletes all data!
```

## Database Access

### Using Supabase Studio
Navigate to http://localhost:54323 to:
- View tables and data
- Run SQL queries
- Manage database schema

### Using psql CLI
```bash
docker exec -it supabase-db psql -U postgres
```

## Troubleshooting

### Port Conflicts
If ports 54322 or 54323 are already in use, edit `supabase/docker/.env`:
- Change `POSTGRES_PORT` (default 54322)
- Change `STUDIO_PORT` (default 54323)

### Database Connection Issues
1. Ensure Docker containers are running: `docker compose ps`
2. Check logs: `docker compose logs supabase-db`
3. Verify password in `.env` matches `DATABASE_URL`

### Reset Database
If you need a fresh database:
```bash
docker compose down -v
docker compose up -d
```

Then run Prisma migrations again from TripLedger project.

## Next Steps

Once Supabase is running:
1. Update `.env.local` with correct DATABASE_URL
2. Run Prisma migrations: `npx prisma db push`
3. Start developing: `npm run dev`

---

**Note:** This is a local development setup. For production, consider using Supabase Cloud (https://supabase.com) or a proper self-hosted deployment with SSL, backups, and monitoring.
