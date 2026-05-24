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
  cartsService,
  type CartDoc,
  type CartItemInput,
  type Product,
} from '../services/firestore-service'

type CartContextValue = {
  cart: CartDoc | null
  loading: boolean
  error: string
  addToCart: (product: Product, quantity: number) => Promise<void>
  updateQuantity: (productId: string, quantity: number, stock?: number) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

function getCartErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    const maybeCode = error as Error & { code?: string }
    if (maybeCode.code === 'permission-denied') {
      return 'Missing or insufficient permissions. Please update Firestore rules for carts/whitelists.'
    }
    return error.message || fallback
  }
  return fallback
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth()
  const [cart, setCart] = useState<CartDoc | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const refreshCart = useCallback(async () => {
    if (!currentUser) {
      setCart(null)
      return
    }

    try {
      setLoading(true)
      setError('')
      const data = await cartsService.getCart(currentUser.uid)
      setCart(data)
    } catch {
      setError('Unable to load cart data.')
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    void refreshCart()
  }, [refreshCart])

  const addToCart = useCallback(
    async (product: Product, quantity: number) => {
      if (!currentUser) {
        throw new Error('Please login before adding products to cart.')
      }

      const existingQty =
        cart?.items.find((item) => item.productId === product.productId)?.quantity ?? 0

      if (quantity <= 0) {
        throw new Error('Quantity must be at least 1')
      }

      if (existingQty + quantity > product.stock) {
        throw new Error('Requested quantity exceeds available stock')
      }

      const payload: CartItemInput & { stock: number } = {
        productId: product.productId,
        name: product.name,
        price: product.price,
        image: product.images[0],
        specifications: product.specifications,
        quantity,
        stock: product.stock,
      }

      try {
        setLoading(true)
        setError('')
        const nextCart = await cartsService.addToCart(currentUser.uid, payload, quantity)
        setCart(nextCart)
      } catch (err) {
        const message = getCartErrorMessage(err, 'Unable to add product to cart.')
        setError(message)
        throw new Error(message)
      } finally {
        setLoading(false)
      }
    },
    [currentUser, cart],
  )

  const updateQuantity = useCallback(
    async (productId: string, quantity: number, stock?: number) => {
      if (!currentUser) {
        throw new Error('Please login before editing cart.')
      }

      if (stock !== undefined && quantity > stock) {
        throw new Error('Requested quantity exceeds available stock')
      }

      try {
        setLoading(true)
        setError('')
        const nextCart = await cartsService.updateCartItemQuantity(
          currentUser.uid,
          productId,
          quantity,
          stock,
        )
        setCart(nextCart)
      } catch (err) {
        const message = getCartErrorMessage(err, 'Unable to update quantity.')
        setError(message)
        throw new Error(message)
      } finally {
        setLoading(false)
      }
    },
    [currentUser],
  )

  const removeFromCart = useCallback(
    async (productId: string) => {
      if (!currentUser) {
        throw new Error('Please login before editing cart.')
      }

      try {
        setLoading(true)
        setError('')
        const nextCart = await cartsService.removeFromCart(currentUser.uid, productId)
        setCart(nextCart)
      } catch (err) {
        setError(getCartErrorMessage(err, 'Unable to remove cart item.'))
      } finally {
        setLoading(false)
      }
    },
    [currentUser],
  )

  const clearCart = useCallback(async () => {
    if (!currentUser) {
      throw new Error('Please login before editing cart.')
    }

    try {
      setLoading(true)
      setError('')
      await cartsService.clearCart(currentUser.uid)
      setCart(null)
    } catch (err) {
      setError(getCartErrorMessage(err, 'Unable to clear cart.'))
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  const value = useMemo(
    () => ({
      cart,
      loading,
      error,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      refreshCart,
    }),
    [cart, loading, error, addToCart, updateQuantity, removeFromCart, clearCart, refreshCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
