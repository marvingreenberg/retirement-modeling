import { describe, it, expect } from 'vitest';
import { preprocessOFX, parseOFX } from './ofxParser';

// Minimal valid OFX content for testing
const MINIMAL_OFX = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>20240115120000
<LANGUAGE>ENG
<FI>
<ORG>Vanguard
<FID>15103
</FI>
</SONRS>
</SIGNONMSGSRSV1>
<INVSTMTMSGSRSV1>
<INVSTMTTRNRS>
<TRNUID>1001
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<INVSTMTRS>
<DTASOF>20240115
<CURDEF>USD
<INVACCTFROM>
<BROKERID>vanguard.com
<ACCTID>12345678
</INVACCTFROM>
<INVPOSLIST>
<POSSTOCK>
<INVPOS>
<SECID>
<UNIQUEID>922908363
<UNIQUEIDTYPE>CUSIP
</SECID>
<UNITS>100.000
<UNITPRICE>250.50
<MKTVAL>25050.00
<DTPRICEASOF>20240115
</INVPOS>
<HELDINACCT>CASH
<POSTYPE>LONG
</POSSTOCK>
<POSMF>
<INVPOS>
<SECID>
<UNIQUEID>921937835
<UNIQUEIDTYPE>CUSIP
</SECID>
<UNITS>500.000
<UNITPRICE>100.00
<MKTVAL>50000.00
<DTPRICEASOF>20240115
</INVPOS>
<HELDINACCT>CASH
<POSTYPE>LONG
</POSMF>
</INVPOSLIST>
<INVBAL>
<AVAILCASH>5000.00
<MARGINBALANCE>0.00
<SHORTBALANCE>0.00
</INVBAL>
</INVSTMTRS>
</INVSTMTTRNRS>
</INVSTMTMSGSRSV1>
<SECLISTMSGSRSV1>
<SECLIST>
<STOCKINFO>
<SECINFO>
<SECID>
<UNIQUEID>922908363
<UNIQUEIDTYPE>CUSIP
</SECID>
<SECNAME>VANGUARD TOTAL STOCK MKT ETF
<TICKER>VTI
</SECINFO>
</STOCKINFO>
<MFINFO>
<SECINFO>
<SECID>
<UNIQUEID>921937835
<UNIQUEIDTYPE>CUSIP
</SECID>
<SECNAME>VANGUARD TOTAL BOND INDEX
<TICKER>BND
</SECINFO>
</MFINFO>
</SECLIST>
</SECLISTMSGSRSV1>
</OFX>`;

const MULTI_ACCOUNT_OFX = `OFXHEADER:100
DATA:OFXSGML

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS><CODE>0<SEVERITY>INFO</STATUS>
<DTSERVER>20240115
<LANGUAGE>ENG
<FI><ORG>Fidelity<FID>7776</FI>
</SONRS>
</SIGNONMSGSRSV1>
<INVSTMTMSGSRSV1>
<INVSTMTTRNRS>
<TRNUID>1001
<STATUS><CODE>0<SEVERITY>INFO</STATUS>
<INVSTMTRS>
<DTASOF>20240115
<CURDEF>USD
<INVACCTFROM><BROKERID>fidelity.com<ACCTID>AAA111</INVACCTFROM>
<INVPOSLIST>
<POSSTOCK>
<INVPOS>
<SECID><UNIQUEID>C1<UNIQUEIDTYPE>CUSIP</SECID>
<UNITS>10<UNITPRICE>100<MKTVAL>1000
</INVPOS>
</POSSTOCK>
</INVPOSLIST>
<INVBAL><AVAILCASH>500</INVBAL>
</INVSTMTRS>
</INVSTMTTRNRS>
<INVSTMTTRNRS>
<TRNUID>1002
<STATUS><CODE>0<SEVERITY>INFO</STATUS>
<INVSTMTRS>
<DTASOF>20240115
<CURDEF>USD
<INVACCTFROM><BROKERID>fidelity.com<ACCTID>BBB222</INVACCTFROM>
<INVPOSLIST>
<POSMF>
<INVPOS>
<SECID><UNIQUEID>C2<UNIQUEIDTYPE>CUSIP</SECID>
<UNITS>200<UNITPRICE>50<MKTVAL>10000
</INVPOS>
</POSMF>
</INVPOSLIST>
<INVBAL><AVAILCASH>1000</INVBAL>
</INVSTMTRS>
</INVSTMTTRNRS>
</INVSTMTMSGSRSV1>
<SECLISTMSGSRSV1>
<SECLIST>
<STOCKINFO>
<SECINFO>
<SECID><UNIQUEID>C1<UNIQUEIDTYPE>CUSIP</SECID>
<SECNAME>APPLE INC<TICKER>AAPL
</SECINFO>
</STOCKINFO>
<MFINFO>
<SECINFO>
<SECID><UNIQUEID>C2<UNIQUEIDTYPE>CUSIP</SECID>
<SECNAME>VANGUARD TOTAL INTL<TICKER>VXUS
</SECINFO>
</MFINFO>
</SECLIST>
</SECLISTMSGSRSV1>
</OFX>`;

describe('preprocessOFX', () => {
   it('strips header and produces parseable XML', () => {
      const xml = preprocessOFX(MINIMAL_OFX);
      expect(xml.startsWith('<OFX>')).toBe(true);
      expect(xml).not.toContain('OFXHEADER');
      // Should be parseable by DOMParser
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');
      expect(doc.querySelector('parsererror')).toBeNull();
   });

   it('throws for content without <OFX> tag', () => {
      expect(() => preprocessOFX('just some text')).toThrow(
         'Not a valid OFX file',
      );
   });

   it('closes unclosed leaf tags', () => {
      const xml = preprocessOFX('<OFX><CODE>0<SEVERITY>INFO</OFX>');
      expect(xml).toContain('<CODE>0</CODE>');
      expect(xml).toContain('<SEVERITY>INFO</SEVERITY>');
   });

   it('strips dot-extension tags (SGML-style, no closing tags)', () => {
      const input = '<OFX><INTU.BID>12345<CODE>0</OFX>';
      const xml = preprocessOFX(input);
      expect(xml).not.toContain('INTU.BID');
      expect(xml).toContain('<CODE>0</CODE>');
   });

   it('strips dot-extension tags (XML-style, with closing tags)', () => {
      const input =
         '<OFX><SONRS><INTU.BID>17260</INTU.BID><INTU.USERID>12345</INTU.USERID></SONRS></OFX>';
      const xml = preprocessOFX(input);
      expect(xml).not.toContain('INTU.BID');
      expect(xml).not.toContain('INTU.USERID');
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');
      expect(doc.querySelector('parsererror')).toBeNull();
   });

   it('strips non-INTU dot-extension tags', () => {
      const input = '<OFX><SONRS><CUSTOM.EXT>foo</CUSTOM.EXT></SONRS></OFX>';
      const xml = preprocessOFX(input);
      expect(xml).not.toContain('CUSTOM.EXT');
   });

   it('handles tags with extra whitespace in values', () => {
      const xml = preprocessOFX('<OFX><TICKER>  VTI  </OFX>');
      expect(xml).toContain('<TICKER>VTI</TICKER>');
   });
});

describe('parseOFX', () => {
   it('extracts stock and MF positions', () => {
      const accounts = parseOFX(MINIMAL_OFX);
      expect(accounts).toHaveLength(1);
      const acct = accounts[0];
      expect(acct.holdings).toHaveLength(2);

      const stock = acct.holdings.find((h) => h.security_type === 'Stock');
      expect(stock).toBeDefined();
      expect(stock!.quantity).toBe(100);
      expect(stock!.price).toBe(250.5);
      expect(stock!.market_value).toBe(25050);

      const mf = acct.holdings.find((h) => h.security_type === 'MF');
      expect(mf).toBeDefined();
      expect(mf!.quantity).toBe(500);
      expect(mf!.market_value).toBe(50000);
   });

   it('resolves CUSIP to ticker via SECLIST', () => {
      const accounts = parseOFX(MINIMAL_OFX);
      const stock = accounts[0].holdings.find((h) => h.cusip === '922908363');
      expect(stock!.symbol).toBe('VTI');
      expect(stock!.name).toBe('VANGUARD TOTAL STOCK MKT ETF');

      const mf = accounts[0].holdings.find((h) => h.cusip === '921937835');
      expect(mf!.symbol).toBe('BND');
   });

   it('uses CUSIP as name for unmatched securities', () => {
      const ofx = `OFXHEADER:100
