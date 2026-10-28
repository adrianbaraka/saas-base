<script lang="ts">
	import type { BetterAuthUser, UserSessionFull } from '#lib';
	import Appbar from '../Layout/Appbar.svelte';
	import Section from '../Section.svelte';
	import ChangePassword from './actions/ChangePassword.svelte';
	import EditInfo from './actions/EditInfo.svelte';
	import RevokeAllSessions from './actions/RevokeAllSessions.svelte';
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
	<div class="flex flex-wrap flex-col md:flex-row gap-8 items-center justify-center">
		<UserInfo user={me} />
		<Section title="Quick Actions" vertical>
			<div class="flex flex-col gap-3">
				<EditInfo {me} user={me} isProfile />
				<ChangePassword />
				<RevokeAllSessions {me} user={me} isProfile />
			</div>
		</Section>
		<UserSessions {sessions} {mySession} isProfile {me} />
	</div>
</Appbar>
