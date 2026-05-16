import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase-config'
import { getUserProfile, type UserProfile } from '../services/user-service'

type Address = {
  street: string
  district: string
  province: string
  postalCode: string
  country: string
}

type AuthContextValue = {
  currentUser: User | null
  userProfile: UserProfile | null
  role: 'customer' | 'admin' | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: {
    email: string
    password: string
    username: string
    firstName: string
    lastName: string
    phone?: string
  }) => Promise<void>
  signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)

      if (user) {
        const profile = await getUserProfile(user.uid)
        setUserProfile(profile)
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }, [])

  const signUp = useCallback(
    async (input: {
      email: string
      password: string
      username: string
      firstName: string
      lastName: string
      phone?: string
    }) => {
      const { email, password, username, firstName, lastName, phone } = input
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      const user = credential.user

      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`.trim(),
      })

      const emptyAddress: Address = {
        street: '',
        district: '',
        province: '',
        postalCode: '',
        country: '',
      }

      await setDoc(doc(db, 'users', user.uid), {
        userId: user.uid,
        email,
        username,
        firstName,
        lastName,
        phone: phone ?? '',
        profileImage: '',
        role: 'customer',
        status: 'active',
        address: emptyAddress,
        preferences: {
          currency: 'THB',
          language: 'th',
          notifications: true,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      const profile = await getUserProfile(user.uid)
      setUserProfile(profile)
    },
    [],
  )

  const signOutUser = useCallback(async () => {
    await signOut(auth)
  }, [])

  const value = useMemo(
    () => ({
      currentUser,
      userProfile,
      role: userProfile?.role ?? null,
      loading,
      signIn,
      signUp,
      signOutUser,
    }),
    [currentUser, userProfile, loading, signIn, signUp, signOutUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
