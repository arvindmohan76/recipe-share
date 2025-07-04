import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Home from './components/Home/Home';
import AuthForm from './components/Auth/AuthForm';
import RecipeList from './components/Recipe/RecipeList';
import RecipeForm from './components/Recipe/RecipeForm';
import RecipeDetail from './components/Recipe/RecipeDetail';
import RecipeEdit from './components/Recipe/RecipeEdit';
import SavedRecipes from './components/Recipe/SavedRecipes';

// Import PrimeReact CSS
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<AuthForm />} />
            <Route path="/recipes" element={<RecipeList />} />
            <Route path="/recipes/new" element={<RecipeForm />} />
            <Route path="/recipes/:id/edit" element={<RecipeEdit />} />
            <Route path="/recipes/:id" element={<RecipeDetail />} />
            <Route path="/saved-recipes" element={<SavedRecipes />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;