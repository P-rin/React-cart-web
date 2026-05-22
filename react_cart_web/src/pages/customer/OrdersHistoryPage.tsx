import { useMemo, useState } from 'react'
import OrderTimeline from '../../components/orders/OrderTimeline'
import { useOrders } from '../../contexts/OrderContext'
import type { OrderDoc } from '../../services/firestore-service'

type OrdersHistoryPageProps = {
  onBackToCatalog: () => void
}

type FilterTab = 'all' | 'to-pay' | 'to-ship' | 'completed' | 'cancelled'

const tabs: Array<{ key: FilterTab; label: string }> = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'to-pay', label: 'รอชำระเงิน' },
  { key: 'to-ship', label: 'กำลังจัดส่ง' },
  { key: 'completed', label: 'สำเร็จ' },
  { key: 'cancelled', label: 'ยกเลิก' },
]

function matchesFilter(order: OrderDoc, tab: FilterTab) {
  if (tab === 'all') return true
  if (tab === 'to-pay') return order.paymentStatus === 'pending'
  if (tab === 'to-ship') {
    return ['confirmed', 'processing', 'shipped'].includes(order.status)
  }
  if (tab === 'completed') return order.status === 'delivered'
  return order.status === 'cancelled'
}

export default function OrdersHistoryPage({ onBackToCatalog }: OrdersHistoryPageProps) {
  const { orders, loading, error } = useOrders()
  const [tab, setTab] = useState<FilterTab>('all')
  const [selectedOrderId, setSelectedOrderId] = useState<string>('')

  const filteredOrders = useMemo(
    () => orders.filter((order) => matchesFilter(order, tab)),
    [orders, tab],
  )

  const selectedOrder = useMemo(() => {
    return filteredOrders.find((order) => order.orderId === selectedOrderId) ?? filteredOrders[0] ?? null
  }, [filteredOrders, selectedOrderId])

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">ประวัติคำสั่งซื้อ</h1>
          <p className="text-sm text-slate-600">ติดตามสถานะการสั่งซื้อและตรวจสอบรายละเอียดแต่ละออเดอร์</p>
        </div>

        <button
          type="button"
          onClick={onBackToCatalog}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          กลับหน้าสินค้า
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              tab === item.key
                ? 'bg-brand-500 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? <p className="text-slate-700">Loading orders...</p> : null}
      {error ? <p className="text-rose-600">{error}</p> : null}

      {filteredOrders.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          ยังไม่มีรายการสั่งซื้อในหมวดนี้
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
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
                  <p className="text-sm text-slate-500">{order.orderNumber}</p>
                  <p className="text-base font-semibold text-slate-900">
                    ฿{order.totalAmount.toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm capitalize text-slate-700">สถานะ: {order.status}</p>
                  <p className="text-xs text-slate-500">
                    {order.createdAt?.toDate
                      ? order.createdAt.toDate().toLocaleString('th-TH')
                      : 'Unknown date'}
                  </p>
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

              <div className="space-y-1 text-sm text-slate-700">
                <p className="flex items-center justify-between">
                  <span>Payment</span>
                  <span className="capitalize">{selectedOrder.paymentStatus}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>Status</span>
                  <span className="capitalize">{selectedOrder.status}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>Total</span>
                  <span className="font-semibold text-slate-900">
                    ฿{selectedOrder.totalAmount.toLocaleString()}
                  </span>
                </p>
              </div>

              <div className="space-y-2 rounded-xl bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-800">รายการสินค้า</p>
                {selectedOrder.items.map((item) => (
                  <p key={item.productId} className="text-sm text-slate-700">
                    {item.name} x {item.quantity}
                  </p>
                ))}
              </div>

              <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-800">ที่อยู่จัดส่ง</p>
                <p>{selectedOrder.shippingAddress.fullName}</p>
                <p>{selectedOrder.shippingAddress.phone}</p>
                <p>
                  {selectedOrder.shippingAddress.street} {selectedOrder.shippingAddress.district}{' '}
                  {selectedOrder.shippingAddress.province} {selectedOrder.shippingAddress.postalCode}
                </p>
                <p>{selectedOrder.shippingAddress.country}</p>
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
