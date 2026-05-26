import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import OrderTimeline from '../../components/orders/OrderTimeline'
import {
  ordersService,
  type AdminOrderUpdateInput,
  type OrderDoc,
  type OrderStatus,
  type PaymentStatus,
} from '../../services/firestore-service'

type OrderFilter = 'all' | OrderStatus

type OrderDraft = {
  status: OrderStatus
  paymentStatus: PaymentStatus
  trackingNumber: string
  note: string
}

const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]

const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'completed', 'failed', 'refunded']

function getOrderDraft(order: OrderDoc): OrderDraft {
  return {
    status: order.status,
    paymentStatus: order.paymentStatus,
    trackingNumber: order.trackingNumber ?? '',
    note: '',
  }
}

export default function AdminOrderManagementPage() {
  const { role } = useAuth()
  const [orders, setOrders] = useState<OrderDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savingOrderId, setSavingOrderId] = useState('')
  const [filter, setFilter] = useState<OrderFilter>('all')
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [drafts, setDrafts] = useState<Record<string, OrderDraft>>({})

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await ordersService.getAllOrders()
      setOrders(data)
    } catch {
      setError('Unable to load all orders.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (role !== 'admin') {
      return
    }
    void fetchOrders()
  }, [fetchOrders, role])

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return orders.filter((order) => {
      const matchesFilter = filter === 'all' ? true : order.status === filter
      const matchesSearch =
        q.length === 0
          ? true
          : order.orderNumber.toLowerCase().includes(q) ||
            order.userId.toLowerCase().includes(q) ||
            order.shippingAddress.fullName.toLowerCase().includes(q)

      return matchesFilter && matchesSearch
    })
  }, [filter, orders, searchTerm])

  const selectedOrder = useMemo(() => {
    if (!filteredOrders.length) {
      return null
    }
    return filteredOrders.find((order) => order.orderId === selectedOrderId) ?? filteredOrders[0]
  }, [filteredOrders, selectedOrderId])

  useEffect(() => {
    if (!selectedOrder || drafts[selectedOrder.orderId]) {
      return
    }

    setDrafts((prev) => ({
      ...prev,
      [selectedOrder.orderId]: getOrderDraft(selectedOrder),
    }))
  }, [drafts, selectedOrder])

  const updateDraft = (orderId: string, field: keyof OrderDraft, value: string) => {
    const sourceOrder = orders.find((item) => item.orderId === orderId)
    if (!sourceOrder) {
      return
    }

    const currentDraft = drafts[orderId] ?? getOrderDraft(sourceOrder)
    setDrafts((prev) => ({
      ...prev,
      [orderId]: {
        ...currentDraft,
        [field]: value,
      },
    }))
  }

  const handleSaveOrder = async (order: OrderDoc) => {
    const draft = drafts[order.orderId] ?? getOrderDraft(order)
    const payload: AdminOrderUpdateInput = {}

    if (draft.status !== order.status) {
      payload.status = draft.status
    }

    if (draft.paymentStatus !== order.paymentStatus) {
      payload.paymentStatus = draft.paymentStatus
    }

    if (draft.trackingNumber.trim() !== (order.trackingNumber ?? '').trim()) {
      payload.trackingNumber = draft.trackingNumber.trim()
    }

    if (draft.note.trim()) {
      payload.note = draft.note.trim()
    }

    if (Object.keys(payload).length === 0) {
      alert('No changes to save.')
      return
    }

    try {
      setSavingOrderId(order.orderId)
      await ordersService.adminUpdateOrder(order.orderId, payload)
      await fetchOrders()
      setDrafts((prev) => ({
        ...prev,
        [order.orderId]: {
          ...draft,
          note: '',
        },
      }))
    } catch {
      alert('Unable to update order.')
    } finally {
      setSavingOrderId('')
    }
  }

  if (role !== 'admin') {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Orders Management</h1>
        <p className="mt-2 text-sm text-rose-600">Only admin can access this page.</p>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Orders Maintenance</h1>
          <p className="text-sm text-slate-600">จัดการคำสั่งซื้อของลูกค้า ปรับสถานะ และอัปเดตข้อมูลการจัดส่ง</p>
        </div>

        <button
          type="button"
          onClick={() => void fetchOrders()}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-2 md:grid-cols-[220px_1fr]">
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as OrderFilter)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by order no, customer name or user id"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {loading ? <p className="text-slate-700">Loading orders...</p> : null}
      {error ? <p className="text-rose-600">{error}</p> : null}

      {filteredOrders.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          No orders found.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const isActive = selectedOrder?.orderId === order.orderId
              return (
                <button
                  key={order.orderId}
                  type="button"
                  onClick={() => setSelectedOrderId(order.orderId)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    isActive
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">{order.orderNumber}</p>
                      <p className="text-base font-semibold text-slate-900">{order.shippingAddress.fullName}</p>
                      <p className="text-xs text-slate-500">User ID: {order.userId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-slate-900">฿{order.totalAmount.toLocaleString()}</p>
                      <p className="text-xs capitalize text-slate-600">{order.status}</p>
                      <p className="text-xs capitalize text-slate-500">pay: {order.paymentStatus}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {selectedOrder ? (
            <aside className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <p className="text-xs text-slate-500">Order Number</p>
                <p className="text-lg font-semibold text-slate-900">{selectedOrder.orderNumber}</p>
              </div>

              <div className="space-y-3 rounded-xl bg-slate-50 p-3">
                <label className="space-y-1 text-sm text-slate-700">
                  <span>Status</span>
                  <select
                    value={(drafts[selectedOrder.orderId] ?? getOrderDraft(selectedOrder)).status}
                    onChange={(event) => updateDraft(selectedOrder.orderId, 'status', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm text-slate-700">
                  <span>Payment Status</span>
                  <select
                    value={(drafts[selectedOrder.orderId] ?? getOrderDraft(selectedOrder)).paymentStatus}
                    onChange={(event) =>
                      updateDraft(selectedOrder.orderId, 'paymentStatus', event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                  >
                    {PAYMENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm text-slate-700">
                  <span>Tracking Number</span>
                  <input
                    value={(drafts[selectedOrder.orderId] ?? getOrderDraft(selectedOrder)).trackingNumber}
                    onChange={(event) =>
                      updateDraft(selectedOrder.orderId, 'trackingNumber', event.target.value)
                    }
                    placeholder="Optional"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>

                <label className="space-y-1 text-sm text-slate-700">
                  <span>Admin Note (timeline)</span>
                  <textarea
                    rows={3}
                    value={(drafts[selectedOrder.orderId] ?? getOrderDraft(selectedOrder)).note}
                    onChange={(event) => updateDraft(selectedOrder.orderId, 'note', event.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>

                <button
                  type="button"
                  disabled={savingOrderId === selectedOrder.orderId}
                  onClick={() => void handleSaveOrder(selectedOrder)}
                  className="w-full rounded-lg bg-brand-500 px-4 py-2 font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
                >
                  {savingOrderId === selectedOrder.orderId ? 'Saving...' : 'Save Maintenance Update'}
                </button>
              </div>

              <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-800">Shipping Address</p>
                <p>{selectedOrder.shippingAddress.fullName}</p>
                <p>{selectedOrder.shippingAddress.phone}</p>
                <p>
                  {selectedOrder.shippingAddress.street} {selectedOrder.shippingAddress.district}{' '}
                  {selectedOrder.shippingAddress.province} {selectedOrder.shippingAddress.postalCode}
                </p>
                <p>{selectedOrder.shippingAddress.country}</p>
              </div>

              <div className="space-y-2 rounded-xl bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-800">Items</p>
                {selectedOrder.items.map((item) => (
                  <p key={item.productId} className="text-sm text-slate-700">
                    {item.name} x {item.quantity}
                  </p>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-800">Timeline</p>
                <OrderTimeline timeline={selectedOrder.timeline ?? []} />
              </div>
            </aside>
          ) : null}
        </div>
      )}
    </section>
  )
}
