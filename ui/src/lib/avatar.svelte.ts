const DICEBEAR_BASE = 'https://api.dicebear.com/9.x/notionists/svg';

export function avatarUrl(seed: string): string {
   if (!seed) return '';
   return `${DICEBEAR_BASE}?seed=${encodeURIComponent(seed)}`;
}

export function avatarSrc(seed: string, cachedSvg?: string): string {
   if (cachedSvg) return cachedSvg;
   return avatarUrl(seed);
}

let debounceTimer: ReturnType<typeof setTimeout> | undefined;

export function fetchAvatarSvg(
   seed: string,
   onCached: (dataUri: string) => void,
): void {
   clearTimeout(debounceTimer);
   if (!seed) return;
   debounceTimer = setTimeout(async () => {
      try {
         const resp = await fetch(avatarUrl(seed));
         if (!resp.ok) return;
         const svgText = await resp.text();
         const dataUri = `data:image/svg+xml;base64,${btoa(svgText)}`;
         onCached(dataUri);
      } catch {
         /* network failure — remote URL still works as fallback */
      }
   }, 500);
}
