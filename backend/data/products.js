const products = [
  {
    "name": "Greek salad",
    "description": "A fresh mixed salad with greens, feta, olives, and a lemon dressing.",
    "price": 12,
    "category": "Salad",
    "image": "food_1.png",
    "stock": 25,
    "costPrice": 5.04,
    "ingredients": [
      {
        "name": "tomato",
        "quantity": 1,
        "unit": "pcs"
      },
      {
        "name": "onion",
        "quantity": 2,
        "unit": "pcs"
      }
    ]
  },
  {
    "name": "Veg salad",
    "description": "Colorful vegetables tossed with herbs and a light vinaigrette.",
    "price": 18,
    "category": "Salad",
    "image": "food_2.png",
    "stock": 18,
    "costPrice": 7.56,
    "ingredients": [
      {
        "name": "onion",
        "quantity": 2,
        "unit": "pcs"
      },
      {
        "name": "lettuce",
        "quantity": 1,
        "unit": "heads"
      }
    ]
  },
  {
    "name": "Clover Salad",
    "description": "Crisp greens, avocado, and seasonal toppings with a bright dressing.",
    "price": 16,
    "category": "Salad",
    "image": "food_3.png",
    "stock": 20,
    "costPrice": 6.72,
    "ingredients": [
      {
        "name": "lettuce",
        "quantity": 3,
        "unit": "heads"
      },
      {
        "name": "chicken",
        "quantity": 2,
        "unit": "kg"
      }
    ]
  },
  {
    "name": "Chicken Salad",
    "description": "Grilled chicken, greens, and crunchy vegetables with a savory finish.",
    "price": 24,
    "category": "Salad",
    "image": "food_4.png",
    "stock": 15,
    "costPrice": 10.08,
    "ingredients": [
      {
        "name": "chicken",
        "quantity": 1,
        "unit": "kg"
      },
      {
        "name": "cheese",
        "quantity": 1,
        "unit": "kg"
      }
    ]
  },
  {
    "name": "Lasagna Rolls",
    "description": "Soft pasta rolls layered with rich cheese and savory sauce.",
    "price": 14,
    "category": "Rolls",
    "image": "food_5.png",
    "stock": 22,
    "costPrice": 5.88,
    "ingredients": [
      {
        "name": "cheese",
        "quantity": 2,
        "unit": "kg"
      },
      {
        "name": "pasta",
        "quantity": 2,
        "unit": "kg"
      }
    ]
  },
  {
    "name": "Peri Peri Rolls",
    "description": "Spicy peri peri chicken wrapped in a warm, flaky roll.",
    "price": 12,
    "category": "Rolls",
    "image": "food_6.png",
    "stock": 27,
    "costPrice": 5.04,
    "ingredients": [
      {
        "name": "pasta",
        "quantity": 3,
        "unit": "kg"
      },
      {
        "name": "rice",
        "quantity": 1,
        "unit": "kg"
      }
    ]
  },
  {
    "name": "Chicken Rolls",
    "description": "Tender chicken bites wrapped with crunchy greens and sauce.",
    "price": 20,
    "category": "Rolls",
    "image": "food_7.png",
    "stock": 16,
    "costPrice": 8.4,
    "ingredients": [
      {
        "name": "rice",
        "quantity": 1,
        "unit": "kg"
      },
      {
        "name": "tomato",
        "quantity": 2,
        "unit": "pcs"
      }
    ]
  },
  {
    "name": "Veg Rolls",
    "description": "Fresh vegetables and herbs packed in a soft, golden roll.",
    "price": 15,
    "category": "Rolls",
    "image": "food_8.png",
    "stock": 19,
    "costPrice": 6.3,
    "ingredients": [
      {
        "name": "tomato",
        "quantity": 2,
        "unit": "pcs"
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "pcs"
      }
    ]
  },
  {
    "name": "Ripple Ice Cream",
    "description": "Creamy frozen dessert with a soft ripple of chocolate flavor.",
    "price": 14,
    "category": "Deserts",
    "image": "food_9.png",
    "stock": 24,
    "costPrice": 5.88,
    "ingredients": [
      {
        "name": "onion",
        "quantity": 3,
        "unit": "pcs"
      },
      {
        "name": "lettuce",
        "quantity": 2,
        "unit": "heads"
      }
    ]
  },
  {
    "name": "Fruit Ice Cream",
    "description": "A bright fruit blend made with tropical fruit and dairy.",
    "price": 22,
    "category": "Deserts",
    "image": "food_10.png",
    "stock": 17,
    "costPrice": 9.24,
    "ingredients": [
      {
        "name": "lettuce",
        "quantity": 1,
        "unit": "heads"
      },
      {
        "name": "chicken",
        "quantity": 1,
        "unit": "kg"
      }
    ]
  },
  {
    "name": "Jar Ice Cream",
    "description": "A chilled jar of velvety ice cream with a rich creamy texture.",
    "price": 10,
    "category": "Deserts",
    "image": "food_11.png",
    "stock": 21,
    "costPrice": 4.2,
    "ingredients": [
      {
        "name": "chicken",
        "quantity": 2,
        "unit": "kg"
      },
      {
        "name": "cheese",
        "quantity": 2,
        "unit": "kg"
      }
    ]
  },
  {
    "name": "Vanilla Ice Cream",
    "description": "Classic vanilla scoop made for comfort and sweetness.",
    "price": 12,
    "category": "Deserts",
    "image": "food_12.png",
    "stock": 30,
    "costPrice": 5.04,
    "ingredients": [
      {
        "name": "cheese",
        "quantity": 3,
        "unit": "kg"
      },
      {
        "name": "pasta",
        "quantity": 1,
        "unit": "kg"
      }
    ]
  },
  {
    "name": "Chicken Sandwich",
    "description": "Grilled chicken sandwich served with herbs and crisp pickles.",
    "price": 12,
    "category": "Sandwich",
    "image": "food_13.png",
    "stock": 25,
    "costPrice": 5.04,
    "ingredients": [
      {
        "name": "pasta",
        "quantity": 1,
        "unit": "kg"
      },
      {
        "name": "rice",
        "quantity": 2,
        "unit": "kg"
      }
    ]
  },
  {
    "name": "Vegan Sandwich",
    "description": "A hearty vegan sandwich packed with fresh veggies and spreads.",
    "price": 18,
    "category": "Sandwich",
    "image": "food_14.png",
    "stock": 13,
    "costPrice": 7.56,
    "ingredients": [
      {
        "name": "rice",
        "quantity": 2,
        "unit": "kg"
      },
      {
        "name": "tomato",
        "quantity": 1,
        "unit": "pcs"
      }
    ]
  },
  {
    "name": "Grilled Sandwich",
    "description": "Loaded with grilled vegetables and melted cheese goodness.",
    "price": 16,
    "category": "Sandwich",
    "image": "food_15.png",
    "stock": 18,
    "costPrice": 6.72,
    "ingredients": [
      {
        "name": "tomato",
        "quantity": 3,
        "unit": "pcs"
      },
      {
        "name": "onion",
        "quantity": 2,
        "unit": "pcs"
      }
    ]
  },
  {
    "name": "Bread Sandwich",
    "description": "Simple, satisfying sandwich with toasted bread and fillings.",
    "price": 24,
    "category": "Sandwich",
    "image": "food_16.png",
    "stock": 12,
    "costPrice": 10.08,
    "ingredients": [
      {
        "name": "onion",
        "quantity": 1,
        "unit": "pcs"
      },
      {
        "name": "lettuce",
        "quantity": 1,
        "unit": "heads"
      }
    ]
  },
  {
    "name": "Cup Cake",
    "description": "Soft sponge dessert topped with a sweet indulgent finish.",
    "price": 14,
    "category": "Cake",
    "image": "food_17.png",
    "stock": 28,
    "costPrice": 5.88,
    "ingredients": [
      {
        "name": "lettuce",
        "quantity": 2,
        "unit": "heads"
      },
      {
        "name": "chicken",
        "quantity": 2,
        "unit": "kg"
      }
    ]
  },
  {
    "name": "Vegan Cake",
    "description": "Plant-based cake with moisture and rich flavor in every bite.",
    "price": 12,
    "category": "Cake",
    "image": "food_18.png",
    "stock": 14,
    "costPrice": 5.04,
    "ingredients": [
      {
        "name": "chicken",
        "quantity": 3,
        "unit": "kg"
      },
      {
        "name": "cheese",
        "quantity": 1,
        "unit": "kg"
      }
    ]
  },
  {
    "name": "Butterscotch Cake",
    "description": "A warm butterscotch finish with a soft buttery crumb.",
    "price": 20,
    "category": "Cake",
    "image": "food_19.png",
    "stock": 15,
    "costPrice": 8.4,
    "ingredients": [
      {
        "name": "cheese",
        "quantity": 1,
        "unit": "kg"
      },
      {
        "name": "pasta",
        "quantity": 2,
        "unit": "kg"
      }
    ]
  },
  {
    "name": "Sliced Cake",
    "description": "A generous slice of fluffy cake layered with sweet cream.",
    "price": 15,
    "category": "Cake",
    "image": "food_20.png",
    "stock": 20,
    "costPrice": 6.3,
    "ingredients": [
      {
        "name": "pasta",
        "quantity": 2,
        "unit": "kg"
      },
      {
        "name": "rice",
        "quantity": 1,
        "unit": "kg"
      }
    ]
  },
  {
    "name": "Sushi Combo",
    "description": "A balanced sushi platter with rice, fish, and crisp sides.",
    "price": 18,
    "category": "Pasta",
    "image": "food_21.png",
    "stock": 11,
    "costPrice": 7.56,
    "ingredients": [
      {
        "name": "rice",
        "quantity": 3,
        "unit": "kg"
      },
      {
        "name": "tomato",
        "quantity": 2,
        "unit": "pcs"
      }
    ]
  },
  {
    "name": "Mushroom Pasta",
    "description": "Creamy pasta tossed with mushrooms, garlic, and herbs.",
    "price": 17,
    "category": "Pasta",
    "image": "food_22.png",
    "stock": 19,
    "costPrice": 7.14,
    "ingredients": [
      {
        "name": "tomato",
        "quantity": 1,
        "unit": "pcs"
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "pcs"
      }
    ]
  },
  {
    "name": "Tomato Pasta",
    "description": "Classic tomato pasta with basil, olive oil, and a rich finish.",
    "price": 19,
    "category": "Pasta",
    "image": "food_23.png",
    "stock": 18,
    "costPrice": 7.98,
    "ingredients": [
      {
        "name": "onion",
        "quantity": 2,
        "unit": "pcs"
      },
      {
        "name": "lettuce",
        "quantity": 2,
        "unit": "heads"
      }
    ]
  },
  {
    "name": "Spaghetti Delight",
    "description": "Italian-inspired spaghetti with bold sauce and savory toppings.",
    "price": 21,
    "category": "Pasta",
    "image": "food_24.png",
    "stock": 16,
    "costPrice": 8.82,
    "ingredients": [
      {
        "name": "lettuce",
        "quantity": 3,
        "unit": "heads"
      },
      {
        "name": "chicken",
        "quantity": 1,
        "unit": "kg"
      }
    ]
  },
  {
    "name": "Veg Noodles",
    "description": "Stir-fried noodles packed with color and crunch.",
    "price": 16,
    "category": "Noodles",
    "image": "food_25.png",
    "stock": 22,
    "costPrice": 6.72,
    "ingredients": [
      {
        "name": "chicken",
        "quantity": 1,
        "unit": "kg"
      },
      {
        "name": "cheese",
        "quantity": 2,
        "unit": "kg"
      }
    ]
  },
  {
    "name": "Sesame Noodles",
    "description": "Noodles with sesame notes and fresh, crisp vegetables.",
    "price": 18,
    "category": "Noodles",
    "image": "food_26.png",
    "stock": 17,
    "costPrice": 7.56,
    "ingredients": [
      {
        "name": "cheese",
        "quantity": 2,
        "unit": "kg"
      },
      {
        "name": "pasta",
        "quantity": 1,
        "unit": "kg"
      }
    ]
  },
  {
    "name": "Prawn Noodles",
    "description": "Savory noodles with succulent prawns and aromatic seasoning.",
    "price": 22,
    "category": "Noodles",
    "image": "food_27.png",
    "stock": 14,
    "costPrice": 9.24,
    "ingredients": [
      {
        "name": "pasta",
        "quantity": 3,
        "unit": "kg"
      },
      {
        "name": "rice",
        "quantity": 2,
        "unit": "kg"
      }
    ]
  },
  {
    "name": "Hot Noodles",
    "description": "A spicy noodle bowl with a kick and deep umami flavor.",
    "price": 20,
    "category": "Noodles",
    "image": "food_28.png",
    "stock": 19,
    "costPrice": 8.4,
    "ingredients": [
      {
        "name": "rice",
        "quantity": 1,
        "unit": "kg"
      },
      {
        "name": "tomato",
        "quantity": 1,
        "unit": "pcs"
      }
    ]
  },
  {
    "name": "Veg Bowl",
    "description": "A wholesome bowl of vegetables, grains, and fresh flavor.",
    "price": 17,
    "category": "Pure Veg",
    "image": "food_29.png",
    "stock": 24,
    "costPrice": 7.14,
    "ingredients": [
      {
        "name": "tomato",
        "quantity": 2,
        "unit": "pcs"
      },
      {
        "name": "onion",
        "quantity": 2,
        "unit": "pcs"
      }
    ]
  },
  {
    "name": "Green Feast",
    "description": "An herb-forward vegetarian platter full of vibrant ingredients.",
    "price": 20,
    "category": "Pure Veg",
    "image": "food_30.png",
    "stock": 15,
    "costPrice": 8.4,
    "ingredients": [
      {
        "name": "onion",
        "quantity": 3,
        "unit": "pcs"
      },
      {
        "name": "lettuce",
        "quantity": 1,
        "unit": "heads"
      }
    ]
  },
  {
    "name": "Garden Bowl",
    "description": "Fresh vegetables and grains blended into a comforting vegetarian dish.",
    "price": 16,
    "category": "Pure Veg",
    "image": "food_31.png",
    "stock": 23,
    "costPrice": 6.72,
    "ingredients": [
      {
        "name": "lettuce",
        "quantity": 1,
        "unit": "heads"
      },
      {
        "name": "chicken",
        "quantity": 2,
        "unit": "kg"
      }
    ]
  },
  {
    "name": "Pure Veg Wrap",
    "description": "A crispy, veggie-rich wrap with bright, zesty flavors.",
    "price": 15,
    "category": "Pure Veg",
    "image": "food_32.png",
    "stock": 21,
    "costPrice": 6.3,
    "ingredients": [
      {
        "name": "chicken",
        "quantity": 2,
        "unit": "kg"
      },
      {
        "name": "cheese",
        "quantity": 1,
        "unit": "kg"
      }
    ]
  }
]

module.exports = products
