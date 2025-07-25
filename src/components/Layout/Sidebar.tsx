
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { CalendarDays, ChevronRight, Menu, MapPin, UtensilsCrossed, LogIn, ShoppingCart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import UserButton from "@/components/Auth/UserButton";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { name: "Meal Planner", path: "/", icon: CalendarDays },
    { name: "Recipes", path: "/suggested-meals", icon: UtensilsCrossed },
    { name: "Planned Runs", path: "/planned-runs", icon: MapPin },
    { name: "Shopping List", path: "/shopping-list", icon: ShoppingCart },
    ...(user ? [{ name: "Account", path: "/account", icon: Settings }] : []),
  ];

  return (
    <>
      <div className="fixed top-0 left-0 z-40 lg:hidden">
        <button
          onClick={toggleSidebar}
          className={cn(
            "p-4 text-gray-600 focus:outline-none transition-opacity duration-300",
            isScrolled ? "opacity-30" : "opacity-100"
          )}
        >
          <Menu size={24} />
        </button>
      </div>

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-teal-500 transition-transform transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:min-h-screen",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col min-h-screen p-3">
          <div className="flex items-center justify-between p-4">
            <Link to="/" className="text-white text-xl font-bold">
              RunBiteFit
            </Link>
            <button
              onClick={toggleSidebar}
              className="p-2 text-white rounded-md lg:hidden hover:bg-teal-600 focus:outline-none"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="mt-6 flex-1 space-y-1 px-3">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className={cn(
                  "flex items-center p-3 rounded-lg text-white hover:bg-teal-600 transition-colors",
                  location.pathname === item.path && "bg-teal-600"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            ))}
            
            {!user && (
              <Link
                to="/auth"
                className={cn(
                  "flex items-center p-3 rounded-lg text-white hover:bg-teal-600 transition-colors",
                  location.pathname === "/auth" && "bg-teal-600"
                )}
              >
                <LogIn className="mr-3 h-5 w-5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          <div className="p-4 mt-auto">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="text-white text-sm">
                  <CalendarDays className="mr-2 h-5 w-5 inline" />
                  {new Date().toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <UserButton />
              </div>
            ) : (
              <div className="flex items-center text-white">
                <CalendarDays className="mr-2 h-5 w-5" />
                <span className="text-sm">
                  {new Date().toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
