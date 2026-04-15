# Backend Documentation

This backend provides the authentication API for the WanderOn assignment. It is built with Node.js, Express, TypeScript, MongoDB, and Mongoose, with `zod` for request validation.

## Purpose

The backend is responsible for:

- registering users securely
- validating login credentials
- issuing `access token` and `refresh token`
- storing the refresh token securely in the database
- protecting authenticated routes
- handling logout and token refresh

## Tech Stack

- Node.js
- Express.js
- TypeScript
- MongoDB with Mongoose
- Zod
- bcryptjs
- jsonwebtoken
- cookie-parser
- helmet
- express-rate-limit
- express-mongo-sanitize

## Folder Structure

```text
src/
  config/        Environment and database setup
  controllers/   Request handlers
  middleware/    Auth, validation, and error middleware
  models/        Mongoose models
  routes/        Express routes
  services/      Business logic for authentication
  types/         Shared TypeScript types
  utils/         Reusable utility classes/helpers
  validators/    Zod schemas
```

## Authentication Design

This backend uses a two-token approach:

- `access token`
  - short-lived
  - stored in an HTTP-only cookie
  - used to access protected routes
- `refresh token`
  - longer-lived
  - stored in an HTTP-only cookie
  - hashed before being stored in MongoDB
  - used to issue a new access token when the old one expires

### Why this design

- reduces risk if an access token is leaked
- supports smoother user sessions
- allows refresh-token rotation
- matches stronger production-style authentication patterns

## Request Flow

### Register

1. Client sends `name`, `email`, and `password`
2. Zod validates the request body
3. Password is hashed with bcrypt
4. User is saved in MongoDB
5. Access token and refresh token are generated
6. Refresh token hash is stored in DB
7. Both tokens are sent as HTTP-only cookies

### Login

1. Client sends `email` and `password`
2. Credentials are validated
3. Password is checked with bcrypt
4. New access and refresh tokens are issued
5. Refresh token hash in DB is replaced

### Refresh Session

1. Client sends refresh cookie automatically
2. Backend verifies the refresh token signature
3. Backend compares the incoming refresh token against the hashed version in DB
4. New access and refresh tokens are issued
5. Refresh token is rotated and saved again

### Protected Route

1. Backend reads access token from cookie
2. Access token is verified
3. User is loaded from DB
4. Request proceeds only if authentication is valid

### Logout

1. Backend clears access and refresh cookies
2. Stored refresh token hash is removed from DB

## Security Choices

- passwords are hashed using `bcryptjs`
- request validation is handled with `zod`
- authentication tokens are sent through HTTP-only cookies
- refresh tokens are hashed before database storage
- `helmet` adds standard security headers
- `express-rate-limit` reduces brute-force risk
- `express-mongo-sanitize` helps reduce NoSQL injection risk
- string sanitization is applied to user-facing string input

## Environment Variables

Create a `.env` file in the `backend` folder.

Required values:

- `PORT`
- `MONGODB_URI`
- `ACCESS_TOKEN_SECRET`
- `ACCESS_TOKEN_EXPIRES_IN`
- `REFRESH_TOKEN_SECRET`
- `REFRESH_TOKEN_EXPIRES_IN`
- `ACCESS_COOKIE_NAME`
- `REFRESH_COOKIE_NAME`
- `CLIENT_URL`
- `NODE_ENV`

Use [`.env.example`]as the template.

## API Endpoints

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## How To Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Main Files

- [src/server.ts]
- [src/app.ts]
- [src/controllers/auth.controller.ts]
- [src/services/auth.service.ts]
- [src/middleware/auth.middleware.ts]
- [src/validators/auth.schemas.ts]

## Design Notes

- business logic is separated from controllers to keep handlers small
- middleware is kept focused on one responsibility per file
- token handling is centralized in the auth service/controller flow
- validation happens before controller logic
- error propagation is explicit with `try/catch` and central error middleware

## Submission Notes

- replace secrets in `.env` before submitting
- use a clean MongoDB URI for review/demo
- if deployed, enable secure cookies with production HTTPS settings

