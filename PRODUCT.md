# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Solo crypto traders who monitor AI-generated BTC signals in real time and want to auto-execute on Polymarket. Primary usage is desktop, checked actively during trading sessions and intermittently when positions are running.

## Product Purpose

A closed-loop Bitcoin signal-to-bet pipeline. The system generates directional BTC predictions, filters them by confidence, and auto-executes qualifying signals as Polymarket positions. Every prediction — direction, confidence, strike, target, and outcome — is logged and visible in real time. The user retains full control over risk settings.

The current profitable core is the **mid-market strategy**. The AI prediction layer is under active development. The platform is built around the mid-market signal while the broader AI prediction model matures.

## Positioning

The only tool that closes the loop from BTC structural signal → Polymarket prediction market execution, with a live transparent ledger of every call and its outcome. Not a bot running static rules. Not a backtested strategy. A live, transparent decision system that shows its work.

## Operating Context

- Used on desktop, primarily a single-user instance
- BTC/USDT 5-minute cadence; signals fire continuously during market hours
- The user monitors signal quality, win rate, and open positions in real time
- Risk is managed via configurable parameters (Kelly sizing, confidence threshold, max bet %)
- Integration: Binance for price data, Polymarket for execution, backend API for signal generation

## Capabilities and Constraints

- Live prediction streaming via WebSocket
- Prediction history ledger with direction, confidence, strike price, target, and outcome
- Paper trading mode with configurable balance
- 2FA authentication and private key management for Polymarket execution
- Mid-market strategy is the active profitable signal
- AI prediction layer (CNN-based) is under active development and not yet primary

## Brand Commitments

- App name: **q1t** (stylised lowercase with number)
- Dark theme, minimal aesthetic: near-black backgrounds, data-dense layout
- No decorative illustrations, no marketing-speak padding
- Monospace font for all numeric/price data
- Signal colors: `#00FF88` (positive/UP), `#FF3366` (negative/DOWN), `#00D4FF` (accent/neutral)

## Evidence on Hand

- Live prediction data streamed from backend
- Real win rate and outcome history from mid-market strategy
- No fabricated testimonials, benchmarks, or social proof to be added

## Product Principles

1. **Transparency over trust** — every prediction is visible with its outcome; nothing is hidden
2. **Data density over decoration** — the interface is a trading tool, not a marketing site; remove anything that doesn't carry information
3. **Signal clarity** — the most important thing on every screen is the current signal state and its outcome quality
4. **Minimal friction** — get to the live ledger in one click from anywhere in the product
5. **Discipline by default** — the confidence filter and risk controls are the product; never design around bypassing them
