export interface CashBalance {
  free: number;
  total: number;
  ppl: number;
  result: number;
  invested: number;
  pieCash: number;
  blocked: number;
}

export interface AccountSummary {
  id: number;
  currency: string;
  totalValue: number;
  cash: {
    availableToTrade: number;
    reservedForOrders: number;
    inPies: number;
  };
  investments: {
    currentValue: number;
    totalCost: number;
    realizedResult?: number;
    unrealizedResult?: number;
  };
}

export interface InstrumentRef {
  ticker: string;
  name: string;
  isin: string;
  currency: string;
}

export interface Position {
  instrument: InstrumentRef;
  createdAt: string;
  quantity: number;
  averagePrice?: number;
  currentPrice?: number;
  ppl?: number;
}

export interface SinglePosition {
  ticker: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  ppl: number;
  fxPpl: number;
  initialFillDate: string;
  frontend: string;
}

export type OrderStrategy = "QUANTITY" | "VALUE";
export type OrderType = "LIMIT" | "MARKET" | "STOP" | "STOP_LIMIT";
export type OrderStatus = "NEW" | "FILLED" | "CANCELLED" | "REJECTED" | "PARTIALLY_FILLED";

export interface Order {
  id: number;
  strategy: OrderStrategy;
  type: OrderType;
  ticker: string;
  quantity: number;
  filledQuantity: number;
  limitPrice?: number;
  status: OrderStatus;
  currency: string;
  extendedHours?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextPagePath?: string;
}

export interface HistoricalOrderEntry {
  order: Order;
}

export interface Dividend {
  ticker: string;
  instrument: InstrumentRef;
  reference: string;
  quantity: number;
  amount?: number;
  currency?: string;
  paidOn?: string;
}

export interface Transaction {
  type: string;
  amount: number;
  currency: string;
  reference: string;
  dateTime: string;
}

export interface PieResult {
  priceAvgInvestedValue: number;
  priceAvgValue: number;
  priceAvgResult: number;
  priceAvgResultCoef: number;
}

export interface Pie {
  id: number;
  cash: number;
  dividendDetails: {
    gained: number;
    reinvested: number;
    inCash: number;
  };
  result: PieResult;
}

export interface Instrument {
  ticker: string;
  type: string;
  workingScheduleId: number;
  isin: string;
  currencyCode: string;
  name: string;
  shortName: string;
  maxOpenQuantity: number;
  extendedHours: boolean;
}

export interface WorkingScheduleTimeEvent {
  date: string;
  type: "OPEN" | "CLOSE";
}

export interface WorkingSchedule {
  id: number;
  timeEvents: WorkingScheduleTimeEvent[];
}

export interface Exchange {
  id: number;
  name: string;
  workingSchedules: WorkingSchedule[];
}

export interface PaginationParams {
  cursor?: number;
  limit?: number;
}