<OFX>
<SIGNONMSGSRSV1><SONRS><STATUS><CODE>0<SEVERITY>INFO</STATUS><DTSERVER>20240115<LANGUAGE>ENG</SONRS></SIGNONMSGSRSV1>
<INVSTMTMSGSRSV1><INVSTMTTRNRS><TRNUID>1<STATUS><CODE>0<SEVERITY>INFO</STATUS>
<INVSTMTRS><DTASOF>20240115<CURDEF>USD
<INVACCTFROM><BROKERID>test<ACCTID>999</INVACCTFROM>
<INVPOSLIST>
<POSSTOCK><INVPOS><SECID><UNIQUEID>UNKNOWN123<UNIQUEIDTYPE>CUSIP</SECID>
<UNITS>10<UNITPRICE>50<MKTVAL>500</INVPOS></POSSTOCK>
</INVPOSLIST>
<INVBAL><AVAILCASH>0</INVBAL>
</INVSTMTRS></INVSTMTTRNRS></INVSTMTMSGSRSV1>
</OFX>`;
      const accounts = parseOFX(ofx);
      const h = accounts[0].holdings[0];
      expect(h.symbol).toBeNull();
      expect(h.name).toBe('UNKNOWN123');
   });

   it('extracts cash balance', () => {
      const accounts = parseOFX(MINIMAL_OFX);
      expect(accounts[0].cash_balance).toBe(5000);
   });

   it('computes total value (holdings + cash)', () => {
      const accounts = parseOFX(MINIMAL_OFX);
      expect(accounts[0].total_value).toBe(25050 + 50000 + 5000);
   });

   it('extracts as-of date', () => {
      const accounts = parseOFX(MINIMAL_OFX);
      expect(accounts[0].as_of_date).toBe('2024-01-15');
   });

   it('detects broker from FID', () => {
      const accounts = parseOFX(MINIMAL_OFX);
      expect(accounts[0].broker).toBe('Vanguard');
   });

   it('handles multi-account files', () => {
      const accounts = parseOFX(MULTI_ACCOUNT_OFX);
      expect(accounts).toHaveLength(2);
      expect(accounts[0].account_id).toBe('AAA111');
      expect(accounts[1].account_id).toBe('BBB222');
      expect(accounts[0].broker).toBe('Fidelity');
   });

   it('correctly types positions across accounts', () => {
      const accounts = parseOFX(MULTI_ACCOUNT_OFX);
      expect(accounts[0].holdings[0].security_type).toBe('Stock');
      expect(accounts[0].holdings[0].symbol).toBe('AAPL');
      expect(accounts[1].holdings[0].security_type).toBe('MF');
      expect(accounts[1].holdings[0].symbol).toBe('VXUS');
   });

   it('throws for files with no investment accounts', () => {
      const ofx = `OFXHEADER:100
