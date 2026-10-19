/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from 'react'
import { food_list } from '../assets/assets'

export const StoreContext = createContext(null)

const normalizeKey = (value = '') => value.toString().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const staticImageMap = Object.fromEntries(
  food_list.flatMap((item) => [
    [normalizeKey(item.name), item.image],
    [normalizeKey(item.category), item.image],
  ])
)
const filenameImageMap = Object.fromEntries(
  food_list.map((item) => [String(item.image).split('/').pop(), item.image])
)

const resolveProductImage = (product) => {
  const imageName = typeof product?.image === 'string' ? product.image.split('/').pop() : ''
  const directFilenameMatch = imageName ? filenameImageMap[imageName] : null
  const directNameMatch = product?.name ? staticImageMap[normalizeKey(product.name)] : null

  return directFilenameMatch || directNameMatch || product?.image || '/src/assets/food_1.png'
}

const StoreContextProvider = ({ children }) => {
  const [foodList, setFoodList] = useState(food_list)
  const [cartItems, setCartItems] = useState(() => {
    try {
      const storedCart = localStorage.getItem('minifour-cart')
      return storedCart ? JSON.parse(storedCart) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    const loadProducts = async () => {
      const apiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin)

      try {
        const response = await fetch(`${apiBaseUrl}/api/products`)
        if (!response.ok) throw new Error('Failed to fetch products')

        const products = await response.json()

        if (Array.isArray(products) && products.length) {
          setFoodList(
            products.map((product) => ({
              ...product,
              image: resolveProductImage(product),
              _id: product._id || product.id,
            }))
          )
        }
      } catch {
        setFoodList(food_list)
      }
    }

    loadProducts()
  }, [])

  useEffect(() => {
    localStorage.setItem('minifour-cart', JSON.stringify(cartItems))
  }, [cartItems])

  const addToCart = (itemId) => {
    setCartItems((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }))
  }

  const removeFromCart = (itemId) => {
    setCartItems((prev) => {
      const next = { ...prev }
      const currentQty = next[itemId] || 0

      if (currentQty <= 1) {
        delete next[itemId]
        return next
      }

      next[itemId] = currentQty - 1
      return next
    })
  }

  const contextValue = {
    food_list: foodList,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
  }

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  )
}

export default StoreContextProvider