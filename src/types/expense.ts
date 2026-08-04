export type Expense = {
  id: string
  tripId: string
  paidBy: string
  paidByName: string
  amount: number
  currency: string
  description: string
  splitBetween: string[] // uids of members sharing this cost, including the payer if they're sharing it too
  settled: boolean
  createdAt: number
}

export type NewExpense = Omit<Expense, 'id' | 'createdAt' | 'settled'>