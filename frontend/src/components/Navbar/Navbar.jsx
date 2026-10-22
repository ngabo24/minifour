import { Link } from 'react-router-dom'
import { useContext, useEffect, useState } from 'react'
import './Navbar.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext'

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState('home')
  const [user, setUser] = useState(() => {
    try {
      const savedUser = sessionStorage.getItem('minifour-user')
      return savedUser ? JSON.parse(savedUser) : null
    } catch {
      return null
    }
  })
  const { cartItems } = useContext(StoreContext)
  const cartCount = Object.values(cartItems).reduce((total, qty) => total + qty, 0)

  useEffect(() => {
    const handleAuthChange = () => {
      try {
        const savedUser = sessionStorage.getItem('minifour-user')
        setUser(savedUser ? JSON.parse(savedUser) : null)
      } catch {
        setUser(null)
      }
    }

    window.addEventListener('minifour-auth-change', handleAuthChange)
    return () => window.removeEventListener('minifour-auth-change', handleAuthChange)
  }, [])

  const handleMenuClick = (nextMenu) => setMenu(nextMenu)

  const handleAuthClick = () => {
    if (user) {
      sessionStorage.removeItem('minifour-token')
      sessionStorage.removeItem('minifour-user')
      window.dispatchEvent(new Event('minifour-auth-change'))
      return
    }

    setShowLogin(true)
  }

  return (
    <div className='navbar'>
      <Link to='/' onClick={() => handleMenuClick('home')}>
        <img src={assets.logo} alt='logo' className='logo' />
      </Link>

      <ul className='navbar-menu'>
        <Link to='/' onClick={() => handleMenuClick('home')} className={menu === 'home' ? 'active' : ''}>home</Link>
        <a href='/#explore-menu' onClick={() => handleMenuClick('menu')} className={menu === 'menu' ? 'active' : ''}>menu</a>
        <a href='/#app-download' onClick={() => handleMenuClick('mobile-app')} className={menu === 'mobile-app' ? 'active' : ''}>mobile-app</a>
        <a href='/#footer' onClick={() => handleMenuClick('contact-us')} className={menu === 'contact-us' ? 'active' : ''}>contact us</a>
        {user?.role === 'admin' && (
          <Link to='/admin' onClick={() => handleMenuClick('admin')} className={menu === 'admin' ? 'active' : ''}>admin</Link>
        )}
        {user?.role === 'chef' && (
          <Link to='/chef' onClick={() => handleMenuClick('chef')} className={menu === 'chef' ? 'active' : ''}>chef</Link>
        )}
      </ul>

      <div className='navbar-right'>

        <Link to='/orders' onClick={() => handleMenuClick('orders')} className={menu === 'orders' ? 'active' : ''}>orders</Link>

        <Link to='/cart' className='navbar-search-icon' onClick={() => handleMenuClick('cart')}>
          <img src={assets.basket_icon} alt='cart' />
          {cartCount > 0 && <div className='dot'>{cartCount}</div>}
        </Link>

        <button onClick={handleAuthClick} className='navbar-btn' type='button'>
          {user ? `Hi, ${user.name.split(' ')[0]}` : 'sign in'}
        </button>
      </div>
    </div>
  )
}

export default Navbar