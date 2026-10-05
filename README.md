# NexorAI

The application runs as two independent Node.js processes:

- **Frontend gateway**: serves `templates/index.html`, `templates/login.html`, and the chat API on port `3001`.
- **Authentication backend**: runs MongoDB-backed authentication with Nodemon on port `3002`.

## Development setup

Install dependencies once:

```powershell
npm install
Set-Location backend
npm install
```

Create the root `.env` from [.env.example](./.env.example) and `backend/.env` from [backend/.env.example](./backend/.env.example).
The backend uses the MongoDB database `Users` and stores user records in the `login` collection. The current local login flow does not issue JWTs; authentication state is kept in the browser until JWT support is intentionally added later.

### Terminal 1: frontend gateway

From the repository root:

```powershell
npm run frontend:dev
```

Open `http://localhost:3001`.

### Terminal 2: authentication backend

Run the backend directly from its directory:

```text
cd backend
nodemon server.js
```

The backend reads `backend/.env`, connects to the `Users` MongoDB database, and stores accounts in the `login` collection. The frontend proxies `/users/*` requests to this backend using `PROXY_TARGET`.

For temporary local backend access through the frontend gateway, use:

```text
http://localhost:3001/backend/health
http://localhost:3001/backend/users/login
```

These requests are proxied to `http://localhost:3002` and require the backend process to be running.
The backend starts listening only after MongoDB is connected. If the MongoDB URL, credentials, or Atlas network access are invalid, startup fails clearly and the process exits.

For production-style processes, use `npm run frontend:start` from the root and `node server.js` from `backend` in separate terminals.
