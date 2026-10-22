// Canonical menu categories for Minifour. Every seed product, admin product
// form and storefront filter uses these exact values so that data stays
// consistent between the database, the API and the React front end.
const MENU_CATEGORIES = [
  'Main Dishes Combo',
  'Snacks & Sides',
  'Desserts',
  'Drinks',
]

const isValidCategory = (category) => MENU_CATEGORIES.includes(String(category || '').trim())

module.exports = { MENU_CATEGORIES, isValidCategory }
