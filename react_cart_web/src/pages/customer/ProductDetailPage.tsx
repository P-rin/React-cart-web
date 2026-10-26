import { useEffect, useMemo, useState } from 'react'
import { useProducts } from '../../contexts/ProductContext'
import { useWhitelist } from '../../contexts/WhitelistContext'
import { useCart } from '../../contexts/CartContext'
import { getSpecificationLabel } from '../../utils/localization'
import { useAuth } from '../../contexts/AuthContext'

type ProductDetailPageProps = {
  productId: string
  onBack: () => void
  onGuestAddToCart?: (productId: string, quantity: number) => void
}

export default function ProductDetailPage({
  productId,
  onBack,
  onGuestAddToCart,
}: ProductDetailPageProps) {
  const { selectedProduct, loading, error, fetchProductById } = useProducts()
  const { isInWhitelist, toggleWhitelist } = useWhitelist()
  const { addToCart } = useCart()
  const { currentUser } = useAuth()
  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    void fetchProductById(productId)
  }, [productId, fetchProductById])

  useEffect(() => {
    setActiveImage(0)
  }, [productId])

  const images = useMemo(() => selectedProduct?.images ?? [], [selectedProduct])
  const selectedImage = images[activeImage] || 'https://placehold.co/800x600?text=%E0%B9%84%E0%B8%A1%E0%B9%88%E0%B8%A1%E0%B8%B5%E0%B8%A3%E0%B8%B9%E0%B8%9B%E0%B8%A0%E0%B8%B2%E0%B8%9E'

  if (loading) {
    return <p className="text-slate-700">กำลังโหลดรายละเอียดสินค้า...</p>
  }

  if (error) {
    return <p className="text-red-600">{error}</p>
  }

  if (!selectedProduct) {
    return <p className="text-slate-700">ไม่พบข้อมูลสินค้า</p>
  }

  const hasStock = selectedProduct.stock > 0
  const inWhitelist = isInWhitelist(selectedProduct.productId)

  const handleToggleWishlist = async () => {
    if (!currentUser) {
      return
    }

    try {
      setActionError('')
      await toggleWhitelist(selectedProduct)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'ไม่สามารถอัปเดตรายการโปรดได้')
    }
  }

  const handleAddToCart = async () => {
    if (quantity < 1) {
      setActionError('จำนวนสินค้าต้องอย่างน้อย 1 ชิ้น')
      return
    }
    if (quantity > selectedProduct.stock) {
      setActionError('จำนวนที่เลือกเกินสต็อกคงเหลือ')
      return
    }

    if (!currentUser) {
      onGuestAddToCart?.(selectedProduct.productId, quantity)
      return
    }

    try {
      setActionError('')
      await addToCart(selectedProduct, quantity)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'ไม่สามารถเพิ่มลงตะกร้าได้')
    }
  }

  return (
    <section className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        ← กลับไปหน้าสินค้า
      </button>

      <div className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-card lg:grid-cols-2">
        <div className="space-y-3">
          <div className="aspect-4/3 overflow-hidden rounded-2xl bg-slate-100">
            <img src={selectedImage} alt={selectedProduct.name} className="h-full w-full object-cover" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveImage(index)}
                className={`aspect-square overflow-hidden rounded-lg border ${
                  activeImage === index ? 'border-brand-500' : 'border-slate-200'
                }`}
              >
                <img src={image} alt={`รูปสินค้า ${index + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-semibold text-slate-900">{selectedProduct.name}</h1>
          <p className="text-slate-600">{selectedProduct.description}</p>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">รายละเอียดสินค้า</p>
            <div className="mt-2 space-y-1 text-sm text-slate-700">
              {Object.entries(selectedProduct.specifications || {}).map(([key, value]) => (
                <p key={key}>
                  <span className="font-medium">{getSpecificationLabel(key)}:</span> {value}
                </p>
              ))}
            </div>
          </div>

          <p className="text-2xl font-semibold text-brand-600">฿{selectedProduct.price.toLocaleString()}</p>
          <p className={`text-sm font-medium ${hasStock ? 'text-emerald-600' : 'text-rose-600'}`}>
            {hasStock ? `คงเหลือ ${selectedProduct.stock} ชิ้น` : 'สินค้าหมด'}
          </p>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <button
                type="button"
                onClick={handleToggleWishlist}
                className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                  inWhitelist
                    ? 'border-rose-300 bg-rose-50 text-rose-700'
                    : 'border-slate-300 bg-white text-slate-700'
                }`}
              >
                {inWhitelist ? '❤ อยู่ในรายการโปรด' : '♡ เพิ่มรายการโปรด'}
              </button>
            ) : null}

            <input
              type="number"
              min={1}
              max={Math.max(1, selectedProduct.stock)}
              value={quantity}
              disabled={!hasStock}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className="w-24 rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>

          <button
            type="button"
            disabled={!hasStock}
            onClick={handleAddToCart}
            className="w-full rounded-xl bg-brand-500 px-4 py-2.5 font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {hasStock ? currentUser ? 'เพิ่มลงตะกร้า' : 'เข้าสู่ระบบเพื่อซื้อ' : 'สินค้าหมด'}
          </button>
          {actionError ? <p className="text-sm text-rose-600">{actionError}</p> : null}
        </div>
      </div>
    </section>
  )
}
