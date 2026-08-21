import { z } from "zod";

/**
 * `CashBalance` is NOT part of Trading212's official OpenAPI spec — the
 * `/equity/account/cash` endpoint it backs doesn't appear in
 * docs/trading212-openapi.yaml at all (only `/equity/account/summary` does),
 * so this schema is best-effort from observed live responses, not a
 * verified schema.
 */
export const CashBalanceSchema = z.object({
  free: z.number(),
  total: z.number(),
  ppl: z.number(),
  result: z.number(),
  invested: z.number(),
  pieCash: z.number(),
  blocked: z.number(),
});
export type CashBalance = z.infer<typeof CashBalanceSchema>;

export const AccountSummarySchema = z.object({
  id: z.number(),
  currency: z.string(),
  totalValue: z.number(),
  cash: z.object({
    availableToTrade: z.number(),
    reservedForOrders: z.number(),
    inPies: z.number(),
  }),
  investments: z.object({
    currentValue: z.number(),
    totalCost: z.number(),
    realizedProfitLoss: z.number(),
    unrealizedProfitLoss: z.number(),
  }),
});
export type AccountSummary = z.infer<typeof AccountSummarySchema>;

export const InstrumentRefSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  isin: z.string(),
  currency: z.string(),
});
export type InstrumentRef = z.infer<typeof InstrumentRefSchema>;

export const PositionWalletImpactSchema = z.object({
  currency: z.string(),
  currentValue: z.number(),
  fxImpact: z.number().optional(),
  totalCost: z.number(),
  unrealizedProfitLoss: z.number(),
});
export type PositionWalletImpact = z.infer<typeof PositionWalletImpactSchema>;

export const PositionSchema = z.object({
  instrument: InstrumentRefSchema,
  createdAt: z.string(),
  quantity: z.number(),
  averagePricePaid: z.number(),
  currentPrice: z.number(),
  quantityAvailableForTrading: z.number(),
  quantityInPies: z.number(),
  walletImpact: PositionWalletImpactSchema,
});
export type Position = z.infer<typeof PositionSchema>;

export const OrderStrategySchema = z.enum(["QUANTITY", "VALUE"]);
export type OrderStrategy = z.infer<typeof OrderStrategySchema>;

export const OrderTypeSchema = z.enum(["LIMIT", "MARKET", "STOP", "STOP_LIMIT"]);
export type OrderType = z.infer<typeof OrderTypeSchema>;

export const OrderSideSchema = z.enum(["BUY", "SELL"]);
export type OrderSide = z.infer<typeof OrderSideSchema>;

export const OrderInitiatedFromSchema = z.enum([
  "API",
  "IOS",
  "ANDROID",
  "WEB",
  "SYSTEM",
  "AUTOINVEST",
  "INSTRUMENT_AUTOINVEST",
]);
export type OrderInitiatedFrom = z.infer<typeof OrderInitiatedFromSchema>;

export const OrderStatusSchema = z.enum([
  "LOCAL",
  "UNCONFIRMED",
  "CONFIRMED",
  "NEW",
  "CANCELLING",
  "CANCELLED",
  "PARTIALLY_FILLED",
  "FILLED",
  "REJECTED",
  "REPLACING",
  "REPLACED",
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const TimeValiditySchema = z.enum(["DAY", "GOOD_TILL_CANCEL"]);
export type TimeValidity = z.infer<typeof TimeValiditySchema>;

export const OrderSchema = z.object({
  id: z.number(),
  createdAt: z.string(),
  strategy: OrderStrategySchema,
  type: OrderTypeSchema,
  ticker: z.string(),
  instrument: InstrumentRefSchema.optional(),
  side: OrderSideSchema,
  quantity: z.number(),
  filledQuantity: z.number(),
  value: z.number().optional(),
  filledValue: z.number().optional(),
  limitPrice: z.number().optional(),
  stopPrice: z.number().optional(),
  timeInForce: TimeValiditySchema.optional(),
  status: OrderStatusSchema,
  currency: z.string(),
  extendedHours: z.boolean().optional(),
  initiatedFrom: OrderInitiatedFromSchema.optional(),
});
export type Order = z.infer<typeof OrderSchema>;

export const MarketOrderRequestSchema = z.object({
  ticker: z.string(),
  quantity: z.number(),
  extendedHours: z.boolean().optional(),
});
export type MarketOrderRequest = z.infer<typeof MarketOrderRequestSchema>;

export const LimitOrderRequestSchema = z.object({
  ticker: z.string(),
  quantity: z.number(),
  limitPrice: z.number(),
  timeValidity: TimeValiditySchema,
});
export type LimitOrderRequest = z.infer<typeof LimitOrderRequestSchema>;

export const StopOrderRequestSchema = z.object({
  ticker: z.string(),
  quantity: z.number(),
  stopPrice: z.number(),
  timeValidity: TimeValiditySchema,
});
export type StopOrderRequest = z.infer<typeof StopOrderRequestSchema>;

export const StopLimitOrderRequestSchema = z.object({
  ticker: z.string(),
  quantity: z.number(),
  stopPrice: z.number(),
  limitPrice: z.number(),
  timeValidity: TimeValiditySchema,
});
export type StopLimitOrderRequest = z.infer<typeof StopLimitOrderRequestSchema>;

/** Generic cursor-paginated response wrapper, e.g. `paginatedResponseSchema(DividendSchema)`. */
export function paginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    nextPagePath: z.string().optional(),
  });
}
export interface PaginatedResponse<T> {
  items: T[];
  nextPagePath?: string;
}

