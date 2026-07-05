<script lang="ts">
	import { flip } from 'svelte/animate';
	import Toast from './Toast.svelte';
	import { getToasts } from './toastStore.svelte';
</script>

<div class="toast toast-center toast-top lg:toast-end z-50 gap-2">
	{#each getToasts() as toast (toast.id)}
		<div animate:flip={{ duration: 300 }}>
			<Toast {...toast} />
		</div>
	{/each}
</div>