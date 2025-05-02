
import { Meal, Run, Recipe } from "../context/AppContext";
import { addDays, subDays } from "date-fns";

// Generate past dates and future dates
const today = new Date();
const yesterday = subDays(today, 1);
const twoDaysAgo = subDays(today, 2);
const threeDaysAgo = subDays(today, 3);
const tomorrow = addDays(today, 1);
const dayAfterTomorrow = addDays(today, 2);
const threeDaysFromNow = addDays(today, 3);

// Mock Meals Data
export const mockMeals: Meal[] = [
  {
    id: "m1",
    title: "Oatmeal with Berries",
    date: new Date(today.setHours(8, 0, 0, 0)),
    calories: 350,
    protein: 12,
    carbs: 60,
    fat: 7,
    isPlanned: false,
    imgUrl: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fG9hdG1lYWx8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60"
  },
  {
    id: "m2",
    title: "Grilled Chicken Salad",
    date: new Date(today.setHours(13, 0, 0, 0)),
    calories: 450,
    protein: 40,
    carbs: 20,
    fat: 15,
    isPlanned: false,
    imgUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2960&q=80"
  },
  {
    id: "m3",
    title: "Salmon with Asparagus",
    date: new Date(today.setHours(19, 0, 0, 0)),
    calories: 520,
    protein: 45,
    carbs: 15,
    fat: 28,
    isPlanned: false,
    imgUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2787&q=80"
  },
  {
    id: "m4",
    title: "Protein Smoothie",
    date: new Date(yesterday.setHours(10, 0, 0, 0)),
    calories: 300,
    protein: 30,
    carbs: 30,
    fat: 5,
    isPlanned: false,
    imgUrl: "https://images.unsplash.com/photo-1553530666-ba11a90bb212?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2835&q=80"
  },
  {
    id: "m5",
    title: "Turkey Sandwich",
    date: new Date(yesterday.setHours(14, 0, 0, 0)),
    calories: 400,
    protein: 35,
    carbs: 40,
    fat: 12,
    isPlanned: false,
    imgUrl: "https://images.unsplash.com/photo-1553909489-cd47e0907980?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c2FuZHdpY2h8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60"
  },
  {
    id: "m6",
    title: "Pasta with Meat Sauce",
    date: new Date(tomorrow.setHours(19, 0, 0, 0)),
    calories: 650,
    protein: 30,
    carbs: 90,
    fat: 20,
    isPlanned: true,
    imgUrl: "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80"
  },
  {
    id: "m7",
    title: "Pancakes with Maple Syrup",
    date: new Date(tomorrow.setHours(9, 0, 0, 0)),
    calories: 550,
    protein: 15,
    carbs: 100,
    fat: 10,
    isPlanned: true,
    imgUrl: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2864&q=80"
  },
  {
    id: "m8",
    title: "Veggie Stir Fry",
    date: new Date(dayAfterTomorrow.setHours(18, 30, 0, 0)),
    calories: 380,
    protein: 20,
    carbs: 45,
    fat: 12,
    isPlanned: true,
    imgUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHZlZ2dpZXN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60"
  }
];

// Mock Runs Data
export const mockRuns: Run[] = [
  {
    id: "r1",
    title: "Morning Jog",
    date: new Date(twoDaysAgo.setHours(7, 0, 0, 0)),
    distance: 5.2,
    duration: 28 * 60, // 28 minutes in seconds
    pace: 5.38, // minutes per km
    isPlanned: false,
    route: "Neighborhood Loop",
    imgUrl: "https://images.unsplash.com/photo-1502224562085-639556fd97a6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cnVubmluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60"
  },
  {
    id: "r2",
    title: "Tempo Run",
    date: new Date(yesterday.setHours(18, 0, 0, 0)),
    distance: 8.0,
    duration: 40 * 60, // 40 minutes in seconds
    pace: 5.0, // minutes per km
    isPlanned: false,
    route: "Riverside Path",
    imgUrl: "https://images.unsplash.com/photo-1540539234-c14a20fb7c7b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2787&q=80"
  },
  {
    id: "r3",
    title: "Recovery Run",
    date: new Date(today.setHours(9, 0, 0, 0)),
    distance: 3.5,
    duration: 25 * 60, // 25 minutes in seconds
    pace: 7.14, // minutes per km
    isPlanned: true,
    route: "Park Loop",
    imgUrl: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80"
  },
  {
    id: "r4",
    title: "Long Run",
    date: new Date(dayAfterTomorrow.setHours(8, 0, 0, 0)),
    distance: 15.0,
    duration: 90 * 60, // 90 minutes in seconds
    pace: 6.0, // minutes per km
    isPlanned: true,
    route: "Forest Trail",
    imgUrl: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80"
  },
  {
    id: "r5",
    title: "Intervals",
    date: new Date(threeDaysFromNow.setHours(17, 30, 0, 0)),
    distance: 6.0,
    duration: 35 * 60, // 35 minutes in seconds
    pace: 5.83, // minutes per km
    isPlanned: true,
    route: "Track",
    imgUrl: "https://images.unsplash.com/photo-1658243914896-e21dc2f90566?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fHJ1bm5pbmclMjB0cmFja3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60"
  }
];

