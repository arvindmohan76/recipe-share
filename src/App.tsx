import React from 'react';
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrimeReact from 'primereact/api';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Home from './components/Home/Home';
import AuthForm from './components/Auth/AuthForm';
import RecipeList from './components/Recipe/RecipeList';
import RecipeForm from './components/Recipe/RecipeForm';
import RecipeDetail from './components/Recipe/RecipeDetail';
import RecipeEdit from './components/Recipe/RecipeEdit';
import SavedRecipes from './components/Recipe/SavedRecipes';
import RecommendedRecipes from './components/Recipe/RecommendedRecipes';
import PrivacySettings from './components/Privacy/PrivacySettings';
import RecipeListWithHistory from './components/Recipe/RecipeListWithHistory';
import ShoppingListManager from './components/ShoppingList/ShoppingListManager';
import RecipeCollections from './components/Collections/RecipeCollections';

// Import PrimeReact CSS
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

function App() {
  useEffect(() => {
    PrimeReact.ripple = true;
    PrimeReact.autoZIndex = true;
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<AuthForm />} />
            <Route path="/recipes" element={<RecipeListWithHistory />} />
            <Route path="/recipes/new" element={<RecipeForm />} />
            <Route path="/recipes/:id/edit" element={<RecipeEdit />} />
            <Route path="/recipes/:id" element={<RecipeDetail />} />
            <Route path="/saved-recipes" element={<SavedRecipes />} />
            <Route path="/recommendations" element={<RecommendedRecipes />} />
            <Route path="/privacy-settings" element={<PrivacySettings />} />
            <Route path="/shopping-lists" element={<ShoppingListManager />} />
            <Route path="/collections" element={<RecipeCollections />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;