# IdeaVault Server

Backend API for **IdeaVault** — a platform where users can share, discover, and collaborate on ideas. Built with Express.js, Better Auth, and MongoDB.

## Tech Stack

| Layer        | Technology                              |
| ------------ | --------------------------------------- |
| Runtime      | [Node.js](https://nodejs.org/)          |
| Framework    | [Express 5](https://expressjs.com/)     |
| Auth         | [Better Auth](https://better-auth.com/) |
| Database     | [MongoDB](https://www.mongodb.com/)     |
| Deployment   | [Vercel](https://vercel.com/)           |

## Project Structure

```
├── api/
│   └── index.js          # Vercel serverless entry point
├── routes/
│   └── ideas.js          # Ideas CRUD + comments routes
├── app.js                # Express app setup (middleware, routes)
├── auth.js               # Better Auth configuration (MongoDB adapter)
├── auth-client.js        # Client-side Better Auth client helper
├── index.js              # Local dev server entry point
├── package.json
├── vercel.json           # Vercel deployment config
└── .env                  # Environment variables (see below)
```

## Features

### Authentication
- Email & password sign-up / sign-in
- Google OAuth social login
- Session-based auth via Better Auth
- Middleware-protected routes via `requireAuth`

### Ideas API
- **Create** — Submit a new idea with title, description, category, tags, budget, etc.
- **Read** — Fetch paginated ideas, single idea with author name, or your own ideas
- **Update** — Edit your own ideas (owner-only)
- **Delete** — Remove your own ideas (owner-only)
- **Search** — Case-insensitive title search via `?search=` query
- **Filter** — Filter by `?category=`
- **Trending** — Top 6 ideas sorted by comment count
- **Interacted** — Ideas the current user has commented on

### Comments API
- **Add** — Post a comment on any idea (500 char limit)
- **Edit** — Update your own comments
- **Delete** — Remove your own comments


> **Deployment on Vercel:** Replace the local URLs with your production URLs.

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB instance (local or Atlas)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure .env (see above)

# 3. Start the server
node index.js
```

The server starts at `http://localhost:5000` by default (configurable via `PORT` env).

## API Reference

All endpoints are prefixed with `/api`.

### Authentication

Better Auth handles auth endpoints under `/api/auth/*`.  
Available actions: sign-up, sign-in, sign-out, session, etc.  
See [Better Auth docs](https://better-auth.com/docs) for the full list.

| Endpoint | Description |
| -------- | ----------- |
| `GET /api/me` | Get current user session |

### Ideas

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| `POST`   | `/api/ideas`             | ✅ Required  | Create a new idea |
| `GET`    | `/api/ideas`             | ❌ Optional  | List ideas (paginated) |
| `GET`    | `/api/ideas/my`          | ✅ Required  | List current user's ideas |
| `GET`    | `/api/ideas/interacted`  | ✅ Required  | Ideas the user commented on |
| `GET`    | `/api/ideas/trending`    | ❌ Optional  | Top 6 trending ideas |
| `GET`    | `/api/ideas/:id`         | ❌ Optional  | Get single idea with author |
| `PUT`    | `/api/ideas/:id`         | ✅ Required  | Update own idea (owner only) |
| `DELETE` | `/api/ideas/:id`         | ✅ Required  | Delete own idea (owner only) |

**Query parameters for `GET /api/ideas`:**
| Param      | Type   | Default | Description |
| ---------- | ------ | ------- | ----------- |
| `limit`    | number | 20      | Results per page (max 100) |
| `skip`     | number | 0       | Results to skip (for pagination) |
| `category` | string | —       | Filter by category |
| `search`   | string | —       | Case-insensitive title search |

### Comments

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| `POST`   | `/api/ideas/:id/comments`            | ✅ Required | Add a comment |
| `PUT`    | `/api/ideas/:id/comments/:commentId` | ✅ Required | Edit own comment |
| `DELETE` | `/api/ideas/:id/comments/:commentId` | ✅ Required | Delete own comment |

## Deployment

This project is configured for **Vercel** serverless deployment.

```bash
# Deploy via Vercel CLI
vercel --prod
```

The [`vercel.json`](vercel.json) routes all traffic through `api/index.js`, which exports the Express app as a serverless function.

Set all environment variables in your Vercel project dashboard.

## Author

**Mahathir Mohammod**  
GitHub: [@Mahathir-Mohammod](https://github.com/Mahathir-Mohammod)
