import React, { useEffect, useState } from "react";
import { ref, onValue} from "firebase/database";
import db from "./firebase";
import Papa from "papaparse"; // Importing PapaParse for CSV conversion
import './Mealslist.css'

const foodNutrition = {
  Burger: { calories: 2.57, protein: 17.0, fat: 12.0, carbohydrates: 33.0 },
  Butter_Naan: { calories: 3.00, protein: 8.0, fat: 10.0, carbohydrates: 30.0 },
  Tea: { calories: 0.30, protein: 0.1, fat: 0.1, carbohydrates: 7.5 },
  Chapati: { calories: 0.33, protein: 9.0, fat: 0.5, carbohydrates: 15.0 },
  Chole_Bhature: { calories: 3.29, protein: 9.0, fat: 15.0, carbohydrates: 40.0 },
  Dal_Makhani: { calories: 1.74, protein: 9.0, fat: 6.0, carbohydrates: 20.0 },
  Dhokla: { calories: 1.11, protein: 4.0, fat: 1.5, carbohydrates: 22.0 },
  Fried_Rice: { calories: 1.30, protein: 3.0, fat: 6.0, carbohydrates: 26.0 },
  Idli: { calories: 0.90, protein: 2.5, fat: 0.3, carbohydrates: 18.0 },
  Jalebi: { calories: 3.00, protein: 1.0, fat: 5.0, carbohydrates: 50.0 },
  Kaathi_Rolls: { calories: 2.50, protein: 6.0, fat: 10.0, carbohydrates: 35.0 },
  Kadai_Paneer: { calories: 1.50, protein: 7.0, fat: 10.0, carbohydrates: 12.0 },
  Kulfi: { calories: 1.70, protein: 3.5, fat: 8.0, carbohydrates: 22.0 },
  Masala_Dosa: { calories: 1.60, protein: 3.0, fat: 7.0, carbohydrates: 30.0 },
  Momos: { calories: 1.40, protein: 6.0, fat: 5.0, carbohydrates: 20.0 },
  Paani_Puri: { calories: 3.17, protein: 3.0, fat: 10.0, carbohydrates: 35.0 },
  Pakode: { calories: 3.75, protein: 4.0, fat: 15.0, carbohydrates: 40.0 },
  Pav_Bhaji: { calories: 2.60, protein: 7.0, fat: 12.0, carbohydrates: 30.0 },
  Pizza: { calories: 2.66, protein: 11.0, fat: 10.0, carbohydrates: 40.0 },
  Samosa: { calories: 2.50, protein: 6.0, fat: 12.0, carbohydrates: 30.0 }
};

function MealsList() {
  const [meals, setMeals] = useState([]);

  useEffect(() => {
    const mealsRef = ref(db, "meals");

    const unsubscribe = onValue(mealsRef, (snapshot) => {
      const data = snapshot.val();
      const mealsList = [];

      for (const key in data) {
        const entry = data[key];
        const { food, weight } = entry;

        if (food in foodNutrition) {
          const nutrition = foodNutrition[food];
          mealsList.push({
            date: key,
            food,
            weight,
            calories: (nutrition.calories * weight),
            protein: (nutrition.protein * weight) ,
            fat: (nutrition.fat * weight) ,
            carbohydrates: (nutrition.carbohydrates * weight) 
          });
        }
      }

      setMeals(mealsList);
    });

    return () => unsubscribe();
  }, []);

    // Function to download the meals data as CSV
    const downloadCSV = () => {
      const csv = Papa.unparse(
        meals.map((meal) => ({
          Date: meal.date,
          Food: meal.food,
          Weight: meal.weight,
          Calories: meal.calories.toFixed(2),
          Protein: meal.protein.toFixed(2),
          Fat: meal.fat.toFixed(2),
          Carbohydrates: meal.carbohydrates.toFixed(2),
        }))
      );
  
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "meals.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

  return (
    <div>
      <h1>Meals List</h1>
      <button onClick={downloadCSV}>Download as CSV</button>
      <ul>
        {meals.map((meal, index) => (
          <li key={index}>
            <p>Date: {meal.date}</p>
            <p>Food: {meal.food}</p>
            <p>Weight: {meal.weight}g</p>
            <p>Protein: {meal.protein.toFixed(2)}g</p>
            <p>Fat: {meal.fat.toFixed(2)}g</p>
            <p>Carbohydrates: {meal.carbohydrates.toFixed(2)}g</p>
            <p>Calories: {meal.calories.toFixed(2)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MealsList;
