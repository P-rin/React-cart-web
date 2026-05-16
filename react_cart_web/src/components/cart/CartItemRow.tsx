import type { CartItem } from '../../services/firestore-service'

type CartItemRowProps = {
  item: CartItem
  stock?: number
  onIncrease: () => void
  onDecrease: () => void
  onRemove: () => void
  error?: string
}

export default function CartItemRow({
  item,
  stock,
  onIncrease,
  onDecrease,
  onRemove,
  error,
}: CartItemRowProps) {
  const canIncrease = stock === undefined ? true : item.quantity < stock
  const canDecrease = item.quantity > 1

  return (
    <article className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[96px_1fr_auto] md:items-center">
      <img
        src={item.image || 'https://placehold.co/300x300?text=No+Image'}
        alt={item.name}
        className="h-24 w-24 rounded-xl object-cover"
      />

      <div className="space-y-1">
        <p className="font-semibold text-slate-900">{item.name}</p>
        <p className="text-sm text-slate-500">฿{item.price.toLocaleString()} ต่อชิ้น</p>
        {typeof stock === 'number' ? (
          <p className="text-xs text-slate-500">Stock: {stock}</p>
        ) : null}
        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDecrease}
            disabled={!canDecrease}
            className="h-8 w-8 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            -
          </button>
          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
          <button
            type="button"
            onClick={onIncrease}
            disabled={!canIncrease}
            className="h-8 w-8 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            +
          </button>
        </div>

        <p className="text-sm font-semibold text-brand-600">฿{item.subtotal.toLocaleString()}</p>

        <button
          type="button"
          onClick={onRemove}
          className="text-xs font-medium text-rose-600 hover:text-rose-700"
        >
          Remove
        </button>
      </div>
    </article>
  )
}
