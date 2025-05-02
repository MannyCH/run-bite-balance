
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { CalendarDays, ChevronRight, PieChart, Menu, Home, MapPin, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/", icon: Home },
    { name: "Planned Meals", path: "/planned-meals", icon: UtensilsCrossed },
    { name: "Past Meals", path: "/past-meals", icon: PieChart },
    { name: "Suggested Meals", path: "/suggested-meals", icon: UtensilsCrossed },
    { name: "Planned Runs", path: "/planned-runs", icon: MapPin },
  ];

  return (
    <>
      <div className="fixed top-0 left-0 z-40 lg:hidden">
        <button
          onClick={toggleSidebar}
          className="p-4 text-gray-600 focus:outline-none"
        >
          <Menu size={24} />
        </button>
      </div>

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-teal-500 transition-transform transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:h-screen",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full p-3">
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
          </div>

          <div className="p-4 mt-auto">
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
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
