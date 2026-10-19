import { useEffect, useState } from 'react'
import './Orders.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const getGuestTableContext = () => {
  const guestAccessRaw = sessionStorage.getItem('minifour-guest-access')
  const guestAccess = guestAccessRaw ? JSON.parse(guestAccessRaw) : null
  const tableNumber = guestAccess?.tableNumber ?? Number(localStorage.getItem('minifour-table') || 0)
  const email = sessionStorage.getItem('minifour-guest-email') ||
    (tableNumber ? `guest-table-${tableNumber}@minifour.local` : '')

  return { tableNumber, email }
}

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const token = sessionStorage.getItem('minifour-token')

        if (token) {
          const response = await fetch(`${API_URL}/api/orders/my`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (!response.ok) {
            throw new Error('Unable to load your order history.')
          }

          const data = await response.json()
          setOrders(data)
          return
        }

        const { tableNumber, email } = getGuestTableContext()

        if (!tableNumber || !email) {
          setOrders([])
          return
        }

        const response = await fetch(`${API_URL}/api/orders/guest?tableNumber=${tableNumber}&email=${encodeURIComponent(email)}`)
        if (!response.ok) {
          throw new Error('Unable to load your table orders.')
        }

        const data = await response.json()
        setOrders(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    void loadOrders()
  }, [])

  if (loading) {
    return <div className='orders-page'><div className='orders-card'><h2>Loading orders...</h2></div></div>
  }

  return (
    <div className='orders-page'>
      <div className='orders-card'>
        <p className='eyebrow'>Recent activity</p>
        <h1>Your orders</h1>
        {error && <p className='orders-error'>{error}</p>}

        {!orders.length && !error && (
          <p className='empty-orders'>No orders yet. Start by choosing a delicious meal.</p>
        )}

        <div className='orders-list'>
          {orders.map((order) => (
            <article className='order-history-card' key={order._id || `${order.createdAt}-${order.guestName}`}>
              <div className='order-history-head'>
                <div>
                  <strong>#{(order._id || '').slice(-6) || 'guest'}</strong>
                  <p>{order.guestName || order.user?.name || 'Guest'} • {order.tableNumber ? `Table ${order.tableNumber}` : 'Walk-in'}</p>
                </div>
                <span className='status-pill'>{order.status || 'pending'}</span>
              </div>

              <div className='order-history-items'>
                {(order.items || []).map((item, index) => (
                  <div key={`${order._id || index}-${index}`}>
                    {item.quantity}x {item.name}
                  </div>
                ))}
              </div>

              <div className='order-history-meta'>
                <span>Total: ${Number(order.total || 0).toFixed(2)}</span>
                <span>{new Date(order.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Orders
