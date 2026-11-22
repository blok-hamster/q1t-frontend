export interface PresetHelpOption {
  name: string;
  badge?: string;
  summary: string;
  example?: string;
}

export interface PresetHelpGuide {
  title: string;
  subtitle: string;
  overview: string;
  options: PresetHelpOption[];
  tip?: string;
}

export const PRESET_HELP_GUIDES: Record<
  | 'sizing'
  | 'concurrent'
  | 'entry_gate'
  | 'coin_cap'
  | 'depth_guard'
  | 'admin_5m',
  PresetHelpGuide
> = {
  sizing: {
    title: 'Position Sizing Presets',
    subtitle: 'Controls how many shares the bot buys on each trade.',
    overview:
      'Instead of betting the exact same amount on every setup, adaptive sizing scales your bet with your account balance and entry price — betting slightly more on cheaper, high-reward setups (<$0.82) and cutting size on expensive ($0.86–$0.88) or sleepy setups.',
    options: [
      {
        name: 'Fixed',
        summary: 'Always buys the flat share count configured per market (e.g. 20 or 50 shares) regardless of your balance or share price.',
        example: 'Best if you want predictable, fixed dollar amounts while testing.',
      },
      {
        name: 'Conservative',
        summary: '1.8% base risk (3.5% max per trade, 20–115 shares). Smooth equity curve with smaller swings.',
        example: 'On a $1,000 balance at $0.75 ask, buys ~36 shares (~$27).',
      },
      {
        name: 'Balanced',
        badge: 'Recommended',
        summary: '2.2% base risk (4.0% max per trade, 25–140 shares). Good mix of compounding speed and downside protection.',
        example: 'On a $1,000 balance at $0.75 ask, buys ~44 shares (~$33).',
      },
      {
        name: 'Growth',
        summary: '2.6% base risk (4.5% max per trade, 25–160 shares). Pushes harder on strong <$0.82 bargains while keeping the same safety cuts on expensive entries.',
        example: 'On a $1,000 balance at $0.75 ask, buys ~52 shares (~$39).',
      },
    ],
    tip: 'If you are just starting with real money, Conservative or Balanced keeps drawdowns comfortable while you verify live fills.',
  },

  concurrent: {
    title: 'Concurrent 5m Order Mode',
    subtitle: 'Controls whether a qualifying setup fires 1 order or 2 simultaneous orders.',
    overview:
      'When a 5-minute market passes all entry checks, you can place a single order or split/double it across two same-direction orders in the same window. Opposite-side orders in the same window are always blocked.',
    options: [
      {
        name: '1× Single',
        summary: 'Places 1 order per qualifying 5-minute window using your normal bet size.',
        example: 'Target 60 shares → places 1 order for 60 shares.',
      },
      {
        name: '2× Split',
        badge: 'Same Risk',
        summary: 'Splits your normal single-trade budget into 2 simultaneous orders in the same direction — identical total dollar risk, double the fills/volume.',
        example: 'Target 60 shares → places 2 orders of 30 shares each (60 total).',
      },
      {
        name: '2× Double',
        badge: '2× Exposure',
        summary: 'Fires 2 full-sized orders at once (2× your normal bet size, hard-capped at 12% of your balance). Higher profit potential and higher loss if a candle reverses.',
        example: 'Target 60 shares → places 2 orders of 60 shares each (120 total).',
      },
    ],
    tip: '2× Split is safest when you want higher order count without increasing risk per trade.',
  },

  entry_gate: {
    title: 'Entry & Falling-Knife Protection Preset',
    subtitle: 'Controls how strict the bot is before entering a 5-minute trade.',
    overview:
      'Every preset uses our Fair-Value model to check if a coin has moved far enough above/below the strike to justify the share price. The difference is how aggressively each mode blocks pullbacks ("falling knives") and how early it allows entries.',
    options: [
      {
        name: 'Mode A · Max Profit',
        summary: 'Strict & selective. Uses Rising-Ask Lock (never buys after the share price has already dropped from its window peak) and requires +4¢ to +5¢ edge with higher conviction at $0.86–$0.88.',
        example: 'Fewer trades per day, very clean entries, strong protection against fading moves.',
      },
      {
        name: 'Mode B · Low Drawdown',
        summary: 'Same strict rules as Mode A, plus automatically cuts your bet size to 30% if the orderbook dropped ≥6¢ in the last 5 seconds after 2m15s, and halves size at $0.87–$0.88.',
        example: 'Built to minimize worst-case drawdown if a sudden pullback happens.',
      },
      {
        name: 'Mode C · Ultra-Safe 96%',
        summary: 'Same strict rules as Mode A, plus completely blocks any late entry (after 2m15s) if the orderbook dropped ≥7¢ in the last 5 seconds.',
        example: 'Lowest trade count, highest win rate — skips anything showing late weakness.',
      },
      {
        name: 'High-Volume Structured',
        badge: 'Most Active',
        summary: 'Highest trade volume. Uses a slightly faster vol floor (1.25× / 1.15×), allows +2¢ edge at $0.86–$0.88, and adds Early-5D entry (45–150s, $0.62–$0.82) when ≥3 coins break out together cleanly with no wick.',
        example: '2–3× more trades than Mode A while keeping spread and fair-value safety gates active.',
      },
    ],
    tip: 'Use High-Volume for maximum activity and faster compounding, or Mode A / Mode C if you prefer fewer, stricter setups.',
  },

  coin_cap: {
    title: 'Same-Window Coin Cap (5m)',
    subtitle: 'Protects against all coins crashing together in the same 5-minute candle.',
    overview:
      'Crypto coins usually move together. If BTC suddenly dumps in the last minute of a 5m window, ETH, SOL, DOGE, BNB, XRP, and HYPE often reverse at the exact same time. Capping how many coins can enter the same direction in one 5-minute window stops one bad candle from causing a 5×–7× simultaneous loss.',
    options: [
      {
        name: 'OFF (Unlimited)',
        summary: 'No limit — all 7 coins can enter the same direction in the same 5-minute window.',
        example: 'Maximum volume, highest correlated crash risk.',
      },
      {
        name: 'Max 3 Coins',
        badge: 'Recommended',
        summary: 'Allows up to 3 different 5m coins to enter the same direction in one 5-minute window (the first 3 that qualify). A coin’s own 2nd split order is never blocked.',
        example: 'If BTC, ETH, and SOL already entered UP in this window, DOGE/BNB/XRP/HYPE wait for the next 5m window.',
      },
      {
        name: 'Max 2 Coins',
        summary: 'Strictest protection — allows at most 2 coins in the same direction per 5-minute window.',
        example: 'Cuts worst-case single-candle drawdown significantly on real money.',
      },
    ],
    tip: 'Opposite-direction trades or the next 5-minute window are unaffected — this cap resets automatically every 5 minutes.',
  },

  depth_guard: {
    title: 'Orderbook Depth Guard (+2¢ Live WS)',
    subtitle: 'Protects against thin orderbooks and paying worse prices than shown on screen.',
    overview:
      'In real trading on Polymarket, the best ask price on screen (say $0.80) might only have 20 shares for sale, with the next shares sitting at $0.81–$0.82 and more expensive ones at $0.87. This guard checks live share depth within +2¢ directly from our in-memory WebSocket feed (zero extra latency) and also prevents orders from paying above Fair Value minus your minimum edge.',
    options: [
      {
        name: 'OFF',
        summary: 'Ignores available share depth and always sends your full target share count.',
        example: 'Target 100 shares with 60 available within +2¢ → still sends 100 shares (risking partial fills or slippage).',
      },
      {
        name: 'Cap Size',
        badge: 'Recommended',
        summary: 'Automatically shrinks your order to match the shares actually available within +2¢ of best ask (skips if fewer than 5 shares exist).',
        example: 'Target 100 shares, only 60 shares available at $0.80–$0.82 → buys 60 shares cleanly without overpaying.',
      },
      {
        name: 'Strict Skip',
        summary: 'Skips the trade completely unless the orderbook has enough shares within +2¢ to cover your entire target size.',
        example: 'Target 100 shares, only 60 available at $0.80–$0.82 → skips (0 shares).',
      },
    ],
    tip: 'On deep coins like BTC/ETH/XRP (often 300+ shares available), Cap Size rarely shrinks anything — it mainly protects thinner coins like HYPE or larger account sizes.',
  },

  admin_5m: {
    title: 'Admin 5m Engine Presets',
    subtitle: 'Global base parameters applied across all 7 five-minute markets.',
    overview:
      'These 1-click admin presets bulk-update the underlying Fair-Value parameters (ask range, time window, volatility multiplier, and z-score floor) in AdminMarketConfig for BTC, ETH, SOL, DOGE, BNB, XRP, and HYPE 5m markets.',
    options: [
      {
        name: 'Model D v5',
        badge: 'Recommended',
        summary: '$0.65–$0.88 ask range, 90–220s wait window, 1.35×/1.20× vol floor, z≥1.15 & +4¢ edge. Pairs cleanly with all user Entry Presets (Mode A/B/C & High-Volume).',
      },
      {
        name: 'Legacy Opt A',
        summary: '$0.55–$0.88 ask range, 90–220s window, z≥1.4, edge≥0¢. Earlier v4 balanced baseline.',
      },
      {
        name: 'Option C',
        summary: 'Tighter $0.86 max ask cap with z≥1.4 & +2¢ edge — fewer entries with higher reward-to-risk.',
      },
      {
        name: 'Option B',
        summary: 'Lower conviction floor (z≥1.0) paired with +5¢ min edge and $0.85 cap.',
      },
      {
        name: 'Calibrated v4',
        summary: 'Original baseline starting at 30s with $0.91 cap and z≥1.5.',
      },
    ],
    tip: 'Keep Admin set to Model D v5 unless intentionally testing a legacy v4 baseline.',
  },
};

