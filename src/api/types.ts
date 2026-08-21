/**
 * `CashBalance` is NOT part of Trading212's official OpenAPI spec — the
 * `/equity/account/cash` endpoint it backs doesn't appear in
 * docs/trading212-openapi.yaml at all (only `/equity/account/summary` does),
 * so these fields are best-effort from observed live responses, not a
 * verified schema.
 */
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
    realizedProfitLoss: number;
    unrealizedProfitLoss: number;
  };
}

export interface InstrumentRef {
  ticker: string;
  name: string;
  isin: string;
  currency: string;
}

export interface PositionWalletImpact {
  currency: string;
  currentValue: number;
  fxImpact?: number;
  totalCost: number;
  unrealizedProfitLoss: number;
}

export interface Position {
  instrument: InstrumentRef;
  createdAt: string;
  quantity: number;
  averagePricePaid: number;
  currentPrice: number;
  quantityAvailableForTrading: number;
  quantityInPies: number;
  walletImpact: PositionWalletImpact;
}

export type OrderStrategy = "QUANTITY" | "VALUE";
export type OrderType = "LIMIT" | "MARKET" | "STOP" | "STOP_LIMIT";
export type OrderSide = "BUY" | "SELL";
export type OrderInitiatedFrom =
  | "API"
  | "IOS"
  | "ANDROID"
  | "WEB"
  | "SYSTEM"
  | "AUTOINVEST"
  | "INSTRUMENT_AUTOINVEST";
export type OrderStatus =
  | "LOCAL"
  | "UNCONFIRMED"
  | "CONFIRMED"
  | "NEW"
  | "CANCELLING"
  | "CANCELLED"
  | "PARTIALLY_FILLED"
  | "FILLED"
  | "REJECTED"
  | "REPLACING"
  | "REPLACED";

export interface Order {
  id: number;
  createdAt: string;
  strategy: OrderStrategy;
  type: OrderType;
  ticker: string;
  instrument?: InstrumentRef;
  side: OrderSide;
  quantity: number;
  filledQuantity: number;
  value?: number;
  filledValue?: number;
  limitPrice?: number;
  stopPrice?: number;
  timeInForce?: TimeValidity;
  status: OrderStatus;
  currency: string;
  extendedHours?: boolean;
  initiatedFrom?: OrderInitiatedFrom;
}

export type TimeValidity = "DAY" | "GOOD_TILL_CANCEL";

export interface MarketOrderRequest {
  ticker: string;
  quantity: number;
  extendedHours?: boolean;
}

export interface LimitOrderRequest {
  ticker: string;
  quantity: number;
  limitPrice: number;
  timeValidity: TimeValidity;
}

export interface StopOrderRequest {
  ticker: string;
  quantity: number;
  stopPrice: number;
  timeValidity: TimeValidity;
}

export interface StopLimitOrderRequest {
  ticker: string;
  quantity: number;
  stopPrice: number;
  limitPrice: number;
  timeValidity: TimeValidity;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextPagePath?: string;
}

export interface Tax {
  name: string;
  quantity: number;
  currency: string;
  chargedAt: string;
}

export interface FillWalletImpact {
  currency: string;
  fxRate?: number;
  netValue: number;
  realisedProfitLoss?: number;
  taxes?: Tax[];
}

export interface Fill {
  id: number;
  filledAt: string;
  price: number;
  quantity: number;
  tradingMethod: "TOTV" | "OTC";
  type: string;
  walletImpact?: FillWalletImpact;
}

export interface HistoricalOrderEntry {
  order: Order;
  fill?: Fill;
}

