import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import db from "./firebase";  // Your Firebase config file
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

// Nutrition data for each food item
const foodNutrition = {
    Burger: { calories: 2.74, protein: 17.0 / 100, fat: 12.0 / 100, carbohydrates: 33.0 / 100 },
    Butter_Naan: { calories: 3.10, protein: 8.0 / 100, fat: 10.0 / 100, carbohydrates: 30.0 / 100 },
    Tea: { calories: 0.20, protein: 0.1 / 100, fat: 0.1 / 100, carbohydrates: 7.5 / 100 },
    Chapati: { calories: 1.68, protein: 3.0 / 100, fat: 0.5 / 100, carbohydrates: 15.0 / 100 },
    Chole_Bhature: { calories: 3.48, protein: 9.0 / 100, fat: 15.0 / 100, carbohydrates: 40.0 / 100 },
    Dal_Makhani: { calories: 1.60, protein: 9.0 / 100, fat: 6.0 / 100, carbohydrates: 20.0 / 100 },
    Dhokla: { calories: 1.25, protein: 4.0 / 100, fat: 1.5 / 100, carbohydrates: 22.0 / 100 },
    Fried_Rice: { calories: 1.60, protein: 3.0 / 100, fat: 6.0 / 100, carbohydrates: 26.0 / 100 },
    Idli: { calories: 1.04, protein: 2.5 / 100, fat: 0.3 / 100, carbohydrates: 18.0 / 100 },
    Jalebi: { calories: 3.40, protein: 1.0 / 100, fat: 5.0 / 100, carbohydrates: 50.0 / 100 },
    Kaathi_Rolls: { calories: 2.74, protein: 6.0 / 100, fat: 10.0 / 100, carbohydrates: 35.0 / 100 },
    Kadai_Paneer: { calories: 2.22, protein: 7.0 / 100, fat: 10.0 / 100, carbohydrates: 12.0 / 100 },
    Kulfi: { calories: 1.90, protein: 3.5 / 100, fat: 8.0 / 100, carbohydrates: 22.0 / 100 },
    Masala_Dosa: { calories: 1.68, protein: 3.0 / 100, fat: 7.0 / 100, carbohydrates: 30.0 / 100 },
    Momos: { calories: 1.75, protein: 6.0 / 100, fat: 5.0 / 100, carbohydrates: 20.0 / 100 },
    Paani_Puri: { calories: 3.60, protein: 3.0 / 100, fat: 10.0 / 100, carbohydrates: 35.0 / 100 },
    Pakode: { calories: 4.20, protein: 4.0 / 100, fat: 15.0 / 100, carbohydrates: 40.0 / 100 },
    Pav_Bhaji: { calories: 2.85, protein: 7.0 / 100, fat: 12.0 / 100, carbohydrates: 30.0 / 100 },
    Pizza: { calories: 2.95, protein: 11.0 / 100, fat: 10.0 / 100, carbohydrates: 40.0 / 100 },
    Samosa: { calories: 3.00, protein: 6.0 / 100, fat: 12.0 / 100, carbohydrates: 30.0 / 100 }
  };
  

function Dashboard() {
  const [mealsData, setMealsData] = useState([]);
  const [totalNutrition, setTotalNutrition] = useState({ protein: 0, fat: 0, carbohydrates: 0, calories: 0 });

  useEffect(() => {
    const mealsRef = ref(db, "meals");

    const unsubscribe = onValue(mealsRef, (snapshot) => {
      const data = snapshot.val();
      let nutrition = { protein: 0, fat: 0, carbohydrates: 0, calories: 0 };
      const mealList = [];

      for (const key in data) {
        const entry = data[key];
        const { food, weight } = entry;

        if (food in foodNutrition) {
          const nutritionData = foodNutrition[food];
          const mealCalories = (nutritionData.calories * weight);
          nutrition.calories += mealCalories;
          nutrition.protein += (nutritionData.protein * weight);
          nutrition.fat += (nutritionData.fat * weight);
          nutrition.carbohydrates += (nutritionData.carbohydrates * weight);

          mealList.push({
            date: key,
            food,
            weight,
            calories: mealCalories,
            protein: (nutritionData.protein * weight),
            fat: (nutritionData.fat * weight),
            carbohydrates: (nutritionData.carbohydrates * weight)
          });
        }
      }

      setMealsData(mealList);
      setTotalNutrition(nutrition);
    });

    return () => unsubscribe();
  }, []);

  // Bar Chart Data
  const barData = mealsData.map((meal) => ({
    name: meal.food,
    calories: meal.calories
  }));

  // Pie Chart Data
  const pieData = [
    { name: "Protein", value: totalNutrition.protein },
    { name: "Fat", value: totalNutrition.fat },
    { name: "Carbohydrates", value: totalNutrition.carbohydrates }
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h1>Nutrition Dashboard</h1>

      {/* Bar Chart for Calories */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={barData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="calories" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>

      <h2>Overall Nutritional Breakdown</h2>

      {/* Pie Chart for Protein, Fat, and Carbs */}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Legend />
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={70}
            label
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={['#ff8042', '#00C49F', '#0088FE'][index]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default Dashboard;
