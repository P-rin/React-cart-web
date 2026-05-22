import { useEffect, useMemo, useState } from 'react'
import CartItemRow from '../../components/cart/CartItemRow'
import { useCart } from '../../contexts/CartContext'
import { useProducts } from '../../contexts/ProductContext'
import { productsService } from '../../services/firestore-service'

type CartPageProps = {
  onProceedCheckout: () => void
}

export default function CartPage({ onProceedCheckout }: CartPageProps) {
  const { cart, loading, error, updateQuantity, removeFromCart } = useCart()
  const { products } = useProducts()
  const [rowError, setRowError] = useState<Record<string, string>>({})
  const [remoteStockMap, setRemoteStockMap] = useState<Record<string, number>>({})

  const stockMap = useMemo(() => {
    const map = new Map<string, number>()
    products.forEach((product) => {
      map.set(product.productId, product.stock)
    })
    Object.entries(remoteStockMap).forEach(([productId, stock]) => {
      map.set(productId, stock)
    })
    return map
  }, [products, remoteStockMap])

  useEffect(() => {
    const items = cart?.items ?? []
    if (items.length === 0) {
      setRemoteStockMap({})
      return
    }

    const fetchStocks = async () => {
      const entries = await Promise.all(
        items.map(async (item) => {
          const product = await productsService.getProductById(item.productId)
          return [item.productId, product?.stock ?? 0] as const
        }),
      )

      const nextMap: Record<string, number> = {}
      entries.forEach(([productId, stock]) => {
        nextMap[productId] = stock
      })

      setRemoteStockMap(nextMap)
    }

    void fetchStocks()
  }, [cart?.items])

  const handleChangeQty = async (productId: string, nextQty: number) => {
    try {
      setRowError((prev) => ({ ...prev, [productId]: '' }))
      const stock = stockMap.get(productId)
      await updateQuantity(productId, nextQty, stock)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update quantity'
      setRowError((prev) => ({ ...prev, [productId]: message }))
    }
  }

  const items = cart?.items ?? []
  const totalItems = cart?.totalItems ?? 0
  const totalPrice = cart?.totalPrice ?? 0

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-slate-900">ตะกร้าสินค้า</h1>
        <p className="text-sm text-slate-600">จัดการสินค้าและตรวจสอบยอดชำระ</p>
      </div>

      {loading ? <p className="text-slate-700">Loading cart...</p> : null}
      {error ? <p className="text-rose-600">{error}</p> : null}

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          ตะกร้ายังว่างอยู่
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {items.map((item) => {
              const stock = stockMap.get(item.productId)
              return (
                <CartItemRow
                  key={item.productId}
                  item={item}
                  stock={stock}
                  error={rowError[item.productId]}
                  onIncrease={() => void handleChangeQty(item.productId, item.quantity + 1)}
                  onDecrease={() => void handleChangeQty(item.productId, item.quantity - 1)}
                  onRemove={() => void removeFromCart(item.productId)}
                />
              )
            })}
          </div>

          <aside className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Cart Summary</h2>
            <div className="space-y-2 text-sm text-slate-700">
              <p className="flex items-center justify-between">
                <span>Total Items</span>
                <span className="font-semibold">{totalItems}</span>
              </p>
              <p className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
                <span>Total Price</span>
                <span>฿{totalPrice.toLocaleString()}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={onProceedCheckout}
              className="w-full rounded-xl bg-brand-500 px-4 py-2.5 font-medium text-white transition hover:bg-brand-600"
            >
              Proceed to Checkout
            </button>
          </aside>
        </div>
      )}
    </section>
  )
}
