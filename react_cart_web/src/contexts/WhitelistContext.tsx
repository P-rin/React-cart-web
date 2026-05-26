import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import {
  whitelistsService,
  type Product,
  type WhitelistDoc,
} from '../services/firestore-service'

type WhitelistContextValue = {
  whitelist: WhitelistDoc | null
  loading: boolean
  error: string
  refreshWhitelist: () => Promise<void>
  isInWhitelist: (productId: string) => boolean
  toggleWhitelist: (product: Product) => Promise<boolean>
  removeFromWhitelist: (productId: string) => Promise<void>
}

const WhitelistContext = createContext<WhitelistContextValue | undefined>(undefined)

export function WhitelistProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth()
  const [whitelist, setWhitelist] = useState<WhitelistDoc | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const refreshWhitelist = useCallback(async () => {
    if (!currentUser) {
      setWhitelist(null)
      return
    }

    try {
      setLoading(true)
      setError('')
      const data = await whitelistsService.getWhitelist(currentUser.uid)
      setWhitelist(data)
    } catch {
      setError('Unable to load whitelist data.')
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    void refreshWhitelist()
  }, [refreshWhitelist])

  const isInWhitelist = useCallback(
    (productId: string) => {
      return whitelist?.items.some((item) => item.productId === productId) ?? false
    },
    [whitelist],
  )

  const toggleWhitelist = useCallback(
    async (product: Product) => {
      if (!currentUser) {
        throw new Error('Please login before updating whitelist.')
      }

      try {
        setLoading(true)
        setError('')
        const payload = {
          productId: product.productId,
          name: product.name,
          price: product.price,
          ...(product.images[0] ? { image: product.images[0] } : {}),
        }
        const result = await whitelistsService.toggleWhitelist(currentUser.uid, {
          ...payload,
        })
        await refreshWhitelist()
        return result.inWhitelist
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to update whitelist.'
        setError(message)
        throw new Error(message)
      } finally {
        setLoading(false)
      }
    },
    [currentUser, refreshWhitelist],
  )

  const removeFromWhitelist = useCallback(
    async (productId: string) => {
      if (!currentUser) {
        throw new Error('Please login before updating whitelist.')
      }

      try {
        setLoading(true)
        setError('')
        await whitelistsService.removeFromWhitelist(currentUser.uid, productId)
        await refreshWhitelist()
      } catch {
        setError('Unable to remove product from whitelist.')
      } finally {
        setLoading(false)
      }
    },
    [currentUser, refreshWhitelist],
  )

  const value = useMemo(
    () => ({
      whitelist,
      loading,
      error,
      refreshWhitelist,
      isInWhitelist,
      toggleWhitelist,
      removeFromWhitelist,
    }),
    [whitelist, loading, error, refreshWhitelist, isInWhitelist, toggleWhitelist, removeFromWhitelist],
  )

  return <WhitelistContext.Provider value={value}>{children}</WhitelistContext.Provider>
}

export function useWhitelist() {
  const context = useContext(WhitelistContext)
  if (!context) {
    throw new Error('useWhitelist must be used within WhitelistProvider')
  }
  return context
}