// Mock Recipes from "RecipeChef"
export const mockRecipes: Recipe[] = [
  {
    id: "rc1",
    title: "Greek Yogurt Protein Bowl",
    calories: 380,
    protein: 25,
    carbs: 40,
    fat: 12,
    imgUrl: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzN8fGhlYWx0aHklMjBmb29kfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60",
    ingredients: [
      "1 cup Greek yogurt", 
      "1/4 cup granola", 
      "1 tbsp honey", 
      "1/2 cup berries", 
      "1 tbsp chia seeds"
    ]
  },
  {
    id: "rc2",
    title: "Quinoa Power Salad",
    calories: 420,
    protein: 15,
    carbs: 60,
    fat: 16,
    imgUrl: "https://images.unsplash.com/photo-1529059997568-3e58c9a079a7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80",
    ingredients: [
      "1 cup cooked quinoa", 
      "2 cups mixed greens", 
      "1/4 cup feta cheese", 
      "1/4 cup chopped walnuts", 
      "1/2 avocado",
      "2 tbsp olive oil",
      "1 tbsp lemon juice"
    ]
  },
  {
    id: "rc3",
    title: "Grilled Salmon with Sweet Potato",
    calories: 480,
    protein: 32,
    carbs: 30,
    fat: 25,
    imgUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80",
    ingredients: [
      "6 oz salmon fillet", 
      "1 medium sweet potato", 
      "1 tbsp olive oil", 
      "1/2 lemon", 
      "2 cups spinach",
      "1 clove garlic",
      "Salt and pepper to taste"
    ]
  },
  {
    id: "rc4",
    title: "Runner's Pre-Race Pasta",
    calories: 550,
    protein: 20,
    carbs: 95,
    fat: 10,
    imgUrl: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80",
    ingredients: [
      "2 cups whole wheat pasta", 
      "1/2 cup tomato sauce", 
      "2 tbsp olive oil", 
      "2 cloves garlic", 
      "1/4 cup grated parmesan cheese",
      "Fresh basil leaves",
      "Salt and pepper to taste"
    ]
  },
  {
    id: "rc5",
    title: "Post-Run Recovery Smoothie",
    calories: 320,
    protein: 24,
    carbs: 45,
    fat: 6,
    imgUrl: "https://images.unsplash.com/photo-1553530666-ba11a90bb212?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2835&q=80",
    ingredients: [
      "1 banana", 
      "1 cup almond milk", 
      "1 scoop protein powder", 
      "1/2 cup frozen berries", 
      "1 tbsp peanut butter",
      "1 tbsp chia seeds"
    ]
  },
  {
    id: "rc6",
    title: "High-Protein Chicken Bowl",
    calories: 550,
    protein: 45,
    carbs: 40,
    fat: 20,
    imgUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjR8fGNoaWNrZW4lMjBtZWFsfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60",
    ingredients: [
      "6 oz grilled chicken breast", 
      "1 cup brown rice", 
      "1 cup roasted vegetables", 
      "1/2 avocado", 
      "2 tbsp tahini sauce",
      "Lemon wedge",
      "Salt and pepper to taste"
    ]
  }
];
