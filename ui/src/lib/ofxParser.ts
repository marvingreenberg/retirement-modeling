/**
 * Client-side OFX/QFX parser. Strips the SGML header, closes unclosed tags,
 * then uses DOMParser to extract positions and securities.
 */

export interface ParsedHolding {
	symbol: string | null;
	cusip: string;
	name: string;
	quantity: number;
	price: number;
	market_value: number;
	security_type: 'Stock' | 'MF';
}

export interface ParsedAccount {
	account_id: string;
	broker: string;
	account_type: null; // OFX doesn't encode IRA/Roth/brokerage
	holdings: ParsedHolding[];
	total_value: number;
	cash_balance: number;
	as_of_date: string | null;
}

const KNOWN_BROKERS: Record<string, string> = {
	'17260': 'Wealthfront',
	'15103': 'Vanguard',
	'vanguard.com': 'Vanguard',
	'7776': 'Fidelity',
	'fidelity.com': 'Fidelity',
	'5509': 'Schwab',
	'schwab.com': 'Schwab',
};

/**
 * Preprocess OFX SGML into XML that DOMParser can handle.
 * Strips the plaintext header, then closes unclosed leaf tags.
 */
export function preprocessOFX(raw: string): string {
	// Strip everything before <OFX>
	const ofxStart = raw.indexOf('<OFX>');
	if (ofxStart === -1) throw new Error('Not a valid OFX file: no <OFX> tag found');
	let sgml = raw.slice(ofxStart);

	// Remove extension tags containing dots (e.g. INTU.BID, INTU.USERID).
	// These are non-standard and invalid as XML element names.
	// Handles both SGML-style (<INTU.BID>val) and XML-style (<INTU.BID>val</INTU.BID>).
	sgml = sgml.replace(/<\/?[A-Z][A-Z0-9]*\.[^>]*>[^<]*/g, '');

	// Close leaf tags: <TAG>value → <TAG>value</TAG>
	// Only close tags with non-whitespace content (container tags have only
	// whitespace between them and their children, so skip those).
	sgml = sgml.replace(/<([A-Z][A-Z0-9]*)>([^<]+)/g, (_match, tag: string, value: string) => {
		const trimmed = value.trim();
		if (trimmed.length === 0) return `<${tag}>${value}`;
		return `<${tag}>${trimmed}</${tag}>`;
	});

	// Some QFX files (e.g. Wells Fargo) already have closing tags on some
	// leaf elements. The regex above produces duplicates like </CODE></CODE>.
	sgml = sgml.replace(/<\/([A-Z][A-Z0-9]*)>\s*<\/\1>/g, '</$1>');

	return sgml;
}

/** Parse preprocessed OFX XML and extract positions + securities. */
export function parseOFX(content: string): ParsedAccount[] {
	const xml = preprocessOFX(content);
	const parser = new DOMParser();
	const doc = parser.parseFromString(xml, 'text/xml');

	const parseError = doc.querySelector('parsererror');
	if (parseError) {
		throw new Error('File does not appear to be a valid OFX/QFX investment account export.');
	}

	const secMap = buildSecurityMap(doc);
	const broker = detectBroker(doc);
	const accounts: ParsedAccount[] = [];

	const statements = doc.querySelectorAll('INVSTMTRS');
	for (const stmt of statements) {
		accounts.push(parseStatement(stmt, secMap, broker));
	}

	if (accounts.length === 0) {
		throw new Error('No investment accounts found in OFX file');
	}
	return accounts;
}

function buildSecurityMap(doc: Document): Map<string, { ticker: string | null; name: string }> {
	const map = new Map<string, { ticker: string | null; name: string }>();
	const secInfos = doc.querySelectorAll('SECLIST SECINFO');
	for (const info of secInfos) {
		const cusip = text(info, 'UNIQUEID');
		const ticker = text(info, 'TICKER');
		const name = text(info, 'SECNAME') || cusip || 'Unknown';
		if (cusip) map.set(cusip, { ticker, name });
	}
	return map;
}

function detectBroker(doc: Document): string {
	const fid = text(doc, 'FI FID');
	if (fid && KNOWN_BROKERS[fid]) return KNOWN_BROKERS[fid];

	const brokerId = text(doc, 'INVACCTFROM BROKERID');
	if (brokerId && KNOWN_BROKERS[brokerId]) return KNOWN_BROKERS[brokerId];

	return 'unknown';
}

function parseStatement(
	stmt: Element,
	secMap: Map<string, { ticker: string | null; name: string }>,
	broker: string
): ParsedAccount {
	const accountId = text(stmt, 'INVACCTFROM ACCTID') || 'unknown';
	const dtasof = text(stmt, 'DTASOF');
	const asOfDate = dtasof ? formatOFXDate(dtasof) : null;

	const holdings: ParsedHolding[] = [];

	for (const pos of stmt.querySelectorAll('POSSTOCK')) {
		const h = parsePosition(pos, secMap, 'Stock');
		if (h) holdings.push(h);
	}
	for (const pos of stmt.querySelectorAll('POSMF')) {
		const h = parsePosition(pos, secMap, 'MF');
		if (h) holdings.push(h);
	}

	const cash = parseFloat(text(stmt, 'INVBAL AVAILCASH') || '0');
	const holdingsTotal = holdings.reduce((sum, h) => sum + h.market_value, 0);

	return {
		account_id: accountId,
		broker,
		account_type: null,
		holdings,
		total_value: holdingsTotal + cash,
		cash_balance: cash,
		as_of_date: asOfDate,
	};
}

function parsePosition(
	pos: Element,
	secMap: Map<string, { ticker: string | null; name: string }>,
	secType: 'Stock' | 'MF'
): ParsedHolding | null {
	const cusip = text(pos, 'SECID UNIQUEID');
	if (!cusip) return null;

	const units = parseFloat(text(pos, 'UNITS') || '0');
	const price = parseFloat(text(pos, 'UNITPRICE') || '0');
	const mktval = parseFloat(text(pos, 'MKTVAL') || '0');

	const sec = secMap.get(cusip);
	return {
		symbol: sec?.ticker ?? null,
		cusip,
		name: sec?.name ?? cusip,
		quantity: units,
		price,
		market_value: mktval,
		security_type: secType,
	};
}

function formatOFXDate(dtstr: string): string | null {
	// OFX dates: YYYYMMDDHHMMSS.sss or YYYYMMDD
	const m = dtstr.match(/^(\d{4})(\d{2})(\d{2})/);
	return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

function text(el: Element | Document, selector: string): string | null {
	const node = el.querySelector(selector);
	return node?.textContent?.trim() || null;
}
