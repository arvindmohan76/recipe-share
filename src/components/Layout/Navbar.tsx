import React from 'react';
import { Menubar } from 'primereact/menubar';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const items = [
    {
      label: 'Home',
      icon: 'pi pi-home',
      command: () => navigate('/'),
    },
    {
      label: 'Recipes',
      icon: 'pi pi-book',
      command: () => navigate('/recipes'),
    },
    {
      label: 'Recommendations',
      icon: 'pi pi-lightbulb',
      command: () => navigate('/recommendations'),
    },
    {
      label: 'My Bookmarks',
      icon: 'pi pi-heart',
      command: () => navigate('/saved-recipes'),
    },
    {
      label: 'Collections',
      icon: 'pi pi-book',
      command: () => navigate('/collections'),
    },
    {
      label: 'Shopping Lists',
      icon: 'pi pi-shopping-cart',
      command: () => navigate('/shopping-lists'),
    },
  ];

  const start = (
    <div className="flex items-center gap-2">
      <i className="pi pi-apple text-2xl text-orange-500"></i>
      <span className="text-xl font-bold text-gray-800">RecipeHub</span>
    </div>
  );

  const end = (
    <div className="flex items-center gap-2">
      {user ? (
        <>
          <Button
            label="Create Recipe"
            icon="pi pi-plus"
            className="p-button-success mr-2"
            onClick={() => navigate('/recipes/new')}
          />
          <Avatar
            icon="pi pi-user"
            className="bg-blue-500 text-white cursor-pointer mr-2"
            onClick={() => navigate('/privacy-settings')}
          />
          <Button
            label="Sign Out"
            icon="pi pi-sign-out"
            className="p-button-text"
            onClick={handleSignOut}
          />
        </>
      ) : (
        <>
          <Button
            label="Sign In"
            icon="pi pi-sign-in"
            className="p-button-text mr-2"
            onClick={() => navigate('/auth')}
          />
          <Button
            label="Sign Up"
            icon="pi pi-user-plus"
            className="p-button-outlined"
            onClick={() => navigate('/auth?mode=signup')}
          />
        </>
      )}
    </div>
  );

  return (
    <div className="bg-white shadow-lg">
      <Menubar model={items} start={start} end={end} className="border-none" />
    </div>
  );
};

export default Navbar;