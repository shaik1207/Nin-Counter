import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  CheckCircle,
  Utensils,
  X
} from "lucide-react";
import { apiCall } from "../utils/api";

// Accept mobile state from parent
const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  // --- LIVE DATA POLLING ---
  const fetchPendingCount = async () => {
    try {
      const response = await apiCall("/admin/orders", { method: "GET" });
      // Count only active orders (not delivered, not cancelled)
      const activeOrders = response.data.filter(o => 
        o.status?.toLowerCase() !== 'delivered' && 
        o.status?.toLowerCase() !== 'cancelled'
      );
      setPendingCount(activeOrders.length);
    } catch (error) {
      console.warn("Sidebar failed to sync live orders");
    }
  };

  // Poll every 10 seconds to keep the badge perfectly synchronized with the other pages
  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { 
      name: "Pending Orders", 
      path: "/orders/pending", 
      icon: ClipboardList, 
      // Only show the badge if there is actually 1 or more pending orders
      badge: pendingCount > 0 ? pendingCount : null 
    },
    { name: "Served Orders", path: "/orders/served", icon: CheckCircle },
    { name: "Menu", path: "/reports", icon: Utensils },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-[#003B73]/20 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 min-h-screen w-64 flex flex-col bg-white/95 backdrop-blur-2xl border-r border-gray-100 shadow-[4px_0_30px_rgba(0,0,0,0.03)] z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* ICMR Logo Area */}
        <div className="relative p-6 flex flex-col items-center justify-center border-b border-gray-100/50 bg-gradient-to-b from-transparent to-blue-50/20 h-32">
          
          {/* Close Button (Mobile Only) */}
          <button 
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 lg:hidden p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors active:scale-90"
          >
            <X size={20} />
          </button>

          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPiNSbuYSZ62cptiCwUBXIQOxaQe7Lv2SkKA&s"
            alt="ICMR Logo"
            className="h-14 w-auto mb-2 mix-blend-multiply"
          />
          <div className="text-xs font-black tracking-widest text-[#003B73] uppercase mt-1">
            NIN Canteen
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.includes(item.path);

            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileOpen(false)} // Auto-close on mobile when a link is clicked
                className={`relative flex items-center justify-start p-3 rounded-2xl transition-all duration-300 group active:scale-[0.96] ${
                  isActive
                    ? "bg-blue-50 text-[#003B73] shadow-[0_4px_12px_rgba(0,59,115,0.06)] border border-blue-100/50"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent"
                }`}
              >
                {/* Icon */}
                <div className={`transition-transform duration-300 ${!isActive && "group-hover:scale-110 group-hover:-translate-y-0.5"}`}>
                  <Icon size={22} className={isActive ? "text-[#003B73]" : "text-gray-400"} strokeWidth={isActive ? 2.5 : 2} />
                </div>

                {/* Text Label */}
                <span className="ml-4 text-sm font-semibold whitespace-nowrap">
                  {item.name}
                </span>

                {/* Notification Badge */}
                {item.badge && (
                  <div className="absolute right-3">
                    <span 
                      className={`flex items-center justify-center rounded-full font-bold shadow-sm px-2 py-0.5 text-xs ${
                        isActive ? "bg-blue-200 text-[#003B73]" : "bg-red-100 text-red-600"
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;