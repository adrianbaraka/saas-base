## Deployment

The app is deployed via Docker Compose including database, frontend and backend.

### Building the images

Each service (`base-backend`, `base-frontend`) is built separately

```bash
# build frontend
cd ../frontend
docker build -t UnifyWorks/base-frontend:latest .


# backend
cd ../backend
docker build -t UnifyWorks/base-backend:latest .

docker compose up -d
```

### Services

- **base-db** — Postgres db.
- **base-backend** — the elysia API, only reachable internally (on the `internal` network, no exposed ports).
- **base-frontend** — The only publicly exposed service, reachable on port `3000`.
