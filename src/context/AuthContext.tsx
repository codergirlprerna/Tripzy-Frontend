import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'

type AuthContextValue = {
  currentUser: User | null
  loading: boolean
  signUp: (name: string, email: string, password: string) => Promise<void>
  logIn: (email: string, password: string) => Promise<void>
  logInWithGoogle: () => Promise<void>
  logOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function signUp(name: string, email: string, password: string) {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(credential.user, { displayName: name })
  }

  async function logIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function logInWithGoogle() {
    await signInWithPopup(auth, googleProvider)
  }

  async function logOut() {
    await signOut(auth)
  }

  const value: AuthContextValue = { currentUser, loading, signUp, logIn, logInWithGoogle, logOut }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}