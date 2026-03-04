## About

This is an open-source retirement planning simulator. It runs entirely in the browser — no account data, portfolio details, or personal information is transmitted to any server.

### Privacy

All simulation data stays local. The save/load feature uses your browser's local storage. Clearing browser data removes saved portfolios. There is no cloud sync, no analytics tracking portfolio data, and no third-party access to inputs.

### Limitations

This tool is for educational and planning purposes. It is not financial advice. The simulation makes simplifying assumptions (flat growth rates, simplified tax rules, no state-specific deductions) that may not reflect actual outcomes. Consult a qualified financial advisor for decisions about retirement planning.

### Technical Details

The backend runs a Python/FastAPI simulation engine. The frontend is built with SvelteKit. In production, both are served from a single container. The version number is displayed in the header bar.
