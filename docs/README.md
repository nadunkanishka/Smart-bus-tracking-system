# Documentation

Start with the project [README](../README.md) for what the system is and how it performs. Then:

## Understand it

| Document | What you will find |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Component and sequence diagrams, the ETA engine, the offline buffer, authentication, hosting and delivery, known limits |
| [DESIGN-DECISIONS.md](DESIGN-DECISIONS.md) | The choices behind the design, why, and what each one costs |
| [API.md](API.md) | Every REST endpoint and Socket.IO event |
| [DATABASE.md](DATABASE.md) | Collections, indexes, the ER diagram and the Redis keys |
| [EVALUATION.md](EVALUATION.md) | How latency, ETA accuracy, GPS smoothing and load are measured, the results so far and what they mean |
| [STRUCTURE.md](STRUCTURE.md) | Where every kind of file lives, naming rules, how to add a screen or an endpoint, environment variables |

## Run it

| Document | What you will find |
|---|---|
| [SETUP-LOCAL.md](SETUP-LOCAL.md) | Run the backend, the admin dashboard and both apps on your own computer, with troubleshooting |

## Put it online

Do these in order; each has its own guide.

| Step | Guide | What it gives you |
|---|---|---|
| 1. Database | [SETUP-MONGODB.md](SETUP-MONGODB.md) | A free MongoDB Atlas database, loading the routes, backups |
| 2. Backend and websites | [SETUP-RAILWAY.md](SETUP-RAILWAY.md) | The server on Railway, CORS, then the admin and passenger sites on Vercel |
| 3. Phone apps | [SETUP-APKS.md](SETUP-APKS.md) | Installable Android apps with Expo EAS, and updates without reinstalling |

[DEPLOYMENT.md](DEPLOYMENT.md) is the reference behind them: Docker, Redis, every environment variable, free-hosting limits and the post-deploy checks.

Each part of the code also has a short README: [backend](../backend/README.md), [admin dashboard](../apps/admin-dashboard/README.md), [driver app](../apps/driver-app/README.md), [passenger app](../apps/passenger-app/README.md), [shared design system](../shared/README.md).
