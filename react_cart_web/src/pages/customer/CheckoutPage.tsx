import { useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { useOrders } from '../../contexts/OrderContext'
import type { PaymentMethod, PaymentStatus, ShippingAddress } from '../../services/firestore-service'

type CheckoutPageProps = {
  onSuccess: (payload: { orderId: string; orderNumber: string; totalAmount: number }) => void
  onBackToCart: () => void
}

const SHIPPING_FLAT = 60
const TAX_RATE = 0.07

export default function CheckoutPage({ onSuccess, onBackToCart }: CheckoutPageProps) {
  const { userProfile } = useAuth()
  const { cart } = useCart()
  const { placeOrder, loading, error } = useOrders()

  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer')

  const [address, setAddress] = useState<ShippingAddress>({
    fullName: `${userProfile?.firstName ?? ''} ${userProfile?.lastName ?? ''}`.trim(),
    phone: userProfile?.phone ?? '',
    street: userProfile?.address?.street ?? '',
    district: userProfile?.address?.district ?? '',
    province: userProfile?.address?.province ?? '',
    postalCode: userProfile?.address?.postalCode ?? '',
    country: userProfile?.address?.country ?? 'ประเทศไทย',
  })

  const subtotal = cart?.totalPrice ?? 0
  const shippingCost = subtotal > 1500 ? 0 : SHIPPING_FLAT
  const tax = useMemo(() => Number((subtotal * TAX_RATE).toFixed(2)), [subtotal])
  const discountAmount = 0
  const total = Math.max(0, subtotal + shippingCost + tax - discountAmount)

  const isAddressValid =
    address.fullName &&
    address.phone &&
    address.street &&
    address.district &&
    address.province &&
    address.postalCode &&
    address.country

  const hasItems = (cart?.items?.length ?? 0) > 0

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!hasItems) {
      return
    }

    const paymentStatus: PaymentStatus =
      paymentMethod === 'cash_on_delivery' ? 'pending' : 'completed'

    try {
      const result = await placeOrder({
        shippingAddress: address,
        paymentMethod,
        paymentStatus,
        shippingCost,
        tax,
        discountAmount,
        notes: notes.trim() || undefined,
      })
      onSuccess(result)
    } catch {
      // Surface message from context error state.
    }
  }

  if (!hasItems) {
    return (
      <section className="space-y-4 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">ไม่มีสินค้าในตะกร้า</h1>
        <p className="text-slate-600">เพิ่มสินค้าในตะกร้าก่อนทำรายการชำระเงิน</p>
        <button
          type="button"
          onClick={onBackToCart}
          className="rounded-xl bg-brand-500 px-4 py-2.5 font-medium text-white hover:bg-brand-600"
        >
          กลับไปตะกร้า
        </button>
      </section>
    )
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">ยืนยันคำสั่งซื้อ</h1>
          <p className="text-sm text-slate-600">ตรวจสอบที่อยู่จัดส่งและเลือกวิธีชำระเงิน</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-700">
            <span>ชื่อผู้รับ</span>
            <input
              value={address.fullName}
              onChange={(e) => setAddress((prev) => ({ ...prev, fullName: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <label className="space-y-1 text-sm text-slate-700">
            <span>เบอร์โทร</span>
            <input
              value={address.phone}
              onChange={(e) => setAddress((prev) => ({ ...prev, phone: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
            <span>ที่อยู่</span>
            <input
              value={address.street}
              onChange={(e) => setAddress((prev) => ({ ...prev, street: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <label className="space-y-1 text-sm text-slate-700">
            <span>เขต/อำเภอ</span>
            <input
              value={address.district}
              onChange={(e) => setAddress((prev) => ({ ...prev, district: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <label className="space-y-1 text-sm text-slate-700">
            <span>จังหวัด</span>
            <input
              value={address.province}
              onChange={(e) => setAddress((prev) => ({ ...prev, province: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <label className="space-y-1 text-sm text-slate-700">
            <span>รหัสไปรษณีย์</span>
            <input
              value={address.postalCode}
              onChange={(e) => setAddress((prev) => ({ ...prev, postalCode: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <label className="space-y-1 text-sm text-slate-700">
            <span>ประเทศ</span>
            <input
              value={address.country}
              onChange={(e) => setAddress((prev) => ({ ...prev, country: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              required
            />
          </label>
        </div>

        <div className="space-y-2 rounded-xl bg-slate-50 p-3">
          <p className="text-sm font-medium text-slate-800">วิธีชำระเงิน</p>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              checked={paymentMethod === 'bank_transfer'}
              onChange={() => setPaymentMethod('bank_transfer')}
            />
            <span>โอนเงินผ่านธนาคาร</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              checked={paymentMethod === 'credit_card'}
              onChange={() => setPaymentMethod('credit_card')}
            />
            <span>บัตรเครดิต</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              checked={paymentMethod === 'cash_on_delivery'}
              onChange={() => setPaymentMethod('cash_on_delivery')}
            />
            <span>ชำระเงินปลายทาง</span>
          </label>
        </div>

        <label className="block space-y-1 text-sm text-slate-700">
          <span>หมายเหตุเพิ่มเติม</span>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="เช่น ฝากไว้ที่นิติบุคคล"
          />
        </label>

        {error ? <p className="rounded-lg bg-rose-50 p-2 text-sm text-rose-600">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onBackToCart}
            className="rounded-xl border border-slate-300 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-100"
          >
            กลับไปตะกร้า
          </button>
          <button
            type="submit"
            disabled={loading || !isAddressValid}
            className="rounded-xl bg-brand-500 px-4 py-2.5 font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
          >
            {loading ? 'กำลังยืนยันคำสั่งซื้อ...' : 'ยืนยันและชำระเงิน'}
          </button>
        </div>
      </form>

      <aside className="h-fit space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">สรุปคำสั่งซื้อ</h2>

        <div className="max-h-72 space-y-2 overflow-auto pr-1 text-sm text-slate-700">
          {cart?.items.map((item) => (
            <div key={item.productId} className="rounded-xl bg-slate-50 p-2">
              <p className="line-clamp-1 font-medium text-slate-800">{item.name}</p>
              <p>
                {item.quantity} x ฿{item.price.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-1 border-t border-slate-200 pt-2 text-sm text-slate-700">
          <p className="flex items-center justify-between">
            <span>ยอดรวมสินค้า</span>
            <span>฿{subtotal.toLocaleString()}</span>
          </p>
          <p className="flex items-center justify-between">
            <span>ค่าจัดส่ง</span>
            <span>฿{shippingCost.toLocaleString()}</span>
          </p>
          <p className="flex items-center justify-between">
            <span>ภาษี (7%)</span>
            <span>฿{tax.toLocaleString()}</span>
          </p>
          <p className="flex items-center justify-between">
            <span>ส่วนลด</span>
            <span>-฿{discountAmount.toLocaleString()}</span>
          </p>
          <p className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
            <span>ยอดสุทธิ</span>
            <span>฿{total.toLocaleString()}</span>
          </p>
        </div>
      </aside>
    </section>
  )
}
