import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './OrderConfirmation.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const OrderConfirmation = () => {
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paymentMessage, setPaymentMessage] = useState('')

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const savedOrder = JSON.parse(localStorage.getItem('minifour-last-order') || 'null')
        if (savedOrder) {
          const tableNumber = Number(localStorage.getItem('minifour-table') || 0)
          const guestEmail = sessionStorage.getItem('minifour-guest-email') ||
            (tableNumber ? `guest-table-${tableNumber}@minifour.local` : '')

          if (tableNumber && guestEmail && savedOrder.tableNumber === tableNumber) {
            setOrder(savedOrder)
            return
          }
        }

        const token = sessionStorage.getItem('minifour-token')
        if (!token) {
          const tableNumber = Number(localStorage.getItem('minifour-table') || 0)
          if (!tableNumber) {
            setError('No recent order was found.')
            return
          }

          const guestEmail = sessionStorage.getItem('minifour-guest-email') || `guest-table-${tableNumber}@minifour.local`
          const response = await fetch(`${API_URL}/api/orders/guest?tableNumber=${tableNumber}&email=${encodeURIComponent(guestEmail)}`)

          if (!response.ok) {
            throw new Error('Unable to load the latest order.')
          }

          const orders = await response.json()
          setOrder(orders[0] || null)
          return
        }

        const response = await fetch(`${API_URL}/api/orders/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Unable to load the latest order.')
        }

        const orders = await response.json()
        setOrder(orders[0] || null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    void loadOrder()
  }, [])

  const handlePaymentNotification = async () => {
    if (!order?._id) return

    try {
      const response = await fetch(`${API_URL}/api/orders/${order._id}/payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus: 'pending_confirmation',
          paymentMethod: 'Mobile Money',
          paymentReference: `MM-${Date.now()}`,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Unable to send payment alert.')
      }

      setOrder(data)
      setPaymentMessage('Your mobile money alert was sent. Please wait for teller confirmation before the kitchen can continue.')
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return <div className='confirmation-page'><div className='confirmation-card'><h2>Loading confirmation...</h2></div></div>
  }

  if (!order) {
    return (
      <div className='confirmation-page'>
        <div className='confirmation-card'>
          <p className='eyebrow'>Order status</p>
          <h1>We could not find this order</h1>
          <p>{error || 'Please return to the menu and place a fresh order.'}</p>
          <button type='button' className='primary-btn' onClick={() => navigate('/')}>Return to menu</button>
        </div>
      </div>
    )
  }

  return (
    <div className='confirmation-page'>
      <div className='confirmation-card'>
        <p className='eyebrow'>Order confirmed</p>
        <h1>Thank you, {order.guestName || order.user?.name || 'Guest'}!</h1>
        <p>
          {order.paymentStatus === 'paid'
            ? 'Payment confirmed. The kitchen is continuing with your order.'
            : order.status === 'confirmed'
              ? 'Your chef confirmation is ready. Please complete the mobile money payment below.'
              : 'Your order has been received and the kitchen is preparing it.'}
        </p>

        <div className='confirmation-summary'>
          <div>
            <span>Order</span>
            <strong>#{(order._id || '').slice(-6) || 'guest'}</strong>
          </div>
          <div>
            <span>Table</span>
            <strong>{order.tableNumber ? `Table ${order.tableNumber}` : 'Walk-in'}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>${Number(order.total || 0).toFixed(2)}</strong>
          </div>
        </div>

        {order.status === 'confirmed' && order.paymentStatus !== 'paid' && (
          <div className='payment-box' style={{ marginTop: '20px', border: '1px solid #f0d7b4', background: '#fffaf4', padding: '16px', borderRadius: '14px' }}>
            <p style={{ marginTop: 0, marginBottom: '10px', fontWeight: 700 }}>Mobile money payment</p>
            <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>0786737349</p>
            <p style={{ margin: '8px 0 16px', color: '#5d4f46' }}>Send the exact amount and wait for the teller to confirm the message alert.</p>
            <button type='button' className='primary-btn' onClick={handlePaymentNotification}>I have sent the payment</button>
          </div>
        )}

        {paymentMessage && <p style={{ marginTop: '16px', color: '#1f5b34', fontWeight: 600 }}>{paymentMessage}</p>}

        <div className='confirmation-items'>
          {(order.items || []).map((item, index) => (
            <div className='confirmation-item-row' key={`${order._id || index}-${index}`}>
              <span>{item.quantity}x {item.name}</span>
              <strong>${Number(item.price * item.quantity).toFixed(2)}</strong>
            </div>
          ))}
        </div>

        <div className='confirmation-actions'>
          <Link to='/orders' className='primary-btn'>View order history</Link>
          <button type='button' className='secondary-btn' onClick={() => navigate('/')}>Back to menu</button>
        </div>
      </div>
    </div>
  )
}

export default OrderConfirmation
