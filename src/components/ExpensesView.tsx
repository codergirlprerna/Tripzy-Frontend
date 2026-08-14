import { Trip } from '@/types/trip'
import { Expense } from '@/types/expense'
import { computeBalances } from '@/lib/balances'
import { setExpenseSettled } from '@/lib/expenses'
import { Check } from 'lucide-react'

type Props = {
  trip: Trip
  expenses: Expense[]
}

export default function ExpensesView({ trip, expenses }: Props) {
  const currencyBalances = computeBalances(expenses, trip.members)

  async function toggleSettled(expense: Expense) {
    await setExpenseSettled(trip.id, expense.id, !expense.settled)
  }

  return (
    <div>
      {expenses.length === 0 ? (
        <div className="py-16 text-center text-[14.5px] font-medium text-[#4a4460]">
          No expenses yet — log the first one to start splitting costs with the crew.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          {/* Expense list */}
          <div className="flex flex-col gap-3">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className={`sticker-card flex items-center justify-between p-4 shadow-hard-sm ${
                  expense.settled ? 'opacity-50' : ''
                }`}
              >
                <div>
                  <div className="font-display text-[15px] font-extrabold">{expense.description}</div>
                  <div className="mt-0.5 text-[12px] font-medium text-[#4a4460]">
                    Paid by {expense.paidByName} · split {expense.splitBetween.length} ways
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-mono text-[16px] font-bold text-ink">
                    {expense.amount.toFixed(2)} {expense.currency}
                  </div>
                  <button
                    onClick={() => toggleSettled(expense)}
                    className={`inline-flex items-center gap-1 rounded-full border-2 border-ink px-3 py-1.5 text-[11px] font-bold ${
                      expense.settled ? 'bg-lime' : 'bg-white'
                    }`}
                  >
                    {expense.settled ? (
                      <>
                        <Check size={12} /> Settled
                      </>
                    ) : (
                      'Settle up'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Balances */}
          <div className="flex flex-col gap-4">
            {currencyBalances.map((group) => (
              <div key={group.currency} className="sticker-card p-5 shadow-hard-sm">
                <div className="mb-3 font-mono text-[11px] font-bold uppercase tracking-wide text-[#7a7590]">
                  Balances — {group.currency}
                </div>
                <div className="flex flex-col gap-2.5">
                  {group.balances.map((b) => (
                    <div key={b.uid} className="flex items-center justify-between text-[13.5px] font-semibold">
                      <span>{b.name}</span>
                      <span className={b.net >= 0 ? 'text-[#2f7a4a]' : 'text-[#c9403a]'}>
                        {b.net >= 0 ? '+' : ''}
                        {b.net.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] font-medium text-[#a39fb0]">
                  Positive = owed money · Negative = owes money
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}