import { useState } from 'react'
import './LoginPopup.css'
import { assets } from '../../assets/assets'

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin)).replace(/\/+$/, '')

const LoginPopup = ({ setShowLogin }) => {
  const [currState, setCurrState] = useState('Login')
  const [form, setForm] = useState({ name: '', email: '', password: '', agreed: false })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.email || !form.password || (currState === 'Sign Up' && !form.name)) {
      setError('Please fill in all required fields.')
      return
    }

    if (currState === 'Sign Up' && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(form.password)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, a number, and a special character.')
      return
    }

    if (!form.agreed) {
      setError('Please accept the terms and privacy policy to continue.')
      return
    }

    setLoading(true)

    try {
      const endpoint = currState === 'Sign Up' ? '/api/auth/register' : '/api/auth/login'
      const payload = currState === 'Sign Up'
        ? { name: form.name, email: form.email, password: form.password }
        : { email: form.email, password: form.password }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed.')
      }

      sessionStorage.setItem('minifour-token', data.token)
      sessionStorage.setItem('minifour-user', JSON.stringify(data.user))
      window.dispatchEvent(new Event('minifour-auth-change'))
      setShowLogin(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='login-popup'>
      <form className='login-popup-container' onSubmit={handleSubmit}>
        <div className='login-popup-title'>
          <h2>{currState}</h2>
          <img onClick={() => setShowLogin(false)} src={assets.cross_icon} alt='' />
        </div>

        <div className='login-popup-input'>
          {currState === 'Login' ? null : (
            <input name='name' type='text' placeholder='Your Name' value={form.name} onChange={handleChange} required />
          )}
          <input name='email' type='email' placeholder='Your email' value={form.email} onChange={handleChange} required />
          <input name='password' type='password' placeholder='Password' value={form.password} onChange={handleChange} required />
        </div>

        {error && <p className='login-error'>{error}</p>}

        <button type='submit' disabled={loading}>{loading ? 'Please wait...' : currState === 'Sign Up' ? 'Create account' : 'Login'}</button>

        <div className='login-popup-condition'>
          <input name='agreed' type='checkbox' checked={form.agreed} onChange={handleChange} required />
          <p>By continuing, I agree to the terms of use & privacy policy.</p>
        </div>

        {currState === 'Login' ? (
          <p>Create a new account? <span onClick={() => setCurrState('Sign Up')}>Click Here</span></p>
        ) : (
          <p>Already have an account? <span onClick={() => setCurrState('Login')}>Login Here</span></p>
        )}
      </form>
    </div>
  )
}

export default LoginPopup