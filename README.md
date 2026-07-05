# Base

- A base template for a full stack app complete with a frontend and backend.

## Backend

- This repo features a basic setup of a backend with authentication, role based access and user management api endpoints.
- It uses [elysia](https://elysiajs.com/) as the backend framework, [betterAuth](https://better-auth.com/) for authentication and [drizzle](https://orm.drizzle.team/) that handles db migrations and the ORM.
- Bun is used as the runtime though this can be changed for node. The tests however are bun dependant.
- [Postgres](https://www.postgresql.org/) is the db used run via docker.

### Local backend Development

- The following are required: [Bun](https://bun.com/), [Docker](https://www.docker.com/get-started/).

- Populate the .env file and spin up the postgres container

    ```bash
    cd backend
    
    # unix
    cp .env.example .env

    # set up the database
    docker compose up -d
    ```

- Install dependancies, run migrations and start the development server.

    ```bash
    # dependancies
    bun install

    # migrations
    bun run db:migrate

    # dev server
    bun run dev
    ```

- The server is running at `http://localhost:3000`
- Visit [http://localhost:3000/openapi](http://localhost:3000/openapi) for the openAPI docs for testing.

## Frontend

#### Local Development
The prerequisites needed are Bun and the running backend.

````bash
# configure env variables to connect to backend
cp .env.example env

# install deps
bun install

# run dev server
bun run dev
````
If everything is fine the server should be up at [http://localhost:5173](http://localhost:5173).