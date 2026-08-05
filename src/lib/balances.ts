import { Expense } from '@/types/expense'

export type Balance = {
  uid: string
  name: string
  net: number // positive = this person is owed money, negative = they owe money
}

export type CurrencyBalances = {
  currency: string
  balances: Balance[]
}

/**
 * Computes net balances per member, grouped separately by currency.
 * Deliberately does NOT convert between currencies — a trip with both USD and EUR
 * expenses gets two separate balance groups rather than one merged (and misleading)
 * total. Real cross-currency conversion needs a live exchange-rate feed, which isn't
 * wired up yet; combining currencies without it would just be quietly wrong math.
 */
export function computeBalances(
  expenses: Expense[],
  members: Record<string, { name: string }>,
): CurrencyBalances[] {
  const byCurrency = new Map<string, Map<string, number>>()

  for (const expense of expenses) {
    if (expense.settled) continue

    if (!byCurrency.has(expense.currency)) {
      byCurrency.set(expense.currency, new Map())
    }
    const netByUid = byCurrency.get(expense.currency)!

    const shareCount = expense.splitBetween.length || 1
    const perPersonShare = expense.amount / shareCount

    // Payer is credited the full amount, then debited their own share (net effect:
    // credited for everyone else's share, since they already covered their own).
    netByUid.set(expense.paidBy, (netByUid.get(expense.paidBy) || 0) + expense.amount)

    for (const uid of expense.splitBetween) {
      netByUid.set(uid, (netByUid.get(uid) || 0) - perPersonShare)
    }
  }

  return Array.from(byCurrency.entries()).map(([currency, netByUid]) => ({
    currency,
    balances: Array.from(netByUid.entries()).map(([uid, net]) => ({
      uid,
      name: members[uid]?.name || 'Unknown',
      net: Math.round(net * 100) / 100,
    })),
  }))
}