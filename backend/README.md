## Backend

## Code structure

- A high level overview of the system

    ````bash

    ├── compose.yaml # docker compose spec
    ├── drizzle # drizzle migrations are stored here
    ├── drizzle.config.ts # drizzle config
    ├── package.json # dependancies and run scripts
    ├── src
    │   ├── index.ts # main entrypoint of the system
    │   ├── lib
    │   │   ├── auth.ts # better auth configuration
    │   │   ├── db
    │   │   │   ├── index.ts
    │   │   │   ├── queries.ts # a central location for all queries made by the system
    │   │   │   └── schema/ # all db schemas are defined here in the folder eg auth-schema.ts
    │   │   ├── interfaces.ts # custom types defined in the app
    │   │   └── permissions.ts # central location defining roles and permissions
    │   └── routes # routes are defined under here grouped by modules and versions
    │       └── v1
    │           └── template
    │               └── template.ts # define the endpoints
    │               └── template.handlers.ts # business logic
    └── tsconfig.json
    ├── .gitignore
    └── tsconfig.json

    ```
    ````

- To add a new module create a folder under `src/routes/{v1}/` exporting an elysia app instance and import it in the main file `src/index.ts` file to register it.
- Ideally for each module have `module.ts` defining the endpoints and `module.handlers.ts` that has the business logic
- New db tables (models) are defined at `src/lib/db/schema`.
- After defining them generate migrations with `bun run db:generate` and apply them with `bun run db:migrate`

## Security

- BetterAuth is used to provide the authentication layer with a custom addition for user roles.
- An [elysia macro](https://elysiajs.com/patterns/macro) is defined at `src/lib/auth.ts` called `authMacro` that provides a check if the user is authenticated.
- It is used as a first check for guarding routes as shown in `src/routes/v1/template/template.ts`.
- For roles and permissions the file `src/lib/permissions.ts` defines them. To add a new role/permissions add them in this file and add the role in `src/lib/auth.ts` under admin plugin.

## notes
- On startup the app runs migrations to the db.
- Also if no admin user is found one is created using the env vars `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_NAME` and a welcome email is sent to that email. (Currently this is just logged in the terminal.)

<!-- ## Testing

- The app uses [bun:test](https://bun.com/docs/test) as the test runner.
- The tests are located at `tests/*` with a `tests/utils.ts` for convenience mocking functions.
    ```bash
    # run the test suite
    bun test
    ``` -->

    