export const TaxSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  currency: z.string(),
  chargedAt: z.string(),
});
export type Tax = z.infer<typeof TaxSchema>;

export const FillWalletImpactSchema = z.object({
  currency: z.string(),
  fxRate: z.number().optional(),
  netValue: z.number(),
  realisedProfitLoss: z.number().optional(),
  taxes: z.array(TaxSchema).optional(),
});
export type FillWalletImpact = z.infer<typeof FillWalletImpactSchema>;

export const FillSchema = z.object({
  id: z.number(),
  filledAt: z.string(),
  price: z.number(),
  quantity: z.number(),
  tradingMethod: z.enum(["TOTV", "OTC"]),
  type: z.string(),
  walletImpact: FillWalletImpactSchema.optional(),
});
export type Fill = z.infer<typeof FillSchema>;

export const HistoricalOrderEntrySchema = z.object({
  order: OrderSchema,
  fill: FillSchema.optional(),
});
export type HistoricalOrderEntry = z.infer<typeof HistoricalOrderEntrySchema>;

export const DividendTypeSchema = z.enum([
  "ORDINARY",
  "BONUS",
  "PROPERTY_INCOME",
  "RETURN_OF_CAPITAL_NON_US",
  "DEMERGER",
  "INTEREST",
  "CAPITAL_GAINS_DISTRIBUTION_NON_US",
  "INTERIM_LIQUIDATION",
  "ORDINARY_MANUFACTURED_PAYMENT",
  "BONUS_MANUFACTURED_PAYMENT",
  "PROPERTY_INCOME_MANUFACTURED_PAYMENT",
  "RETURN_OF_CAPITAL_NON_US_MANUFACTURED_PAYMENT",
  "DEMERGER_MANUFACTURED_PAYMENT",
  "INTEREST_MANUFACTURED_PAYMENT",
  "CAPITAL_GAINS_DISTRIBUTION_NON_US_MANUFACTURED_PAYMENT",
  "INTERIM_LIQUIDATION_MANUFACTURED_PAYMENT",
  "INTEREST_PAID_BY_US_OBLIGORS",
  "INTEREST_PAID_BY_FOREIGN_CORPORATIONS",
  "DIVIDENDS_PAID_BY_US_CORPORATIONS",
  "DIVIDENDS_PAID_BY_FOREIGN_CORPORATIONS",
  "CAPITAL_GAINS",
  "REAL_PROPERTY_INCOME_AND_NATURAL_RESOURCES_ROYALTIES",
  "OTHER_INCOME",
  "QUALIFIED_INVESTMENT_ENTITY",
  "TRUST_DISTRIBUTION",
  "PUBLICLY_TRADED_PARTNERSHIP_DISTRIBUTION",
  "CAPITAL_GAINS_DISTRIBUTION",
  "RETURN_OF_CAPITAL",
  "OTHER_DIVIDEND_EQUIVALENT",
  "TAX_EVENT_1446F_FOR_PUBLICLY_TRADED_SECURITIES",
  "PTP_UNCHARACTERISED_INCOME",
  "MULTIPLE_1042S_TAX_COMPONENTS",
  "DIVIDEND",
  "SHORT_TERM_CAPITAL_GAINS",
  "LONG_TERM_CAPITAL_GAINS",
  "PROPERTY_INCOME_DISTRIBUTION",
  "TAX_EXEMPTED",
  "INTEREST_PAID_BY_US_OBLIGORS_MANUFACTURED_PAYMENT",
  "INTEREST_PAID_BY_FOREIGN_CORPORATIONS_MANUFACTURED_PAYMENT",
  "DIVIDENDS_PAID_BY_US_CORPORATIONS_MANUFACTURED_PAYMENT",
  "DIVIDENDS_PAID_BY_FOREIGN_CORPORATIONS_MANUFACTURED_PAYMENT",
  "CAPITAL_GAINS_MANUFACTURED_PAYMENT",
  "REAL_PROPERTY_INCOME_AND_NATURAL_RESOURCES_ROYALTIES_MANUFACTURED_PAYMENT",
  "OTHER_INCOME_MANUFACTURED_PAYMENT",
  "QUALIFIED_INVESTMENT_ENTITY_MANUFACTURED_PAYMENT",
  "TRUST_DISTRIBUTION_MANUFACTURED_PAYMENT",
  "PUBLICLY_TRADED_PARTNERSHIP_DISTRIBUTION_MANUFACTURED_PAYMENT",
  "CAPITAL_GAINS_DISTRIBUTION_MANUFACTURED_PAYMENT",
  "RETURN_OF_CAPITAL_MANUFACTURED_PAYMENT",
  "OTHER_DIVIDEND_EQUIVALENT_MANUFACTURED_PAYMENT",
  "TAX_EVENT_1446F_FOR_PUBLICLY_TRADED_SECURITIES_MANUFACTURED_PAYMENT",
  "PTP_UNCHARACTERISED_INCOME_MANUFACTURED_PAYMENT",
  "MULTIPLE_1042S_TAX_COMPONENTS_MANUFACTURED_PAYMENT",
  "DIVIDEND_MANUFACTURED_PAYMENT",
  "SHORT_TERM_CAPITAL_GAINS_MANUFACTURED_PAYMENT",
  "LONG_TERM_CAPITAL_GAINS_MANUFACTURED_PAYMENT",
  "PROPERTY_INCOME_DISTRIBUTION_MANUFACTURED_PAYMENT",
  "TAX_EXEMPTED_MANUFACTURED_PAYMENT",
]);
export type DividendType = z.infer<typeof DividendTypeSchema>;

