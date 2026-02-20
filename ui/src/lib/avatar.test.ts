import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { avatarUrl, avatarSrc, fetchAvatarSvg } from '$lib/avatar.svelte';

describe('avatar', () => {
   describe('avatarUrl', () => {
      it('returns notionists URL for a seed', () => {
         expect(avatarUrl('Mike')).toBe(
            'https://api.dicebear.com/9.x/notionists/svg?seed=Mike',
         );
      });

      it('encodes special characters in seed', () => {
         expect(avatarUrl('Jane Doe')).toContain('seed=Jane%20Doe');
      });

      it('returns empty string for empty seed', () => {
         expect(avatarUrl('')).toBe('');
      });
   });

   describe('avatarSrc', () => {
      it('returns cached data URI when available', () => {
         const cached = 'data:image/svg+xml;base64,abc123';
         expect(avatarSrc('Mike', cached)).toBe(cached);
      });

      it('returns remote URL when no cache', () => {
         expect(avatarSrc('Mike')).toBe(
            'https://api.dicebear.com/9.x/notionists/svg?seed=Mike',
         );
      });

      it('returns remote URL when cache is undefined', () => {
         expect(avatarSrc('Mike', undefined)).toContain('notionists');
      });

      it('returns empty string for empty seed with no cache', () => {
         expect(avatarSrc('')).toBe('');
      });

      it('returns cached URI even with empty seed', () => {
         const cached = 'data:image/svg+xml;base64,abc';
         expect(avatarSrc('', cached)).toBe(cached);
      });
   });

   describe('fetchAvatarSvg', () => {
      beforeEach(() => {
         vi.useFakeTimers();
      });

      afterEach(() => {
         vi.useRealTimers();
         vi.restoreAllMocks();
      });

      it('fetches SVG and calls back with data URI after debounce', async () => {
         const svgText =
            '<svg xmlns="http://www.w3.org/2000/svg"><circle/></svg>';
         vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
               ok: true,
               text: () => Promise.resolve(svgText),
            }),
         );

         const onCached = vi.fn();
         fetchAvatarSvg('Mike', onCached);

         expect(onCached).not.toHaveBeenCalled();
         vi.advanceTimersByTime(500);
         await vi.runAllTimersAsync();

         expect(fetch).toHaveBeenCalledWith(
            'https://api.dicebear.com/9.x/notionists/svg?seed=Mike',
         );
         expect(onCached).toHaveBeenCalledWith(
            `data:image/svg+xml;base64,${btoa(svgText)}`,
         );
      });

      it('does nothing for empty seed', () => {
         vi.stubGlobal('fetch', vi.fn());
         const onCached = vi.fn();
         fetchAvatarSvg('', onCached);
         vi.advanceTimersByTime(1000);
         expect(fetch).not.toHaveBeenCalled();
         expect(onCached).not.toHaveBeenCalled();
      });

      it('ignores fetch failure', async () => {
         vi.stubGlobal(
            'fetch',
            vi.fn().mockRejectedValue(new Error('network')),
         );
         const onCached = vi.fn();
         fetchAvatarSvg('Mike', onCached);
         vi.advanceTimersByTime(500);
         await vi.runAllTimersAsync();
         expect(onCached).not.toHaveBeenCalled();
      });

      it('ignores non-ok response', async () => {
         vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
         const onCached = vi.fn();
         fetchAvatarSvg('Mike', onCached);
         vi.advanceTimersByTime(500);
         await vi.runAllTimersAsync();
         expect(onCached).not.toHaveBeenCalled();
      });

      it('debounces rapid calls', async () => {
         const svgText = '<svg/>';
         vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
               ok: true,
               text: () => Promise.resolve(svgText),
            }),
         );

         const onCached = vi.fn();
         fetchAvatarSvg('M', onCached);
         vi.advanceTimersByTime(100);
         fetchAvatarSvg('Mi', onCached);
         vi.advanceTimersByTime(100);
         fetchAvatarSvg('Mike', onCached);
         vi.advanceTimersByTime(500);
         await vi.runAllTimersAsync();

         expect(fetch).toHaveBeenCalledTimes(1);
         expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('seed=Mike'),
         );
      });
   });
});
