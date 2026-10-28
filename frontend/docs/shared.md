## Docs for shared helpers throughout the frontend

## Toast

- Toasts are used to display a result of some action to the user.
- There are 3 types `success`, `warning`, `error`.
- By default the `error` one lasts 5 seconds and the reset 2.5 seconds, but this can be customized per call.
- Multiple toasts can be called at the same time.

### Example

```TS
function handleClick() {
	showToast("A success message green", "success")
    showToast("Warning message yellow", "warning")
	showToast("An error message red", "error", 7000)
}

<button class="btn" onclick={handleClick}>click me</button>
```

## Modal

- This is used when confirmation is needed from the user or some info or form is need but does not warrant its own separate page.
- The example shown is the for the former.

### Example

```html
<script lang="ts">
	import { openModal } from '#lib/components/Modal/modal.svelte';

	async function handleClick() {
		const confirmed = await openModal({
			title: 'Are you sure?',
			content: confirmSnippet
		});
		if (confirmed) {
			console.log('confirmed');
		} else {
			console.log('not confirmed');
		}
	}
</script>

{#snippet confirmSnippet({ confirm, cancel }: { confirm: () => void; cancel: () => void })}
<p class="py-4">This action cannot be undone.</p>
<div class="modal-action">
	<button class="btn" onclick="{cancel}">Cancel</button>
	<button class="btn btn-error" onclick="{confirm}">Confirm</button>
</div>
{/snippet}

<button class="btn" onclick="{handleClick}">click me</button>
```

## Basic Page skeleton

### BackendFetch

- The backendFetch function is a wrapper over the normal fetch that automatically attaches the session cookie and the clientIP to the fetch before calling the backend.
- Mostly used in page server load functions.

### Appbar

- This is the horizontal bar that shows the page title and description and the logged in user with links to settings and logout.

#### Example

```TS
// +page.server.ts
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { UserSessionFull } from '#lib';

export const load: PageServerLoad = async ({ locals }) => {
	let res: Response;
	try {
		res = await locals.backendFetch('/api/auth/list-sessions');
	} catch (e) {
		console.error(e);
		error(503, 'An Unexpected error occurred.');
	}

	switch (res.status) {
		case 401:
			error(401, 'Unauthenticated');
		case 403:
			error(403, 'Unauthorized');
	}

	if (!res.ok) {
		console.error(res.status);
		error(res.status, 'Failed to load user info');
	}

	let userSessions: UserSessionFull[];
	try {
		userSessions = await res.json();
	} catch (e) {
		console.error(e);
		error(503, 'An Unexpected error occurred.');
	}

	return {
		// avoid passing full session unless necessary just user object
		me: locals.session?.user,
		allMySessions: userSessions
	};
};

```

```html
<!-- +page.svelte -->
<script lang="ts">
	import Appbar from '#lib/components/Appbar.svelte';
	let { data } = $props();
</script>

<Appbar title="Default User page" description="" user="{data.me}">
	<div>User page for non admin</div>
</Appbar>
```
