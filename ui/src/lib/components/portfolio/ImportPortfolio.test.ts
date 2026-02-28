import {
   describe,
   it,
   expect,
   vi,
   beforeAll,
   beforeEach,
   afterEach,
} from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ImportPortfolio from './ImportPortfolio.svelte';

// jsdom doesn't support Blob.prototype.text() — polyfill it
beforeAll(() => {
   if (!Blob.prototype.text) {
      Blob.prototype.text = function () {
         return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(this);
         });
      };
   }
});

// Mock parsers
const mockHoldings = [
   {
      symbol: 'VTI',
      units: 100,
      unit_price: 250,
      total_value: 25000,
      security_type: 'STOCK',
   },
];

vi.mock('$lib/ofxParser', () => ({
   parseOFX: vi.fn(() => [
      {
         account_id: 'OFX123',
         broker: 'Vanguard',
         account_type: null,
         holdings: mockHoldings,
         total_value: 50000,
         cash_balance: 25000,
         as_of_date: null,
      },
   ]),
}));
vi.mock('$lib/csvParser', () => ({
   parseCSV: vi.fn(() => [
      {
         account_id: 'CSV456',
         broker: 'Fidelity',
         account_type: null,
         holdings: [],
         total_value: 30000,
         cash_balance: 30000,
         as_of_date: null,
      },
   ]),
}));

async function uploadFiles(input: HTMLInputElement, files: File[]) {
   Object.defineProperty(input, 'files', { value: files, configurable: true });
   await fireEvent.change(input);
   // Advance past file.text() microtasks and the 1-second minimum spinner delay
   await vi.advanceTimersByTimeAsync(1100);
}

describe('ImportPortfolio', () => {
   beforeEach(() => {
      vi.clearAllMocks();
      vi.useFakeTimers();
   });

   afterEach(() => {
      vi.useRealTimers();
   });

   it('renders Import Accounts button', () => {
      render(ImportPortfolio, { accounts: [] });
      expect(screen.getByText('Import Accounts')).toBeInTheDocument();
   });

   it('has file input accepting .ofx,.qfx,.csv with multiple attribute', () => {
      render(ImportPortfolio, { accounts: [] });
      const input = document.querySelector(
         'input[type="file"]',
      ) as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.accept).toBe('.ofx,.qfx,.csv');
      expect(input.multiple).toBe(true);
   });

   it('shows modal with combined accounts after multi-file upload', async () => {
      const { parseOFX } = await import('$lib/ofxParser');
      const { parseCSV } = await import('$lib/csvParser');

      render(ImportPortfolio, { accounts: [] });
      const input = document.querySelector(
         'input[type="file"]',
      ) as HTMLInputElement;

      const ofxFile = new File(['<OFX>data</OFX>'], 'portfolio.ofx', {
         type: 'text/plain',
      });
      const csvFile = new File(['Symbol,Shares\nVTI,100'], 'holdings.csv', {
         type: 'text/csv',
      });

      await uploadFiles(input, [ofxFile, csvFile]);

      expect(screen.getByText('Import Results')).toBeInTheDocument();
      expect(parseOFX).toHaveBeenCalled();
      expect(parseCSV).toHaveBeenCalled();
      expect(screen.getByText(/OFX123/)).toBeInTheDocument();
      expect(screen.getByText(/CSV456/)).toBeInTheDocument();
      expect(screen.getByText(/portfolio\.ofx/)).toBeInTheDocument();
      expect(screen.getByText(/holdings\.csv/)).toBeInTheDocument();
      expect(screen.getByText('Add 2 Accounts')).toBeInTheDocument();
   });

   it('shows per-file error while still displaying successful parses', async () => {
      const { parseOFX } = await import('$lib/ofxParser');
      (parseOFX as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
         throw new Error('bad file');
      });

      render(ImportPortfolio, { accounts: [] });
      const input = document.querySelector(
         'input[type="file"]',
      ) as HTMLInputElement;

      const badFile = new File(['garbage'], 'bad.ofx', { type: 'text/plain' });
      const goodFile = new File(['Symbol,Shares\nVTI,100'], 'good.csv', {
         type: 'text/csv',
      });

      await uploadFiles(input, [badFile, goodFile]);

      expect(screen.getByText(/Could not load: bad.ofx/)).toBeInTheDocument();
      expect(screen.getByText('Import Results')).toBeInTheDocument();
      expect(screen.getByText(/CSV456/)).toBeInTheDocument();
   });

   it('shows stock allocation in import summary when holdings exist', async () => {
      render(ImportPortfolio, { accounts: [] });
      const input = document.querySelector(
         'input[type="file"]',
      ) as HTMLInputElement;

      const ofxFile = new File(['<OFX>data</OFX>'], 'portfolio.ofx', {
         type: 'text/plain',
      });

      await uploadFiles(input, [ofxFile]);

      expect(screen.getByText('Import Results')).toBeInTheDocument();
      // Summary should show stock/bond allocation from holdings
      expect(screen.getByText(/Stocks:/)).toBeInTheDocument();
      expect(screen.getByText(/Bonds:/)).toBeInTheDocument();
   });

   it('shows spinner during import processing', async () => {
      render(ImportPortfolio, { accounts: [] });
      const input = document.querySelector(
         'input[type="file"]',
      ) as HTMLInputElement;
      const ofxFile = new File(['<OFX>data</OFX>'], 'portfolio.ofx', {
         type: 'text/plain',
      });

      Object.defineProperty(input, 'files', {
         value: [ofxFile],
         configurable: true,
      });
      await fireEvent.change(input);
      // Advance just enough for file.text() but not past the 1-second delay
      await vi.advanceTimersByTimeAsync(100);

      expect(screen.getByText('Importing...')).toBeInTheDocument();

      // Advance past the minimum delay
      await vi.advanceTimersByTimeAsync(1000);
      expect(screen.queryByText('Importing...')).not.toBeInTheDocument();
   });

   it('routes CSV files to parseCSV and OFX/QFX to parseOFX', async () => {
      const { parseOFX } = await import('$lib/ofxParser');
      const { parseCSV } = await import('$lib/csvParser');

      render(ImportPortfolio, { accounts: [] });
      const input = document.querySelector(
         'input[type="file"]',
      ) as HTMLInputElement;

      const csvFile = new File(['data'], 'test.csv', { type: 'text/csv' });
      const qfxFile = new File(['data'], 'test.qfx', { type: 'text/plain' });

      await uploadFiles(input, [csvFile, qfxFile]);

      expect(parseCSV).toHaveBeenCalled();
      expect(parseOFX).toHaveBeenCalled();
   });
});
