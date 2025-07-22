
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="flex-1 relative flex flex-col">
        <div
          className={cn(
            "fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden transition-opacity",
            sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={toggleSidebar}
        ></div>

        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
