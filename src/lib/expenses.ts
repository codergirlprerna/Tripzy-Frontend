import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { NewExpense, Expense } from '@/types/expense'

export async function addExpense(tripId: string, expense: NewExpense) {
  await addDoc(collection(db, 'trips', tripId, 'expenses'), {
    ...expense,
    createdAt: Date.now(),
  })
}

export function subscribeToTripExpenses(tripId: string, callback: (expenses: Expense[]) => void) {
  const expensesQuery = query(collection(db, 'trips', tripId, 'expenses'), orderBy('createdAt', 'desc'))

  return onSnapshot(expensesQuery, (snapshot) => {
    const expenses = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Expense[]
    callback(expenses)
  })
}