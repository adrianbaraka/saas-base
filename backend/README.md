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
    │   │   │   └── schema # all db schemas are defined here eg auth-schema.ts
    │   │   ├── interfaces.ts # custom types defined in the app
    │   │   └── roles.ts # central location defining roles and role convenience functions
    │   └── routes # routes are defined under here grouped by modules and versions
    │       └── v1
    │           └── users
    ├── tests # unit test across the app
    │   └── users.test.ts
    │   └── utils.ts
    └── tsconfig.json
    ├── .gitignore
    └── tsconfig.json

    ```
    ````

- To add a new module create a folder under `src/routes/{v1}/` exporting an elysia app instance and import it in the main file `src/index.ts` file to register it.
- Ideally for each module have the main file that defines the routes and utils file that handles the logic eg `user.ts` and `users.utils.ts`.
- New db tables (models) are defined at `src/lib/db/schema`.
- After defining them generate migrations with `bun run db:generate` and apply them with `bun run db:migrate`

## Security

- BetterAuth is used to provide the authentication layer with a custom addition for user roles.
- An [elysia macro](https://elysiajs.com/patterns/macro) is defined at `src/lib/auth.ts` called `authMacro` that provides a check if the user is authenticated.
- It is used as a first check for guarding routes as shown in `src/routes/v1/users.ts`.

- For role based checks a function `requireRoles()` is defined at `src/lib/roles.ts`.
- It takes a list of roles that are required to perform an action and the user making the request.
- If the user is not in any of the roles a `403 Unauthorised` is returned to break out of the flow.
- New roles should be added to the enum defined in that file.

## Testing

- The app uses [bun:test](https://bun.com/docs/test) as the test runner.
- The tests are located at `tests/*` with a `tests/utils.ts` for convenience mocking functions.
    ```bash
    # run the test suite
    bun test
    ```

## Deployment

TODO
