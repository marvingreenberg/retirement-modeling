import { describe, it, expect, beforeEach } from 'vitest';
import { isDark, initDarkMode, toggleDarkMode } from '$lib/darkMode.svelte';

describe('darkMode', () => {
   beforeEach(() => {
      localStorage.clear();
      document.documentElement.classList.remove('dark');
   });

   it('isDark returns false by default', () => {
      initDarkMode();
      expect(isDark()).toBe(false);
   });

   it('initDarkMode reads localStorage', () => {
      localStorage.setItem('color-scheme', 'dark');
      initDarkMode();
      expect(isDark()).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
   });

   it('toggleDarkMode switches from light to dark', () => {
      initDarkMode();
      toggleDarkMode();
      expect(isDark()).toBe(true);
      expect(localStorage.getItem('color-scheme')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
   });

   it('toggleDarkMode switches from dark to light', () => {
      localStorage.setItem('color-scheme', 'dark');
      initDarkMode();
      toggleDarkMode();
      expect(isDark()).toBe(false);
      expect(localStorage.getItem('color-scheme')).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
   });
});
