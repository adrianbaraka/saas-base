<script lang="ts">
	import Appbar from '#lib/components/Layout/Appbar.svelte';
	import StatCard from '#lib/components/StatCard.svelte';
	import type { PageData } from './$types';
	import KeyboardArrowRightIcon from '@iconify-svelte/material-symbols/keyboard-arrow-right';
	import ViewModuleIcon from '@iconify-svelte/material-symbols/view-module';
	import GroupsIcon from '@iconify-svelte/material-symbols/groups';
	import ShieldIcon from '@iconify-svelte/material-symbols/shield';
	import VerifiedUserIcon from '@iconify-svelte/material-symbols/verified-user';
	import AnalyticsIcon from '@iconify-svelte/material-symbols/analytics';

	let { data }: { data: PageData } = $props();
	const { modules, roles } = $derived(data.rolesFull);

	let expandedModules = $derived(new Set(data.rolesFull.modules.map((m) => m.module)));

	//  handle selecting roles
	let selectedRoles = $derived(new Set(roles.map((r) => r.role)));
	function toggleRole(role: string) {
		const next = new Set(selectedRoles);

		if (next.has(role)) {
			next.delete(role);
		} else {
			next.add(role);
		}

		selectedRoles = next;
	}
	const visibleRoles = $derived(roles.filter((role) => selectedRoles.has(role.role)));
	function selectAllRoles() {
		selectedRoles = new Set(roles.map((r) => r.role));
	}

	function clearRoles() {
		selectedRoles = new Set();
	}
	function toggleModule(moduleName: string) {
		const next = new Set(expandedModules);

		if (next.has(moduleName)) {
			next.delete(moduleName);
		} else {
			next.add(moduleName);
		}

		expandedModules = next;
	}

	function hasPermission(roleName: string, moduleName: string, action: string): boolean {
		const role = roles.find((r) => r.role === roleName);
		return role?.permissions[moduleName]?.includes(action) ?? false;
	}

	function stats() {
		const totalPermissions = modules.reduce((sum, module) => sum + module.actions.length, 0);

		const assignedPermissions = roles.reduce((sum, role) => {
			return (
				sum + Object.values(role.permissions).reduce((count, actions) => count + actions.length, 0)
			);
		}, 0);
		const avgPermissionsPerRole =
			roles.length === 0 ? 0 : Math.round(assignedPermissions / roles.length);

		return [
			{
				title: 'Total Modules',
				value: `${modules.length}`,
				desc: 'Modules in the system',
				color: 'text-blue-700',
				Icon: ViewModuleIcon
			},
			{
				title: 'Roles',
				value: `${roles.length}`,
				desc: 'Defined system roles',
				color: 'text-green-700',
				Icon: GroupsIcon
			},
			{
				title: 'Permission Rules',
				value: `${totalPermissions}`,
				desc: 'Available module actions',
				color: 'text-purple-700',
				Icon: ShieldIcon
			},
			{
				title: 'Granted Permissions',
				value: `${assignedPermissions}`,
				desc: 'Permissions assigned to roles',
				color: 'text-orange-700',
				Icon: VerifiedUserIcon
			},
			{
				title: 'Avg Permissions / Role',
				value: `${avgPermissionsPerRole}`,
				desc: 'Average permissions granted',
				color: 'text-cyan-700',
				Icon: AnalyticsIcon
			}
		];
	}
</script>

<Appbar
	user={data.me}
	title="Roles and Permissions"
	description="An overview of system access, tracking active roles, protected modules, and total permission rules."
>
	<div class="flex flex-wrap pb-5 gap-5">
		{#each stats() as stat}
			<StatCard
				title={stat.title}
				value={stat.value}
				desc={stat.desc}
				color={stat.color}
				Icon={stat.Icon}
			/>
		{/each}
	</div>
	{@render ListRoles()}
	{#each modules as { module, actions }}
		{@const isExpanded = expandedModules.has(module)}

		<div class="mb-6 rounded-lg border border-base-300 overflow-hidden">
			<!-- Module Header -->
			<button
				class="bg-base-300 hover:bg-base-200 flex w-full items-center gap-2 px-4 py-3 text-left font-bold"
				onclick={() => toggleModule(module)}
			>
				<span class="transition-transform duration-200" class:rotate-90={isExpanded}>
					<KeyboardArrowRightIcon height="24" />
				</span>

				{module}
				({actions.length} actions)
			</button>

			{#if isExpanded}
				<div class="overflow-x-auto">
					<table class="table min-w-max">
						<thead>
							<tr class="bg-primary text-primary-content">
								<th class="sticky left-0 bg-primary whitespace-nowrap"> Action </th>

								{#each visibleRoles as role}
									<th class="text-center whitespace-nowrap">
										{role.role}
									</th>
								{/each}
							</tr>
						</thead>

						<tbody>
							{#each actions as action}
								<tr class="hover:bg-base-300">
									<td
										class="sticky left-0 z-10 bg-base-100 whitespace-nowrap font-medium hover:bg-base-300"
									>
										{action}
									</td>

									{#each visibleRoles as role}
										<td class="text-center">
											{#if hasPermission(role.role, module, action)}
												<span class="text-success font-bold">✓</span>
											{/if}
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/each}
</Appbar>

{#snippet ListRoles()}
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-2xl font-bold">Permission Matrix</h2>

		<div class="dropdown dropdown-end">
			<div tabindex="0" role="button" class="btn btn-outline">
				Roles ({visibleRoles.length}/{roles.length})
			</div>

			<div
				tabindex="-1"
				class="dropdown-content z-50 mt-2 w-64 rounded-box border border-base-300 bg-base-100 p-2 shadow-xl"
			>
				<div class="flex flex-wrap gap-4">
					{#each roles as role}
						<label class="label cursor-pointer justify-start gap-5">
							<input
								type="checkbox"
								class="checkbox checkbox-primary checkbox-sm"
								checked={selectedRoles.has(role.role)}
								onchange={() => toggleRole(role.role)}
							/>

							<span class="label-text capitalize">{role.role}</span>
						</label>
					{/each}
				</div>

				<div class="divider my-2"></div>

				<div class="flex gap-2">
					<button class="btn btn-sm btn-primary flex-1" onclick={selectAllRoles}>
						Select All
					</button>

					<button class="btn btn-sm btn-ghost flex-1" onclick={clearRoles}> Clear </button>
				</div>
			</div>
		</div>
	</div>
{/snippet}
