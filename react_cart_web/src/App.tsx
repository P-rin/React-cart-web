import { useState } from 'react'
import LoginPage from './components/auth/LoginPage'
import RegisterPage from './components/auth/RegisterPage'
import ProfilePage from './components/account/ProfilePage'
import { useAuth } from './contexts/AuthContext'
import ProductListingPage from './pages/customer/ProductListingPage'
import ProductDetailPage from './pages/customer/ProductDetailPage'
import WhitelistPage from './pages/customer/WhitelistPage'
import CartPage from './pages/customer/CartPage'
import AdminProductManagementPage from './pages/admin/AdminProductManagementPage'
import CheckoutPage from './pages/customer/CheckoutPage'
import OrderSuccessPage from './pages/customer/OrderSuccessPage'
import OrdersHistoryPage from './pages/customer/OrdersHistoryPage'

type AppTab =
  | 'catalog'
  | 'detail'
  | 'whitelist'
  | 'cart'
  | 'checkout'
  | 'orders'
  | 'order-success'
  | 'profile'
  | 'admin'

function App() {
  const { currentUser, role, loading } = useAuth()
  const [screen, setScreen] = useState<'login' | 'register'>('login')
  const [appTab, setAppTab] = useState<AppTab>('catalog')
  const [activeProductId, setActiveProductId] = useState('')
  const [lastOrder, setLastOrder] = useState<{ orderId: string; orderNumber: string; totalAmount: number } | null>(null)

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-slate-700">Checking account session...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-cyan-50 via-teal-50 to-slate-100 p-6 md:p-10">
      {currentUser ? (
        <div className="mx-auto w-full max-w-6xl space-y-5">
          <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <p className="text-sm text-slate-500">Signed in as</p>
              <p className="font-semibold text-slate-900">{currentUser.email}</p>
            </div>

            <nav className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAppTab('catalog')}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
              >
                Catalog
              </button>
              <button
                type="button"
                onClick={() => setAppTab('profile')}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
              >
                Profile
              </button>
              <button
                type="button"
                onClick={() => setAppTab('whitelist')}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
              >
                Wishlist
              </button>
              <button
                type="button"
                onClick={() => setAppTab('cart')}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
              >
                Cart
              </button>
              <button
                type="button"
                onClick={() => setAppTab('orders')}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
              >
                Orders
              </button>
              {role === 'admin' ? (
                <button
                  type="button"
                  onClick={() => setAppTab('admin')}
                  className="rounded-lg border border-brand-500 bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
                >
                  Admin Products
                </button>
              ) : null}
            </nav>
          </header>

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

          {appTab === 'orders' ? <OrdersHistoryPage onBackToCatalog={() => setAppTab('catalog')} /> : null}

          {appTab === 'admin' && role === 'admin' ? <AdminProductManagementPage /> : null}
        </div>
      ) : screen === 'login' ? (
        <LoginPage onSwitchToRegister={() => setScreen('register')} />
      ) : (
        <RegisterPage onSwitchToLogin={() => setScreen('login')} />
      )}
    </main>
  )
}

export default App
