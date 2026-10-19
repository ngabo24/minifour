import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'
import './Cart.css'

const Cart = () => {
  const navigate = useNavigate()
  const { cartItems, food_list, addToCart, removeFromCart } = useContext(StoreContext)

  const cartEntries = food_list.filter((item) => cartItems[item._id])
  const itemCount = cartEntries.reduce((total, item) => total + cartItems[item._id], 0)
  const subtotal = cartEntries.reduce((total, item) => total + item.price * cartItems[item._id], 0)
  const deliveryFee = subtotal > 0 ? 2 : 0
  const total = subtotal + deliveryFee

  if (!cartEntries.length) {
    return (
      <div className='cart empty-cart'>
        <div className='empty-cart-card'>
          <h2>Your cart is empty</h2>
          <p>Add a few dishes from the menu to get started.</p>
          <button onClick={() => navigate('/')}>Browse menu</button>
        </div>
      </div>
    )
  }

  return (
    <div className='cart'>
      <div className='cart-left'>
        <h2>Your cart</h2>
        <div className='cart-items'>
          {cartEntries.map((item) => {
            const quantity = cartItems[item._id]
            const itemTotal = item.price * quantity

            return (
              <div className='cart-item' key={item._id}>
                <img src={item.image} alt={item.name} className='cart-item-image' />

                <div className='cart-item-info'>
                  <h3>{item.name}</h3>
                  <p>${item.price} each</p>
                </div>

                <div className='cart-item-controls'>
                  <div className='cart-item-counter'>
                    <button onClick={() => removeFromCart(item._id)} type='button'>-</button>
                    <span>{quantity}</span>
                    <button onClick={() => addToCart(item._id)} type='button'>+</button>
                  </div>
                </div>

                <p className='cart-item-total'>${itemTotal}</p>
              </div>
            )
          })}
        </div>
      </div>

      <aside className='cart-summary'>
        <h3>Order summary</h3>
        <div className='summary-row'>
          <span>Items</span>
          <span>{itemCount}</span>
        </div>
        <div className='summary-row'>
          <span>Subtotal</span>
          <span>${subtotal}</span>
        </div>
        <div className='summary-row'>
          <span>Delivery</span>
          <span>${deliveryFee}</span>
        </div>
        <div className='summary-row total'>
          <span>Total</span>
          <span>${total}</span>
        </div>

        <div className='cart-actions'>
          <button className='primary-btn' onClick={() => navigate('/placeorder')} type='button'>Proceed to checkout</button>
          <button className='secondary-btn' onClick={() => navigate('/')} type='button'>Continue shopping</button>
        </div>
      </aside>
    </div>
  )
}

export default Cart