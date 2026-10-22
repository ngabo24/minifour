import { useContext } from 'react'
import './FoodDisplay.css'
import { StoreContext } from '../../context/StoreContext'
import FoodItem from '../FoodItem/FoodItem'

const FoodDisplay = ({ category }) => {
  const { food_list, loadError } = useContext(StoreContext)
  const visibleItems = category === 'All' ? food_list : food_list.filter((item) => item.category === category)

  if (loadError && !food_list.length) {
    return (
      <div className='food-display' id='food-display'>
        <h2>Top dishes near you</h2>
        <div className='food-display-empty-state'>
          <p>Unable to load the menu from the database.</p>
          <p className='food-display-error-detail'>{loadError}</p>
        </div>
      </div>
    )
  }

  if (!food_list.length) {
    return (
      <div className='food-display' id='food-display'>
        <h2>Top dishes near you</h2>
        <p className='food-display-empty-state'>Loading menu from the database...</p>
      </div>
    )
  }

  return (
    <div className='food-display' id='food-display'>
      <h2>Top dishes near you</h2>
      <div className='food-display-list'>
        {visibleItems.map((item, index) => (
          <FoodItem
            key={item._id || index}
            id={item._id}
            name={item.name}
            description={item.description}
            price={item.price}
            image={item.image}
          />
        ))}
      </div>
    </div>
  )
}

export default FoodDisplay