<script lang="ts" module>
	export { field, textInput, ModeControl };
	import EditIcon from '@iconify-svelte/material-symbols/edit';
	import VisibilityIcon from '@iconify-svelte/material-symbols/visibility';
</script>

{#snippet field(label: string, value: string)}
	<div class="max-w-full grow overflow-hidden border-b border-base-200 px-6 py-4 lg:basis-1/3">
		<span class="text-xs font-medium tracking-widest text-base-content/70 uppercase">{label}</span>
		<div class="mt-1 font-medium wrap-break-word text-base-content">{value}</div>
	</div>
{/snippet}

{#snippet textInput(
	label: string,
	value: string,
	onInput: (v: string) => void,
	required = true,
	options: {
		type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'password' | 'url';
		placeholder?: string;
		maxlength?: number;
		min?: string | number;
		max?: string | number;
		disabled?: boolean;
	} = {}
)}
	<fieldset
		class="fieldset max-w-full grow overflow-hidden border-b border-base-200 px-6 py-4 lg:basis-1/3"
	>
		<legend
			class="fieldset-legend text-xs font-medium tracking-widest text-base-content/70 uppercase"
		>
			{label}
			{#if required}
				<span class="text-error">*</span>
			{/if}
		</legend>
		<input
			type={options.type ?? 'text'}
			class="input-bordered input mt-1 w-full"
			{value}
			{required}
			placeholder={options.placeholder}
			maxlength={options.maxlength}
			min={options.min}
			max={options.max}
			disabled={options.disabled}
			oninput={(e) => onInput(e.currentTarget.value)}
		/>
	</fieldset>
{/snippet}

{#snippet ModeControl(mode: 'view' | 'edit', setMode: (next: 'view' | 'edit') => void)}
	<div class="dropdown dropdown-end" title={mode === 'edit' ? 'Editing' : 'Viewing'}>
		<button
			tabindex="0"
			class="btn btn-circle gap-1 btn-sm btn-warning"
			onkeydown={(e) => {
				if (e.key === 'Escape') e.currentTarget.blur();
			}}
		>
			{#if mode === 'view'}
				<VisibilityIcon class="h-4 w-4" />
			{:else}
				<EditIcon class="h-4 w-4" />
			{/if}
		</button>

		<ul class="dropdown-content menu z-10 mt-1 w-56 menu-sm rounded-box bg-base-100 p-1 shadow">
			<li>
				<button
					type="button"
					onclick={() => {
						setMode('edit');
						(document.activeElement as HTMLElement)?.blur();
					}}
				>
					<EditIcon class="h-4 w-4" />

					<div class="flex flex-col items-start">
						<span class="font-medium">Editing</span>
						<span class="text-xs opacity-60">Edit form</span>
					</div>

					{#if mode === 'edit'}
						<span class="ml-auto">✓</span>
					{/if}
				</button>
			</li>

			<li>
				<button
					type="button"
					onclick={() => {
						setMode('view');
						(document.activeElement as HTMLElement)?.blur();
					}}
				>
					<VisibilityIcon class="h-4 w-4" />

					<div class="flex flex-col items-start">
						<span class="font-medium">Viewing</span>
						<span class="text-xs opacity-60">Read form content.</span>
					</div>

					{#if mode === 'view'}
						<span class="ml-auto">✓</span>
					{/if}
				</button>
			</li>
		</ul>
	</div>
{/snippet}
