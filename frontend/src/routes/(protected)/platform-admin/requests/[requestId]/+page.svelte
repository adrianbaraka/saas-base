<script lang="ts">
	import Appbar from '$lib/components/Layout/Appbar.svelte';
	import AcceptTenancy from '$lib/components/Profile/actions/AcceptTenancy.svelte';
	import RejectTenancy from '$lib/components/Profile/actions/RejectTenancy.svelte';
	import Section from '$lib/components/Section.svelte';
	let { data } = $props();

	function formatDate(value: string | null) {
		return value ? new Date(value).toLocaleString() : '—';
	}
</script>

<Appbar user={data.me} title="Review a request" description="">
	<div class="flex flex-wrap flex-col md:flex-row gap-8 items-center justify-center">
		<Section title={data.req.request.name} badge={status}>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 p-3">
				<div class="flex flex-col gap-4">
					<p class="text-sm text-base-content/90">Organization name</p>
					<p class="font-medium">{data.req.request.name}</p>
				</div>
				<div class="flex flex-col gap-4">
					<p class="text-sm text-base-content/90">Requested by</p>
					<p class="font-medium">{data.req.request.requestedBy}</p>
				</div>
				<div class="flex flex-col gap-4">
					<p class="text-sm text-base-content/90">Created</p>
					<p class="font-medium">{formatDate(data.req.request.createdAt)}</p>
				</div>
				<div class="flex flex-col gap-4">
					<p class="text-sm text-base-content/90">Last updated</p>
					<p class="font-medium">{formatDate(data.req.request.updatedAt)}</p>
				</div>

				{#if data.req.request.status !== 'pending'}
					<div class="md:col-span-2 divider my-0"></div>

					<div class="flex flex-col gap-4">
						<p class="text-sm text-base-content/90">Reviewed by</p>
						<p class="font-medium">{data.req.request.reviewedBy ?? '—'}</p>
					</div>
					<div class="flex flex-col gap-4">
						<p class="text-sm text-base-content/90">Reviewed at</p>
						<p class="font-medium">{formatDate(data.req.request.reviewedAt)}</p>
					</div>
				{/if}

				{#if data.req.request.status === 'rejected' && data.req.request.rejectionReason}
					<div class="md:col-span-2 divider my-0"></div>
					<div class="md:col-span-2 gap-4">
						<p class="text-sm text-base-content/90">Rejection reason</p>
						<p class="font-medium">{data.req.request.rejectionReason}</p>
					</div>
				{/if}
			</div>
		</Section>
		<Section title="Quick Actions" vertical>
			<div class="flex flex-col gap-3">
				<AcceptTenancy request={data.req.request} />
				<RejectTenancy request={data.req.request} />
			</div>
		</Section>
	</div>
</Appbar>

{#snippet status()}
	{#if data.req.request.status === 'pending'}
		<div class="badge badge-warning">Pending</div>
	{:else if data.req.request.status === 'rejected'}
		<div class="badge badge-error">Rejected</div>
	{:else}
		<div class="badge badge-success">Approved</div>
	{/if}
{/snippet}
