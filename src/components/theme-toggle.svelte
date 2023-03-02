<script>
	import { theme } from '~/lib/store';
	import { fly } from 'svelte/transition';
	import { tweened } from 'svelte/motion';
	import { onMount } from 'svelte';
	import FullMoon from '~/components/icons/full-moon.astro';
	import Sun from '~/components/icons/sun.astro';
	import LastQuarterMoon from '~/components/icons/last-quarter-moon.astro';

	let themes = ['dark', 'light', 'system'];
	let themeIcons = [FullMoon, Sun, LastQuarterMoon];
	let index = themes.indexOf($theme);

	let mounted = false;
	onMount(() => {
		mounted = true;
	});

	$: $theme = themes[index];
	$: nextIndex = index >= themes.length - 1 ? 0 : index + 1;

	let toastProgress = tweened(0, {
		duration: 800,
	});

	let toggleTheme = () => {
		index = nextIndex;
		toastProgress.set(1);
	};

	$: if ($toastProgress >= 1) {
		toastProgress.set(0);
	}
</script>

{#if mounted}
	<button
		aria-controls="toast"
		class="hover:cursor-pointer"
		on:click={toggleTheme}
		title="Toggle site theme"
		aria-label="Set {themes[nextIndex]} theme"
	>
		<svelte:component this={themeIcons[index]} {...$$restProps} />
	</button>

	{#if $toastProgress > 0}
		<div
			role="status"
			id="toast"
			class="toast border-border fixed right-9 bottom-9 z-20 flex items-center justify-center space-x-3 rounded-xl border-4 bg-background p-4 text-f-high"
			transition:fly={{ y: 100, duration: 600 }}
		>
			Theme set to&nbsp;<b>{themes[index]}</b>
			<!-- icons referenced as images due to bug - not re-rendering when toggling during parent exit transition. possibly https://github.com/sveltejs/svelte/issues/5268-->
			<slot />
			<!-- {#if $theme === 'dark'} -->
			<!-- 	<img -->
			<!-- 		class="w-4 xs:w-6" -->
			<!-- 		src="/icons/full-moon.svg" -->
			<!-- 		alt="dark theme icon: full moon" -->
			<!-- 	/> -->
			<!-- {:else if $theme === 'light'} -->
			<!-- 	<img -->
			<!-- 		class="w-4 xs:w-6" -->
			<!-- 		src="/icons/sun.svg" -->
			<!-- 		alt="light theme icon: sun" -->
			<!-- 	/> -->
			<!-- {:else if $theme === 'system'} -->
			<!-- 	<img -->
			<!-- 		class="w-4 xs:w-6" -->
			<!-- 		src="/icons/last-quarter-moon.svg" -->
			<!-- 		alt="system theme icon: last quarter moon" -->
			<!-- 	/> -->
			<!-- {/if} -->
		</div>
	{/if}
{/if}
