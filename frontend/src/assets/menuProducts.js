import { food_1, food_2, food_3, food_4, food_5, food_6, food_7, food_8, food_9, food_10, food_11, food_12, food_13, food_14, food_15, food_16, food_17, food_18, food_19, food_20, food_21, food_22, food_23, food_24, food_25, food_26, food_27, food_28, food_29, food_30, food_31, food_32 } from './assets'
import chickenRiceImage from './menu-chicken-rice.webp'
import burgerFriesImage from './menu-burger-fries.webp'
import smoothieImage from './menu-smoothie.webp'
import dessertImage from './menu-dessert.webp'
import skewersImage from './menu-skewers.webp'
import friesImage from './menu-fries.webp'
import pastaImage from './menu-pasta.webp'
import plantainImage from './menu-plantain.webp'
import cinnamonRollsImage from './menu-cinnamon-rolls.webp'
import wafflesImage from './menu-waffles.webp'
import mikateImage from './menu-mikate.webp'
import lemonadeImage from './menu-lemonade.webp'
import waterImage from './menu-water.webp'
import milkshakeImage from './menu-milkshake.webp'

const images = [food_1, food_2, food_3, food_4, food_5, food_6, food_7, food_8, food_9, food_10, food_11, food_12, food_13, food_14, food_15, food_16, food_17, food_18, food_19, food_20, food_21, food_22, food_23, food_24, food_25, food_26, food_27, food_28, food_29, food_30, food_31, food_32]

// Maps the image filenames stored in the database to the bundled assets.
export const menuImageByFilename = {
  'menu-chicken-rice.webp': chickenRiceImage,
  'menu-burger-fries.webp': burgerFriesImage,
  'menu-smoothie.webp': smoothieImage,
  'menu-dessert.webp': dessertImage,
  'menu-skewers.webp': skewersImage,
  'menu-fries.webp': friesImage,
  'menu-pasta.webp': pastaImage,
  'menu-plantain.webp': plantainImage,
  'menu-cinnamon-rolls.webp': cinnamonRollsImage,
  'menu-waffles.webp': wafflesImage,
  'menu-mikate.webp': mikateImage,
  'menu-lemonade.webp': lemonadeImage,
  'menu-water.webp': waterImage,
  'menu-milkshake.webp': milkshakeImage,
}

const entries = [
  ['Rubis Box', 8500, 'Main Dishes Combo', 'Red rice, plantains, and chicken.'],
  ['Golden Box', 8500, 'Main Dishes Combo', 'Yellow rice, fries, and chicken.'],
  ['Poulet Mayo', 10000, 'Main Dishes Combo', '400g chicken with mayonnaise, fries, plantain, chikwangue, or plain rice.'],
  ['Attieke + Poulet', 8000, 'Main Dishes Combo', 'Attieke served with chicken.'],
  ['Chicken Leg + Fries', 7000, 'Main Dishes Combo', 'Chicken leg served with fries.'],
  ['2 Beef Brochettes + Chikwangue', 5000, 'Main Dishes Combo', 'Two beef brochettes with chikwangue.'],
  ['2 Chicken Brochettes + Chikwangue', 6000, 'Main Dishes Combo', 'Two chicken brochettes with chikwangue.'],
  ['UFO Burger + Fries', 7000, 'Main Dishes Combo', 'UFO burger served with fries.'],
  ['Beef Burger + Fries', 5500, 'Main Dishes Combo', 'Beef burger served with fries.'],
  ['Chicken Burger', 6500, 'Main Dishes Combo', 'Chicken burger.'],
  ['Akabenzi Chops', 7500, 'Main Dishes Combo', 'Fries or plantain with chikwangue or plain rice.'],
  ['Veggies Pastas', 4000, 'Main Dishes Combo', 'Pasta with carrots, onions, peppers, maize, and cucumber.'],
  ['Beef Burger', 3500, 'Snacks & Sides', 'Burgers & shawarmas.'],
  ['UFO Burger', 5500, 'Snacks & Sides', 'Closed homemade bread burger with beef.'],
  ['Chicken Burger', 4500, 'Snacks & Sides', 'Burgers & shawarmas.'],
  ['Beef Shawarma', 3500, 'Snacks & Sides', 'Burgers & shawarmas.'],
  ['Chicken Shawarma', 4500, 'Snacks & Sides', 'Burgers & shawarmas.'],
  ['Beef Brochette', 2500, 'Snacks & Sides', 'Brochettes.'],
  ['Chicken Brochette', 3500, 'Snacks & Sides', 'Brochettes.'],
  ['Plain Fries', 2500, 'Snacks & Sides', 'Sides.'],
  ['Plain Plantain', 3000, 'Snacks & Sides', 'Sides.'],
  ['Butter Veg Rice', 3000, 'Snacks & Sides', 'Sides.'],
  ['Potatoes', 2500, 'Snacks & Sides', 'Sides.'],
  ['Attieke', 4000, 'Snacks & Sides', 'Sides.'],
  ['Cinnamon Rolls', 2000, 'Desserts', 'Desserts & sweets.'],
  ['Cake (2 pieces)', 2500, 'Desserts', 'Two pieces.'],
  ['Cake (1 piece)', 1500, 'Desserts', 'One piece.'],
  ['Waffles (4 pieces)', 2500, 'Desserts', 'Four pieces.'],
  ['Mikate (8 pieces)', 2500, 'Desserts', 'Soft mandazi; eight pieces.'],
  ['Brownie', 2000, 'Desserts', 'Desserts & sweets.'],
  ['Chocolate extra', 1000, 'Desserts', 'Extra topping.'],
  ['Peanut Butter extra', 1000, 'Desserts', 'Extra topping.'],
  ['Jam extra', 1000, 'Desserts', 'Extra topping.'],
  ['Soft Drinks (Glass)', 1500, 'Drinks', 'Soft drinks & water.'],
  ['Soft Drinks (Plastic Bottle)', 2000, 'Drinks', 'Soft drinks & water.'],
  ['Water', 1500, 'Drinks', 'Soft drinks & water.'],
  ['Mango Smash', 4500, 'Drinks', 'Smoothies.'],
  ['Banana Tropical', 4500, 'Drinks', 'Smoothies.'],
  ['Strawberry Melody', 4500, 'Drinks', 'Smoothies.'],
  ['Tree Tomatoes', 4500, 'Drinks', 'Smoothies.'],
  ['Cocktail du Nord', 5000, 'Drinks', 'Cocktails.'],
  ['Cocktail du Sud', 5000, 'Drinks', 'Cocktails.'],
  ['VanyShake', 7000, 'Drinks', 'Milkshakes.'],
  ['Cara-Melo Sunset', 7000, 'Drinks', 'Milkshakes.'],
  ['Chocobon', 7500, 'Drinks', 'Milkshakes.'],
  ['Strawberry Mini', 7000, 'Drinks', 'Milkshakes.'],
]

