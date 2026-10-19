import './Header.css'

const Header = () => {
  const scrollToMenu = () => {
    document.getElementById('explore-menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className='header'>
      <div className="header-contents">
        <h2>Order your favourite food here</h2>
        <p>Choose from a diverse menu featuring a delectable arrray of dishes crafted with the finest ingredients and culinary expertise. Our mission is to satisfy your cravings and elevate your dining experience, one delicious meal at time.</p>
        <button onClick={scrollToMenu} type='button'>View Menu</button>
      </div>
    </div>
  )
}

export default Header