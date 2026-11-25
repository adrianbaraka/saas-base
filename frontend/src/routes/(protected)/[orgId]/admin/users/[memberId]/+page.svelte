<script lang="ts">
	import Appbar from '#lib/components/Layout/Appbar.svelte';
	import MemberActions from '#lib/components/members/memberActions.svelte';
	import MemberInfo from '#lib/components/members/memberInfo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Appbar user={data.me} title={data.member.name} description="">
	<div class="flex flex-col gap-4">
		<MemberInfo member={data.member} />
		<MemberActions member={data.member} meId={data.me?.id} roles={data.roles} />
	</div>
</Appbar>
