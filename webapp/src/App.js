import './App.css';
import MealsList from './Mealslist';
import {BrowserRouter as Router, Route, Routes, Link} from 'react-router-dom'
import Dashboard from './Dashboard';
import FoodEntryForm from './FoodEntryForm';

function App() {
  return (
    <div>
    <Router>
      <nav>
      <Link to="/">Home</Link> | <Link to="/List">Meals</Link> | <Link to="/Form">Form</Link> | 
      </nav>
    <Routes>
      <Route path="/" element={<Dashboard/>}/>
      <Route path="/List" element={<MealsList/>}/>
      <Route path="/Form" element={<FoodEntryForm/>}/>
    </Routes>
    </Router>
    </div>
    
  );
}

export default App;