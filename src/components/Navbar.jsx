import React, { useState, useEffect, useRef } from "react";
import { 
  Bell, User, Settings, LogOut, ChevronDown, 
  Menu, Zap, BellRing, Package, CheckCircle2 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiCall } from "../utils/api";

const Navbar = ({ servedCount = 0, onMenuClick }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // --- NOTIFICATION & LIVE ORDER STATE ---
  const [pendingCount, setPendingCount] = useState(0);
  const [knownOrderIds, setKnownOrderIds] = useState(new Set());
  const [newOrderAlert, setNewOrderAlert] = useState({ show: false, orderId: "" });

  const terminalName = localStorage.getItem("userName") || "Counter Staff";

  // --- CLOSE DROPDOWN ON OUTSIDE CLICK ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- ACTIONS ---
  const handleSettingsClick = () => {
    setIsProfileOpen(false);
    navigate("/settings"); 
  };

  const handleLogout = () => {
    setIsProfileOpen(false);
    // Securely clear all terminal session data
    localStorage.removeItem("authToken");
    localStorage.removeItem("isAuth");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    localStorage.removeItem("employeeId");
    
    // Route back to the secure login portal
    navigate("/");
  };

  // --- LIVE NOTIFICATION ENGINE ---
  useEffect(() => {
    let isInitialLoad = true;

    const checkForNewOrders = async () => {
      try {
        const response = await apiCall("/admin/orders", { method: "GET" });
        const activeOrders = response.data.filter(o => 
          o.status?.toLowerCase() === 'pending' || 
          o.status?.toLowerCase() === 'preparing'
        );

        setPendingCount(activeOrders.length);
        const currentIds = new Set(activeOrders.map(o => o.orderId || o.id));

        // If it's not the first load, check if there are new IDs we haven't seen before
        if (!isInitialLoad) {
          const newOrder = activeOrders.find(o => !knownOrderIds.has(o.orderId || o.id));
          
          if (newOrder) {
            const displayId = String(newOrder.orderId || newOrder.id).substring(0,8).toUpperCase();
            
            // Trigger Visual Popup
            setNewOrderAlert({ show: true, orderId: displayId });
            
            // Trigger Audio Notification (Chime)
            try {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.play().catch(() => console.log("Audio autoplay blocked by browser"));
            } catch (e) {}

            // Auto-hide popup after 5 seconds
            setTimeout(() => setNewOrderAlert({ show: false, orderId: "" }), 5000);
          }
        }

        setKnownOrderIds(currentIds);
        isInitialLoad = false;
      } catch (error) {
        console.warn("Live notification polling failed");
      }
    };

    checkForNewOrders();
    const interval = setInterval(checkForNewOrders, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [knownOrderIds]);

  return (
    <div className="w-full px-4 pt-4 pb-2 z-[900] relative">
      
      {/* ================= NEW ORDER POPUP ALERT ================= */}
      <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        newOrderAlert.show ? "translate-y-0 opacity-100 scale-100" : "-translate-y-24 opacity-0 scale-90 pointer-events-none"
      }`}>
        <div className="bg-[#1C1C1E] backdrop-blur-3xl border border-gray-700 shadow-[0_30px_60px_rgba(0,0,0,0.4)] rounded-[2rem] p-2 pr-6 flex items-center gap-4 cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate('/orders/pending')}>
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center shadow-inner relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-white/20 animate-ping rounded-full"></div>
            <BellRing size={22} className="text-white relative z-10 animate-bounce" />
          </div>
          <div>
            <h3 className="text-white font-black text-sm tracking-wide flex items-center gap-2">
              NEW ORDER RECEIVED <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            </h3>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-0.5">
              Docket: <span className="text-emerald-400">{newOrderAlert.orderId}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ================= DYNAMIC ISLAND NAVBAR ================= */}
      <header className="mx-auto max-w-7xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.06)] rounded-[2.5rem] flex items-center justify-between px-3 lg:px-5 py-2.5 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]">
        
        {/* LEFT: Menu & Logo */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onMenuClick} 
            className="lg:hidden p-2.5 bg-gray-100/50 hover:bg-gray-200/60 rounded-full transition-all active:scale-90"
          >
            <Menu size={18} className="text-gray-700" />
          </button>
          
          <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#003B73] to-blue-600 shadow-[0_2px_10px_rgba(0,59,115,0.2)] border border-blue-100">
            <Zap size={18} className="text-white fill-white" />
          </div>
          
          <div className="flex flex-col ml-1 lg:ml-2">
            <h1 className="text-sm lg:text-base font-bold tracking-wide text-gray-900">
              SmartCanteen
            </h1>
            <p className="text-[9px] text-[#003B73] uppercase tracking-widest font-bold hidden sm:block">
              Terminal POS
            </p>
          </div>
        </div>

        {/* CENTER: Dynamic Island Stats (Hidden on mobile) */}
        <div className="hidden md:flex items-center px-5 py-1.5 bg-gray-50/80 rounded-full border border-gray-100 shadow-inner">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mr-3">
            Served Today
          </span>
          <span className="text-sm font-black text-[#003B73] flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-500" /> {servedCount}
          </span>
        </div>

        {/* RIGHT: Actions & Profile */}
        <div className="flex items-center gap-2 lg:gap-3 relative" ref={dropdownRef}>
          
          {/* Live Notification Bell */}
          <button 
            onClick={() => navigate('/orders/pending')}
            className={`relative p-2.5 rounded-full transition-all active:scale-90 border shadow-sm ${
              pendingCount > 0 ? "bg-amber-50 border-amber-100 hover:bg-amber-100" : "bg-gray-50/80 hover:bg-gray-200/50 border-gray-100"
            }`}
          >
            <Bell size={18} className={pendingCount > 0 ? "text-amber-600" : "text-gray-700"} />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full border-2 border-white shadow-[0_0_8px_rgba(239,68,68,0.6)] text-[9px] font-black text-white flex items-center justify-center animate-in zoom-in">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Profile Pill Trigger */}
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex items-center gap-2 p-1 pr-3 rounded-full transition-all duration-300 active:scale-95 border shadow-sm ${
              isProfileOpen ? 'bg-gray-100 border-gray-200' : 'bg-white hover:bg-gray-50 border-gray-100'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#003B73] to-blue-800 flex items-center justify-center overflow-hidden shadow-inner font-bold text-white text-xs">
              {terminalName.charAt(0).toUpperCase()}
            </div>
            <ChevronDown 
              size={14} 
              className={`text-gray-500 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${isProfileOpen ? 'rotate-180' : ''}`} 
            />
          </button>

          {/* DYNAMIC ISLAND EXPANSION (Dropdown) */}
          <div className={`absolute top-[calc(100%+1.25rem)] right-0 w-64 bg-white/95 backdrop-blur-3xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-200/50 overflow-hidden origin-top-right transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isProfileOpen ? "opacity-100 scale-100 translate-y-0 visible" : "opacity-0 scale-90 -translate-y-4 invisible pointer-events-none"
          }`}>
            
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 relative overflow-hidden">
              <p className="text-sm font-bold text-gray-900 tracking-wide truncate">{terminalName}</p>
              <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></span>
                System Active
              </p>
            </div>
            
            <div className="p-3 space-y-1">
              <button 
                onClick={handleSettingsClick}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-gray-700 hover:text-[#003B73] hover:bg-blue-50 rounded-2xl transition-all active:scale-[0.98] group"
              >
                <Settings size={18} className="text-gray-400 group-hover:text-[#003B73] transition-colors" /> System Settings
              </button>
              
              <div className="h-px bg-gray-100 my-1 mx-2"></div>
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-2xl transition-all active:scale-[0.98] group"
              >
                <LogOut size={18} className="text-red-500 group-hover:text-red-600 transition-colors" /> Terminate Session
              </button>
            </div>
            
          </div>

        </div>
      </header>
    </div>
  );
};

export default Navbar;