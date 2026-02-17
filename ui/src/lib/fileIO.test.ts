import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateFilename, saveJsonFile, loadJsonFile } from '$lib/fileIO';

describe('fileIO', () => {
	describe('generateFilename', () => {
		it('uses both names when available', () => {
			expect(generateFilename('Marvin', 'Susie')).toBe('Marvin-Susie-Retirement-Data.json');
		});

		it('uses only primary name when no spouse', () => {
			expect(generateFilename('Marvin', '')).toBe('Marvin-Retirement-Data.json');
		});

		it('falls back to portfolio.json when no names', () => {
			expect(generateFilename('', '')).toBe('portfolio.json');
		});

		it('sanitizes special characters', () => {
			expect(generateFilename("O'Brien", 'Jane')).toBe('OBrien-Jane-Retirement-Data.json');
		});

		it('replaces spaces with dashes', () => {
			expect(generateFilename('Mary Jane', 'Bob')).toBe('Mary-Jane-Bob-Retirement-Data.json');
		});

		it('handles whitespace-only names', () => {
			expect(generateFilename('  ', '  ')).toBe('portfolio.json');
		});
	});

	describe('saveJsonFile', () => {
		let createObjectURL: ReturnType<typeof vi.fn>;
		let revokeObjectURL: ReturnType<typeof vi.fn>;
		let clickSpy: ReturnType<typeof vi.fn>;

		beforeEach(() => {
			createObjectURL = vi.fn().mockReturnValue('blob:test');
			revokeObjectURL = vi.fn();
			clickSpy = vi.fn();
			vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
			vi.spyOn(document, 'createElement').mockReturnValue({
				href: '',
				download: '',
				click: clickSpy,
			} as any);
		});

		afterEach(() => {
			vi.restoreAllMocks();
			delete (window as any).showSaveFilePicker;
		});

		it('uses <a download> fallback when FS API unavailable', async () => {
			delete (window as any).showSaveFilePicker;
			await saveJsonFile({ test: 1 }, 'test.json');
			expect(createObjectURL).toHaveBeenCalled();
			expect(clickSpy).toHaveBeenCalled();
			expect(revokeObjectURL).toHaveBeenCalled();
		});

		it('uses File System Access API when available', async () => {
			const mockWrite = vi.fn();
			const mockClose = vi.fn();
			const mockCreateWritable = vi.fn().mockResolvedValue({ write: mockWrite, close: mockClose });
			(window as any).showSaveFilePicker = vi.fn().mockResolvedValue({
				createWritable: mockCreateWritable,
			});

			await saveJsonFile({ test: 1 }, 'test.json');
			expect((window as any).showSaveFilePicker).toHaveBeenCalledWith({
				suggestedName: 'test.json',
				types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
			});
			expect(mockWrite).toHaveBeenCalled();
			expect(mockClose).toHaveBeenCalled();
			expect(createObjectURL).not.toHaveBeenCalled();
		});

		it('handles user cancellation (AbortError)', async () => {
			const abort = new DOMException('user cancelled', 'AbortError');
			(window as any).showSaveFilePicker = vi.fn().mockRejectedValue(abort);
			await saveJsonFile({ test: 1 }, 'test.json');
			expect(createObjectURL).not.toHaveBeenCalled();
		});

		it('falls back on non-abort errors', async () => {
			(window as any).showSaveFilePicker = vi.fn().mockRejectedValue(new Error('fail'));
			await saveJsonFile({ test: 1 }, 'test.json');
			expect(createObjectURL).toHaveBeenCalled();
		});
	});

	describe('loadJsonFile', () => {
		afterEach(() => {
			vi.restoreAllMocks();
			delete (window as any).showOpenFilePicker;
		});

		it('returns null when FS API unavailable', async () => {
			delete (window as any).showOpenFilePicker;
			expect(await loadJsonFile()).toBeNull();
		});

		it('returns file text when FS API available', async () => {
			const mockFile = { text: vi.fn().mockResolvedValue('{"test":1}') };
			(window as any).showOpenFilePicker = vi.fn().mockResolvedValue([
				{ getFile: vi.fn().mockResolvedValue(mockFile) },
			]);

			const result = await loadJsonFile();
			expect(result).toBe('{"test":1}');
		});

		it('returns null on user cancellation', async () => {
			const abort = new DOMException('cancelled', 'AbortError');
			(window as any).showOpenFilePicker = vi.fn().mockRejectedValue(abort);
			expect(await loadJsonFile()).toBeNull();
		});

		it('returns null on other errors', async () => {
			(window as any).showOpenFilePicker = vi.fn().mockRejectedValue(new Error('fail'));
			expect(await loadJsonFile()).toBeNull();
		});
	});
});
