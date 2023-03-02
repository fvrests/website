import { writable } from 'svelte/store';
import { onMount } from 'svelte';

const storedTheme = localStorage.theme || null;

export const theme = writable(storedTheme || 'system');

let mounted = false;
onMount(() => {
	mounted = true;
});
// runs every time theme changes
theme.subscribe((value) => {
	if (mounted) {
		localStorage.theme = value || null;
		document.querySelector('html').className = value || null;
	}
});
