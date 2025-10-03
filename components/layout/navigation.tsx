'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faClipboardList, 
  faUser, 
  faSignOutAlt, 
  faBars, 
  faTimes 
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { routeConfigs, type RouteKey } from '@/lib/router';

interface NavigationProps {
  currentRoute: RouteKey;
  onNavigate: (route: RouteKey) => void;
  onLogout: () => void;
}

export default function Navigation({ currentRoute, onNavigate, onLogout }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigate = (route: RouteKey) => {
    onNavigate(route);
    setIsMobileMenuOpen(false); // 關閉行動版選單
  };

  const getRouteIcon = (routeKey: RouteKey) => {
    switch (routeKey) {
      case 'work-order':
        return faClipboardList;
      case 'employees':
        return faUser;
      default:
        return faHome;
    }
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <FontAwesomeIcon icon={faHome} className="text-blue-600 text-xl mr-3" />
            <h1 className="text-xl font-semibold text-gray-900">
              AM 維護工作管理系統
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {routeConfigs.map((route) => (
              <Button
                key={route.key}
                variant={currentRoute === route.key ? "default" : "ghost"}
                onClick={() => handleNavigate(route.key)}
                className="flex items-center gap-2 transition-smooth"
              >
                <FontAwesomeIcon icon={getRouteIcon(route.key)} />
                {route.title}
              </Button>
            ))}
            
            <div className="w-px h-6 bg-gray-300 mx-2" />
            
            <Button
              variant="outline"
              onClick={onLogout}
              className="flex items-center gap-2 transition-smooth hover:bg-red-50 hover:border-red-200"
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
              登出
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="p-2"
            >
              <FontAwesomeIcon 
                icon={isMobileMenuOpen ? faTimes : faBars} 
                className="text-lg"
              />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <nav className="py-4 space-y-2">
              {routeConfigs.map((route) => (
                <Button
                  key={route.key}
                  variant={currentRoute === route.key ? "default" : "ghost"}
                  onClick={() => handleNavigate(route.key)}
                  className="w-full justify-start flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={getRouteIcon(route.key)} />
                  {route.title}
                </Button>
              ))}
              
              <div className="border-t pt-2 mt-2">
                <Button
                  variant="outline"
                  onClick={onLogout}
                  className="w-full justify-start flex items-center gap-2 hover:bg-red-50 hover:border-red-200"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} />
                  登出
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}