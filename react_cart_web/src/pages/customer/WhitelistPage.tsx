import { useWhitelist } from '../../contexts/WhitelistContext'

export default function WhitelistPage() {
  const { whitelist, loading, error, removeFromWhitelist } = useWhitelist()
  const items = whitelist?.items ?? []

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-slate-900">รายการโปรดของฉัน</h1>
        <p className="text-sm text-slate-600">สินค้าที่คุณสนใจและบันทึกเอาไว้</p>
      </div>

      {loading ? <p className="text-slate-700">กำลังโหลดรายการโปรด...</p> : null}
      {error ? <p className="text-rose-600">{error}</p> : null}

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          ยังไม่มีสินค้าในรายการโปรด
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item.productId} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <img
                src={item.image || 'https://placehold.co/400x300?text=%E0%B9%84%E0%B8%A1%E0%B9%88%E0%B8%A1%E0%B8%B5%E0%B8%A3%E0%B8%B9%E0%B8%9B%E0%B8%A0%E0%B8%B2%E0%B8%9E'}
                alt={item.name}
                className="h-40 w-full rounded-xl object-cover"
              />
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">{item.name}</p>
                <p className="text-sm text-brand-600">฿{item.price.toLocaleString()}</p>
              </div>

              <button
                type="button"
                onClick={() => void removeFromWhitelist(item.productId)}
                className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
              >
                ลบออกจากรายการโปรด
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
