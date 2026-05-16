/**
 * React Hooks & Context Examples for E-Commerce
 * ใช้ร่วมกับ Firestore services
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  cartsService,
  ordersService,
  whitelistsService,
  productsService,
} from './firestore-service-example';
import { Cart, Product, Order, Whitelist } from './firestore-service-example';

// ============ CONTEXT TYPES ============

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  addToCart: (product: Product, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: (userId: string) => Promise<void>;
}

interface OrderContextType {
  orders: Order[];
  selectedOrder: Order | null;
  loading: boolean;
  error: string | null;
  fetchOrders: (userId: string) => Promise<void>;
  getOrder: (orderId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
}

interface WhitelistContextType {
  whitelist: Whitelist | null;
  loading: boolean;
  error: string | null;
  addToWhitelist: (product: Product) => Promise<void>;
  removeFromWhitelist: (productId: string) => Promise<void>;
  isInWhitelist: (productId: string) => boolean;
  fetchWhitelist: (userId: string) => Promise<void>;
}

interface ProductContextType {
  products: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;
  fetchProducts: (category?: string) => Promise<void>;
  getProduct: (productId: string) => Promise<void>;
  searchProducts: (term: string) => Promise<void>;
}

// ============ CART CONTEXT ============

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ userId: string; children: React.ReactNode }> = ({
  userId,
  children,
}) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const cartData = await cartsService.getCart(id);
      setCart(cartData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cart');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = useCallback(
    async (product: Product, quantity: number) => {
      try {
        setError(null);
        await cartsService.addToCart(userId, product, quantity);
        await fetchCart(userId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add to cart');
        throw err;
      }
    },
    [userId, fetchCart]
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      try {
        setError(null);
        await cartsService.removeFromCart(userId, productId);
        await fetchCart(userId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove from cart');
        throw err;
      }
    },
    [userId, fetchCart]
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      try {
        setError(null);
        await cartsService.updateCartItemQuantity(userId, productId, quantity);
        await fetchCart(userId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update quantity');
        throw err;
      }
    },
    [userId, fetchCart]
  );

  const clearCart = useCallback(async () => {
    try {
      setError(null);
      await cartsService.clearCart(userId);
      setCart(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cart');
      throw err;
    }
  }, [userId]);

  useEffect(() => {
    fetchCart(userId);
  }, [userId, fetchCart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

// ============ ORDER CONTEXT ============

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ userId: string; children: React.ReactNode }> = ({
  userId,
  children,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const ordersData = await ordersService.getUserOrders(id);
      setOrders(ordersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrder = useCallback(async (orderId: string) => {
    try {
      setError(null);
      const orderData = await ordersService.getOrder(orderId);
      setSelectedOrder(orderData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order');
      throw err;
    }
  }, []);

  const updateOrderStatus = useCallback(
    async (orderId: string, status: Order['status']) => {
      try {
        setError(null);
        await ordersService.updateOrderStatus(orderId, status);
        await fetchOrders(userId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update order');
        throw err;
      }
    },
    [userId, fetchOrders]
  );

  useEffect(() => {
    fetchOrders(userId);
  }, [userId, fetchOrders]);

  return (
    <OrderContext.Provider
      value={{
        orders,
        selectedOrder,
        loading,
        error,
        fetchOrders,
        getOrder,
        updateOrderStatus,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within OrderProvider');
  }
  return context;
};

// ============ WHITELIST CONTEXT ============

const WhitelistContext = createContext<WhitelistContextType | undefined>(undefined);

export const WhitelistProvider: React.FC<{ userId: string; children: React.ReactNode }> = ({
  userId,
  children,
}) => {
  const [whitelist, setWhitelist] = useState<Whitelist | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWhitelist = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const whitelistData = await whitelistsService.getWhitelist(id);
      setWhitelist(whitelistData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch whitelist');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToWhitelist = useCallback(
    async (product: Product) => {
      try {
        setError(null);
        await whitelistsService.addToWhitelist(userId, product);
        await fetchWhitelist(userId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add to whitelist');
        throw err;
      }
    },
    [userId, fetchWhitelist]
  );

  const removeFromWhitelist = useCallback(
    async (productId: string) => {
      try {
        setError(null);
        await whitelistsService.removeFromWhitelist(userId, productId);
        await fetchWhitelist(userId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove from whitelist');
        throw err;
      }
    },
    [userId, fetchWhitelist]
  );

  const isInWhitelist = useCallback(
    (productId: string): boolean => {
      return whitelist?.items.some((item) => item.productId === productId) ?? false;
    },
    [whitelist]
  );

  useEffect(() => {
    fetchWhitelist(userId);
  }, [userId, fetchWhitelist]);

  return (
    <WhitelistContext.Provider
      value={{
        whitelist,
        loading,
        error,
        addToWhitelist,
        removeFromWhitelist,
        isInWhitelist,
        fetchWhitelist,
      }}
    >
      {children}
    </WhitelistContext.Provider>
  );
};

export const useWhitelist = () => {
  const context = useContext(WhitelistContext);
  if (!context) {
    throw new Error('useWhitelist must be used within WhitelistProvider');
  }
  return context;
};

// ============ PRODUCT CONTEXT ============

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (category?: string) => {
    try {
      setLoading(true);
      setError(null);
      let productsData: Product[];

      if (category) {
        productsData = await productsService.getProductsByCategory(category);
      } else {
        // Fetch all active products (implement this in your service)
        productsData = [];
      }

      setProducts(productsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getProduct = useCallback(async (productId: string) => {
    try {
      setError(null);
      const productData = await productsService.getProduct(productId);
      setSelectedProduct(productData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product');
      throw err;
    }
  }, []);

  const searchProducts = useCallback(async (term: string) => {
    try {
      setLoading(true);
      setError(null);
      // Implement search logic based on your service
      // This is a placeholder
      console.log('Searching for:', term);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search products');
      throw err;
    }
  }, []);

  return (
    <ProductContext.Provider
      value={{
        products,
        selectedProduct,
        loading,
        error,
        fetchProducts,
        getProduct,
        searchProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within ProductProvider');
  }
  return context;
};

// ============ USAGE EXAMPLE IN COMPONENTS ============

/**
 * Example: Cart Page Component
 */
