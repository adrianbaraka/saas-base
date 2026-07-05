<script lang="ts">
	import { fly } from 'svelte/transition';
	import ErrorOutlineIcon from '@iconify-svelte/material-symbols/error-outline';
	import WarningOutlineIcon from '@iconify-svelte/material-symbols/warning-outline';
	import CheckCircleOutlineIcon from '@iconify-svelte/material-symbols/check-circle-outline';
	import { dismissToast } from './toastStore.svelte';

	type ToastType = 'error' | 'warning' | 'success';

	let {
		id,
		message,
		type,
		duration
	}: {
		id: number;
		message: string;
		type: ToastType;
		duration: number;
	} = $props();

	const config: Record<ToastType, { class: string; icon: typeof ErrorOutlineIcon }> = {
		error: { class: 'alert-error', icon: ErrorOutlineIcon },
		warning: { class: 'alert-warning', icon: WarningOutlineIcon },
		success: { class: 'alert-success', icon: CheckCircleOutlineIcon }
	};
	let Icon = $derived(config[type].icon);
	let alertClass = $derived(config[type].class);

	$effect(() => {
		const timer = setTimeout(() => dismissToast(id), duration);
		return () => clearTimeout(timer);
	});
</script>

<div class="alert {alertClass}" transition:fly={{ x: 200, duration: 300 }}>
	<Icon height="24" />
	<span>{message}</span>
</div>