export const DividendSchema = z.object({
  ticker: z.string(),
  tickerCurrency: z.string().optional(),
  instrument: InstrumentRefSchema,
  reference: z.string(),
  quantity: z.number(),
  amount: z.number().optional(),
  amountInEuro: z.number().optional(),
  grossAmountPerShare: z.number().optional(),
  currency: z.string().optional(),
  paidOn: z.string().optional(),
  type: DividendTypeSchema.optional(),
});
export type Dividend = z.infer<typeof DividendSchema>;

export const TransactionTypeSchema = z.enum([
  "WITHDRAW",
  "DEPOSIT",
  "FEE",
  "TRANSFER",
  "INTEREST_ON_FREE_CASH",
  "LENDING_INTEREST",
]);
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const TransactionSchema = z.object({
  type: TransactionTypeSchema,
  amount: z.number(),
  currency: z.string(),
  reference: z.string(),
  dateTime: z.string(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

export const InvestmentResultSchema = z.object({
  priceAvgInvestedValue: z.number(),
  priceAvgValue: z.number(),
  priceAvgResult: z.number(),
  priceAvgResultCoef: z.number(),
});
export type InvestmentResult = z.infer<typeof InvestmentResultSchema>;

export const DividendCashActionSchema = z.enum(["REINVEST", "TO_ACCOUNT_CASH"]);
export type DividendCashAction = z.infer<typeof DividendCashActionSchema>;

export const PieRequestSchema = z.object({
  name: z.string(),
  goal: z.number().optional(),
  instrumentShares: z.record(z.string(), z.number()).optional(),
  dividendCashAction: DividendCashActionSchema.optional(),
  endDate: z.string().optional(),
  icon: z.string().optional(),
});
export type PieRequest = z.infer<typeof PieRequestSchema>;

export const DuplicatePieRequestSchema = z.object({
  name: z.string().optional(),
  icon: z.string().optional(),
});
export type DuplicatePieRequest = z.infer<typeof DuplicatePieRequestSchema>;

/** Shape returned by GET /equity/pies (the list endpoint). */
export const PieSummarySchema = z.object({
  id: z.number(),
  cash: z.number(),
  dividendDetails: z.object({
    gained: z.number(),
    reinvested: z.number(),
    inCash: z.number(),
  }),
  progress: z.number().optional(),
  result: InvestmentResultSchema,
  status: z.enum(["AHEAD", "ON_TRACK", "BEHIND"]).optional(),
});
export type PieSummary = z.infer<typeof PieSummarySchema>;

export const InstrumentIssueNameSchema = z.enum([
  "DELISTED",
  "SUSPENDED",
  "NO_LONGER_TRADABLE",
  "MAX_POSITION_SIZE_REACHED",
  "APPROACHING_MAX_POSITION_SIZE",
  "COMPLEX_INSTRUMENT_APP_TEST_REQUIRED",
  "PRICE_TOO_LOW",
]);
export type InstrumentIssueName = z.infer<typeof InstrumentIssueNameSchema>;

export const InstrumentIssueSchema = z.object({
  name: InstrumentIssueNameSchema,
  severity: z.enum(["IRREVERSIBLE", "REVERSIBLE", "INFORMATIVE"]),
});
export type InstrumentIssue = z.infer<typeof InstrumentIssueSchema>;

export const PieInstrumentResultSchema = z.object({
  ticker: z.string(),
  ownedQuantity: z.number(),
  currentShare: z.number(),
  expectedShare: z.number(),
  result: InvestmentResultSchema,
  issues: z.array(InstrumentIssueSchema).optional(),
});
export type PieInstrumentResult = z.infer<typeof PieInstrumentResultSchema>;

export const PieSettingsSchema = z.object({
  id: z.number(),
  name: z.string(),
  goal: z.number().optional(),
  icon: z.string().optional(),
  initialInvestment: z.number().optional(),
  creationDate: z.string(),
  endDate: z.string().optional(),
  dividendCashAction: DividendCashActionSchema.optional(),
  instrumentShares: z.record(z.string(), z.number()).optional(),
  publicUrl: z.string().optional(),
});
export type PieSettings = z.infer<typeof PieSettingsSchema>;

/**
 * Shape returned by GET/POST /equity/pies/{id}, POST /equity/pies (create),
 * and POST /equity/pies/{id}/duplicate — a different, richer shape than the
 * list endpoint's PieSummary.
 */
export const PieDetailSchema = z.object({
  instruments: z.array(PieInstrumentResultSchema),
  settings: PieSettingsSchema,
});
export type PieDetail = z.infer<typeof PieDetailSchema>;

export const InstrumentSchema = z.object({
  ticker: z.string(),
  type: z.enum([
    "CRYPTOCURRENCY",
    "ETF",
    "FOREX",
    "FUTURES",
    "INDEX",
    "STOCK",
    "WARRANT",
    "CRYPTO",
    "CVR",
    "CORPACT",
  ]),
  workingScheduleId: z.number(),
  isin: z.string(),
  currencyCode: z.string(),
  name: z.string(),
  shortName: z.string(),
  maxOpenQuantity: z.number(),
  extendedHours: z.boolean(),
  addedOn: z.string().optional(),
});
export type Instrument = z.infer<typeof InstrumentSchema>;

export const WorkingScheduleTimeEventTypeSchema = z.enum([
  "OPEN",
  "CLOSE",
  "BREAK_START",
  "BREAK_END",
  "PRE_MARKET_OPEN",
  "AFTER_HOURS_OPEN",
  "AFTER_HOURS_CLOSE",
  "OVERNIGHT_OPEN",
]);
export type WorkingScheduleTimeEventType = z.infer<typeof WorkingScheduleTimeEventTypeSchema>;

export const WorkingScheduleTimeEventSchema = z.object({
  date: z.string(),
  type: WorkingScheduleTimeEventTypeSchema,
});
export type WorkingScheduleTimeEvent = z.infer<typeof WorkingScheduleTimeEventSchema>;

export const WorkingScheduleSchema = z.object({
  id: z.number(),
  timeEvents: z.array(WorkingScheduleTimeEventSchema),
});
export type WorkingSchedule = z.infer<typeof WorkingScheduleSchema>;

export const ExchangeSchema = z.object({
  id: z.number(),
  name: z.string(),
  workingSchedules: z.array(WorkingScheduleSchema),
});
export type Exchange = z.infer<typeof ExchangeSchema>;
