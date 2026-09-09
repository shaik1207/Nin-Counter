import React, { useState, useEffect, useRef } from "react";
import { X, CheckCircle2, AlertCircle, Loader2, Clock, Check, Utensils, Lock, Delete } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { apiCall } from "../utils/api";

// Helper component for the colored status dots
const StatusDot = ({ status }) => {
  let color = "bg-gray-400";
  if (status?.toLowerCase() === "pending") color = "bg-amber-400";
  if (status?.toLowerCase() === "preparing") color = "bg-blue-400";
  if (status?.toLowerCase() === "ready") color = "bg-cyan-400";
  if (status?.toLowerCase() === "delivered") color = "bg-emerald-400";
  
  return <div className={`w-2 h-2 rounded-full ${color} shadow-sm`}></div>;
};

const OrdersList = () => {
  // --- LAYOUT & NAVIGATION STATE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All Active");

  // Track window size for sidebar behavior
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- SECURITY: PERSISTENT LOCK SCREEN STATE ---
  const [isLocked, setIsLocked] = useState(() => {
    const savedState = localStorage.getItem("terminalLocked");
    return savedState === "true"; 
  });
  const [pin, setPin] = useState("");
  const [isPinError, setIsPinError] = useState(false);
  const [activeKey, setActiveKey] = useState(null);

  useEffect(() => {
    localStorage.setItem("terminalLocked", isLocked.toString());
  }, [isLocked]);

  // --- POPUP & NOTIFICATION STATE ---
  const [isServeModalOpen, setIsServeModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // --- LIVE DATA STATE ---
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- FETCH LIVE ORDERS ---
  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const response = await apiCall("/admin/orders", { method: "GET" });
      
      // Filter out cancelled orders. 
      // We also filter out delivered orders EXCEPT if they were just delivered locally.
      const activeOrders = response.data.filter(o => 
        o.status?.toLowerCase() !== 'cancelled' && 
        o.status?.toLowerCase() !== 'delivered'
      );
      
      // Merge with any orders currently visible on screen that we just marked as 'Delivered' locally
      setOrders(prevOrders => {
        const locallyDelivered = prevOrders.filter(o => o.status?.toLowerCase() === 'delivered');
        
        // Return active database orders + any locally delivered orders waiting to fade out
        const combined = [...activeOrders];
        locallyDelivered.forEach(localOrder => {
          if (!combined.find(o => o.id === localOrder.id)) {
            combined.push(localOrder);
          }
        });
        
        // Sort by creation time so the list stays stable
        return combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });

    } catch (error) {
      if (!silent) showToast("Failed to sync live orders.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-polling every 10 seconds to catch new checkouts instantly
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const filters = [
    { name: "All Active", status: null },
    { name: "Pending", status: "Pending" },
    { name: "Preparing", status: "Preparing" },
    { name: "Ready", status: "Ready" },
  ];

  // --- PREMIUM TOAST NOTIFICATION LOGIC ---
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
  };

  // --- SYSTEM IDLE TIMER ---
  useEffect(() => {
    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      if (!isLocked) {
        timeout = setTimeout(() => setIsLocked(true), 300000); // 5 mins
      }
    };
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      clearTimeout(timeout);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [isLocked]);

  // --- LOCK SCREEN LOGIC ---
  const padKeys = [
    { num: "1", letters: "" }, { num: "2", letters: "ABC" }, { num: "3", letters: "DEF" },
    { num: "4", letters: "GHI" }, { num: "5", letters: "JKL" }, { num: "6", letters: "MNO" },
    { num: "7", letters: "PQRS" }, { num: "8", letters: "TUV" }, { num: "9", letters: "WXYZ" },
  ];

  const handleNumPress = (num) => {
    setPin((prev) => {
      if (prev.length < 6 && !isPinError) return prev + num;
      return prev;
    });
  };

  const handleDelete = () => {
    setPin((prev) => {
      if (prev.length > 0 && !isPinError) return prev.slice(0, -1);
      return prev;
    });
  };

  useEffect(() => {
    if (!isLocked) return;
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (/^[0-9]$/.test(e.key)) {
        handleNumPress(e.key);
        setActiveKey(e.key);
      } else if (e.key === "Backspace" || e.key === "Delete") {
        handleDelete();
        setActiveKey("delete");
      }
    };
    const handleKeyUp = () => setActiveKey(null);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isLocked, isPinError]);

  useEffect(() => {
    if (isLocked && pin.length === 6) {
      if (pin === "123456") { 
        setTimeout(() => {
          setIsLocked(false);
          setPin("");
          showToast("Terminal Unlocked", "success");
        }, 200);
      } else {
        setIsPinError(true);
        setTimeout(() => {
          setPin("");
          setIsPinError(false);
        }, 500);
      }
    }
  }, [pin, isLocked]);

  // --- DYNAMIC FILTER LOGIC ---
  const filteredOrders = orders.filter((order) => {
    if (activeFilter === "All Active") return true;
    return order.status?.toLowerCase() === activeFilter.toLowerCase();
  });

  // Calculate Wait Time
  const getWaitTime = (createdAt) => {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    return Math.floor(diffMs / 60000); // Minutes
  };

  // --- MODAL TRIGGERS & SERVE LOGIC ---
  const handleOpenServeModal = (order) => {
    setSelectedOrder(order);
    setIsServeModalOpen(true);
  };

  const handleConfirmServe = async () => {
    if (!selectedOrder) return;
    setIsProcessing(true);

    const targetId = selectedOrder.orderId || selectedOrder.id;

    try {
      await apiCall(`/admin/orders/${targetId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "Delivered" })
      });

      showToast(`Order marked as Delivered!`, "success");
      setIsServeModalOpen(false);
      
      // CRITICAL FIX: Instantly change status to Delivered to trigger color change
      setOrders(prev => prev.map(o => 
        (o.orderId === targetId || o.id === targetId) 
          ? { ...o, status: "Delivered" } 
          : o
      ));
      
      // Remove it from the queue after exactly 3.5 seconds
      setTimeout(() => {
        setOrders(prev => prev.filter(o => o.orderId !== targetId && o.id !== targetId));
      }, 3500);
      
    } catch (error) {
      showToast(error.message || "Failed to serve order.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-15px); }
            40%, 80% { transform: translateX(15px); }
          }
          .animate-shake { animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
        `}
      </style>

      {/* PREMIUM IOS TOAST */}
      <div className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-[99999] transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${toast.show ? "translate-y-0 opacity-100 scale-100" : "-translate-y-12 opacity-0 scale-90"}`}>
        <div className="bg-[#1C1C1E]/95 backdrop-blur-3xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.3)] rounded-full px-5 py-2.5 flex items-center gap-3">
          {toast.type === "success" ? (
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="text-green-400" size={14} />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="text-red-400" size={14} />
            </div>
          )}
          <span className="text-sm font-semibold text-gray-100 tracking-wide pr-2">{toast.message}</span>
        </div>
      </div>

      {/* PREMIUM IOS-STYLE LOCK SCREEN OVERLAY */}
      <div 
        className={`fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-2xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isLocked ? "opacity-100 pointer-events-auto visible" : "opacity-0 pointer-events-none invisible"
        }`}
      >
        <div className={`relative z-10 flex flex-col items-center w-full max-w-md transition-all duration-700 delay-75 ${isLocked ? "scale-100 translate-y-0" : "scale-95 translate-y-10"}`}>
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] mb-6 p-2">
              <img src="https://upload.wikimedia.org/wikipedia/en/thumb/a/a3/Indian_Council_of_Medical_Research_Logo.svg/1280px-Indian_Council_of_Medical_Research_Logo.svg.png" alt="ICMR Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-2 mb-1 text-white">
              <Lock size={18} className="opacity-80" />
              <h1 className="text-xl font-bold tracking-wide">Enter Passcode</h1>
            </div>
            <p className="text-gray-400 text-sm font-medium tracking-wide">Terminal 01 • Counter Staff</p>
          </div>

          <div className={`flex justify-center gap-5 mb-12 h-4 ${isPinError ? "animate-shake" : ""}`}>
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                  pin.length > i ? "bg-white scale-100 border-transparent" : "bg-transparent border-[1.5px] border-white/40"
                }`}
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-x-8 gap-y-4 px-6 w-full max-w-[340px]">
            {padKeys.map((key) => {
              const isActive = activeKey === key.num;
              return (
                <button
                  key={key.num} onClick={() => handleNumPress(key.num)}
                  onPointerDown={() => setActiveKey(key.num)} onPointerUp={() => setActiveKey(null)} onPointerLeave={() => setActiveKey(null)}
                  className={`w-[78px] h-[78px] mx-auto rounded-full flex flex-col items-center justify-center transition-all duration-75 ${isActive ? "bg-[#666666] scale-95" : "bg-[#333333] hover:bg-[#444444]"}`}
                >
                  <span className="text-white text-3xl font-normal leading-none mt-1">{key.num}</span>
                  <span className="text-[10px] text-white/70 font-semibold tracking-[0.1em] mt-0.5 h-3">{key.letters}</span>
                </button>
              );
            })}
            <div></div>
            <button
              onClick={() => handleNumPress("0")} onPointerDown={() => setActiveKey("0")} onPointerUp={() => setActiveKey(null)} onPointerLeave={() => setActiveKey(null)}
              className={`w-[78px] h-[78px] mx-auto rounded-full flex flex-col items-center justify-center transition-all duration-75 ${activeKey === "0" ? "bg-[#666666] scale-95" : "bg-[#333333] hover:bg-[#444444]"}`}
            >
              <span className="text-white text-3xl font-normal leading-none">0</span>
            </button>
            <div className="flex items-center justify-center h-full w-full">
              {pin.length > 0 && (
                <button
                  onClick={handleDelete} onPointerDown={() => setActiveKey("delete")} onPointerUp={() => setActiveKey(null)} onPointerLeave={() => setActiveKey(null)}
                  className={`text-white/90 hover:text-white transition-all duration-75 flex items-center justify-center w-full h-full ${activeKey === "delete" ? "opacity-50 scale-95" : "scale-100"}`}
                >
                  <Delete size={28} strokeWidth={1.5} />
                </button>
              )}
            </div>
          </div>
          <p className="text-[10px] text-white/30 mt-8">PIN: 123456</p>
        </div>
      </div>

      {/* VERIFY & SERVE MODAL */}
      <div className={`fixed inset-0 z-[500] flex items-center justify-center bg-black/40 backdrop-blur-md transition-all duration-500 ${isServeModalOpen && !isLocked ? "opacity-100 pointer-events-auto visible" : "opacity-0 pointer-events-none invisible"}`}>
        <div className={`bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-[0_30px_70px_rgba(0,0,0,0.15)] border border-gray-100 transition-all duration-500 origin-center ${isServeModalOpen ? "scale-100 translate-y-0" : "scale-90 translate-y-8"}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <CheckCircle2 className="text-[#003B73]" size={24} /> Verify & Serve
            </h3>
            <button onClick={() => setIsServeModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-1.5 rounded-full transition-all"><X size={16} /></button>
          </div>

          {selectedOrder && (
            <div className="space-y-5">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order ID</p>
                <p className="text-xl font-black text-[#003B73] mt-0.5">{selectedOrder.orderId || selectedOrder.id}</p>
                <div className="flex justify-between mt-3 pt-3 border-t border-gray-200">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</p>
                    <p className="text-sm font-bold text-gray-900">{selectedOrder.user?.name || "Counter Walk-in"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Wait Time</p>
                    <p className="text-sm font-bold text-amber-600">{getWaitTime(selectedOrder.createdAt)} Mins</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Manifest Items</label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-white border border-gray-200 p-3 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3 font-bold text-sm text-gray-800">
                        <Utensils size={14} className="text-gray-400" /> {item.name}
                      </div>
                      <span className="bg-[#003B73] text-white px-2 py-0.5 rounded-md text-xs font-black">x{item.quantity || 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleConfirmServe}
                disabled={isProcessing}
                className="w-full bg-[#003B73] hover:bg-[#002855] text-white py-4 rounded-xl font-bold text-sm shadow-[0_8px_25px_rgba(0,59,115,0.2)] transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-70 disabled:active:scale-100"
              >
                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                {isProcessing ? "Processing..." : "Serve Order (Mark Delivered)"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MAIN DASHBOARD WRAPPER */}
      <div className={`flex h-screen w-full bg-[#FBFBFC] font-sans text-gray-800 overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] origin-center ${isLocked ? "scale-[0.97] blur-md brightness-50 pointer-events-none" : "scale-100 blur-0 brightness-100"}`}>
        
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} isMobile={isMobile} />

        <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-0 transition-all duration-300 lg:pl-64">
          <Navbar servedCount={orders.length} onMenuClick={() => setIsSidebarOpen(true)} />

          <div className="flex-1 overflow-y-auto p-4 lg:p-8">
            <div className="max-w-[1400px] mx-auto bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.01)] border border-gray-100 overflow-hidden flex flex-col h-full min-h-[650px]">
              
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0 bg-white">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Active Queue</h2>
                  <p className="text-sm text-gray-500 font-medium mt-0.5">Manage and serve live canteen orders</p>
                </div>
                <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 shadow-sm p-2">
                  <img src="https://upload.wikimedia.org/wikipedia/en/thumb/a/a3/Indian_Council_of_Medical_Research_Logo.svg/1280px-Indian_Council_of_Medical_Research_Logo.svg.png" alt="ICMR Logo" className="w-full h-full object-contain" />
                </div>
              </div>

              {/* DYNAMIC FILTER PILLS */}
              <div className="p-6 shrink-0 bg-white">
                <div className="flex flex-wrap gap-2 p-1.5 bg-white border border-gray-200 rounded-2xl w-max shadow-sm">
                  {filters.map((filter) => (
                    <button
                      key={filter.name}
                      onClick={() => setActiveFilter(filter.name)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                        activeFilter === filter.name
                          ? "bg-gray-100 text-gray-900 shadow-sm"
                          : "bg-transparent text-gray-500 hover:bg-gray-50/80"
                      }`}
                    >
                      {filter.status && <StatusDot status={filter.status} />}
                      {filter.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* LIVE DATA TABLE CONTAINER */}
              <div className="flex-1 overflow-x-auto px-6 pb-6 relative">
                
                {isLoading && orders.length === 0 && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                    <Loader2 size={32} className="text-[#003B73] animate-spin mb-2" />
                    <p className="text-sm font-bold text-[#003B73]">Syncing live queue...</p>
                  </div>
                )}

                <table className="w-full text-left border-collapse min-w-[950px]">
                  <thead className="bg-white sticky top-0 z-10 shadow-sm shadow-gray-50">
                    <tr>
                      <th className="py-4 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider w-12 text-center">#</th>
                      <th className="py-4 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">Order ID</th>
                      <th className="py-4 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                      <th className="py-4 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">Items Summary</th>
                      <th className="py-4 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="py-4 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Wait (Mins)</th>
                      <th className="py-4 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider text-right pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {filteredOrders.length === 0 && !isLoading ? (
                      <tr>
                        <td colSpan="7" className="py-16 text-center text-gray-400 font-medium">
                          <CheckCircle2 size={32} className="mx-auto text-gray-300 mb-3" />
                          No pending orders matching this filter.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order, index) => {
                        const waitMins = getWaitTime(order.createdAt);
                        const isLate = waitMins > 15; 
                        const isDelivered = order.status?.toLowerCase() === 'delivered';
                        
                        return (
                          <tr 
                            key={order.orderId || order.id || index} 
                            // Change the entire row to emerald green when delivered
                            className={`transition-colors group ${isDelivered ? 'bg-emerald-50/70 border-l-4 border-l-emerald-500' : 'hover:bg-gray-50/40 border-l-4 border-l-transparent'}`}
                          >
                            <td className="py-4 border-b border-gray-50 text-gray-400 text-center font-medium">{index + 1}</td>
                            <td className={`py-4 border-b border-gray-50 font-bold ${isDelivered ? 'text-emerald-900' : 'text-gray-900'}`}>
                              {String(order.orderId || order.id).substring(0,8).toUpperCase()}
                            </td>
                            <td className="py-4 border-b border-gray-50">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-50 to-blue-100 flex items-center justify-center text-[#003B73] font-bold text-xs border border-blue-100 shadow-sm">
                                  {(order.user?.name || "C").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span className={`font-bold block leading-tight ${isDelivered ? 'text-emerald-800' : 'text-gray-800'}`}>{order.user?.name || "Counter Request"}</span>
                                  <span className={`text-[10px] uppercase font-bold ${isDelivered ? 'text-emerald-600' : 'text-gray-400'}`}>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 border-b border-gray-50">
                              <div className="flex flex-wrap gap-1 max-w-[250px]">
                                {order.items?.map((item, i) => (
                                  <span key={i} className={`px-2.5 py-1 rounded-md text-[10px] font-bold whitespace-nowrap ${isDelivered ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                                    {item.quantity || 1}x {item.name}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-4 border-b border-gray-50">
                              <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-full w-max shadow-sm ${isDelivered ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'}`}>
                                <StatusDot status={order.status} />
                                <span className={`text-xs font-bold capitalize ${isDelivered ? 'text-emerald-700' : 'text-gray-700'}`}>{order.status}</span>
                              </div>
                            </td>
                            <td className="py-4 border-b border-gray-50 text-center">
                              <div className={`w-8 h-8 mx-auto rounded-full border flex items-center justify-center text-xs font-bold shadow-sm ${isDelivered ? 'border-emerald-200 bg-emerald-100 text-emerald-700' : isLate ? "border-red-200 bg-red-50 text-red-600 animate-pulse" : "border-gray-200 bg-white text-gray-700"}`}>
                                {isDelivered ? <Check size={14} /> : waitMins}
                              </div>
                            </td>
                            <td className="py-4 border-b border-gray-50 text-right pr-4">
                              {/* Swap the Serve button for a Served badge when done */}
                              {isDelivered ? (
                                <span className="text-emerald-700 bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 ml-auto w-max">
                                  <CheckCircle2 size={14} /> Served
                                </span>
                              ) : (
                                <button 
                                  onClick={() => handleOpenServeModal(order)}
                                  className="bg-[#003B73] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-900/10 hover:bg-[#002855] transition-all active:scale-[0.96] flex items-center gap-1.5 ml-auto"
                                >
                                  <Check size={14} /> Serve
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default OrdersList;