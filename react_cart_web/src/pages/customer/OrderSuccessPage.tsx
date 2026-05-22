type OrderSuccessPageProps = {
  orderNumber: string
  totalAmount: number
  onViewOrders: () => void
  onContinueShopping: () => void
}

export default function OrderSuccessPage({
  orderNumber,
  totalAmount,
  onViewOrders,
  onContinueShopping,
}: OrderSuccessPageProps) {
  return (
    <section className="mx-auto w-full max-w-2xl rounded-3xl border border-emerald-200 bg-white p-6 shadow-card">
      <div className="space-y-3 text-center">
        <p className="text-5xl">🎉</p>
        <h1 className="text-3xl font-semibold text-slate-900">สั่งซื้อสำเร็จแล้ว</h1>
        <p className="text-slate-600">ขอบคุณสำหรับคำสั่งซื้อของคุณ ระบบได้รับข้อมูลเรียบร้อยแล้ว</p>
      </div>

      <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
        <p className="flex items-center justify-between">
          <span>เลขที่ออเดอร์</span>
          <span className="font-semibold">{orderNumber}</span>
        </p>
        <p className="mt-2 flex items-center justify-between">
          <span>ยอดสุทธิ</span>
          <span className="text-base font-semibold">฿{totalAmount.toLocaleString()}</span>
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onViewOrders}
          className="rounded-xl bg-brand-500 px-4 py-2.5 font-medium text-white hover:bg-brand-600"
        >
          ดูคำสั่งซื้อของฉัน
        </button>
        <button
          type="button"
          onClick={onContinueShopping}
          className="rounded-xl border border-slate-300 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-100"
        >
          กลับไปเลือกสินค้า
        </button>
      </div>
    </section>
  )
}
