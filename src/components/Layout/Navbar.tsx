import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { Sidebar } from 'primereact/sidebar';
import { Menu } from 'primereact/menu';
import { MenuItem } from 'primereact/menuitem';
import { MenuItemCommandEvent } from 'primereact/menuitem';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [sidebarVisible, setSidebarVisible] = useState(false); 
  const profileMenuRef = React.useRef<Menu>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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
  ];

  const handleNavClick = (command: () => void) => {
    command();
    setSidebarVisible(false);
  };

  const profileMenuItems: MenuItem[] = [
    {
      label: 'Privacy Settings',
      icon: 'pi pi-cog',
      command: (event: MenuItemCommandEvent) => {
        navigate('/privacy-settings');
        profileMenuRef.current?.hide(event.originalEvent);
      }
    },
    {
      label: 'My Profile',
      icon: 'pi pi-user',
      command: (event: MenuItemCommandEvent) => {
        navigate('/profile');
        profileMenuRef.current?.hide(event.originalEvent);
      }
    },
    {
      separator: true
    },
    {
      label: 'Sign Out',
      icon: 'pi pi-sign-out',
      command: (event: MenuItemCommandEvent) => {
        handleSignOut();
        profileMenuRef.current?.hide(event.originalEvent);
      }
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50 transition-colors duration-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <i className="pi pi-apple text-2xl text-orange-500"></i>
            <span className="text-xl font-bold text-gray-800 dark:text-gray-100">RecipeHub</span>
          </div>
          
          {/* Desktop Navigation - Hidden on mobile/tablet */}
          <div className="hidden lg:flex items-center justify-center flex-1 mx-8">
            <div className="flex items-center gap-2">
              {navigationItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.command}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200 text-sm font-medium"
                >
                  <i className={`${item.icon} text-sm`}></i>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <Button
              icon={isDarkMode ? 'pi pi-sun' : 'pi pi-moon'}
              className="p-button-text p-button-rounded"
              onClick={toggleDarkMode}
              tooltip={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              tooltipOptions={{ position: 'bottom' }}
            />
            
            {user ? (
              <>
                {/* Create Recipe Button */}
                <Button
                  label="Create Recipe"
                  icon="pi pi-plus"
                  className="hidden md:flex p-button-success"
                  onClick={() => navigate('/recipes/new')}
                />
                <Button
                  icon="pi pi-plus"
                  className="md:hidden p-button-success"
                  onClick={() => navigate('/recipes/new')}
                />
                
                {/* User Avatar with Profile Menu */}
                <div className="relative">
                  <Avatar
                    icon="pi pi-user"
                    className="bg-blue-500 dark:bg-blue-600 text-white cursor-pointer hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors w-10 h-10"
                    onClick={(e) => {
                      e.preventDefault();
                      profileMenuRef.current?.toggle(e);
                    }}
                  />
                  <Menu
                    ref={profileMenuRef}
                    model={profileMenuItems}
                    popup
                    className="profile-menu dark:bg-gray-800"
                  />
                </div>
              </>
            ) : (
              <>
                <Button
                  label="Sign In" 
                  icon="pi pi-sign-in"
                  className="p-button-text hidden md:flex"
                  onClick={() => navigate('/auth')}
                />
                <Button
                  label="Sign Up"
                  icon="pi pi-user-plus"
                  className="p-button-outlined hidden md:flex"
                  onClick={() => navigate('/auth?mode=signup')}
                />
                <Button
                  icon="pi pi-sign-in"
                  className="p-button-text md:hidden"
                  onClick={() => navigate('/auth')}
                />
              </>
            )}
          </div>
          
          {/* Mobile Menu Button - Only show on smaller screens */}
          <div className="lg:hidden ml-2">
            <Button
              icon="pi pi-bars"
              className="p-button-text"
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
        style={{ width: '300px' }}
        className="dark:bg-gray-800"
      >
        <div className="p-4 dark:bg-gray-800">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <i className="pi pi-apple text-2xl text-orange-500"></i>
            <span className="text-xl font-bold text-gray-800 dark:text-gray-100">RecipeHub</span>
          </div>
          
          <div className="space-y-2">
            {/* Dark Mode Toggle for Mobile */}
            <button
              onClick={() => {
                toggleDarkMode();
                setSidebarVisible(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              <i className={`${isDarkMode ? 'pi pi-sun' : 'pi pi-moon'} text-lg`}></i>
              <span className="font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            
            {navigationItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleNavClick(item.command)}
                className="flex items-center gap-3 w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <i className={`${item.icon} text-lg`}></i>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
          
          {user && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleNavClick(() => {
                  navigate('/privacy-settings');
                })}
                className="flex items-center gap-3 w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <i className="pi pi-cog text-lg"></i>
                <span className="font-medium">Settings</span>
              </button>
              <button
                onClick={() => handleNavClick(handleSignOut)}
                className="flex items-center gap-3 w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
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