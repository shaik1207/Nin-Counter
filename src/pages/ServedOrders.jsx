import React, { useState, useEffect, useRef } from "react";
import { 
  CheckCircle2, AlertCircle, Loader2, Lock, Delete, 
  Receipt, IndianRupee, Clock, CalendarDays, User,
  ScanLine, X, BadgeCheck, MoreVertical, Pin, Printer, Download, PinOff
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { apiCall } from "../utils/api";

const ServedOrders = () => {
  // --- LAYOUT & NAVIGATION STATE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // --- POPUP MODAL & OPTIONS STATE ---
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  
  // Array of order IDs that have been pinned
  const [pinnedOrders, setPinnedOrders] = useState([]);

  // --- LIVE DATA STATE ---
  const [servedOrders, setServedOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ totalServed: 0, revenue: 0 });

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

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
  };

  // --- FETCH LIVE DELIVERED ORDERS ---
  const fetchServedHistory = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const response = await apiCall("/admin/orders", { method: "GET" });
      
      const delivered = response.data.filter(o => 
        o.status?.toLowerCase() === 'delivered' || 
        o.status?.toLowerCase() === 'completed'
      );
      
      const totalRevenue = delivered.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
      
      setServedOrders(delivered);
      setStats({
        totalServed: delivered.length,
        revenue: totalRevenue
      });

    } catch (error) {
      if (!silent) showToast("Failed to sync history.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServedHistory();
    const interval = setInterval(() => fetchServedHistory(true), 10000);
    return () => clearInterval(interval);
  }, []);


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

  // --- MODAL & OPTIONS LOGIC ---
  const openDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
    setShowOptionsDropdown(false);
  };

  const closeDetails = () => {
    setIsModalOpen(false);
    setShowOptionsDropdown(false);
    setTimeout(() => setSelectedOrder(null), 300); 
  };

  const togglePinStatus = () => {
    if (!selectedOrder) return;
    const orderId = selectedOrder.orderId || selectedOrder.id;
    
    if (pinnedOrders.includes(orderId)) {
      setPinnedOrders(prev => prev.filter(id => id !== orderId));
      showToast("Receipt Unpinned");
    } else {
      setPinnedOrders(prev => [orderId, ...prev]);
      showToast("Receipt Pinned to Top");
    }
    setShowOptionsDropdown(false);
  };

  // --- SORT ORDERS (Pinned first, then by date) ---
  const sortedServedOrders = [...servedOrders].sort((a, b) => {
    const aId = a.orderId || a.id;
    const bId = b.orderId || b.id;
    const isAPinned = pinnedOrders.includes(aId);
    const isBPinned = pinnedOrders.includes(bId);

    if (isAPinned && !isBPinned) return -1;
    if (!isAPinned && isBPinned) return 1;
    
    // If both are pinned or both are unpinned, sort by newest
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

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
          
          /* Real Thermal Receipt CSS */
          .thermal-receipt {
            position: relative;
            background: #ffffff;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            margin: 0 auto;
          }
          .thermal-receipt::before {
            content: "";
            position: absolute;
            top: -8px; left: 0; right: 0; height: 8px;
            background-size: 16px 16px;
            background-image: linear-gradient(135deg, #ffffff 25%, transparent 25%), 
                              linear-gradient(-135deg, #ffffff 25%, transparent 25%);
            background-position: 0 0;
          }
          .thermal-receipt::after {
            content: "";
            position: absolute;
            bottom: -8px; left: 0; right: 0; height: 8px;
            background-size: 16px 16px;
            background-image: linear-gradient(45deg, #ffffff 25%, transparent 25%), 
                              linear-gradient(-45deg, #ffffff 25%, transparent 25%);
            background-position: 0 0;
          }
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

      {/* LOCK SCREEN OVERLAY */}
      <div className={`fixed inset-0 z-[5000] flex items-center justify-center bg-black/70 backdrop-blur-2xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isLocked ? "opacity-100 pointer-events-auto visible" : "opacity-0 pointer-events-none invisible"}`}>
        {/* ... (Lock Screen unchanged for brevity, keeping existing code) ... */}
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
              <div key={i} className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${pin.length > i ? "bg-white scale-100 border-transparent" : "bg-transparent border-[1.5px] border-white/40"}`} />
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
        </div>
      </div>

      {/* --- REAL-WORLD RECEIPT MODAL --- */}
      <div className={`fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${isModalOpen && !isLocked ? "opacity-100 pointer-events-auto visible" : "opacity-0 pointer-events-none invisible"}`}>
        <div className={`relative w-full max-w-sm transition-all duration-500 delay-75 origin-center ${isModalOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-8"}`}>
          
          <div className="thermal-receipt px-8 py-8 w-full font-mono text-sm leading-tight text-gray-800 rounded-sm">
            
            {/* Header Actions (Close & 3-Dots) */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <div className="relative">
                <button 
                  onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                  className="p-1.5 text-gray-400 hover:text-gray-800 rounded-md transition-colors"
                >
                  <MoreVertical size={18} />
                </button>
                
                {/* Options Dropdown */}
                {showOptionsDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95">
                    <button onClick={togglePinStatus} className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-[#003B73] flex items-center gap-2 transition-colors">
                      {pinnedOrders.includes(selectedOrder?.orderId || selectedOrder?.id) ? <PinOff size={14}/> : <Pin size={14}/>} 
                      {pinnedOrders.includes(selectedOrder?.orderId || selectedOrder?.id) ? "Unpin Receipt" : "Pin to Top"}
                    </button>
                    <button onClick={() => { showToast("Printing sent to Thermal Printer"); setShowOptionsDropdown(false); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                      <Printer size={14}/> Print Copy
                    </button>
                    <button onClick={() => { showToast("Receipt downloaded as PDF"); setShowOptionsDropdown(false); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                      <Download size={14}/> Download PDF
                    </button>
                  </div>
                )}
              </div>

              <button onClick={closeDetails} className="p-1.5 text-gray-400 hover:text-red-500 rounded-md transition-colors">
                <X size={18} />
              </button>
            </div>

            {selectedOrder && (
              <>
                <div className="flex flex-col items-center justify-center text-center mb-5 mt-2">
                  <h1 className="font-bold text-lg tracking-wider">ICMR - NIN CANTEEN</h1>
                  <p className="text-xs mt-1 text-gray-500">NATIONAL INSTITUTE OF NUTRITION</p>
                  <p className="text-xs text-gray-500">HYDERABAD, TELANGANA</p>
                </div>

                <div className="border-b-2 border-dashed border-gray-300 w-full my-3"></div>
                <h2 className="text-center font-bold text-lg tracking-widest my-2 uppercase text-green-700">Order Served</h2>
                <div className="border-b-2 border-dashed border-gray-300 w-full my-3"></div>

                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span>ORDER: {selectedOrder.orderId || selectedOrder.id}</span>
                  <span>{new Date(selectedOrder.createdAt).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit'})}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold mb-3 text-gray-500">
                  <span>CUSTOMER: {selectedOrder.user?.name || "GUEST"}</span>
                  <span>{new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div className="border-b-2 border-dashed border-gray-300 w-full my-3"></div>

                <div className="space-y-3 my-4">
                  <div className="flex justify-between font-bold text-xs pb-1 text-gray-500">
                    <span>ITEM</span>
                    <span>AMT (₹)</span>
                  </div>
                  
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex flex-col">
                      <span className="font-semibold uppercase">{item.name}</span>
                      <div className="flex justify-between text-xs text-gray-600 pl-2">
                        <span>{item.quantity} x {Number(item.price).toFixed(2)}</span>
                        <span className="font-bold text-gray-800">{(item.quantity * item.price).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-b-2 border-dashed border-gray-300 w-full my-3"></div>

                <div className="space-y-1.5 my-3">
                  <div className="flex justify-between font-bold text-base my-2">
                    <span>TOTAL AMOUNT</span>
                    <span>₹{Number(selectedOrder.totalAmount).toFixed(2)}</span>
                  </div>

                  {/* Explicit Payment Method Display */}
                  <div className="flex justify-between text-xs text-gray-500 font-bold mt-2">
                    <span>PAID VIA</span>
                    <span className="uppercase px-2 py-0.5 bg-gray-100 rounded text-gray-800 border border-gray-200">
                      {selectedOrder.paymentMethod || "UNKNOWN"}
                    </span>
                  </div>
                </div>

                <div className="border-b-2 border-dashed border-gray-300 w-full my-4"></div>
                <div className="text-center text-xs font-bold tracking-widest my-2 text-gray-400">
                  THANK YOU FOR DINING!
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT WRAPPER */}
      <div className={`flex h-screen w-full bg-[#FBFBFC] font-sans text-gray-800 overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] origin-center ${isLocked ? "scale-[0.97] blur-md brightness-50 pointer-events-none" : "scale-100 blur-0 brightness-100"}`}>
        
        {/* SIDEBAR */}
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} isMobile={isMobile} />

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-0 transition-all duration-300 lg:pl-64">
          
          <Navbar servedCount={stats.totalServed} onMenuClick={() => setIsSidebarOpen(true)} />

          <div className="flex-1 overflow-y-auto p-4 lg:p-8">
            <div className="max-w-[1000px] mx-auto">
              
              {/* PAGE HEADER */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <CheckCircle2 className="text-green-500" size={32} />
                    Served Orders
                  </h1>
                  <p className="text-gray-500 font-medium mt-1">History of all successfully completed and dispensed transactions.</p>
                </div>

                <div className="flex gap-4">
                  <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#003B73]">
                      <Receipt size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Served</p>
                      <p className="text-xl font-black text-gray-900 leading-tight">{stats.totalServed}</p>
                    </div>
                  </div>
                  <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                      <IndianRupee size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revenue</p>
                      <p className="text-xl font-black text-gray-900 leading-tight">₹{stats.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SERVED ORDERS LIST */}
              <div className="flex flex-col gap-3 relative min-h-[300px]">
                
                {isLoading && servedOrders.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">Fetching history...</p>
                  </div>
                )}

                {!isLoading && servedOrders.length === 0 && (
                  <div className="text-center py-20">
                    <CheckCircle2 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No orders have been served yet.</p>
                  </div>
                )}

                {/* Uses the newly sorted array containing pinned orders at the top */}
                {sortedServedOrders.map((order) => {
                  const orderId = order.orderId || order.id;
                  const isPinned = pinnedOrders.includes(orderId);

                  return (
                    <div 
                      key={orderId} 
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 pr-4 rounded-3xl sm:rounded-full border shadow-sm transition-all hover:bg-gray-200/50 ${
                        isPinned ? "bg-blue-50/50 border-blue-200" : "bg-[#F2F3F5] border-gray-200/60"
                      }`}
                    >
                      {/* LEFT SIDE: Avatar & Details */}
                      <div className="flex items-center gap-4 mb-4 sm:mb-0">
                        <div className={`w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border shrink-0 ${isPinned ? "border-blue-200" : "border-gray-100"}`}>
                          <User size={24} className={isPinned ? "text-[#003B73]" : "text-gray-300"} />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900 tracking-tight">{order.user?.name || "Counter Walk-in"}</span>
                            {/* Little visual pin indicator next to the name */}
                            {isPinned && <Pin size={12} className="text-[#003B73] fill-blue-100" />}
                          </div>
                          <span className="text-[11px] font-bold text-gray-500 tracking-wide mt-0.5">{orderId}</span>
                        </div>
                      </div>

                      {/* RIGHT SIDE: Icons & Action Button */}
                      <div className="flex items-center justify-between sm:justify-end gap-5 pl-16 sm:pl-0">
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right mr-4 hidden sm:block">
                            <p className="text-xs font-bold text-gray-900">₹{order.totalAmount}</p>
                            <p className="text-[10px] text-gray-500 font-medium">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          <ScanLine size={24} className="text-green-500 opacity-80" strokeWidth={2.5} />
                          <CheckCircle2 size={26} className="text-green-500 fill-green-100" strokeWidth={2} />
                        </div>

                        {/* Details Button */}
                        <button 
                          onClick={() => openDetails(order)}
                          className="bg-white hover:bg-gray-50 text-[#003B73] text-xs font-bold px-5 py-2.5 rounded-full shadow-sm border border-gray-200 transition-all active:scale-95 flex items-center gap-2"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default ServedOrders;