import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const OrderHistory = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            const token = localStorage.getItem('access');
            
            if (!token) {
                toast.error("You must be logged in to view your orders.");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch('http://localhost:8000/api/shop/history/', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error("Failed to fetch orders");
                
                const data = await response.json();
                setOrders(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching history:', error);
                toast.error("Could not load your order history.");
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    if (loading) return <div style={styles.loading}>Loading your orders...</div>;

    return (
        <div style={styles.pageContainer}>
            <Toaster position="bottom-right" />
            
            <div style={styles.header}>
                <h2>My Order History</h2>
                <a href="/shop" style={styles.backButton}>← Back to Shop</a>
            </div>

            {orders.length === 0 ? (
                <div style={styles.emptyState}>
                    <div style={{fontSize: '4rem', marginBottom: '10px'}}>📦</div>
                    <h3>No orders yet</h3>
                    <p style={{color: '#888'}}>When you buy something, it will show up here!</p>
                </div>
            ) : (
                <div style={styles.orderList}>
                    {orders.map((order) => (
                        <div key={order.id} style={styles.orderCard}>
                            <div style={styles.orderHeader}>
                                <div>
                                    <span style={{color: '#888', fontSize: '0.9rem'}}>Order #{order.id}</span>
                                    <h3 style={{margin: '5px 0 0 0'}}>
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </h3>
                                </div>
                                <div style={{textAlign: 'right'}}>
                                    <span style={{
                                        ...styles.statusBadge, 
                                        backgroundColor: order.status === 'paid' ? '#10b981' : '#f59e0b'
                                    }}>
                                        {order.status.toUpperCase()}
                                    </span>
                                    <h3 style={{margin: '5px 0 0 0'}}>${parseFloat(order.total_price).toFixed(2)}</h3>
                                </div>
                            </div>

                            <hr style={{border: 'none', borderTop: '1px solid #333', margin: '15px 0'}} />

                            <div style={styles.itemList}>
                                {order.items.map((item, index) => (
                                    <div key={index} style={styles.itemRow}>
                                        <span style={{color: '#ccc'}}>{item.quantity}x {item.product_name || "Product"}</span>
                                        <span style={{color: '#888'}}>${parseFloat(item.price_at_purchase).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Dark Mode Styles ---
const styles = {
    pageContainer: { fontFamily: 'sans-serif', padding: '40px 20px', maxWidth: '800px', margin: '0 auto', color: 'white' },
    loading: { textAlign: 'center', marginTop: '100px', fontSize: '1.2rem', color: 'white' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #444', paddingBottom: '15px', marginBottom: '30px' },
    backButton: { padding: '8px 16px', backgroundColor: '#333', color: 'white', textDecoration: 'none', borderRadius: '5px', fontSize: '0.9rem', transition: 'background 0.2s' },
    emptyState: { textAlign: 'center', marginTop: '60px', padding: '40px', backgroundColor: '#1a1a1a', borderRadius: '10px', border: '1px dashed #444' },
    orderList: { display: 'flex', flexDirection: 'column', gap: '20px' },
    orderCard: { backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', border: '1px solid #333' },
    orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    statusBadge: { fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', color: 'white' },
    itemList: { display: 'flex', flexDirection: 'column', gap: '10px' },
    itemRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }
};

export default OrderHistory;