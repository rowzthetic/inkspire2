import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast'; 

const Shop = () => {
    // State Management
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]); // New Category state
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [sortOrder, setSortOrder] = useState("default");

    // Fetch Products & Categories from Django Backend
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Products
                const pRes = await fetch('http://localhost:8000/api/shop/products/');
                const pData = await pRes.json();
                setProducts(pData);
                
                // Fetch Categories
                const cRes = await fetch('http://localhost:8000/api/shop/categories/');
                const cData = await cRes.json();
                setCategories(cData);
                
                setLoading(false);
            } catch (error) {
                console.error('Error fetching shop data:', error);
                toast.error("Failed to load shop items."); 
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Handle Stripe Redirects
    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        
        if (query.get("payment") === "success") {
            const orderId = query.get("order_id");
            const token = localStorage.getItem('access');

            if (orderId && token) {
                // Manually trigger payment confirmation so the order status updates immediately
                fetch(`http://localhost:8000/api/shop/checkout/${orderId}/confirm/`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(() => {
                    toast.success("Payment successful! Your order is now being processed.", { duration: 6000 });
                })
                .catch(err => console.error("Confirmation error:", err));
            } else {
                toast.success("Payment successful! Thank you for your order.", { duration: 5000 });
            }

            setCart([]); 
            window.history.replaceState(null, '', window.location.pathname);
        }
        
        if (query.get("payment") === "cancelled") {
            toast.error("Payment was cancelled. Your items are still in your cart.", { duration: 5000 }); 
            window.history.replaceState(null, '', window.location.pathname);
        }
    }, []);

    // Filter Logic
    let displayedProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        // Match by ID string (since select values are strings)
        const matchesCategory = selectedCategory === "All" || String(product.category) === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (sortOrder === "price-low") {
        displayedProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortOrder === "price-high") {
        displayedProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    }

    // --- Cart Logic ---
    const addToCart = (product) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find((item) => item.product.id === product.id);
            if (existingItem) {
                if (existingItem.quantity >= product.stock_quantity) {
                    toast.error(`Sorry, only ${product.stock_quantity} available!`); 
                    return prevCart;
                }
                return prevCart.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { product, quantity: 1 }];
        });
        
        toast.success(`${product.name} added to cart!`); 
    };

    const removeFromCart = (productId) => {
        setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
        toast.success("Item removed.");
    };

    const cartTotal = cart.reduce((total, item) => {
        const itemPrice = item.product.price ? parseFloat(item.product.price) : 0;
        return total + (itemPrice * item.quantity);
    }, 0);

    // --- Stripe Checkout ---
    const handleCheckout = async () => {
        const token = localStorage.getItem('access'); 
        
        if (!token) {
            toast.error("You must be logged in to check out!"); 
            return;
        }

        const toastId = toast.loading("Connecting to secure checkout..."); 

        const orderData = {
            items: cart.map(item => ({ product_id: item.product.id, quantity: item.quantity })),
            shipping_address: "123 User Entered Address" 
        };

        try {
            const orderRes = await fetch('http://localhost:8000/api/shop/create-order/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(orderData)
            });

            const orderResult = await orderRes.json();
            if (!orderRes.ok) throw new Error(orderResult.error || "Failed to create order");

            const stripeRes = await fetch(`http://localhost:8000/api/shop/checkout/${orderResult.order_id}/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const stripeResult = await stripeRes.json();
            if (stripeRes.ok && stripeResult.url) {
                toast.dismiss(toastId); 
                window.location.href = stripeResult.url; 
            } else {
                throw new Error("Stripe checkout failed to initialize.");
            }
        } catch (error) {
            toast.error(error.message, { id: toastId }); 
        }
    };

    if (loading) return <div style={styles.loading}>Loading Inkspire Shop...</div>;

    return (
        <div style={styles.pageContainer}>
            <Toaster position="bottom-right" reverseOrder={false} />

           {/* Shop Header */}
            <div style={styles.header}>
                <h2>Inkspire Aftercare & Merch</h2>
                <div>
                    <a href="/orders" className="gold-btn" style={{marginRight: '15px', textDecoration: 'none', display: 'inline-block'}}>
                        📦 My Orders
                    </a>
                    <button onClick={() => setIsCartOpen(!isCartOpen)} className="gold-btn">
                        🛒 Cart ({cart.reduce((acc, item) => acc + item.quantity, 0)})
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div style={styles.toolbar}>
                <input 
                    type="text" 
                    placeholder="Search products..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={styles.searchInput}
                />
                
                <div style={styles.filterGroup}>
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={styles.selectInput}>
                        <option value="All">All Categories</option>
                        {categories.map(cat => <option key={cat.id} value={String(cat.id)}>{cat.name}</option>)}
                    </select>
                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={styles.selectInput}>
                        <option value="default">Sort: Default</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                    </select>
                </div>
            </div>

            {/* Product Grid */}
            <div style={styles.grid}>
                {displayedProducts.length === 0 ? <p style={{color: '#f0ebe0'}}>No products found.</p> : null}
                
                {displayedProducts.map((product) => (
                    <div key={product.id} style={styles.card}>
                        <div style={{ height: '200px', width: '100%', overflow: 'hidden', borderRadius: '4px', position: 'relative' }}>
                            {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
                                <div style={styles.lowStockBadge}>Only {product.stock_quantity} left!</div>
                            )}

                            {product.image ? (
                                <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={styles.imagePlaceholder}>📷</div>
                            )}
                        </div>
                        
                        <div style={{marginTop: '10px'}}>
                            {product.category_details && (
                                <span style={styles.categoryTag}>
                                    {product.category_details.name.toUpperCase()}
                                </span>
                            )}
                            <h3 style={{ margin: '5px 0' }}>{product.name}</h3>
                        </div>
                        
                        <p style={{ color: '#ccc', flexGrow: 1, fontSize: '0.9rem' }}>{product.description}</p>
                        
                        <div style={styles.cardFooter}>
                            <strong>{product.price ? `$${parseFloat(product.price).toFixed(2)}` : 'N/A'}</strong>
                            <span style={{ fontSize: '0.9rem', color: product.stock_quantity > 0 ? 'green' : 'red' }}>
                                {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                        </div>
                        
                        <button 
                            onClick={() => addToCart(product)} 
                            disabled={product.stock_quantity <= 0}
                            className="gold-btn"
                            style={{marginTop: 'auto'}}
                        >
                            {product.stock_quantity > 0 ? 'Add to Cart' : 'Sold Out'}
                        </button>
                    </div>
                ))}
            </div>

            {/* THE NEW, BEAUTIFUL SLIDE-OUT CART PANEL  */}
            {isCartOpen && (
                <div style={styles.cartPanel}>
                    <div style={styles.cartHeader}>
                        <h3 style={{margin: 0, fontSize: '1.4rem'}}>Your Cart</h3>
                        <button onClick={() => setIsCartOpen(false)} style={styles.closeBtn}>✖</button>
                    </div>
                    
                    {cart.length === 0 ? (
                        <div style={{textAlign: 'center', marginTop: '50px', color: '#888'}}>
                            <div style={{fontSize: '3rem', marginBottom: '10px'}}>🛒</div>
                            <p>Your cart is empty.</p>
                        </div>
                    ) : (
                        <div style={styles.cartItems}>
                            {cart.map((item) => (
                                <div key={item.product.id} style={styles.cartItemRow}>
                                    
                                    {/* Mini Thumbnail */}
                                    <div style={styles.cartItemImage}>
                                        {item.product.image ? (
                                            <img src={item.product.image} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{fontSize: '1.5rem'}}>📷</span>
                                        )}
                                    </div>

                                    {/* Item Details */}
                                    <div style={{ flexGrow: 1 }}>
                                        <strong style={{display: 'block', fontSize: '1.05rem', marginBottom: '4px'}}>{item.product.name}</strong>
                                        <div style={{color: '#666', fontSize: '0.9rem'}}>
                                            Qty: {item.quantity} <span style={{margin: '0 5px'}}>×</span> 
                                            <strong style={{color: '#000'}}>{item.product.price ? `$${parseFloat(item.product.price).toFixed(2)}` : 'N/A'}</strong>
                                        </div>
                                    </div>

                                    {/* Sleek Remove Button */}
                                    <button onClick={() => removeFromCart(item.product.id)} style={styles.removeBtn} title="Remove Item">
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {cart.length > 0 && (
                        <div style={styles.checkoutSection}>
                            <div style={styles.totalRow}>
                                <span style={{color: '#f0ebe0', fontWeight: '500'}}>Subtotal</span>
                                <strong style={{fontSize: '1.3rem'}}>${cartTotal.toFixed(2)}</strong>
                            </div>
                            <p style={{fontSize: '0.8rem', color: '#888', textAlign: 'center', marginBottom: '15px', marginTop: '-5px'}}>
                                Shipping and taxes calculated at checkout.
                            </p>
                            <button onClick={handleCheckout} className="gold-btn-solid">
                                🔒 Pay with Stripe
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Updated Inline Styles ---
const styles = {
    pageContainer: { fontFamily: 'sans-serif', padding: '20px', maxWidth: '1200px', margin: '0 auto', position: 'relative' },
    loading: { textAlign: 'center', marginTop: '50px', fontSize: '1.2rem', color: '#f0ebe0' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '10px', marginBottom: '20px', color: '#f0ebe0' },
    cartButton: { padding: '10px 20px', backgroundColor: 'transparent', color: '#D4AF37', border: '1px solid #D4AF37', borderRadius: '5px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' },
    toolbar: { display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', marginBottom: '30px', backgroundColor: 'rgba(17, 17, 18, 0.8)', padding: '15px', borderRadius: '8px', border: '1px solid #222' },
    searchInput: { flexGrow: 1, minWidth: '200px', padding: '10px', borderRadius: '5px', border: '1px solid #222', backgroundColor: '#0a0a0b', color: '#f0ebe0' },
    filterGroup: { display: 'flex', gap: '10px' },
    selectInput: { padding: '10px', borderRadius: '5px', border: '1px solid #222', backgroundColor: '#0a0a0b', color: '#f0ebe0', cursor: 'pointer' },
    categoryTag: { fontSize: '0.75rem', backgroundColor: '#D4AF37', color: '#000', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' },
    lowStockBadge: { position: 'absolute', top: '10px', left: '10px', backgroundColor: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', zIndex: 10 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
    card: { color: '#f0ebe0', border: '1px solid #222', borderRadius: '8px', padding: '15px', display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(17, 17, 18, 0.8)', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', transition: 'transform 0.3s' },
    imagePlaceholder: { height: '100%', width: '100%', backgroundColor: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '1.2rem' },
    cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '15px 0' },
    addButton: { padding: '12px', backgroundColor: 'transparent', color: '#D4AF37', border: '1px solid #D4AF37', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'all 0.3s ease' },
    disabledButton: { padding: '12px', backgroundColor: '#111', color: '#555', border: '1px solid #333', borderRadius: '4px', cursor: 'not-allowed', fontWeight: 'bold', fontSize: '1rem' },
    
    //  UPGRADED CART PANEL STYLES 
    cartPanel: { color: '#f0ebe0', position: 'fixed', top: '0', right: '0', width: '380px', height: '100%', backgroundColor: '#0a0a0b', borderLeft: '1px solid #222', boxShadow: '-5px 0 25px rgba(0,0,0,0.8)', padding: '25px', zIndex: 1000, display: 'flex', flexDirection: 'column' },
    cartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '15px', marginBottom: '20px' },
    closeBtn: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#D4AF37', transition: 'color 0.2s' },
    cartItems: { flexGrow: 1, overflowY: 'auto', paddingRight: '5px' },
    
    // Beautiful item bubbles!
    cartItemRow: { display: 'flex', alignItems: 'center', marginBottom: '15px', backgroundColor: 'rgba(17, 17, 18, 0.8)', padding: '12px', borderRadius: '10px', border: '1px solid #222' },
    cartItemImage: { width: '60px', height: '60px', backgroundColor: '#222', borderRadius: '6px', overflow: 'hidden', marginRight: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    removeBtn: { backgroundColor: 'transparent', color: '#ef4444', border: 'none', padding: '5px', fontSize: '1.2rem', cursor: 'pointer', opacity: '0.8', transition: 'opacity 0.2s' },
    
    // Sleek checkout summary box!
    checkoutSection: { marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #222', backgroundColor: 'rgba(17, 17, 18, 0.5)', padding: '20px', borderRadius: '12px', border: '1px solid #222' },
    totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.2rem', marginBottom: '10px', color: '#D4AF37' },
    checkoutBtn: { width: '100%', padding: '16px', backgroundColor: '#D4AF37', color: '#000', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)' }
};

export default Shop;