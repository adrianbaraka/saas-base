<script lang="ts">
	import type { BetterAuthUser, UserSessionFull } from '#lib/interfaces.ts';
	import Appbar from '../Layout/Appbar.svelte';
	import MemberLeave from '../members/memberLeave.svelte';
	import Section from '../Section.svelte';
	import ChangePassword from './ChangePassword.svelte';
	import RevokeAllSessions from './RevokeAllSessions.svelte';
	import UserInfo from './UserInfo.svelte';
	import UserSessions from './UserSessions.svelte';

	let {
		me,
		sessions,
		mySession
	}: {
		me: BetterAuthUser;
		sessions: UserSessionFull[];
		mySession: UserSessionFull;
	} = $props();
</script>

<Appbar user={me} title="Manage app settings." description="">
	<div class="flex flex-col flex-wrap items-center justify-center gap-8 md:flex-row">
		<UserInfo user={me} />
		<Section title="Quick Actions" fullWidth>
			<div class="flex flex-col gap-5">
				<ChangePassword />
				<RevokeAllSessions />
				<MemberLeave />
			</div>
		</Section>
		<UserSessions {sessions} {mySession} />
	</div>
</Appbar>
