import { useContext, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'
import './PlaceOrder.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const buildGuestForm = (tableNumber) => ({
  firstName: 'Guest',
  lastName: tableNumber ? `Table ${tableNumber}` : 'Customer',
  email: tableNumber ? `guest-table-${tableNumber}@minifour.local` : 'guest@minifour.local',
  street: tableNumber ? `Table ${tableNumber}` : 'Walk-in Counter',
  city: 'Restaurant',
  country: 'Local',
  zip: tableNumber ? `T-${tableNumber}` : '0000',
  payment: 'Pay now (manual)',
})

const PlaceOrder = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { cartItems, food_list, setCartItems } = useContext(StoreContext)
  const tableNumber = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const fromQuery = params.get('table')
    if (fromQuery) return fromQuery
    const savedTable = localStorage.getItem('minifour-table')
    if (savedTable) return savedTable
    return ''
  }, [location.search])

  const initialForm = useMemo(() => buildGuestForm(tableNumber), [tableNumber])
  const [form, setForm] = useState(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const cartEntries = food_list.filter((item) => cartItems[item._id])
  const subtotal = cartEntries.reduce((total, item) => total + item.price * cartItems[item._id], 0)
  const deliveryFee = tableNumber ? 0 : subtotal > 0 ? 2 : 0
  const total = subtotal + deliveryFee

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!cartEntries.length) {
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const token = sessionStorage.getItem('minifour-token')
      const payload = {
        items: cartEntries.map((item) => ({
          product: item._id,
          name: item.name,
          price: item.price,
          costPrice: item.costPrice || 0,
          quantity: cartItems[item._id],
          image: item.image,
        })),
        address: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          street: form.street,
          city: form.city,
          country: form.country,
          zip: form.zip,
        },
        paymentMethod: form.payment,
        tableNumber: tableNumber ? Number(tableNumber) : null,
        guestName: tableNumber ? `Guest Table ${tableNumber}` : `${form.firstName} ${form.lastName}`,
        paymentStatus: form.payment === 'Pay now (manual)' ? 'manual_paid' : 'paid',
      }

      if (tableNumber) {
        sessionStorage.setItem('minifour-guest-email', form.email)
      }

      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Order could not be placed.')
      }

      const orderRecord = data.order || {
        _id: `guest-${Date.now()}`,
        guestName: tableNumber ? `Guest Table ${tableNumber}` : `${form.firstName} ${form.lastName}`,
        tableNumber: tableNumber ? Number(tableNumber) : null,
        items: cartEntries,
        total,
        status: 'pending',
        address: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          street: form.street,
          city: form.city,
          country: form.country,
          zip: form.zip,
        },
        createdAt: new Date().toISOString(),
      }

      const guestHistoryKey = tableNumber ? `minifour-order-history-table-${tableNumber}` : 'minifour-order-history-guest'
      const savedHistory = JSON.parse(localStorage.getItem(guestHistoryKey) || '[]')
      const nextHistory = [orderRecord, ...savedHistory.filter((entry) => entry._id !== orderRecord._id)].slice(0, 12)
      localStorage.setItem('minifour-last-order', JSON.stringify(orderRecord))
      localStorage.setItem(`minifour-last-order-table-${tableNumber || 'guest'}`, JSON.stringify(orderRecord))
      localStorage.setItem(guestHistoryKey, JSON.stringify(nextHistory))

      setCartItems({})
      setSuccessMessage(
        tableNumber
          ? `Order placed for table ${tableNumber}. Please wait for kitchen confirmation.`
          : 'Order placed successfully! Your food is on the way.'
      )
      setTimeout(() => navigate('/order-confirmation'), 600)
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!cartEntries.length) {
    return (
      <div className='place-order empty-order'>
        <div className='empty-order-card'>
          <h2>Your cart is empty</h2>
          <p>Add something delicious before checking out.</p>
          <button onClick={() => navigate('/')} type='button'>Browse menu</button>
        </div>
      </div>
    )
  }

  return (
    <div className='place-order'>
      <div className='place-order-left'>
        <h2>{tableNumber ? `Table ${tableNumber} order` : 'Delivery details'}</h2>
        {tableNumber && <p className='guest-order-note'>Guest table order: payment is confirmed before the chef prepares your meal.</p>}

        <form id='place-order-form' className='place-order-form' onSubmit={handleSubmit}>
          <div className='place-order-row'>
            <input name='firstName' value={form.firstName} onChange={handleChange} placeholder='First name' required />
            <input name='lastName' value={form.lastName} onChange={handleChange} placeholder='Last name' required />
          </div>

          <div className='place-order-row'>
            <input name='email' type='email' value={form.email} onChange={handleChange} placeholder='Email address' required />
          </div>

          <div className='place-order-row'>
            <input name='street' value={form.street} onChange={handleChange} placeholder='Street address' required />
          </div>

          <div className='place-order-row'>
            <input name='city' value={form.city} onChange={handleChange} placeholder='City' required />
            <input name='country' value={form.country} onChange={handleChange} placeholder='Country' required />
          </div>

          <div className='place-order-row'>
            <input name='zip' value={form.zip} onChange={handleChange} placeholder='Postal code' required />
          </div>

          <div className='place-order-row'>
            <select name='payment' value={form.payment} onChange={handleChange}>
              <option>Pay now (manual)</option>
              <option>Cash on delivery</option>
              <option>Card payment</option>
            </select>
          </div>
        </form>

        {submitError && <p className='order-error'>{submitError}</p>}
        {successMessage && <p className='order-success'>{successMessage}</p>}
      </div>

      <aside className='place-order-right'>
        <h3>Order summary</h3>
        <div className='place-order-items'>
          {cartEntries.map((item) => (
            <div className='summary-item' key={item._id}>
              <div className='summary-item-info'>
                <span className='summary-qty'>{cartItems[item._id]}x</span>
                <span>{item.name}</span>
              </div>
              <strong>${item.price * cartItems[item._id]}</strong>
            </div>
          ))}
        </div>

        <div className='summary-totals'>
          <div>
            <span>Subtotal</span>
            <strong>${subtotal}</strong>
          </div>
          <div>
            <span>Delivery</span>
            <strong>${deliveryFee}</strong>
          </div>
          <div className='grand-total'>
            <span>Total</span>
            <strong>${total}</strong>
          </div>
        </div>

        <button className='primary-btn' form='place-order-form' type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Placing order...' : 'Place order'}
        </button>
      </aside>
    </div>
  )
}

export default PlaceOrder