const matchingImages = {
  'Rubis Box': chickenRiceImage,
  'Golden Box': chickenRiceImage,
  'Poulet Mayo': chickenRiceImage,
  'Attieke + Poulet': chickenRiceImage,
  'Chicken Leg + Fries': burgerFriesImage,
  '2 Beef Brochettes + Chikwangue': skewersImage,
  '2 Chicken Brochettes + Chikwangue': skewersImage,
  'UFO Burger + Fries': burgerFriesImage,
  'Beef Burger + Fries': burgerFriesImage,
  'Chicken Burger': burgerFriesImage,
  'Akabenzi Chops': chickenRiceImage,
  'Veggies Pastas': pastaImage,
  'Beef Burger': burgerFriesImage,
  'UFO Burger': burgerFriesImage,
  'Beef Shawarma': skewersImage,
  'Chicken Shawarma': skewersImage,
  'Beef Brochette': skewersImage,
  'Chicken Brochette': skewersImage,
  'Plain Fries': friesImage,
  'Plain Plantain': plantainImage,
  'Butter Veg Rice': chickenRiceImage,
  'Potatoes': friesImage,
  'Attieke': plantainImage,
  'Cinnamon Rolls': cinnamonRollsImage,
  'Cake (2 pieces)': dessertImage,
  'Cake (1 piece)': dessertImage,
  'Waffles (4 pieces)': wafflesImage,
  'Mikate (8 pieces)': mikateImage,
  'Brownie': dessertImage,
  'Chocolate extra': dessertImage,
  'Peanut Butter extra': dessertImage,
  'Jam extra': dessertImage,
  'Soft Drinks (Glass)': lemonadeImage,
  'Soft Drinks (Plastic Bottle)': lemonadeImage,
  'Water': waterImage,
  'Mango Smash': smoothieImage,
  'Banana Tropical': smoothieImage,
  'Strawberry Melody': smoothieImage,
  'Tree Tomatoes': smoothieImage,
  'Cocktail du Nord': lemonadeImage,
  'Cocktail du Sud': lemonadeImage,
  'VanyShake': milkshakeImage,
  'Cara-Melo Sunset': milkshakeImage,
  'Chocobon': milkshakeImage,
  'Strawberry Mini': milkshakeImage,
}

export const menuProducts = entries.map(([name, price, category, description], index) => ({
  _id: `menu-${index + 1}`,
  name,
  price,
  category,
  description,
  image: matchingImages[name] || images[index % images.length],
  stock: 30,
  costPrice: 0,
}))