import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { Sidebar } from 'primereact/sidebar';
import { Menu } from 'primereact/menu';
import { MenuItem } from 'primereact/menuitem';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const profileMenuRef = React.useRef<Menu>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setProfileMenuVisible(false);
  };

  const navigationItems = [
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
      icon: 'pi pi-folder',
      command: () => navigate('/collections'),
    },
    {
      label: 'Shopping Lists',
      icon: 'pi pi-shopping-cart',
      command: () => navigate('/shopping-lists'),
    },
  ];

  const handleNavClick = (command: () => void) => {
    command();
    setSidebarVisible(false);
  };

  const profileMenuItems: MenuItem[] = [
    {
      label: 'Privacy Settings',
      icon: 'pi pi-cog',
      command: () => {
        navigate('/privacy-settings');
        setProfileMenuVisible(false);
      }
    },
    {
      label: 'My Profile',
      icon: 'pi pi-user',
      command: () => {
        // Placeholder for future profile page
        setProfileMenuVisible(false);
      }
    },
    {
      separator: true
    },
    {
      label: 'Sign Out',
      icon: 'pi pi-sign-out',
      command: handleSignOut
    }
  ];

  return (
    <div className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo/Brand */}
          <div 
            className="flex items-center gap-2 flex-shrink-0 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <i className="pi pi-apple text-2xl text-orange-500"></i>
            <span className="text-xl font-bold text-gray-800">RecipeHub</span>
          </div>
          
          {/* Desktop Navigation - Hidden on mobile/tablet */}
          <div className="hidden xl:flex items-center justify-center flex-1 mx-8">
            <div className="flex items-center gap-1">
              {navigationItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.command}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200 whitespace-nowrap text-sm font-medium"
                >
                  <i className={`${item.icon} text-sm`}></i>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Right Side Actions */}
          <div className="navbar-end">
            {user ? (
              <>
                {/* Create Recipe Button - Fixed color contrast */}
                <Button
                  label="Create Recipe"
                  icon="pi pi-plus"
                  className="hidden lg:flex p-button-success"
                  onClick={() => navigate('/recipes/new')}
                />
                <Button
                  icon="pi pi-plus"
                  className="lg:hidden p-button-success p-button-sm"
                  onClick={() => navigate('/recipes/new')}
                />
                
                {/* User Avatar with Profile Menu */}
                <div className="relative">
                  <Avatar
                    icon="pi pi-user"
                    className="bg-blue-500 text-white cursor-pointer hover:bg-blue-600 transition-colors"
                    size="normal"
                    onClick={(e) => {
                      e.preventDefault();
                      profileMenuRef.current?.toggle(e);
                    }}
                  />
                  <Menu
                    ref={profileMenuRef}
                    model={profileMenuItems}
                    popup
                    className="profile-menu"
                  />
                </div>
              </>
            ) : (
              <>
                <Button
                  label="Sign In"
                  icon="pi pi-sign-in"
                  className="p-button-text p-button-sm hidden lg:flex"
                  onClick={() => navigate('/auth')}
                />
                <Button
                  label="Sign Up"
                  icon="pi pi-user-plus"
                  className="p-button-outlined p-button-sm hidden lg:flex"
                  onClick={() => navigate('/auth?mode=signup')}
                />
                <Button
                  icon="pi pi-sign-in"
                  className="p-button-text p-button-sm lg:hidden"
                  onClick={() => navigate('/auth')}
                />
              </>
            )}
          </div>
          
          {/* Mobile Menu Button - Only show on smaller screens */}
          <div className="xl:hidden ml-2">
            <Button
              icon="pi pi-bars"
              className="p-button-text p-button-sm"
              onClick={() => setSidebarVisible(true)}
            />
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sidebar 
        visible={sidebarVisible} 
        onHide={() => setSidebarVisible(false)}
        position="right"
        className="w-80"
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
            <i className="pi pi-apple text-2xl text-orange-500"></i>
            <span className="text-xl font-bold text-gray-800">RecipeHub</span>
          </div>
          
          <div className="space-y-2">
            {navigationItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleNavClick(item.command)}
                className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 text-left"
              >
                <i className={`${item.icon} text-lg`}></i>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
          
          {user && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleNavClick(() => {
                  navigate('/privacy-settings');
                })}
                className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 text-left"
              >
                <i className="pi pi-cog text-lg"></i>
                <span className="font-medium">Settings</span>
              </button>
              <button
                onClick={() => handleNavClick(handleSignOut)}
                className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 text-left"
              >
                <i className="pi pi-sign-out text-lg"></i>
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </Sidebar>
    </div>
  );
};

export default Navbar;