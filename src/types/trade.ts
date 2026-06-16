/**
 * Trade direction
 */
export type TradeDirection = 'UP' | 'DOWN';

/**
 * Trade strategy
 */
export type TradeStrategy = 'ai_prediction' | 'mid_market';

/**
 * Trade status
 */
export type TradeStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'LIMIT_PENDING'
  | 'OPEN'
  | 'CLOSED_WIN'
  | 'CLOSED_LOSS'
  | 'REJECTED';

/**
 * Trade model
 */
export interface Trade {
  _id: string;
  user_id: string;
  market_slug: string;
  direction: TradeDirection;
  size_usd: number;
  strategy: TradeStrategy;
  status: TradeStatus;
  execution_price: number | null;
  pnl: number | null;
  num_shares: number | null;
  entry_share_price: number | null;
  exit_share_price: number | null;
  cost_basis: number | null;
  proceeds: number | null;
  stop_loss_triggered: boolean;
  resolved_at: string | null;
  dispatchedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  entry_method: 'market' | 'limit_retrace' | null;
  limit_order_price: number | null;
  limit_order_placed_at: string | null;
  limit_order_filled_at: string | null;
  limit_order_expired: boolean;
  computed_stop_loss: number | null;
  computed_rr_ratio: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Trade ledger response
 */
export interface TradeLedger {
  trades: Trade[];
}

/**
 * Trade statistics
 */
export interface TradeStats {
  totalTrades: number;
  totalPnL: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  openTrades: number;
}

/**
 * Trade filter options
 */
export interface TradeFilters {
  status?: TradeStatus | 'all';
  direction?: TradeDirection | 'all';
  strategy?: TradeStrategy | 'all';
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

/**
 * Trade sort options
 */
export type TradeSortField = 'date' | 'pnl' | 'size' | 'market';
export type TradeSortOrder = 'asc' | 'desc';

export interface TradeSort {
  field: TradeSortField;
  order: TradeSortOrder;
}
