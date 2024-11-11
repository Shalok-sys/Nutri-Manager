import React, { useState, useEffect } from 'react';
import { ref, get, update } from 'firebase/database';
import db from './firebase';  // Firebase configuration

const FoodEntryForm = ({ onAddFood }) => {
  const [foodClass, setFoodClass] = useState('');
  const [weight, setWeight] = useState('');
  const [latestEntryKey, setLatestEntryKey] = useState('');

  // Fetch the latest entry from Firebase
  useEffect(() => {
    const mealsRef = ref(db, 'meals');
    get(mealsRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const latestKey = Object.keys(data).pop(); // Get the latest entry
          setLatestEntryKey(latestKey);
          setFoodClass(data[latestKey].food);
          setWeight(data[latestKey].weight);
        }
      })
      .catch((error) => {
        console.error('Error fetching latest food entry:', error);
      });
  }, []);

  const handleFoodClassChange = (event) => {
    setFoodClass(event.target.value);
  };

  const handleWeightChange = (event) => {
    setWeight(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (foodClass && weight) {
      // If there's a latest entry, update the food class and keep the weight the same
      const mealUpdate = {
        food: foodClass,
        weight: parseFloat(weight),  // Keep the same weight
      };

      const mealRef = ref(db, 'meals/' + latestEntryKey);
      update(mealRef, mealUpdate)
        .then(() => {
          console.log('Food class updated successfully');
          setFoodClass('');  // Reset input fields
          setWeight('');
        })
        .catch((error) => {
          console.error('Error updating food class:', error);
        });
    }
  };

  return (
    <div className="food-entry-form">
      <h2>Edit Latest Food Entry</h2>
      {latestEntryKey ? (
        <form onSubmit={handleSubmit}>
          <div>
            <label>Food Class: </label>
            <input 
              type="text" 
              value={foodClass} 
              onChange={handleFoodClassChange} 
              placeholder="e.g., apple, banana" 
            />
          </div>
          <br />
          <div>
            <label>Weight (g): </label>
            <input 
              type="number" 
              value={weight} 
              onChange={handleWeightChange} 
              placeholder="e.g., 150" 
              min="1" 
              disabled 
            />
          </div>
          <button type="submit">Update Food</button>
        </form>
      ) : (
        <p>Loading the latest food entry...</p>
      )}
    </div>
  );
};

export default FoodEntryForm;
