import { useState, FormEvent } from 'react'
import { useAuth } from '@/context/AuthContext'
import { addExpense } from '@/lib/expenses'
import { Trip } from '@/types/trip'
import Spinner from '@/components/Spinner'
import { useModalA11y } from '@/hooks/useModalA11y'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD']

type Props = {
  trip: Trip
  onClose: () => void
}

export default function AddExpenseModal({ trip, onClose }: Props) {
  const modalRef = useModalA11y(onClose)
  const { currentUser } = useAuth()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [splitBetween, setSplitBetween] = useState<string[]>(trip.memberIds)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function toggleMember(uid: string) {
    setSplitBetween((prev) => (prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!currentUser) return

    if (splitBetween.length === 0) {
      setError('Pick at least one person to split this with.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await addExpense(trip.id, {
        tripId: trip.id,
        paidBy: currentUser.uid,
        paidByName: currentUser.displayName || currentUser.email || 'Someone',
        amount: parseFloat(amount),
        currency,
        description,
        splitBetween,
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Could not log the expense. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 px-4 py-8">
      <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Add expense" tabIndex={-1} className="modal-card sticker-card max-h-[90vh] w-full max-w-[440px] overflow-y-auto p-7 shadow-hard sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-[22px] font-extrabold">Log an expense</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-ink text-[16px] font-bold"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border-[2px] border-ink bg-pink/20 px-4 py-3 text-[13px] font-semibold text-ink">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-wide text-[#4a4460]">
              What was it for?
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dinner at the harbor"
              className="w-full rounded-xl border-[2.5px] border-ink px-4 py-3 text-[14.5px] font-medium outline-none"
            />
          </div>

          <div className="grid grid-cols-[1fr_100px] gap-3">
            <div>
              <label className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-wide text-[#4a4460]">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border-[2.5px] border-ink px-4 py-3 text-[14.5px] font-medium outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-wide text-[#4a4460]">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-xl border-[2.5px] border-ink px-2 py-3 text-[13.5px] font-medium outline-none"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block font-mono text-[11px] font-bold uppercase tracking-wide text-[#4a4460]">
              Split between
            </label>
            <div className="flex flex-col gap-2">
              {trip.memberIds.map((uid) => (
                <label key={uid} className="flex items-center gap-2.5 text-[14px] font-medium">
                  <input
                    type="checkbox"
                    checked={splitBetween.includes(uid)}
                    onChange={() => toggleMember(uid)}
                    className="h-4 w-4 accent-pink"
                  />
                  {trip.members[uid]?.name || 'Unknown'}
                </label>
              ))}
            </div>
            <p className="mt-2 text-[12px] font-medium text-[#4a4460]">
              Splits evenly between everyone checked. Uneven splits aren't supported yet.
            </p>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary mt-2 w-full !text-center disabled:opacity-60">
            {submitting ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Spinner /> Saving…
              </span>
            ) : (
              'Add expense'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}