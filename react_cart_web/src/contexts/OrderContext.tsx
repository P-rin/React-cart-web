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
  ordersService,
  processOrder,
  type OrderDoc,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
  type ProcessOrderResult,
  type ShippingAddress,
} from '../services/firestore-service'

type PlaceOrderInput = {
  shippingAddress: ShippingAddress
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  shippingCost: number
  tax: number
  discountAmount: number
  notes?: string
}

type OrderContextValue = {
  orders: OrderDoc[]
  selectedOrder: OrderDoc | null
  loading: boolean
  error: string
  fetchOrders: () => Promise<void>
  fetchOrdersByStatus: (status: OrderStatus) => Promise<void>
  getOrder: (orderId: string) => Promise<void>
  placeOrder: (payload: PlaceOrderInput) => Promise<ProcessOrderResult>
  clearSelectedOrder: () => void
}

const OrderContext = createContext<OrderContextValue | undefined>(undefined)

export function OrderProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth()
  const [orders, setOrders] = useState<OrderDoc[]>([])
  const [selectedOrder, setSelectedOrder] = useState<OrderDoc | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchOrders = useCallback(async () => {
    if (!currentUser) {
      setOrders([])
      return
    }

    try {
      setLoading(true)
      setError('')
      const data = await ordersService.getUserOrders(currentUser.uid)
      setOrders(data)
    } catch {
      setError('Unable to load orders.')
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  const fetchOrdersByStatus = useCallback(
    async (status: OrderStatus) => {
      if (!currentUser) {
        setOrders([])
        return
      }

      try {
        setLoading(true)
        setError('')
        const data = await ordersService.getUserOrdersByStatus(currentUser.uid, status)
        setOrders(data)
      } catch {
        setError('Unable to load orders by status.')
      } finally {
        setLoading(false)
      }
    },
    [currentUser],
  )

  const getOrder = useCallback(async (orderId: string) => {
    try {
      setLoading(true)
      setError('')
      const data = await ordersService.getOrder(orderId)
      setSelectedOrder(data)
    } catch {
      setError('Unable to load order detail.')
      setSelectedOrder(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const placeOrder = useCallback(
    async (payload: PlaceOrderInput) => {
      if (!currentUser) {
        throw new Error('Please login before placing order')
      }

      try {
        setLoading(true)
        setError('')

        const result = await processOrder({
          userId: currentUser.uid,
          shippingAddress: payload.shippingAddress,
          paymentMethod: payload.paymentMethod,
          paymentStatus: payload.paymentStatus,
          shippingCost: payload.shippingCost,
          tax: payload.tax,
          discountAmount: payload.discountAmount,
          notes: payload.notes,
        })

        await fetchOrders()
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to place order'
        setError(message)
        throw new Error(message)
      } finally {
        setLoading(false)
      }
    },
    [currentUser, fetchOrders],
  )

  const clearSelectedOrder = useCallback(() => {
    setSelectedOrder(null)
  }, [])

  useEffect(() => {
    void fetchOrders()
  }, [fetchOrders])

  const value = useMemo(
    () => ({
      orders,
      selectedOrder,
      loading,
      error,
      fetchOrders,
      fetchOrdersByStatus,
      getOrder,
      placeOrder,
      clearSelectedOrder,
    }),
    [
      orders,
      selectedOrder,
      loading,
      error,
      fetchOrders,
      fetchOrdersByStatus,
      getOrder,
      placeOrder,
      clearSelectedOrder,
    ],
  )

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}

export function useOrders() {
  const context = useContext(OrderContext)
  if (!context) {
    throw new Error('useOrders must be used within OrderProvider')
  }
  return context
}
