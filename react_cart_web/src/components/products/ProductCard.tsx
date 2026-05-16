import type { Product } from '../../services/firestore-service'

type ProductCardProps = {
  product: Product
  onViewDetail: (productId: string) => void
}

export default function ProductCard({ product, onViewDetail }: ProductCardProps) {
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0

  return (
    <button
      type="button"
      onClick={() => onViewDetail(product.productId)}
      className="group w-full overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        <img
          src={product.images[0] || 'https://placehold.co/500x500?text=No+Image'}
          alt={product.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        {discountPercent > 0 ? (
          <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white">
            -{discountPercent}%
          </span>
        ) : null}
      </div>

      <div className="space-y-2 p-4">
        <p className="line-clamp-1 font-semibold text-slate-900">{product.name}</p>
        <p className="text-sm text-amber-600">
          {'★'.repeat(Math.max(1, Math.round(product.rating || 0)))}
          <span className="ml-1 text-slate-500">({product.reviewCount || 0})</span>
        </p>

        <div className="flex items-end gap-2">
          <p className="text-lg font-semibold text-brand-600">฿{product.price.toLocaleString()}</p>
          {product.originalPrice && product.originalPrice > product.price ? (
            <p className="text-sm text-slate-400 line-through">฿{product.originalPrice.toLocaleString()}</p>
          ) : null}
        </div>
      </div>
    </button>
  )
}