export type DividendType =
  | "ORDINARY"
  | "BONUS"
  | "PROPERTY_INCOME"
  | "RETURN_OF_CAPITAL_NON_US"
  | "DEMERGER"
  | "INTEREST"
  | "CAPITAL_GAINS_DISTRIBUTION_NON_US"
  | "INTERIM_LIQUIDATION"
  | "ORDINARY_MANUFACTURED_PAYMENT"
  | "BONUS_MANUFACTURED_PAYMENT"
  | "PROPERTY_INCOME_MANUFACTURED_PAYMENT"
  | "RETURN_OF_CAPITAL_NON_US_MANUFACTURED_PAYMENT"
  | "DEMERGER_MANUFACTURED_PAYMENT"
  | "INTEREST_MANUFACTURED_PAYMENT"
  | "CAPITAL_GAINS_DISTRIBUTION_NON_US_MANUFACTURED_PAYMENT"
  | "INTERIM_LIQUIDATION_MANUFACTURED_PAYMENT"
  | "INTEREST_PAID_BY_US_OBLIGORS"
  | "INTEREST_PAID_BY_FOREIGN_CORPORATIONS"
  | "DIVIDENDS_PAID_BY_US_CORPORATIONS"
  | "DIVIDENDS_PAID_BY_FOREIGN_CORPORATIONS"
  | "CAPITAL_GAINS"
  | "REAL_PROPERTY_INCOME_AND_NATURAL_RESOURCES_ROYALTIES"
  | "OTHER_INCOME"
  | "QUALIFIED_INVESTMENT_ENTITY"
  | "TRUST_DISTRIBUTION"
  | "PUBLICLY_TRADED_PARTNERSHIP_DISTRIBUTION"
  | "CAPITAL_GAINS_DISTRIBUTION"
  | "RETURN_OF_CAPITAL"
  | "OTHER_DIVIDEND_EQUIVALENT"
  | "TAX_EVENT_1446F_FOR_PUBLICLY_TRADED_SECURITIES"
  | "PTP_UNCHARACTERISED_INCOME"
  | "MULTIPLE_1042S_TAX_COMPONENTS"
  | "DIVIDEND"
  | "SHORT_TERM_CAPITAL_GAINS"
  | "LONG_TERM_CAPITAL_GAINS"
  | "PROPERTY_INCOME_DISTRIBUTION"
  | "TAX_EXEMPTED"
  | "INTEREST_PAID_BY_US_OBLIGORS_MANUFACTURED_PAYMENT"
  | "INTEREST_PAID_BY_FOREIGN_CORPORATIONS_MANUFACTURED_PAYMENT"
  | "DIVIDENDS_PAID_BY_US_CORPORATIONS_MANUFACTURED_PAYMENT"
  | "DIVIDENDS_PAID_BY_FOREIGN_CORPORATIONS_MANUFACTURED_PAYMENT"
  | "CAPITAL_GAINS_MANUFACTURED_PAYMENT"
  | "REAL_PROPERTY_INCOME_AND_NATURAL_RESOURCES_ROYALTIES_MANUFACTURED_PAYMENT"
  | "OTHER_INCOME_MANUFACTURED_PAYMENT"
  | "QUALIFIED_INVESTMENT_ENTITY_MANUFACTURED_PAYMENT"
  | "TRUST_DISTRIBUTION_MANUFACTURED_PAYMENT"
  | "PUBLICLY_TRADED_PARTNERSHIP_DISTRIBUTION_MANUFACTURED_PAYMENT"
  | "CAPITAL_GAINS_DISTRIBUTION_MANUFACTURED_PAYMENT"
  | "RETURN_OF_CAPITAL_MANUFACTURED_PAYMENT"
  | "OTHER_DIVIDEND_EQUIVALENT_MANUFACTURED_PAYMENT"
  | "TAX_EVENT_1446F_FOR_PUBLICLY_TRADED_SECURITIES_MANUFACTURED_PAYMENT"
  | "PTP_UNCHARACTERISED_INCOME_MANUFACTURED_PAYMENT"
  | "MULTIPLE_1042S_TAX_COMPONENTS_MANUFACTURED_PAYMENT"
  | "DIVIDEND_MANUFACTURED_PAYMENT"
  | "SHORT_TERM_CAPITAL_GAINS_MANUFACTURED_PAYMENT"
  | "LONG_TERM_CAPITAL_GAINS_MANUFACTURED_PAYMENT"
  | "PROPERTY_INCOME_DISTRIBUTION_MANUFACTURED_PAYMENT"
  | "TAX_EXEMPTED_MANUFACTURED_PAYMENT";

