import { useState } from 'react'
import type { Product } from '../../services/firestore-service'
import { useWhitelist } from '../../contexts/WhitelistContext'
import { useCart } from '../../contexts/CartContext'

type ProductCardProps = {
  product: Product
  onViewDetail: (productId: string) => void
}

export default function ProductCard({ product, onViewDetail }: ProductCardProps) {
  const { isInWhitelist, toggleWhitelist } = useWhitelist()
  const { addToCart } = useCart()
  const [error, setError] = useState('')

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0

  const inWhitelist = isInWhitelist(product.productId)
  const outOfStock = product.stock <= 0

  const handleAddToCart = async () => {
    try {
      setError('')
      await addToCart(product, 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถเพิ่มลงตะกร้าได้')
    }
  }

  const handleToggleWhitelist = async () => {
    try {
      await toggleWhitelist(product)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถอัปเดตรายการโปรดได้')
    }
  }

  return (
    <article className="group w-full overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-card">
      <button
        type="button"
        onClick={() => onViewDetail(product.productId)}
        className="relative block aspect-square w-full overflow-hidden bg-slate-100"
      >
        <img
          src={product.images[0] || 'https://placehold.co/500x500?text=%E0%B9%84%E0%B8%A1%E0%B9%88%E0%B8%A1%E0%B8%B5%E0%B8%A3%E0%B8%B9%E0%B8%9B%E0%B8%A0%E0%B8%B2%E0%B8%9E'}
          alt={product.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        {discountPercent > 0 ? (
          <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white">
            -{discountPercent}%
          </span>
        ) : null}
      </button>

      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-1 font-semibold text-slate-900">{product.name}</p>
          <button
            type="button"
            onClick={handleToggleWhitelist}
            className={`rounded-full px-2 py-1 text-lg leading-none ${
              inWhitelist ? 'text-rose-600' : 'text-slate-400 hover:text-rose-500'
            }`}
            aria-label="เพิ่มหรือลบรายการโปรด"
          >
            {inWhitelist ? '❤' : '♡'}
          </button>
        </div>
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

        <div className="flex items-center gap-2">
          <p className="w-20 text-xs font-medium text-slate-600">
            คงเหลือ {Math.max(0, product.stock)}
          </p>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="flex-1 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {outOfStock ? 'สินค้าหมด' : 'เพิ่มลงตะกร้า'}
          </button>
        </div>
        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      </div>
    </article>
  )
}
