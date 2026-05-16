import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { ProductProvider } from './contexts/ProductContext'
import { CartProvider } from './contexts/CartContext'
import { WhitelistProvider } from './contexts/WhitelistContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ProductProvider>
        <WhitelistProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </WhitelistProvider>
      </ProductProvider>
    </AuthProvider>
  </StrictMode>,
)
