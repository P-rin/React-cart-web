import { useEffect } from 'react'
import ProductCard from '../../components/products/ProductCard'
import ProductFilters from '../../components/products/ProductFilters'
import { useProducts } from '../../contexts/ProductContext'

type ProductListingPageProps = {
  onOpenDetail: (productId: string) => void
  onGuestAddToCart?: (productId: string, quantity: number) => void
}

export default function ProductListingPage({
  onOpenDetail,
  onGuestAddToCart,
}: ProductListingPageProps) {
  const {
    products,
    loading,
    error,
    searchTerm,
    selectedCategory,
    categories,
    setSearchTerm,
    setSelectedCategory,
    fetchProducts,
  } = useProducts()

  useEffect(() => {
    void fetchProducts()
  }, [searchTerm, selectedCategory, fetchProducts])

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-slate-900">เลือกซื้อสินค้า</h1>
        <p className="text-sm text-slate-600">เลือกสินค้าที่ใช่สำหรับคุณ</p>
      </div>

      <ProductFilters
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        categories={categories}
        onSearchChange={setSearchTerm}
        onCategoryChange={setSelectedCategory}
      />

      {loading ? <p className="text-slate-700">กำลังโหลดสินค้า...</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}

      {!loading && products.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          ไม่พบสินค้าที่ตรงกับเงื่อนไข
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.productId}
            product={product}
            onViewDetail={onOpenDetail}
            onGuestAddToCart={onGuestAddToCart}
          />
        ))}
      </div>
    </section>
  )
}
