import { collection, addDoc, doc, updateDoc, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { NewExpense, Expense } from '@/types/expense'

export async function addExpense(tripId: string, expense: NewExpense) {
  await addDoc(collection(db, 'trips', tripId, 'expenses'), {
    ...expense,
    settled: false,
    createdAt: Date.now(),
  })
}

export async function setExpenseSettled(tripId: string, expenseId: string, settled: boolean) {
  await updateDoc(doc(db, 'trips', tripId, 'expenses', expenseId), { settled })
}

export function subscribeToTripExpenses(tripId: string, callback: (expenses: Expense[]) => void) {
  const expensesQuery = query(collection(db, 'trips', tripId, 'expenses'), orderBy('createdAt', 'desc'))

  return onSnapshot(expensesQuery, (snapshot) => {
    const expenses = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Expense[]
    callback(expenses)
  })
}