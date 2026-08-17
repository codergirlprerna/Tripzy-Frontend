export type ExchangeRates = {
  base: string
  rates: Record<string, number> // 1 unit of `base` = this many units of the key currency
  fetchedAt: number
}

const CACHE_KEY_PREFIX = 'tripzy:exchangeRates:'
const CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000 // 12h — exchange rates don't need to be live-live for splitting a trip bill, and this keeps requests low

/**
 * Frankfurter (frankfurter.app) — free, no API key, backed by European
 * Central Bank reference rates. Chosen deliberately over a "free public
 * demo" style service (the kind that caused real problems earlier this
 * session with Overpass/OSRM) — this is an actual maintained API with
 * real uptime expectations, not a shared demo instance.
 *
 * Caches in sessionStorage so switching tabs/reopening the expenses view
 * doesn't refetch every time — only refetches once the cache is more than
 * 12h old.
 */
export async function fetchExchangeRates(baseCurrency: string): Promise<ExchangeRates | null> {
  const cacheKey = CACHE_KEY_PREFIX + baseCurrency

  try {
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      const parsed: ExchangeRates = JSON.parse(cached)
      if (Date.now() - parsed.fetchedAt < CACHE_MAX_AGE_MS) return parsed
    }
  } catch {
    // sessionStorage unavailable (privacy mode, etc.) — fall through to a fresh fetch every time
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const response = await fetch(`https://api.frankfurter.app/latest?from=${baseCurrency}`, {
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      console.warn('Exchange rate fetch failed:', response.status)
      return null
    }

    const data = await response.json()
    const result: ExchangeRates = {
      base: baseCurrency,
      rates: { ...data.rates, [baseCurrency]: 1 }, // Frankfurter omits the base currency from its own rates list
      fetchedAt: Date.now(),
    }

    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(result))
    } catch {
      // storage full or unavailable — not worth failing the whole feature over
    }

    return result
  } catch (err: any) {
    console.warn('Exchange rate fetch error:', err?.name === 'AbortError' ? 'timed out' : err?.message)
    return null
  }
}

/**
 * Converts an amount FROM some other currency INTO `rates.base`.
 * `rates` must have been fetched with `rates.base` as the base currency
 * (i.e. `fetchExchangeRates(displayCurrency)`) — `rates.rates[fromCurrency]`
 * then means "this many units of fromCurrency equal 1 unit of rates.base",
 * so dividing converts the other direction, into the base.
 */
export function convertToBaseCurrency(amount: number, fromCurrency: string, rates: ExchangeRates): number | null {
  if (fromCurrency === rates.base) return amount
  const rate = rates.rates[fromCurrency]
  if (!rate) return null
  return amount / rate
}