<OFX>
<SIGNONMSGSRSV1><SONRS><STATUS><CODE>0<SEVERITY>INFO</STATUS></SONRS></SIGNONMSGSRSV1>
</OFX>`;
      expect(() => parseOFX(ofx)).toThrow('No investment accounts found');
   });

   it('sets account_type to null (OFX cannot encode this)', () => {
      const accounts = parseOFX(MINIMAL_OFX);
      expect(accounts[0].account_type).toBeNull();
   });

   it('parses Wealthfront-style pre-closed XML with INTU tags', () => {
      const ofx = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS><CODE>0</CODE><SEVERITY>INFO</SEVERITY></STATUS>
<DTSERVER>20250910072206.647</DTSERVER>
<LANGUAGE>ENG</LANGUAGE>
<FI><ORG>8437</ORG><FID>17260</FID></FI>
<INTU.BID>17260</INTU.BID>
<INTU.USERID>1234567890</INTU.USERID>
</SONRS>
</SIGNONMSGSRSV1>
<INVSTMTMSGSRSV1>
<INVSTMTTRNRS>
<TRNUID>0</TRNUID>
<STATUS><CODE>0</CODE><SEVERITY>INFO</SEVERITY></STATUS>
<INVSTMTRS>
<DTASOF>20250910000000.000</DTASOF>
<CURDEF>USD</CURDEF>
<INVACCTFROM><BROKERID>17260</BROKERID><ACCTID>8W543724</ACCTID></INVACCTFROM>
<INVPOSLIST>
<POSSTOCK>
<INVPOS>
<SECID><UNIQUEID>WFDIC01</UNIQUEID><UNIQUEIDTYPE>CUSIP</UNIQUEIDTYPE></SECID>
<HELDINACCT>CASH</HELDINACCT>
<POSTYPE>LONG</POSTYPE>
<UNITS>74.87</UNITS>
<UNITPRICE>1.0</UNITPRICE>
<MKTVAL>74.87</MKTVAL>
</INVPOS>
</POSSTOCK>
</INVPOSLIST>
<INVBAL><AVAILCASH>0.00</AVAILCASH></INVBAL>
</INVSTMTRS>
</INVSTMTTRNRS>
</INVSTMTMSGSRSV1>
<SECLISTMSGSRSV1>
<SECLIST>
<STOCKINFO>
<SECINFO>
<SECID><UNIQUEID>WFDIC01</UNIQUEID><UNIQUEIDTYPE>CUSIP</UNIQUEIDTYPE></SECID>
<SECNAME>Wealthfront FDIC Cash</SECNAME>
<TICKER>WFDIC01</TICKER>
</SECINFO>
</STOCKINFO>
</SECLIST>
</SECLISTMSGSRSV1>
</OFX>`;
      const accounts = parseOFX(ofx);
      expect(accounts).toHaveLength(1);
      expect(accounts[0].broker).toBe('Wealthfront');
      expect(accounts[0].holdings).toHaveLength(1);
      expect(accounts[0].holdings[0].quantity).toBe(74.87);
   });

   it('provides friendly error message for unparseable XML', () => {
      const ofx = `OFXHEADER:100
<OFX><SONRS></MISMATCH></OFX>`;
      expect(() => parseOFX(ofx)).toThrow(
         'does not appear to be a valid OFX/QFX',
      );
   });

   it('handles OFX date with time component', () => {
      const ofx = `OFXHEADER:100
<OFX>
<SIGNONMSGSRSV1><SONRS><STATUS><CODE>0<SEVERITY>INFO</STATUS><DTSERVER>20240115<LANGUAGE>ENG</SONRS></SIGNONMSGSRSV1>
<INVSTMTMSGSRSV1><INVSTMTTRNRS><TRNUID>1<STATUS><CODE>0<SEVERITY>INFO</STATUS>
<INVSTMTRS><DTASOF>20240115120000.000
<CURDEF>USD
<INVACCTFROM><BROKERID>test<ACCTID>999</INVACCTFROM>
<INVPOSLIST>
<POSSTOCK><INVPOS><SECID><UNIQUEID>C1<UNIQUEIDTYPE>CUSIP</SECID>
<UNITS>10<UNITPRICE>50<MKTVAL>500</INVPOS></POSSTOCK>
</INVPOSLIST>
<INVBAL><AVAILCASH>0</INVBAL>
</INVSTMTRS></INVSTMTTRNRS></INVSTMTMSGSRSV1>
</OFX>`;
      const accounts = parseOFX(ofx);
      expect(accounts[0].as_of_date).toBe('2024-01-15');
   });
});
