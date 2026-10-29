import { useEffect, useRef, useState } from 'react'
import LoginPage from './components/auth/LoginPage'
import RegisterPage from './components/auth/RegisterPage'
import ProfilePage from './components/account/ProfilePage'
import { useAuth } from './contexts/AuthContext'
import ProductListingPage from './pages/customer/ProductListingPage'
import ProductDetailPage from './pages/customer/ProductDetailPage'
import WhitelistPage from './pages/customer/WhitelistPage'
import CartPage from './pages/customer/CartPage'
import AdminProductManagementPage from './pages/admin/AdminProductManagementPage'
import AdminOrderManagementPage from './pages/admin/AdminOrderManagementPage'
import AdminSalesReportPage from './pages/admin/AdminSalesReportPage'
import CheckoutPage from './pages/customer/CheckoutPage'
import OrderSuccessPage from './pages/customer/OrderSuccessPage'
import OrdersHistoryPage from './pages/customer/OrdersHistoryPage'
import { useCart } from './contexts/CartContext'
import { productsService } from './services/firestore-service'
import StoreLandingPage from './components/StoreLandingPage'

const pendingCartItemKey = 'react-cart-web:pending-cart-item'

type PendingCartItem = {
  productId: string
  quantity: number
}

type AppNotice = {
  message: string
  isError: boolean
}

function isPendingCartItem(value: unknown): value is PendingCartItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'productId' in value &&
    typeof value.productId === 'string' &&
    'quantity' in value &&
    typeof value.quantity === 'number' &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0
  )
}

type AppTab =
  | 'landing'
  | 'catalog'
  | 'detail'
  | 'whitelist'
  | 'cart'
  | 'checkout'
  | 'orders'
  | 'order-success'
  | 'profile'
  | 'admin'
  | 'admin-sales'

