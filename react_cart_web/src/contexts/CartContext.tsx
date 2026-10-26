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
      return 'ไม่มีสิทธิ์เข้าถึงข้อมูล กรุณาตรวจสอบกฎ Firestore สำหรับตะกร้าสินค้าและรายการโปรด'
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
      setError('โหลดข้อมูลตะกร้าสินค้าไม่สำเร็จ')
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
        throw new Error('กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า')
      }

      const existingQty =
        cart?.items.find((item) => item.productId === product.productId)?.quantity ?? 0

      if (quantity <= 0) {
        throw new Error('จำนวนสินค้าต้องอย่างน้อย 1 ชิ้น')
      }

      if (existingQty + quantity > product.stock) {
        throw new Error('จำนวนสินค้าที่เลือกเกินจำนวนคงเหลือ')
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
        const message = getCartErrorMessage(err, 'ไม่สามารถเพิ่มสินค้าลงตะกร้าได้')
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
        throw new Error('กรุณาเข้าสู่ระบบก่อนแก้ไขตะกร้าสินค้า')
      }

      if (stock !== undefined && quantity > stock) {
        throw new Error('จำนวนสินค้าที่เลือกเกินจำนวนคงเหลือ')
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
        const message = getCartErrorMessage(err, 'ไม่สามารถอัปเดตจำนวนสินค้าได้')
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
        throw new Error('กรุณาเข้าสู่ระบบก่อนแก้ไขตะกร้าสินค้า')
      }

      try {
        setLoading(true)
        setError('')
        const nextCart = await cartsService.removeFromCart(currentUser.uid, productId)
        setCart(nextCart)
      } catch (err) {
        setError(getCartErrorMessage(err, 'ไม่สามารถนำสินค้าออกจากตะกร้าได้'))
      } finally {
        setLoading(false)
      }
    },
    [currentUser],
  )

  const clearCart = useCallback(async () => {
    if (!currentUser) {
      throw new Error('กรุณาเข้าสู่ระบบก่อนแก้ไขตะกร้าสินค้า')
    }

    try {
      setLoading(true)
      setError('')
      await cartsService.clearCart(currentUser.uid)
      setCart(null)
    } catch (err) {
      setError(getCartErrorMessage(err, 'ไม่สามารถล้างตะกร้าสินค้าได้'))
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
