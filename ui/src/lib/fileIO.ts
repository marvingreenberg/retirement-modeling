export function generateFilename(primaryName: string, spouseName: string): string {
	const sanitize = (s: string) =>
		s.trim().replace(/[^a-zA-Z0-9 -]/g, '').replace(/\s+/g, '-');
	const parts: string[] = [];
	if (primaryName.trim()) parts.push(sanitize(primaryName));
	if (spouseName.trim()) parts.push(sanitize(spouseName));
	if (parts.length === 0) return 'portfolio.json';
	return `${parts.join('-')}-Retirement-Data.json`;
}

function hasFileSystemAccess(): boolean {
	return typeof window !== 'undefined' && 'showSaveFilePicker' in window;
}

export async function saveJsonFile(data: object, filename: string): Promise<void> {
	const json = JSON.stringify(data, null, 2);
	if (hasFileSystemAccess()) {
		try {
			const handle = await (window as any).showSaveFilePicker({
				suggestedName: filename,
				types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
			});
			const writable = await handle.createWritable();
			await writable.write(json);
			await writable.close();
			return;
		} catch (e: any) {
			if (e.name === 'AbortError') return;
		}
	}
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export async function saveTextFile(text: string, filename: string): Promise<void> {
	if (hasFileSystemAccess()) {
		try {
			const handle = await (window as any).showSaveFilePicker({
				suggestedName: filename,
				types: [{ description: 'Text Files', accept: { 'text/plain': ['.txt'] } }],
			});
			const writable = await handle.createWritable();
			await writable.write(text);
			await writable.close();
			return;
		} catch (e: any) {
			if (e.name === 'AbortError') return;
		}
	}
	const blob = new Blob([text], { type: 'text/plain' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export async function loadJsonFile(): Promise<string | null> {
	if (typeof window === 'undefined' || !('showOpenFilePicker' in window)) return null;
	try {
		const [handle] = await (window as any).showOpenFilePicker({
			types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
			multiple: false,
		});
		const file = await handle.getFile();
		return await file.text();
	} catch (e: any) {
		if (e.name === 'AbortError') return null;
		return null;
	}
}
