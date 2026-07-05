<script lang="ts">
	import type { BetterAuthSession, BetterAuthUser, Role, UserSessionFull } from '$lib';
	import Appbar from '../Appbar.svelte';
	import QuickActions from './QuickActions.svelte';
	import RoleChange from './RoleChange.svelte';
	import UserInfo from './UserInfo.svelte';
	import UserSessions from './UserSessions.svelte';

	let {
		mySession,
		userToShow,
		isProfile,
		allSessionsToShow,
		roles
	}: {
		mySession: BetterAuthSession;
		userToShow: BetterAuthUser;
		isProfile: boolean;
		allSessionsToShow?: UserSessionFull[] | null | undefined;
		roles?: Role[] | null;
	} = $props();

	function appBarDetails() {
		if (isProfile) {
			return {
				title: 'My Profile',
				description: `User Profile: ${mySession.user.name}`
			};
		} else {
			return {
				title: 'Manage Individual Users',
				description: `User Profile: ${userToShow?.name}`
			};
		}
	}
</script>

<Appbar
	title={appBarDetails().title}
	description={appBarDetails().description}
	user={mySession.user}
>
	<div class="">
		<div class="flex flex-wrap flex-col md:flex-row gap-8 items-center justify-center">
			<UserInfo user={userToShow} />
			<QuickActions user={userToShow} me={mySession.user} {isProfile} />
			{#if allSessionsToShow}
				<UserSessions sessions={allSessionsToShow} mySession={mySession.session} me={mySession.user} isProfile={isProfile}/>
			{/if}

			{#if !isProfile && mySession.user.role === 'admin' && roles}
				<RoleChange user={userToShow} me={mySession.user} {roles} {isProfile} />
			{/if}
		</div>
	</div>
</Appbar>
