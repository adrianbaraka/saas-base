<!-- UserDetailsFields.svelte -->
<script lang="ts">
	import type { Role } from '$lib';

	let { roles }: { roles: Role[] } = $props();
	let selectedRole = $derived(roles[0].name);
</script>

<fieldset class="fieldset">
	<legend class="fieldset-legend">First Name <span class="text-error">*</span></legend>
	<input type="text" name="firstName" id="firstName" class="input w-full" required />
</fieldset>

<fieldset class="fieldset">
	<legend class="fieldset-legend">Middle Name</legend>
	<input type="text" name="middleName" id="middleName" class="input w-full" />
</fieldset>

<fieldset class="fieldset">
	<legend class="fieldset-legend">Last Name <span class="text-error">*</span></legend>
	<input type="text" name="lastName" id="lastName" class="input w-full" required />
</fieldset>

<fieldset class="fieldset">
	<legend class="fieldset-legend">Email <span class="text-error">*</span></legend>
	<input type="email" name="email" id="email" class="input w-full" required />
</fieldset>

<fieldset class="fieldset md:col-span-2">
	<legend class="fieldset-legend">Role <span class="text-error">*</span></legend>
	<select
		bind:value={selectedRole}
		name="role"
		id="role"
		class="select select-bordered w-full"
		required
	>
		{#each roles as role}
			<option value={role.name}>{role.name}</option>
		{/each}
	</select>
	<p class="label mt-2 text-wrap">
		{roles.find((r) => r.name === selectedRole)?.description ?? ''}
	</p>
</fieldset>
