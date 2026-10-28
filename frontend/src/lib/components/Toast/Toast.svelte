<script lang="ts">
	import { fly } from 'svelte/transition';
	import ErrorOutlineIcon from '@iconify-svelte/material-symbols/error-outline';
	import WarningOutlineIcon from '@iconify-svelte/material-symbols/warning-outline';
	import CheckCircleOutlineIcon from '@iconify-svelte/material-symbols/check-circle-outline';
	import CloseIcon from '@iconify-svelte/material-symbols/close';
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
		duration?: number;
	} = $props();

	const config: Record<
		ToastType,
		{ class: string; icon: typeof ErrorOutlineIcon; role: 'alert' | 'status' }
	> = {
		error: { class: 'alert-error', icon: ErrorOutlineIcon, role: 'alert' },
		warning: { class: 'alert-warning', icon: WarningOutlineIcon, role: 'alert' },
		success: { class: 'alert-success', icon: CheckCircleOutlineIcon, role: 'status' }
	};
	let Icon = $derived(config[type].icon);
	let alertClass = $derived(config[type].class);
	let role = $derived(config[type].role);

	// Timer bookkeeping — plain (non-reactive) state, since it's internal to the
	// effect and doesn't drive any markup.
	let remaining: number | undefined;
	let timerStart = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;

	function startTimer(ms: number) {
		timerStart = Date.now();
		timer = setTimeout(() => dismissToast(id), ms);
	}

	function clearTimer() {
		if (timer) {
			clearTimeout(timer);
			timer = undefined;
		}
	}

	function pause() {
		if (remaining === undefined || !timer) return;
		clearTimer();
		remaining -= Date.now() - timerStart;
	}

	function resume() {
		if (remaining === undefined || remaining <= 0 || timer) return;
		startTimer(remaining);
	}

	$effect(() => {
		if (duration === undefined) return; // persistent toast (e.g. error)
		remaining = duration;
		startTimer(duration);
		return clearTimer;
	});
</script>

<div
	class="alert max-w-md text-wrap {alertClass} transition-all duration-200 hover:scale-105"
	{role}
	transition:fly={{ x: 200, duration: 300 }}
	onmouseenter={pause}
	onmouseleave={resume}
	onfocusin={pause}
	onfocusout={resume}
>
	<Icon height="24" />
	<span>{message}</span>
	<button
		type="button"
		class="btn ml-auto btn-circle btn-ghost btn-sm"
		aria-label="Dismiss"
		onclick={() => dismissToast(id)}
	>
		<div class="text-base">
			<CloseIcon height="18" />
		</div>
	</button>
</div>
