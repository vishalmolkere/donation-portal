# Donation Portal

A full-stack donation platform — Receivers post fund requests, Donors browse and donate, Admins approve and manage. Built with Spring Boot + Spring Security + JWT on the backend and React on the frontend.


## Features

- JWT authentication with 3 roles: Donor, Receiver, Admin
- Fund request approval workflow with admin review
- **Emergency requests** — self-declared, goes live instantly, with rate-limiting and abuse auto-lockout instead of waiting for admin approval
- Race-condition-safe donations using pessimistic DB locking (prevents overfunding under concurrent donations)
- In-app notifications for all major events
- Admin dashboard: user management, donation records, emergency review

## Tech Stack

**Backend:** Spring Boot 3, Spring Security, JWT, Spring Data JPA, MySQL
**Frontend:** React 18, React Router, Axios

## Setup

```bash
# 1. Create database
CREATE DATABASE donation_portal;

# 2. Backend — copy .env.example to .env, fill in DB credentials + JWT_SECRET
cd backend && mvn spring-boot:run

# 3. Frontend
cd frontend && npm install && npm start
```

First admin account is auto-seeded from `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` env vars on first run.

## API

28 REST endpoints across auth (2), fund-requests (5), donations (6), notifications (3), and admin (11) and users (1). Role-restricted via `@PreAuthorize`. See `/backend/src/main/java/com/donation/controller` for the full list.

## Project Structure

```
backend/  → entity / repository / service / controller / security / config
frontend/ → components (auth, donor, receiver, admin, common) / pages / context / services
```

## Next steps

- Real payment gateway integration (currently simulated)
- Flyway migrations
- Automated tests

