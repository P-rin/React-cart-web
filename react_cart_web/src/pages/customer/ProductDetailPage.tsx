import { useEffect, useMemo, useState } from 'react'
import { useProducts } from '../../contexts/ProductContext'

type ProductDetailPageProps = {
  productId: string
  onBack: () => void
}

export default function ProductDetailPage({ productId, onBack }: ProductDetailPageProps) {
  const { selectedProduct, loading, error, fetchProductById } = useProducts()
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    void fetchProductById(productId)
  }, [productId, fetchProductById])

  useEffect(() => {
    setActiveImage(0)
  }, [productId])

  const images = useMemo(() => selectedProduct?.images ?? [], [selectedProduct])
  const selectedImage = images[activeImage] || 'https://placehold.co/800x600?text=No+Image'

  if (loading) {
    return <p className="text-slate-700">Loading product detail...</p>
  }

  if (error) {
    return <p className="text-red-600">{error}</p>
  }

  if (!selectedProduct) {
    return <p className="text-slate-700">ไม่พบข้อมูลสินค้า</p>
  }

  const hasStock = selectedProduct.stock > 0

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
          <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
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
                <img src={image} alt={`product-${index + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-semibold text-slate-900">{selectedProduct.name}</h1>
          <p className="text-slate-600">{selectedProduct.description}</p>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Specifications</p>
            <div className="mt-2 space-y-1 text-sm text-slate-700">
              {Object.entries(selectedProduct.specifications || {}).map(([key, value]) => (
                <p key={key}>
                  <span className="font-medium capitalize">{key}:</span> {value}
                </p>
              ))}
            </div>
          </div>

          <p className="text-2xl font-semibold text-brand-600">฿{selectedProduct.price.toLocaleString()}</p>
          <p className={`text-sm font-medium ${hasStock ? 'text-emerald-600' : 'text-rose-600'}`}>
            {hasStock ? `คงเหลือ ${selectedProduct.stock} ชิ้น` : 'สินค้าหมด'}
          </p>

          <button
            type="button"
            disabled={!hasStock}
            className="w-full rounded-xl bg-brand-500 px-4 py-2.5 font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {hasStock ? 'สั่งซื้อสินค้า' : 'สินค้าหมด'}
          </button>
        </div>
      </div>
    </section>
  )
}
