import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatCurrency } from '../../utils/currency'
import './OrderConfirmation.css'

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin)).replace(/\/+$/, '')

const MOMO_METHOD = 'MTN Mobile Money'
const POLL_INTERVAL_MS = 5000
const POLL_TIMEOUT_MS = 120000

const getGuestContext = () => {
  const tableNumber = Number(localStorage.getItem('minifour-table') || 0)
  const email = sessionStorage.getItem('minifour-guest-email') ||
    (tableNumber ? `guest-table-${tableNumber}@minifour.local` : '')

  return { tableNumber, email }
}

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('minifour-token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const OrderConfirmation = () => {
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paymentMessage, setPaymentMessage] = useState('')
  const [checkingPayment, setCheckingPayment] = useState(false)
  const pollTimer = useRef(null)

  const loadOrder = useCallback(async () => {
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
        headers: getAuthHeaders(),
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
  }, [])

  useEffect(() => {
    // Deferring the initial load keeps the state update out of the effect body.
    const initialLoad = setTimeout(() => {
      void loadOrder()
    }, 0)

    return () => clearTimeout(initialLoad)
  }, [loadOrder])

  // Polls the MTN MoMo status endpoint until the payment settles or the
  // polling window expires.
  const checkPaymentStatus = useCallback(async () => {
    if (!order?._id) return null

    const { email } = getGuestContext()
    const query = email ? `?guestEmail=${encodeURIComponent(email)}` : ''

    try {
      const response = await fetch(`${API_URL}/api/orders/${order._id}/momo-status${query}`, {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Unable to verify the MTN payment right now.')
      }

      const data = await response.json()
      setOrder((current) => (current ? { ...current, paymentStatus: data.paymentStatus, status: data.orderStatus } : current))

      return data
    } catch (err) {
      setPaymentMessage(err.message)
      return null
    }
  }, [order])

  useEffect(() => {
    if (!order?._id) return undefined
    if (order.paymentMethod !== MOMO_METHOD) return undefined
    if (!['pending_confirmation', 'unpaid'].includes(order.paymentStatus)) return undefined

    const startedAt = Date.now()

    pollTimer.current = setInterval(() => {
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        clearInterval(pollTimer.current)
        pollTimer.current = null
        return
      }

      void checkPaymentStatus().then((data) => {
        if (data && ['paid', 'failed', 'cancelled'].includes(data.paymentStatus)) {
          if (pollTimer.current) {
            clearInterval(pollTimer.current)
            pollTimer.current = null
          }
        }
      })
    }, POLL_INTERVAL_MS)

    return () => {
      if (pollTimer.current) {
        clearInterval(pollTimer.current)
        pollTimer.current = null
      }
    }
  }, [order, checkPaymentStatus])

  const handlePaymentNotification = async () => {
    if (!order?._id) return

    setCheckingPayment(true)
    setPaymentMessage('')

    const { email } = getGuestContext()
    const token = sessionStorage.getItem('minifour-token')

    try {
      const response = await fetch(`${API_URL}/api/orders/${order._id}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          paymentStatus: 'pending_confirmation',
          paymentMethod: MOMO_METHOD,
          ...(email && !token ? { guestEmail: email } : {}),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Unable to send payment alert.')
      }

      setOrder(data)
      setPaymentMessage('We are checking your MTN Mobile Money payment. Approve the request on your phone to continue.')
    } catch (err) {
      setError(err.message)
    } finally {
      setCheckingPayment(false)
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

  const isMomoOrder = order.paymentMethod === MOMO_METHOD
  const isPaymentPending = ['pending_confirmation', 'unpaid'].includes(order.paymentStatus)
  const isPaymentFailed = order.paymentStatus === 'failed'
  const isPaymentPaid = ['paid', 'manual_paid'].includes(order.paymentStatus)

  const statusMessage = isPaymentPaid
    ? 'Payment confirmed. The kitchen is continuing with your order.'
    : isPaymentFailed
      ? 'The MTN Mobile Money payment did not complete. Please try paying again or choose another payment method.'
      : isMomoOrder
        ? 'Approve the MTN Mobile Money request on your phone to complete the payment. We are checking the status automatically.'
        : order.status === 'confirmed'
          ? 'Your chef confirmation is ready. Please complete the mobile money payment below.'
          : 'Your order has been received and the kitchen is preparing it.'

  return (
    <div className='confirmation-page'>
      <div className='confirmation-card'>
        <p className='eyebrow'>Order confirmed</p>
        <h1>Thank you, {order.guestName || order.user?.name || 'Guest'}!</h1>
        <p>{statusMessage}</p>

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
            <strong>{formatCurrency(Number(order.total || 0))}</strong>
          </div>
        </div>

        {isMomoOrder && isPaymentPending && (
          <div className='payment-box' style={{ marginTop: '20px', border: '1px solid #f0d7b4', background: '#fffaf4', padding: '16px', borderRadius: '14px' }}>
            <p style={{ marginTop: 0, marginBottom: '10px', fontWeight: 700 }}>MTN Mobile Money payment</p>
            <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
              {formatCurrency(Number(order.total || 0))}
            </p>
            <p style={{ margin: '8px 0 16px', color: '#5d4f46' }}>
              {order.momoPhone
                ? `We sent a payment request to ${order.momoPhone}. Approve it on your phone to complete the order.`
                : 'We sent a payment request to your phone. Approve it to complete the order.'}
            </p>
            <button type='button' className='primary-btn' onClick={handlePaymentNotification} disabled={checkingPayment}>
              {checkingPayment ? 'Checking payment...' : 'I have approved the payment'}
            </button>
          </div>
        )}

        {isMomoOrder && isPaymentFailed && (
          <div className='payment-box' style={{ marginTop: '20px', border: '1px solid #f0b4b4', background: '#fff6f6', padding: '16px', borderRadius: '14px' }}>
            <p style={{ marginTop: 0, marginBottom: '10px', fontWeight: 700 }}>Payment failed</p>
            <p style={{ margin: '8px 0 16px', color: '#5d4f46' }}>
              The MTN Mobile Money payment was not completed. You can retry the payment below.
            </p>
            <button type='button' className='primary-btn' onClick={handlePaymentNotification} disabled={checkingPayment}>
              {checkingPayment ? 'Checking payment...' : 'Retry payment'}
            </button>
          </div>
        )}

        {paymentMessage && <p style={{ marginTop: '16px', color: '#1f5b34', fontWeight: 600 }}>{paymentMessage}</p>}

        <div className='confirmation-items'>
          {(order.items || []).map((item, index) => (
            <div className='confirmation-item-row' key={`${order._id || index}-${index}`}>
              <span>{item.quantity}x {item.name}</span>
              <strong>{formatCurrency(Number(item.price * item.quantity))}</strong>
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
