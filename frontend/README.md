## Overview

A base frontend for the elysia backend built with [Sveltekit](https://svelte.dev/docs/kit/introduction), [DaisyUI](https://daisyui.com/components/) and [Iconify](https://icon-sets.iconify.design/material-symbols/).

## Folder structure

```bash
.
├── bun.lock
├── Dockerfile # build an image
├── healthCheck.ts # healthcheck script
├── package.json # dependancies and scripts
├── README.md
├── src
│   ├── app.d.ts
│   ├── app.html
│   ├── hooks.server.ts # runs before each request auth is implemented here
│   ├── lib
│   │   ├── assets
│   │   │   └── favicon.svg
│   │   ├── auth-client.ts # better auth client config
│   │   ├── components/ # shared ui components
│   │   │   ├── Appbar.svelte # every page should have this(has the appbar and layout)
│   │   │   ├── MainLayout.svelte # implemented in a modules layout
│   │   ├── index.ts
│   │   ├── roles.ts # simple role check for modules ui. is enforced by the backend
│   │   ├── server # server only functions
│   │   │   ├── backend-fetch.ts # fetches from backend(injects cookie and headers auto)
│   │   │   └── session.ts # fetch session
│   └── routes
│       ├── (auth)
│       │   └── login # login page
│       │       ├── +page.server.ts
│       │       └── +page.svelte
│       ├── +error.svelte
│       ├── health # container healthcheck endpoint
│       ├── layout.css
│       ├── +layout.svelte # main app layout
│       ├── +page.svelte
│       └── (protected) # everything under here requires an authenticated user
│           ├── admin # admin module
│           │   ├── dashboard
│           │   │   ├── +page.server.ts
│           │   │   └── +page.svelte
│           │   ├── +layout.svelte # module layout. has the admin layout the nav links.
│           └── user
│               └── dashboard
│                   ├── +page.server.ts
│                   └── +page.svelte
├── static
│   └── robots.txt
├── tsconfig.json
└── vite.config.ts

```

- For each module under `routes/(protected)` a `+layout.svelte` file holds the links in the side/nav bar implemented by `mainlayout`, example `routes/(protected)/admin/+layout.ts`.
- For each individual page import `appBar.svelte` that provides the page bar and scrollble region.

## Security

- Security is enforced in the `hooks.server.ts` file. Basically all routes under `src/routes/(protected)` require an authenticated user.
- For role specific checks this map is used. In this example to access anything under `/(protected)/admin` the user must have the role `admin`.

  ```TS
  const routeRoles = new Map<string, string>();
  routeRoles.set('/(protected)/admin', 'admin');
  ```

- To access the users info in a page the `+page.server.ts` returns the object and can be accessed in the `+page.svelte`

  ```TS
  // +page.server.ts
  import type { PageServerLoad } from './$types';
  export const load: PageServerLoad = async ({ locals }) => {
      return { session: locals.session };
  };

  // +page.svelte
  <script lang="ts">
      import Appbar from '$lib/components/Appbar.svelte';
      let { data } = $props();
  </script>

  <Appbar title="Default User page" description="" user={data.session?.user}>
      <div>User page</div>
  </Appbar>
  ```

### Adding a new module

1. Create a new folder `src/routes/protected/<module>`
2. Add a `+layout.svelte` file with nav links.
3. If requires a role register it in `src/lib/roles.ts`
4. Wrap each page in `Appbar`

### Notes

- To avoid cors issues any client side fetch to the backend(minimal) is prefixed with `/api` which is then rewritten by `hooks.server.ts` to the backend so from browsers perspective its querying the same origin.
