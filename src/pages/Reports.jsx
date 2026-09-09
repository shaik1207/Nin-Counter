import React, { useState, useEffect, useRef } from "react";
import { 
  CheckCircle2, AlertCircle, Loader2, Lock, Delete, 
  ShoppingCart, Utensils, Coffee, Apple, Leaf, 
  Plus, Minus, ReceiptText, Printer, X, IndianRupee,
  BadgeCheck
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { apiCall } from "../utils/api";

const POS = () => {
  // --- LAYOUT & NAVIGATION STATE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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


  // ==========================================
  // --- POINT OF SALE / MENU LOGIC ---
  // ==========================================
  
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [generatedOrder, setGeneratedOrder] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- FETCH LIVE MENU FROM BACKEND ---
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setIsLoadingMenu(true);
        const response = await apiCall('/menu', { method: 'GET' });
        const items = response.data || [];
        
        // Filter out unavailable items if your backend supports an 'isAvailable' flag
        const availableItems = items.filter(item => item.isAvailable !== false);
        setMenuItems(availableItems);

        // Extract unique categories dynamically
        const uniqueCategories = ["All", ...new Set(availableItems.map(item => item.category).filter(Boolean))];
        setCategories(uniqueCategories);
      } catch (error) {
        showToast("Failed to load live menu", "error");
      } finally {
        setIsLoadingMenu(false);
      }
    };
    fetchMenu();
  }, []);

  const filteredMenu = activeCategory === "All" ? menuItems : menuItems.filter(item => item.category === activeCategory);

  // Dynamic Icon & Colors based on category
  const getCategoryStyle = (categoryStr) => {
    const cat = (categoryStr || "").toLowerCase();
    if (cat.includes("meal") || cat.includes("thali")) return { icon: Utensils, color: "bg-orange-100 text-orange-600" };
    if (cat.includes("diet") || cat.includes("salad")) return { icon: Apple, color: "bg-green-100 text-green-600" };
    if (cat.includes("bev") || cat.includes("drink") || cat.includes("coffee")) return { icon: Coffee, color: "bg-amber-100 text-amber-700" };
    if (cat.includes("snack") || cat.includes("fast")) return { icon: Leaf, color: "bg-purple-100 text-purple-600" };
    return { icon: Utensils, color: "bg-blue-100 text-blue-600" };
  };

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }).filter(item => item.qty > 0)); 
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const total = subtotal; // Assuming exact calculations like the user frontend

  // --- SUBMIT REAL INSTANT ORDER ---
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    
    try {
      const payload = {
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.qty
        })),
        totalAmount: total,
        paymentMethod: 'cash' // Forced to cash for counter walk-ins
      };

      // 1. Create the order in the backend
      const response = await apiCall('/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const realOrderId = response.orderId || response.data?.orderId;
      if (!realOrderId) throw new Error("Failed to generate order ID");

      // 2. AUTO-DELIVER: Counter instantly delivers it, so skip the pending queue!
      try {
        await apiCall(`/admin/orders/${realOrderId}/status`, {
          method: "PUT",
          body: JSON.stringify({ status: "Delivered" })
        });
      } catch(err) {
        console.warn("Auto-deliver failed, check pending queue.");
      }

      const orderDate = response.createdAt ? new Date(response.createdAt) : new Date();

      setGeneratedOrder({
        id: realOrderId,
        date: orderDate.toLocaleDateString('en-IN'),
        time: orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        items: [...cart],
        subtotal,
        total,
        paymentMethod: 'CASH'
      });
      
      setShowReceipt(true);
      showToast("Cash Order Processed & Served!", "success");

    } catch (error) {
      showToast(error.message || "Failed to process order", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const closeReceiptAndClear = () => {
    setShowReceipt(false);
    setCart([]);
    setGeneratedOrder(null);
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
          
          /* Receipt jagged edge effect */
          .receipt-edge {
            background-image: radial-gradient(circle at 10px 0, transparent 10px, white 11px);
            background-size: 20px 20px;
            background-repeat: repeat-x;
            height: 20px;
            width: 100%;
          }
          .receipt-edge-bottom {
            background-image: radial-gradient(circle at 10px 20px, transparent 10px, white 11px);
            background-position: bottom;
          }
        `}
      </style>

      {/* PREMIUM IOS TOAST */}
      <div className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-[99999] transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${toast.show ? "translate-y-0 opacity-100 scale-100" : "-translate-y-12 opacity-0 scale-90"}`}>
        <div className="bg-[#1C1C1E]/95 backdrop-blur-3xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.3)] rounded-full px-5 py-2.5 flex items-center gap-3">
          {toast.type === "success" ? (
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center"><CheckCircle2 className="text-green-400" size={14} /></div>
          ) : toast.type === "info" ? (
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center animate-spin"><Loader2 className="text-blue-400" size={14} /></div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center"><AlertCircle className="text-red-400" size={14} /></div>
          )}
          <span className="text-sm font-semibold text-gray-100 tracking-wide pr-2">{toast.message}</span>
        </div>
      </div>

      {/* PREMIUM IOS-STYLE LOCK SCREEN OVERLAY */}
      <div className={`fixed inset-0 z-[5000] flex items-center justify-center bg-black/70 backdrop-blur-2xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isLocked ? "opacity-100 pointer-events-auto visible" : "opacity-0 pointer-events-none invisible"}`}>
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
          <p className="text-[10px] text-white/30 mt-8">PIN: 123456</p>
        </div>
      </div>

      {/* --- RECEIPT GENERATION MODAL --- */}
      <div className={`fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${showReceipt && !isLocked ? "opacity-100 pointer-events-auto visible" : "opacity-0 pointer-events-none invisible"}`}>
        <div className={`relative w-full max-w-sm transition-all duration-500 delay-75 origin-center ${showReceipt ? "scale-100 translate-y-0" : "scale-95 translate-y-8"}`}>
          
          {/* Main Receipt Body */}
          <div className="bg-white rounded-t-sm rounded-b-md shadow-[0_30px_60px_rgba(0,0,0,0.15)] overflow-hidden">
            <div className="receipt-edge rotate-180"></div>
            
            <div className="px-8 py-6">
              {/* Receipt Header */}
              <div className="flex flex-col items-center mb-6 text-center border-b-2 border-dashed border-gray-200 pb-6">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 mb-3 p-1">
                  <img src="https://upload.wikimedia.org/wikipedia/en/thumb/a/a3/Indian_Council_of_Medical_Research_Logo.svg/1280px-Indian_Council_of_Medical_Research_Logo.svg.png" alt="ICMR Logo" className="w-full h-full object-contain mix-blend-multiply" />
                </div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">ICMR • NIN</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Canteen Receipt</p>
                <div className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-1 rounded border border-green-200 shadow-sm mt-3">
                  <BadgeCheck size={12} className="fill-green-100" />
                  <span className="text-[9px] font-bold uppercase tracking-wide">Paid Successfully</span>
                </div>
              </div>

              {generatedOrder && (
                <>
                  {/* Meta Data */}
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-500 mb-6">
                    <div className="flex flex-col gap-1">
                      <span>Date: {generatedOrder.date}</span>
                      <span>Time: {generatedOrder.time}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span>Order: <strong className="text-gray-900">{generatedOrder.id}</strong></span>
                      <span>Terminal: 01</span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="mb-6">
                    <table className="w-full text-sm">
                      <thead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                        <tr>
                          <th className="pb-2 text-left">Item</th>
                          <th className="pb-2 text-center">Qty</th>
                          <th className="pb-2 text-right">Amt</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-800 font-semibold">
                        {generatedOrder.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 border-b border-gray-50">{item.name}</td>
                            <td className="py-2.5 border-b border-gray-50 text-center text-gray-500">x{item.qty}</td>
                            <td className="py-2.5 border-b border-gray-50 text-right">₹{item.price * item.qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="space-y-2 text-sm font-semibold text-gray-500 mb-6">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{generatedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-black text-gray-900 pt-3 border-t-2 border-dashed border-gray-200 mt-2">
                      <span>Total Paid</span>
                      <span>₹{generatedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* PAYMENT MODE EXPLICITLY SHOWN HERE */}
                  <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Payment Mode</p>
                    <p className="text-base font-black text-[#003B73] mt-0.5">{generatedOrder.paymentMethod}</p>
                  </div>
                </>
              )}
            </div>
            <div className="receipt-edge receipt-edge-bottom"></div>
          </div>

          {/* Action Buttons Below Receipt */}
          <div className="mt-6 flex gap-3 px-2">
            <button onClick={closeReceiptAndClear} className="flex-1 bg-white hover:bg-gray-50 text-gray-800 py-3.5 rounded-2xl font-bold text-sm shadow-[0_10px_20px_rgba(0,0,0,0.1)] transition-all active:scale-[0.98]">
              Done
            </button>
            <button onClick={() => showToast("Printing to Thermal Printer...", "info")} className="flex-[2] bg-[#003B73] hover:bg-[#002855] text-white py-3.5 rounded-2xl font-bold text-sm shadow-[0_10px_20px_rgba(0,59,115,0.2)] transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              <Printer size={18} /> Print Receipt
            </button>
          </div>

        </div>
      </div>

      {/* MAIN LAYOUT WRAPPER */}
      <div className={`flex h-screen w-full bg-[#FBFBFC] font-sans text-gray-800 overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] origin-center ${isLocked ? "scale-[0.97] blur-md brightness-50 pointer-events-none" : "scale-100 blur-0 brightness-100"}`}>
        
        {/* SIDEBAR */}
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} isMobile={isMobile} />

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-0 transition-all duration-300 lg:pl-64">
          
          <Navbar servedCount={128} onMenuClick={() => setIsSidebarOpen(true)} />

          <div className="flex-1 overflow-hidden p-4 lg:p-6 flex flex-col lg:flex-row gap-6">
            
            {/* LEFT COLUMN: MENU GRID */}
            <div className="flex-1 flex flex-col h-full bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden">
              
              {/* Header & Categories */}
              <div className="p-6 border-b border-gray-100 shrink-0">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3 mb-6">
                  Terminal Walk-In POS
                </h1>
                
                {isLoadingMenu ? (
                  <div className="flex items-center gap-2 text-blue-500">
                    <Loader2 size={16} className="animate-spin" /> Fetching live menu...
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <button 
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                          activeCategory === category 
                            ? "bg-[#003B73] text-white shadow-md shadow-blue-900/20" 
                            : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Scrollable Items Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                {isLoadingMenu ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 size={32} className="text-gray-300 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredMenu.map(item => {
                      const { icon: ItemIcon, color } = getCategoryStyle(item.category);
                      return (
                        <div key={item.id} className="bg-white border border-gray-100 hover:border-blue-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 flex flex-col justify-between group">
                          <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${color}`}>
                              <ItemIcon size={24} />
                            </div>
                            <span className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md">
                              {item.category || "General"}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 leading-tight mb-1">{item.name}</h3>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-lg font-black text-[#003B73]">₹{item.price}</span>
                              <button 
                                onClick={() => addToCart(item)}
                                className="bg-blue-50 text-[#003B73] hover:bg-[#003B73] hover:text-white w-8 h-8 rounded-lg flex items-center justify-center transition-colors active:scale-90"
                              >
                                <Plus size={18} strokeWidth={3} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: SMART CART */}
            <div className="w-full lg:w-[380px] shrink-0 bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-gray-100 flex flex-col h-full overflow-hidden">
              
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
                <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <ShoppingCart size={20} className="text-[#003B73]" /> Current Order
                </h2>
                {cart.length > 0 && (
                  <span className="bg-[#003B73] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FBFBFC]">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-6">
                    <ReceiptText size={48} className="text-gray-200 mb-4" />
                    <h3 className="text-gray-400 font-bold mb-1">Cart is empty</h3>
                    <p className="text-xs text-gray-400 font-medium">Add items from the menu to start an order.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                      <div className="flex-1 pr-3">
                        <h4 className="text-sm font-bold text-gray-900 leading-tight mb-1 truncate">{item.name}</h4>
                        <span className="text-xs font-black text-[#003B73]">₹{item.price}</span>
                      </div>
                      <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1 border border-gray-100 shrink-0">
                        <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-gray-600 shadow-sm hover:text-red-500 active:scale-95 transition-all">
                          <Minus size={14} strokeWidth={3} />
                        </button>
                        <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 bg-[#003B73] rounded-lg flex items-center justify-center text-white shadow-sm active:scale-95 transition-all">
                          <Plus size={14} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Calculation & Checkout Footer */}
              <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] shrink-0">
                <div className="space-y-2.5 mb-6 text-sm font-semibold text-gray-500">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-gray-900">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest self-end pb-1">Total Payable</span>
                    <span className="text-3xl font-black text-[#003B73]">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  onClick={handlePlaceOrder}
                  disabled={cart.length === 0 || isProcessing}
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                    cart.length === 0 
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                      : "bg-[#003B73] hover:bg-[#002855] text-white shadow-[0_8px_20px_rgba(0,59,115,0.2)]"
                  }`}
                >
                  {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <ReceiptText size={20} />}
                  {isProcessing ? "Processing..." : "Process Cash Order"}
                </button>
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default POS;