export interface Dividend {
  ticker: string;
  tickerCurrency?: string;
  instrument: InstrumentRef;
  reference: string;
  quantity: number;
  amount?: number;
  amountInEuro?: number;
  grossAmountPerShare?: number;
  currency?: string;
  paidOn?: string;
  type?: DividendType;
}

export type TransactionType = "WITHDRAW" | "DEPOSIT" | "FEE" | "TRANSFER" | "INTEREST_ON_FREE_CASH" | "LENDING_INTEREST";

export interface Transaction {
  type: TransactionType;
  amount: number;
  currency: string;
  reference: string;
  dateTime: string;
}

export interface InvestmentResult {
  priceAvgInvestedValue: number;
  priceAvgValue: number;
  priceAvgResult: number;
  priceAvgResultCoef: number;
}

export type DividendCashAction = "REINVEST" | "TO_ACCOUNT_CASH";

export interface PieRequest {
  name: string;
  goal?: number;
  instrumentShares?: Record<string, number>;
  dividendCashAction?: DividendCashAction;
  endDate?: string;
  icon?: string;
}

export interface DuplicatePieRequest {
  name?: string;
  icon?: string;
}

/** Shape returned by GET /equity/pies (the list endpoint). */
export interface PieSummary {
  id: number;
  cash: number;
  dividendDetails: {
    gained: number;
    reinvested: number;
    inCash: number;
  };
  progress?: number;
  result: InvestmentResult;
  status?: "AHEAD" | "ON_TRACK" | "BEHIND";
}

export type InstrumentIssueName =
  | "DELISTED"
  | "SUSPENDED"
  | "NO_LONGER_TRADABLE"
  | "MAX_POSITION_SIZE_REACHED"
  | "APPROACHING_MAX_POSITION_SIZE"
  | "COMPLEX_INSTRUMENT_APP_TEST_REQUIRED"
  | "PRICE_TOO_LOW";

export interface InstrumentIssue {
  name: InstrumentIssueName;
  severity: "IRREVERSIBLE" | "REVERSIBLE" | "INFORMATIVE";
}

export interface PieInstrumentResult {
  ticker: string;
  ownedQuantity: number;
  currentShare: number;
  expectedShare: number;
  result: InvestmentResult;
  issues?: InstrumentIssue[];
}

export interface PieSettings {
  id: number;
  name: string;
  goal?: number;
  icon?: string;
  initialInvestment?: number;
  creationDate: string;
  endDate?: string;
  dividendCashAction?: DividendCashAction;
  instrumentShares?: Record<string, number>;
  publicUrl?: string;
}

/**
 * Shape returned by GET/POST /equity/pies/{id}, POST /equity/pies (create),
 * and POST /equity/pies/{id}/duplicate — a different, richer shape than the
 * list endpoint's PieSummary.
 */
export interface PieDetail {
  instruments: PieInstrumentResult[];
  settings: PieSettings;
}

export interface Instrument {
  ticker: string;
  type:
    | "CRYPTOCURRENCY"
    | "ETF"
    | "FOREX"
    | "FUTURES"
    | "INDEX"
    | "STOCK"
    | "WARRANT"
    | "CRYPTO"
    | "CVR"
    | "CORPACT";
  workingScheduleId: number;
  isin: string;
  currencyCode: string;
  name: string;
  shortName: string;
  maxOpenQuantity: number;
  extendedHours: boolean;
  addedOn?: string;
}

export type WorkingScheduleTimeEventType =
  | "OPEN"
  | "CLOSE"
  | "BREAK_START"
  | "BREAK_END"
  | "PRE_MARKET_OPEN"
  | "AFTER_HOURS_OPEN"
  | "AFTER_HOURS_CLOSE"
  | "OVERNIGHT_OPEN";

export interface WorkingScheduleTimeEvent {
  date: string;
  type: WorkingScheduleTimeEventType;
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
