/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from 'react'
import { food_list } from '../assets/assets'
import { menuImageByFilename } from '../assets/menuProducts'

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
  const rawImage = typeof product?.image === 'string' ? product.image.trim() : ''

  // Remote uploads (Google Drive, Cloudinary, etc.) are used as-is.
  if (/^https?:\/\//i.test(rawImage)) {
    return rawImage
  }

  // Inline uploads are already a usable data URL.
  if (rawImage.startsWith('data:image')) {
    return rawImage
  }

  const imageName = rawImage.split('/').pop()
  const directFilenameMatch = imageName ? filenameImageMap[imageName] : null
  const directNameMatch = product?.name ? staticImageMap[normalizeKey(product.name)] : null
  const menuImageMatch = imageName ? menuImageByFilename[imageName] : null

  return directFilenameMatch || menuImageMatch || directNameMatch || rawImage || '/src/assets/food_1.png'
}

const StoreContextProvider = ({ children }) => {
  const [foodList, setFoodList] = useState([])
  const [loadError, setLoadError] = useState('')
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
      const apiBaseUrl = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin)).replace(/\/+$/, '')

      try {
        const response = await fetch(`${apiBaseUrl}/api/products`)
        if (!response.ok) throw new Error(`Failed to fetch products (${response.status})`)

        const products = await response.json()

        if (Array.isArray(products)) {
          setFoodList(
            products.map((product) => ({
              ...product,
              image: resolveProductImage(product),
              _id: product._id || product.id,
            }))
          )
          setLoadError('')
        } else {
          throw new Error('Invalid products response from server.')
        }
      } catch (error) {
        setLoadError(error.message || 'Unable to load the menu from the database.')
        // Fall back to the static menu only when the API is unreachable.
        setFoodList(
          food_list.map((item) => ({
            ...item,
            _id: item._id || item.id,
          }))
        )
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
    loadError,
  }

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  )
}

export default StoreContextProvider