export const CartPage = () => {
  const { cart, loading, error, removeFromCart, updateQuantity, clearCart } = useCart();

  if (loading) return <div>Loading cart...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!cart || cart.items.length === 0) return <div>Your cart is empty</div>;

  return (
    <div>
      <h1>Shopping Cart</h1>
      <div className="cart-items">
        {cart.items.map((item) => (
          <div key={item.productId} className="cart-item">
            <img src={item.image} alt={item.name} />
            <div>
              <h3>{item.name}</h3>
              <p>฿{item.price.toLocaleString()}</p>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value))}
              />
              <button onClick={() => removeFromCart(item.productId)}>Remove</button>
            </div>
            <p>Subtotal: ฿{item.subtotal.toLocaleString()}</p>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <h2>Total: ฿{cart.totalPrice.toLocaleString()}</h2>
        <button onClick={clearCart}>Clear Cart</button>
        <button>Checkout</button>
      </div>
    </div>
  );
};

/**
 * Example: Product Card Component with Whitelist
 */
export const ProductCard = ({ product }: { product: Product }) => {
  const { addToCart } = useCart();
  const { isInWhitelist, addToWhitelist, removeFromWhitelist } = useWhitelist();
  const [quantity, setQuantity] = useState(1);
  const inWishlist = isInWhitelist(product.productId);

  const handleAddToCart = async () => {
    try {
      await addToCart(product, quantity);
      alert('Added to cart!');
    } catch (error) {
      alert('Failed to add to cart');
    }
  };

  const handleToggleWishlist = async () => {
    try {
      if (inWishlist) {
        await removeFromWhitelist(product.productId);
      } else {
        await addToWhitelist(product);
      }
    } catch (error) {
      alert('Failed to update whitelist');
    }
  };

  return (
    <div className="product-card">
      <img src={product.images[0]} alt={product.name} />
      <h3>{product.name}</h3>
      <div className="rating">
        ⭐ {product.rating} ({product.reviewCount} reviews)
      </div>
      <p className="price">฿{product.price.toLocaleString()}</p>
      {product.originalPrice && (
        <p className="original-price">
          ฿{product.originalPrice.toLocaleString()} <span>Save {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%</span>
        </p>
      )}
      <p className="stock">{product.stock} in stock</p>
      <div className="controls">
        <input
          type="number"
          min="1"
          max={product.stock}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value))}
        />
        <button onClick={handleAddToCart} className="btn-primary">
          Add to Cart
        </button>
        <button
          onClick={handleToggleWishlist}
          className={`btn-wishlist ${inWishlist ? 'active' : ''}`}
        >
          {inWishlist ? '❤️' : '🤍'}
        </button>
      </div>
    </div>
  );
};

/**
 * Example: Orders Page Component
 */
export const OrdersPage = () => {
  const { orders, loading, error, getOrder } = useOrders();

  if (loading) return <div>Loading orders...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>My Orders</h1>
      <div className="orders-list">
        {orders.length === 0 ? (
          <p>No orders yet</p>
        ) : (
          orders.map((order) => (
            <div key={order.orderId} className="order-card" onClick={() => getOrder(order.orderId)}>
              <h3>{order.orderNumber}</h3>
              <p>Status: <strong>{order.status}</strong></p>
              <p>Items: {order.items.length}</p>
              <p>Total: ฿{order.totalAmount.toLocaleString()}</p>
              <p>Date: {new Date(order.createdAt.toDate()).toLocaleDateString('th-TH')}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============ APP SETUP ============

/**
 * Setup in App.tsx:
 * 
 * <ProductProvider>
 *   <CartProvider userId={userId}>
 *     <OrderProvider userId={userId}>
 *       <WhitelistProvider userId={userId}>
 *         <YourApp />
 *       </WhitelistProvider>
 *     </OrderProvider>
 *   </CartProvider>
 * </ProductProvider>
 */
