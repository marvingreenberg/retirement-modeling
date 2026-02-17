let dark = $state(false);

export function isDark(): boolean {
	return dark;
}

export function initDarkMode() {
	dark = localStorage.getItem('color-scheme') === 'dark';
	document.documentElement.classList.toggle('dark', dark);
}

export function toggleDarkMode() {
	dark = !dark;
	document.documentElement.classList.toggle('dark', dark);
	localStorage.setItem('color-scheme', dark ? 'dark' : 'light');
}
