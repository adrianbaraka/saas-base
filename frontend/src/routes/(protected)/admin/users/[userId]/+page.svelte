<script lang="ts">
	import Appbar from '#lib/components/Layout/Appbar.svelte';
	import BanUnban from '#lib/components/Profile/actions/BanUnban.svelte';
	import EditInfo from '#lib/components/Profile/actions/EditInfo.svelte';
	import RevokeAllSessions from '#lib/components/Profile/actions/RevokeAllSessions.svelte';
	import SendWelcomeEmail from '#lib/components/Profile/actions/SendWelcomeEmail.svelte';
	import RoleChange from '#lib/components/Profile/RoleChange.svelte';
	import UserInfo from '#lib/components/Profile/UserInfo.svelte';
	import UserSessions from '#lib/components/Profile/UserSessions.svelte';
	import Section from '#lib/components/Section.svelte';
	import type { PageProps } from './$types';
	//import UserProfilePage from '#lib/components/Profile/upp.bak';

	let { data }: PageProps = $props();
	let sessions = $derived(data.sessionData?.sessions);

	let isProfile = $derived(data.me?.user.id === data.user.id);
</script>

{#if data.me}
	<Appbar user={data.me.user} title="Manage a user" description={`User info: ${data.user.name}`}>
		<div class="flex flex-wrap flex-col md:flex-row gap-8 items-center justify-center">
			<UserInfo user={data.user} />
			<Section title="Quick Actions" vertical>
				<div class="flex flex-col gap-3">
					<SendWelcomeEmail user={data.user} me={data.me.user} />
					<EditInfo user={data.user} {isProfile} me={data.me.user} />
					<BanUnban user={data.user} me={data.me.user} />
					<RevokeAllSessions me={data.me.user} user={data.user} {isProfile} />
				</div>
			</Section>
			{#if sessions}
				<UserSessions {sessions} mySession={data.me.session} me={data.me.user} {isProfile} />
			{/if}
			{#if data.rolesData}
				<RoleChange user={data.user} me={data.me.user} {isProfile} roles={data.rolesData} />
			{/if}
		</div>
	</Appbar>
{/if}
