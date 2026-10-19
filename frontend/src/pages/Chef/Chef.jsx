import { useCallback, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import './Chef.css'

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin)

const Chef = () => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = sessionStorage.getItem('minifour-user')
      return savedUser ? JSON.parse(savedUser) : null
    } catch {
      return null
    }
  })
  const [loginForm, setLoginForm] = useState({
    email: 'chef@minifour.com',
    password: 'Chef@Minifour123',
  })
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const token = sessionStorage.getItem('minifour-token')

  const fetchOrders = useCallback(async () => {
    if (!token || !user || user.role !== 'chef') return

    try {
      const response = await fetch(`${API_URL}/api/chef/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Unable to fetch orders.')
      }

      const data = await response.json()
      setOrders(data)
    } catch (err) {
      setError(err.message)
    }
  }, [token, user])

  useEffect(() => {
    if (!user || user.role !== 'chef') {
      return undefined
    }

    const socket = io(API_URL, { transports: ['websocket'] })
    socket.emit('join-chef-room')
    socket.on('order:updated', (nextOrder) => {
      setOrders((prev) => {
        if (!nextOrder || !nextOrder._id) return prev

        const exists = prev.some((order) => order._id === nextOrder._id)
        if (exists) {
          return prev.map((order) => (order._id === nextOrder._id ? nextOrder : order))
        }

        return [nextOrder, ...prev]
      })
    })

    void fetchOrders()

    return () => {
      socket.off('order:updated')
      socket.disconnect()
    }
  }, [fetchOrders, user])

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Chef login failed.')
      }

      if (data.user.role !== 'chef') {
        throw new Error('This account is not a chef account.')
      }

      sessionStorage.setItem('minifour-token', data.token)
      sessionStorage.setItem('minifour-user', JSON.stringify(data.user))
      setUser(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId, nextStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/chef/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Status update failed.')
      }

      setOrders((prev) => prev.map((order) => (order._id === orderId ? data : order)))
    } catch (err) {
      setError(err.message)
    }
  }

  const handlePaymentConfirmation = async (orderId) => {
    try {
      const response = await fetch(`${API_URL}/api/chef/orders/${orderId}/payment-confirm`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Payment confirmation failed.')
      }

      setOrders((prev) => prev.map((order) => (order._id === orderId ? data : order)))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('minifour-token')
    sessionStorage.removeItem('minifour-user')
    setUser(null)
    setOrders([])
  }

  if (!user || user.role !== 'chef') {
    return (
      <div className='chef-auth-wrapper'>
        <form className='chef-auth-card' onSubmit={handleLogin}>
          <h2>Chef Login</h2>
          <p>Manage table orders and confirm prep.</p>
          <input
            type='email'
            value={loginForm.email}
            onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder='chef@minifour.com'
            required
          />
          <input
            type='password'
            value={loginForm.password}
            onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
            placeholder='Chef@Minifour123'
            required
          />
          {error && <p className='chef-error'>{error}</p>}
          <button type='submit' disabled={loading}>{loading ? 'Signing in...' : 'Login as chef'}</button>
        </form>
      </div>
    )
  }

  return (
    <div className='chef-page'>
      <div className='chef-header'>
        <div>
          <p className='eyebrow'>Kitchen</p>
          <h1>Chef dashboard</h1>
        </div>
        <button type='button' className='logout-button' onClick={handleLogout}>Logout</button>
      </div>

      {error && <p className='chef-error'>{error}</p>}

      <div className='chef-order-grid'>
        {orders.filter((order) => order.status !== 'served').map((order) => (
          <div className='chef-order-card' key={order._id}>
            <div className='chef-order-top'>
              <div>
                <strong>#{order._id.slice(-6)}</strong>
                <p>{order.guestName || order.user?.name || 'Guest'} • Table {order.tableNumber || 'walk-in'}</p>
              </div>
              <span className='status-pill'>{order.status}</span>
            </div>

            <div className='chef-items'>
              {order.items.map((item, index) => (
                <div key={`${order._id}-${index}`}>
                  {item.quantity}x {item.name}
                </div>
              ))}
            </div>

            <div className='chef-actions'>
              <div style={{ display: 'grid', gap: '8px' }}>
                <select value={order.status} onChange={(event) => handleStatusChange(order._id, event.target.value)}>
                  <option value='pending'>pending</option>
                  <option value='confirmed'>confirmed</option>
                  <option value='preparing'>preparing</option>
                  <option value='ready'>ready</option>
                  <option value='served'>served</option>
                  <option value='cancelled'>cancelled</option>
                </select>
                {order.status === 'confirmed' && order.paymentStatus === 'pending_confirmation' && (
                  <button type='button' className='logout-button' onClick={() => handlePaymentConfirmation(order._id)}>
                    Confirm mobile money payment
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gap: '4px', textAlign: 'right' }}>
                <strong>${Number(order.total || 0).toFixed(2)}</strong>
                <span className='status-pill'>{order.paymentStatus || 'unpaid'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Chef
