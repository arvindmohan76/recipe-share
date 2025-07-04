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
            className="p-button-success p-button-outlined mr-2"
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
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          {/* Logo/Brand */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <i className="pi pi-apple text-2xl text-orange-500"></i>
            <span className="text-xl font-bold text-gray-800">RecipeHub</span>
          </div>
          
          {/* Center Navigation */}
          <div className="hidden lg:flex items-center justify-center flex-1 mx-8">
            <div className="flex items-center gap-4">
              {items.map((item, index) => (
                <button
                  key={index}
                  onClick={item.command}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200 whitespace-nowrap"
                >
                  <i className={item.icon}></i>
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Right Side Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {user ? (
              <>
                <Button
                  label="Create"
                  icon="pi pi-plus"
                  className="p-button-success p-button-sm"
                  onClick={() => navigate('/recipes/new')}
                />
                <Avatar
                  icon="pi pi-user"
                  className="bg-blue-500 text-white cursor-pointer"
                  size="normal"
                  onClick={() => navigate('/privacy-settings')}
                />
                <Button
                  label="Logout"
                  icon="pi pi-sign-out"
                  className="p-button-text p-button-sm"
                  onClick={handleSignOut}
                />
              </>
            ) : (
              <>
                <Button
                  label="Login"
                  icon="pi pi-sign-in"
                  className="p-button-text p-button-sm"
                  onClick={() => navigate('/auth')}
                />
                <Button
                  label="Register"
                  icon="pi pi-user-plus"
                  className="p-button-outlined p-button-sm"
                  onClick={() => navigate('/auth?mode=signup')}
                />
              </>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <div className="lg:hidden ml-2">
            <Button
              icon="pi pi-bars"
              className="p-button-text p-button-sm"
              onClick={() => {/* Add mobile menu toggle */}}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;