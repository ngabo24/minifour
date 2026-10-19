import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import './Home.css'
import Header from '../../components/Header/Header'
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu'
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay'
import AppDownload from '../../components/AppDownload/AppDownload'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const initialReservationForm = {
  guestName: '',
  email: '',
  phone: '',
  tableNumber: '',
  partySize: '2',
  reservationDate: new Date().toISOString().slice(0, 10),
  reservationTime: '19:00',
  notes: '',
}

const Home = () => {
  const location = useLocation()
  const [category, setCategory] = useState('All')
  const [reservationOpen, setReservationOpen] = useState(false)
  const [reservationForm, setReservationForm] = useState(initialReservationForm)
  const [reservationMessage, setReservationMessage] = useState('')
  const params = new URLSearchParams(location.search)
  const tableNumber = params.get('table') || localStorage.getItem('minifour-table') || ''

  const handleReservationChange = (event) => {
    const { name, value } = event.target
    setReservationForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleReservationSubmit = async (event) => {
    event.preventDefault()

    try {
      const response = await fetch(`${API_URL}/api/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reservationForm,
          tableNumber: reservationForm.tableNumber ? Number(reservationForm.tableNumber) : null,
          partySize: Number(reservationForm.partySize || 1),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Reservation failed.')
      }

      setReservationMessage('Reservation request received. The restaurant will confirm it shortly.')
      setReservationForm(initialReservationForm)
    } catch (error) {
      setReservationMessage(error.message)
    }
  }

  return (
    <div>
      {tableNumber && (
        <div className='table-banner'>
          Guest table {tableNumber}: ordering without account, pay before kitchen prep.
        </div>
      )}

      <section className='reservation-section'>
        <div className='reservation-card'>
          <button type='button' className='reservation-toggle' onClick={() => setReservationOpen((prev) => !prev)}>
            <div>
              <p className='eyebrow'>Reserve a table</p>
              <h2>Book your restaurant experience</h2>
            </div>
            <span>{reservationOpen ? 'Hide' : 'Open'}</span>
          </button>

          {reservationOpen && (
            <form className='reservation-form' onSubmit={handleReservationSubmit}>
              <div className='reservation-row'>
                <input name='guestName' value={reservationForm.guestName} onChange={handleReservationChange} placeholder='Your name' required />
                <input name='phone' value={reservationForm.phone} onChange={handleReservationChange} placeholder='Phone' required />
              </div>
              <div className='reservation-row'>
                <input name='email' type='email' value={reservationForm.email} onChange={handleReservationChange} placeholder='Email' />
                <input name='tableNumber' type='number' min='1' value={reservationForm.tableNumber} onChange={handleReservationChange} placeholder='Table number (optional)' />
              </div>
              <div className='reservation-row'>
                <input name='reservationDate' type='date' value={reservationForm.reservationDate} onChange={handleReservationChange} required />
                <input name='reservationTime' type='time' value={reservationForm.reservationTime} onChange={handleReservationChange} required />
                <input name='partySize' type='number' min='1' value={reservationForm.partySize} onChange={handleReservationChange} required />
              </div>
              <textarea name='notes' value={reservationForm.notes} onChange={handleReservationChange} placeholder='Notes or special requests' rows='3' />
              {reservationMessage && <p className='reservation-message'>{reservationMessage}</p>}
              <button type='submit' className='primary-btn'>Reserve</button>
            </form>
          )}
        </div>
      </section>

      <Header />
      <ExploreMenu category={category} setCategory={setCategory} />
      <FoodDisplay category={category} />
      <AppDownload />
    </div>
  )
}

export default Home