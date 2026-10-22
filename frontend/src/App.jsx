import Navbar from './components/Navbar/Navbar'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Home from './pages/Home/Home'
import Cart from './pages/Cart/Cart'
import PlaceOrder from './pages/PlaceOrder/PlaceOrder'
import OrderConfirmation from './pages/OrderConfirmation/OrderConfirmation'
import Orders from './pages/Orders/Orders'
import Admin from './pages/Admin/Admin'
import Chef from './pages/Chef/Chef'
import Footer from './components/Footer/Footer'
import { useEffect, useMemo, useState } from 'react'
import LoginPopup from './components/LoginPopup/LoginPopup'

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin)).replace(/\/+$/, '')
const GUEST_ACCESS_KEY = 'minifour-guest-access'

const getStoredGuestAccess = () => {
  try {
    const rawValue = sessionStorage.getItem(GUEST_ACCESS_KEY)
    if (!rawValue) return null

    const value = JSON.parse(rawValue)
    if (!value || !value.expiresAt || Date.now() > Number(value.expiresAt)) {
      sessionStorage.removeItem(GUEST_ACCESS_KEY)
      return null
    }

    return value
  } catch {
    sessionStorage.removeItem(GUEST_ACCESS_KEY)
    return null
  }
}

const GuestAccessGate = ({ onGuestAccessGranted }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const queryTable = new URLSearchParams(location.search).get('table') || ''

  useEffect(() => {
    if (!queryTable) return
    const validate = async () => {
      setLoading(true)
      setErrorMessage('')
      try {
        const response = await fetch(`${API_URL}/api/tables/validate?table=${encodeURIComponent(queryTable)}`)
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'This table is not available for guest access.')
        const access = { tableNumber: Number(data.tableNumber), tableName: data.tableName, expiresAt: Number(data.expiresAt) }
        const guestEmail = `guest-table-${access.tableNumber}@minifour.local`
        sessionStorage.setItem(GUEST_ACCESS_KEY, JSON.stringify(access))
        sessionStorage.setItem('minifour-guest-email', guestEmail)
        localStorage.setItem('minifour-table', String(access.tableNumber))
        if (onGuestAccessGranted) onGuestAccessGranted(access)
        navigate('/')
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    }
    validate()
  }, [queryTable, onGuestAccessGranted, navigate])

  if (queryTable) {
    return (
      <div style={{ minHeight: '72vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <div style={{ background: '#fffaf6', border: '1px solid #f2dcc0', borderRadius: '24px', boxShadow: '0 16px 36px rgba(30,21,14,0.08)', maxWidth: '560px', width: '100%', padding: '32px 24px', textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#a67024', fontSize: '0.74rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>Private table access</p>
          <h1 style={{ margin: '12px 0 12px', fontSize: 'clamp(2rem, 3vw, 2.8rem)', lineHeight: 1.2 }}>{loading ? 'Validating table...' : 'Please scan the QR code at your table'}</h1>
          <p style={{ margin: 0, color: '#5d4f46', lineHeight: 1.6 }}>This restaurant is protected for guest table access only. Use the QR code at your table to unlock temporary access and continue ordering.</p>
          {errorMessage && <p style={{ margin: '12px 0 0', color: '#9b2c2c', fontWeight: 600 }}>{errorMessage}</p>}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '72vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
      <div style={{ background: '#fffaf6', border: '1px solid #f2dcc0', borderRadius: '24px', boxShadow: '0 16px 36px rgba(30,21,14,0.08)', maxWidth: '560px', width: '100%', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ margin: 0, color: '#a67024', fontSize: '0.74rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>Private table access</p>
        <h1 style={{ margin: '12px 0 12px', fontSize: 'clamp(2rem, 3vw, 2.8rem)', lineHeight: 1.2 }}>Scan the QR code at your table</h1>
        <p style={{ margin: 0, color: '#5d4f46', lineHeight: 1.6 }}>This restaurant is protected for guest table access only. Use the QR code at your table to unlock temporary access and continue ordering. Manual table entry is not allowed.</p>
      </div>
    </div>
  )
}

const App = () => {
  const location = useLocation()
  const [showLogin, setShowLogin] = useState(false)
  const [guestAccess, setGuestAccess] = useState(() => getStoredGuestAccess())

  const rawTable = useMemo(() => {
    const isTableRoute = location.pathname.startsWith('/table/')
    return new URLSearchParams(location.search).get('table') ||
      (isTableRoute ? location.pathname.split('/').filter(Boolean).at(-1) : null)
  }, [location])

  useEffect(() => {
    if (rawTable) {
      localStorage.setItem('minifour-table', rawTable)
    }
  }, [rawTable])

  useEffect(() => {
    const validateTableAccess = async () => {
      if (!rawTable) return

      const token = sessionStorage.getItem('minifour-token')
      if (token) {
        return
      }

      try {
        const response = await fetch(`${API_URL}/api/tables/validate?table=${encodeURIComponent(rawTable)}`)
        const data = await response.json()

        if (!response.ok) {
          setGuestAccess(null)
          return
        }

        const access = {
          tableNumber: Number(data.tableNumber),
          tableName: data.tableName,
          expiresAt: Number(data.expiresAt),
        }

        sessionStorage.setItem(GUEST_ACCESS_KEY, JSON.stringify(access))
        sessionStorage.setItem('minifour-guest-email', `guest-table-${access.tableNumber}@minifour.local`)
        setGuestAccess(access)
      } catch {
        setGuestAccess(null)
      }
    }

    validateTableAccess()
  }, [rawTable])

  const isAuthenticated = Boolean(sessionStorage.getItem('minifour-token'))
  const isGuestAllowed = Boolean(guestAccess)
  const isProtectedPublicRoute = !['/admin', '/chef', '/access'].includes(location.pathname) &&
    !location.pathname.startsWith('/admin') &&
    !location.pathname.startsWith('/chef') &&
    !location.pathname.startsWith('/table/')

  const shouldBlockPublicAccess = isProtectedPublicRoute && !isAuthenticated && !isGuestAllowed

  return (
    <>
      {showLogin ? <LoginPopup setShowLogin={setShowLogin} /> : null}
      {shouldBlockPublicAccess ? (
        <GuestAccessGate onGuestAccessGranted={setGuestAccess} />
      ) : (
        <>
          <div className='app'>
            <Navbar setShowLogin={setShowLogin} />
            <Routes>
              <Route path='/' element={<Home />} />
              <Route path='/menu' element={<Home />} />
              <Route path='/mobile-app' element={<Home />} />
              <Route path='/contact' element={<Home />} />
              <Route path='/cart' element={<Cart />} />
              <Route path='/placeorder' element={<PlaceOrder />} />
              <Route path='/order-confirmation' element={<OrderConfirmation />} />
              <Route path='/orders' element={<Orders />} />
              <Route path='/admin' element={<Admin />} />
              <Route path='/chef' element={<Chef />} />
              <Route path='/table/:tableNumber' element={<Home />} />
              <Route path='/access' element={<GuestAccessGate onGuestAccessGranted={setGuestAccess} />} />
            </Routes>
          </div>
          <Footer />
        </>
      )}
    </>
  )
}

export default App