function App() {
  const { currentUser, role, loading, authError } = useAuth()
  const { addToCart } = useCart()
  const [screen, setScreen] = useState<'browse' | 'login' | 'register'>('browse')
  const [appTab, setAppTab] = useState<AppTab>('landing')
  const [activeProductId, setActiveProductId] = useState('')
  const [lastOrder, setLastOrder] = useState<{ orderId: string; orderNumber: string; totalAmount: number } | null>(null)
  const [notice, setNotice] = useState<AppNotice | null>(null)
  const processedPendingCartItem = useRef(false)
  const visibleGuestTab = appTab === 'detail' ? 'detail' : 'catalog'
  const returnToCatalog = () => {
    sessionStorage.removeItem(pendingCartItemKey)
    setAppTab('catalog')
    setScreen('browse')
  }

  useEffect(() => {
    if (!currentUser) {
      processedPendingCartItem.current = false
      return
    }

    if (loading || processedPendingCartItem.current) {
      return
    }

    const pendingItem = sessionStorage.getItem(pendingCartItemKey)
    if (!pendingItem) {
      return
    }

    processedPendingCartItem.current = true
    sessionStorage.removeItem(pendingCartItemKey)

    void (async () => {
      try {
        if (authError) {
          throw new Error(authError)
        }
        if (role !== 'customer') {
          throw new Error('การเพิ่มสินค้าลงตะกร้าต้องเข้าสู่ระบบด้วยบัญชี Customer')
        }

        const item: unknown = JSON.parse(pendingItem)
        if (!isPendingCartItem(item)) {
          throw new Error('ข้อมูลสินค้าที่เลือกไม่ถูกต้อง กรุณาเลือกสินค้าใหม่')
        }

        const product = await productsService.getProductById(item.productId)
        if (!product || product.status !== 'active') {
          throw new Error('สินค้านี้ไม่มีจำหน่ายแล้ว')
        }
        if (product.stock < item.quantity) {
          throw new Error('สินค้าเหลือไม่เพียงพอตามจำนวนที่เลือก กรุณาปรับจำนวนใหม่')
        }

        await addToCart(product, item.quantity)
        setAppTab('cart')
        setNotice({ message: 'เพิ่มสินค้าที่เลือกลงตะกร้าแล้ว', isError: false })
      } catch (error) {
        setAppTab('catalog')
        setNotice({
          message: error instanceof Error ? error.message : 'ไม่สามารถเพิ่มสินค้าลงตะกร้าได้',
          isError: true,
        })
      }
    })()
  }, [currentUser, role, loading, authError, addToCart])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-slate-700">กำลังตรวจสอบสถานะบัญชี...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-cyan-50 via-teal-50 to-slate-100 p-6 md:p-10">
      {currentUser ? (
        <div className="mx-auto w-full max-w-6xl space-y-5">
          <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <p className="text-sm text-slate-500">เข้าสู่ระบบในชื่อ</p>
              <p className="font-semibold text-slate-900">{currentUser.email}</p>
            </div>

            <nav className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAppTab('landing')}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
              >
                หน้าแรก
              </button>
              <button
                type="button"
                onClick={() => setAppTab('catalog')}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
              >
                สินค้าทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setAppTab('profile')}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
              >
                บัญชีของฉัน
              </button>
              <button
                type="button"
                onClick={() => setAppTab('whitelist')}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
              >
                รายการโปรด
              </button>
              <button
                type="button"
                onClick={() => setAppTab('cart')}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
              >
                ตะกร้าสินค้า
              </button>
              <button
                type="button"
                onClick={() => setAppTab('orders')}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
              >
                คำสั่งซื้อ
              </button>
              {role === 'admin' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setAppTab('admin')}
                    className="rounded-lg border border-brand-500 bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
                  >
                    จัดการสินค้า
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppTab('admin-sales')}
                    className="rounded-lg border border-brand-500 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
                  >
                    รายงานยอดขาย
                  </button>
                </>
              ) : null}
            </nav>
          </header>

          {authError ? (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {authError}
            </p>
          ) : null}

          {notice ? (
            <p
              role="status"
              className={`rounded-xl border p-3 text-sm ${
                notice.isError
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {notice.message}
            </p>
          ) : null}

          {appTab === 'landing' ? (
            <StoreLandingPage
              onShopNow={() => setAppTab('catalog')}
              onLogin={() => setAppTab('profile')}
              accountLabel="บัญชีของฉัน"
            />
          ) : null}

          {appTab === 'catalog' ? (
            <ProductListingPage
              onOpenDetail={(productId) => {
                setActiveProductId(productId)
                setAppTab('detail')
              }}
            />
          ) : null}

          {appTab === 'detail' && activeProductId ? (
            <ProductDetailPage
              productId={activeProductId}
              onBack={() => setAppTab('catalog')}
            />
          ) : null}

          {appTab === 'profile' ? <ProfilePage /> : null}
          {appTab === 'whitelist' ? <WhitelistPage /> : null}
          {appTab === 'cart' ? <CartPage onProceedCheckout={() => setAppTab('checkout')} /> : null}

          {appTab === 'checkout' ? (
            <CheckoutPage
              onBackToCart={() => setAppTab('cart')}
              onSuccess={(payload) => {
                setLastOrder(payload)
                setAppTab('order-success')
              }}
            />
          ) : null}

          {appTab === 'order-success' && lastOrder ? (
            <OrderSuccessPage
              orderNumber={lastOrder.orderNumber}
              totalAmount={lastOrder.totalAmount}
              onViewOrders={() => setAppTab('orders')}
              onContinueShopping={() => setAppTab('catalog')}
            />
          ) : null}

          {appTab === 'orders' ? (
            role === 'admin' ? (
              <AdminOrderManagementPage />
            ) : (
              <OrdersHistoryPage onBackToCatalog={() => setAppTab('catalog')} />
            )
          ) : null}

          {appTab === 'admin' && role === 'admin' ? <AdminProductManagementPage /> : null}
          {appTab === 'admin-sales' && role === 'admin' ? <AdminSalesReportPage /> : null}
        </div>
      ) : (
        <div className="mx-auto w-full max-w-6xl space-y-5">
          {screen === 'browse' ? (
            <StoreLandingPage
              onShopNow={() => {
                setAppTab('catalog')
                window.setTimeout(() => document.getElementById('storefront')?.scrollIntoView({ behavior: 'smooth' }), 0)
              }}
              onLogin={() => setScreen('login')}
            />
          ) : null}

          {notice ? (
            <p
              role="status"
              className={`rounded-xl border p-3 text-sm ${
                notice.isError
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {notice.message}
            </p>
          ) : null}

          {screen === 'login' ? (
            <LoginPage
              onSwitchToRegister={() => setScreen('register')}
              onBrowseCatalog={returnToCatalog}
            />
          ) : (
            screen === 'register' ? (
              <RegisterPage
                onSwitchToLogin={() => setScreen('login')}
                onBrowseCatalog={returnToCatalog}
              />
            ) : null
          )}

          {screen === 'browse' && visibleGuestTab === 'catalog' ? (
            <div id="storefront" className="scroll-mt-6">
              <ProductListingPage
                onOpenDetail={(productId) => {
                  setActiveProductId(productId)
                  setAppTab('detail')
                }}
                onGuestAddToCart={(productId, quantity) => {
                  sessionStorage.setItem(
                    pendingCartItemKey,
                    JSON.stringify({ productId, quantity } satisfies PendingCartItem),
                  )
                  setNotice(null)
                  setScreen('login')
                }}
              />
            </div>
          ) : null}

          {authError ? (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {authError}
            </p>
          ) : null}

          {screen === 'browse' && visibleGuestTab === 'detail' && activeProductId ? (
            <ProductDetailPage
              productId={activeProductId}
              onBack={() => setAppTab('catalog')}
              onGuestAddToCart={(productId, quantity) => {
                sessionStorage.setItem(
                  pendingCartItemKey,
                  JSON.stringify({ productId, quantity } satisfies PendingCartItem),
                )
                setNotice(null)
                setScreen('login')
              }}
            />
          ) : null}
        </div>
      )}
    </main>
  )
}

export default App
