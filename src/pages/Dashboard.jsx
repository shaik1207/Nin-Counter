import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { apiCall } from "../utils/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import {
  ScanLine, CheckCircle2, FileText, 
  Camera, CameraOff, User, Clock, ChevronRight, 
  AlertCircle, X, Barcode, Keyboard, 
  MonitorSmartphone, Usb, Loader2, AlertTriangle, Lock, Delete,
  Utensils, QrCode, Ban, ShieldAlert
} from "lucide-react";

/* ================= TOAST COMPONENT ================= */
function Toast({ msg, type }) {
  const colors = {
    success: "bg-emerald-500",
    error: "bg-red-500",
    warn: "bg-amber-500",
    info: "bg-blue-600",
  };
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold text-sm tracking-wide animate-in slide-in-from-top-4 fade-in duration-300 ${colors[type]}`}>
      {type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
      {msg}
    </div>
  );
}

/* ================= SUCCESS OVERLAY ================= */
function SuccessOverlay({ show, onClose }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 2500);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-emerald-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-12 flex flex-col items-center text-center max-w-sm animate-in zoom-in-75 duration-300">
        <div className="w-28 h-28 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner animate-[spin_0.5s_ease-out]">
          <CheckCircle2 size={72} strokeWidth={2.5} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Order Served!</h2>
        <p className="text-slate-500 mt-2 font-medium">The items have been verified and delivered.</p>
      </div>
    </div>
  );
}

/* ================= ORDER DELIVERY MODAL ================= */
function OrderPreviewModal({ order, onClose, onDeliver, isDelivering }) {
  if (!order) return null;

  const items = order.items || [];
  const total = order.totalAmount || items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const displayId = order.orderId || order.id || "UNKNOWN";

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[8000] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 zoom-in-95 duration-300">
        <div className="bg-[#003B73] text-white p-6 flex justify-between items-center border-b-4 border-emerald-500">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CheckCircle2 size={24} className="text-emerald-400" />
              Verify & Serve Items
            </h2>
            <p className="text-blue-200 text-sm mt-1 font-mono tracking-wider">
              ORDER ID: {displayId}
            </p>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors bg-blue-900/50 p-2 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Items to Deliver</h3>
            <span className="text-xs font-bold text-slate-500">Customer: {order.user?.name || "Counter Request"}</span>
          </div>
          
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-xl border border-slate-200 flex-shrink-0 flex items-center justify-center text-slate-400">
                  <Utensils size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 text-lg uppercase leading-tight">{item.name}</h4>
                  <p className="text-slate-500 font-medium mt-0.5">₹{Number(item.price).toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-5 py-2 rounded-xl flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">QTY</span>
                  <span className="font-black text-2xl leading-none">x{item.quantity || 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 border-t border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs uppercase font-bold tracking-widest">Total Value</p>
            <p className="text-3xl font-black text-slate-900">₹{total.toFixed(2)}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isDelivering}
              className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onDeliver(displayId)}
              disabled={isDelivering}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-black tracking-wide flex items-center gap-2 shadow-[0_4px_14px_0_rgba(5,150,105,0.39)] disabled:opacity-70 transition-all active:scale-95 text-lg"
            >
              {isDelivering ? "Processing..." : "SERVE ORDER"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= MAIN PANEL ================= */
export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // --- SECURITY: LOCK & ADMIN STATE ---
  const [isLocked, setIsLocked] = useState(() => {
    const savedState = localStorage.getItem("terminalLocked");
    return savedState === "true"; 
  });
  const [adminStatus, setAdminStatus] = useState("Active"); // "Active", "Blocked", "Locked"
  
  const [pin, setPin] = useState("");
  const [isPinError, setIsPinError] = useState(false);
  const [activeKey, setActiveKey] = useState(null);

  // --- DATA & SCANNER STATES ---
  const [queue, setQueue] = useState([]); 
  const [stats, setStats] = useState({ pending: 0, servedToday: 0 });
  const [mode, setMode] = useState("camera"); 
  const [setupPhase, setSetupPhase] = useState(true);
  const [searchId, setSearchId] = useState("");
  const [toast, setToast] = useState(null);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [hasBarcodeSupport, setHasBarcodeSupport] = useState(true);
  const [hardwareReady, setHardwareReady] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualItem, setManualItem] = useState({ receiptId: "" });
  const [scannedOrderPreview, setScannedOrderPreview] = useState(null);
  const [isDelivering, setIsDelivering] = useState(false);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const scannerRef = useRef(null);

  const showOrderModal = !!scannedOrderPreview; 

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem("terminalLocked", isLocked.toString());
  }, [isLocked]);

  const showToastMsg = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- 1. LIVE DATA & ADMIN STATUS POLLING ---
  const fetchTerminalData = async () => {
    try {
      // 1. Fetch Orders
      const orderRes = await apiCall("/admin/orders", { method: "GET" });
      const deliveredOrders = orderRes.data.filter(o => o.status?.toLowerCase() === 'delivered');
      const activeOrders = orderRes.data.filter(o => o.status?.toLowerCase() !== 'delivered' && o.status?.toLowerCase() !== 'cancelled');

      setQueue(deliveredOrders.slice(0, 50));
      setStats({ pending: activeOrders.length, servedToday: deliveredOrders.length });

      // 2. Fetch Terminal Status (Check if Admin blocked/locked this counter)
      // NOTE: Ensure your backend has a route like `/counter/status` returning { status: "Blocked" | "Locked" | "Active" }
      const statusRes = await apiCall("/counter/status", { method: "GET" }).catch(() => null);
      if (statusRes && statusRes.data) {
        const currentStatus = statusRes.data.status;
        setAdminStatus(currentStatus);
        
        // If admin forces a lock, trigger the local lock screen instantly
        if (currentStatus === "Locked" && !isLocked) {
          setIsLocked(true);
        }
      }
    } catch (error) {
      console.warn("Silent sync failed");
    }
  };

  useEffect(() => {
    fetchTerminalData();
    const t = setInterval(fetchTerminalData, 5000); // Polling every 5s for rapid Admin response
    return () => clearInterval(t);
  }, [isLocked]);

  // --- 2. IDLE LOCK TIMER ---
  useEffect(() => {
    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      if (!isLocked && adminStatus !== "Blocked") {
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
  }, [isLocked, adminStatus]);

  // --- 3. LOCK SCREEN LOGIC ---
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
    // Prevent manual unlock if the Admin strictly blocked the terminal
    if (!isLocked || adminStatus === "Blocked") return;
    
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
  }, [isLocked, isPinError, adminStatus]);

  useEffect(() => {
    // If admin has forced a lock, prevent the UI from unlocking even if PIN is right
    // (Assuming the admin must unlock it from the dashboard. Alternatively, you can allow PIN unlock).
    if (isLocked && pin.length === 6) {
      if (pin === "123456" && adminStatus !== "Blocked") { 
        setTimeout(() => {
          setIsLocked(false);
          setPin("");
          showToastMsg("Terminal Unlocked", "success");
        }, 200);
      } else {
        setIsPinError(true);
        setTimeout(() => {
          setPin("");
          setIsPinError(false);
        }, 500);
      }
    }
  }, [pin, isLocked, adminStatus]);

  // --- 4. SCANNER LOGIC ---
  const handleInitialScan = async (rawString) => {
    let cleanId = String(rawString).trim().toUpperCase();
    if (!cleanId) return;

    setIsProcessing(true);
    
    try {
      const res = await apiCall(`/admin/orders/${cleanId}`);
      if (res.data) {
        if (res.data.status?.toLowerCase() === 'delivered' || res.data.status?.toLowerCase() === 'completed') {
          showToastMsg("Order already served!", "warn");
          if (scannerRef.current && mode === "camera") setTimeout(() => scannerRef.current.resume(), 2500);
        } else {
          showToastMsg("Order Found! Ready to dispense.", "success");
          setScannedOrderPreview(res.data);
        }
      }
    } catch (err) {
      showToastMsg("Invalid Code or Not Found.", "error");
      if (scannerRef.current && mode === "camera") setTimeout(() => scannerRef.current.resume(), 2500);
    } finally {
      setIsProcessing(false);
      setManualItem({ receiptId: "" }); 
    }
    setSearchId(""); 
  };

  const handleManualEntry = (e) => {
    e.preventDefault();
    if (!manualItem.receiptId) return showToastMsg("Enter an ID or Code.", "error");
    handleInitialScan(manualItem.receiptId);
  };

  // --- 5. DELIVERY ACTION ---
  const handleProceedToDeliver = async (orderId) => {
    setIsDelivering(true);
    try {
      await apiCall(`/admin/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "Delivered" })
      });
      
      setScannedOrderPreview(null);
      showToastMsg("Order served successfully", "success");
      setShowSuccessAnim(true); 
      
      fetchTerminalData(); 
      
      if (scannerRef.current && mode === "camera") {
        setTimeout(() => scannerRef.current.resume(), 1000);
      }
      
    } catch (e) {
      showToastMsg("Failed to update status", "error");
    } finally {
      setIsDelivering(false);
    }
  };

  const handleModeSwitch = (newMode) => {
    stopCamera();
    setMode(newMode);
    setSetupPhase(true);
    setHardwareReady(false);
  };

  /* --- 6. HARDWARE SCANNER ENGINE (USB) --- */
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleHardwareKeyDown = (e) => {
      if (mode !== "hardware" || setupPhase || !hardwareReady || isLocked || showOrderModal || adminStatus === "Blocked") return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 100) buffer = ""; 
      
      if (e.key === 'Enter') {
        if (buffer.length > 3) {
          e.preventDefault();
          handleInitialScan(buffer);
        }
        buffer = "";
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
      lastKeyTime = currentTime;
    };

    window.addEventListener('keydown', handleHardwareKeyDown, true);
    return () => window.removeEventListener('keydown', handleHardwareKeyDown, true);
  }, [mode, setupPhase, hardwareReady, isLocked, showOrderModal, adminStatus]);

  const initHardwareScanner = () => {
    setSetupPhase(false);
    showToastMsg("Detecting USB Scanner...", "info");
    setTimeout(() => {
      setHardwareReady(true);
      showToastMsg("Scanner Connected & Ready", "success");
    }, 1500);
  };

  /* --- 7. CAMERA SETUP (OPTIMIZED FOR QR CODES) --- */
  const initCameraScanner = async () => {
    setSetupPhase(false);
    showToastMsg("Initializing Camera...", "info");

    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setHasBarcodeSupport(false);
        showToastMsg("Camera not present or accessible", "error");
        setSetupPhase(true);
        return;
      }

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      
      await scanner.start(
        { facingMode: "environment" },
        { 
          fps: 15, 
          qrbox: { width: 280, height: 280 }, 
          disableFlip: false
        },
        (decodedText) => {
          if (scannerRef.current) scannerRef.current.pause();
          handleInitialScan(decodedText);
        }
      );
      
      setIsCameraActive(true);
      showToastMsg("Camera Active - Auto Scanning", "success");
    } catch (err) {
      console.error(err);
      showToastMsg("Camera access denied or unavailable.", "error");
      setSetupPhase(true);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.error("Safely caught camera termination delay.");
      }
      scannerRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (mode === "manual" || mode === "hardware" || isLocked || showOrderModal || adminStatus === "Blocked") stopCamera();
    return () => { stopCamera(); };
  }, [mode, isLocked, showOrderModal, adminStatus]);

  return (
    <>
      {toast && <Toast {...toast} />}
      <SuccessOverlay show={showSuccessAnim} onClose={() => setShowSuccessAnim(false)} />
      
      {scannedOrderPreview && (
        <OrderPreviewModal
          order={scannedOrderPreview}
          isDelivering={isDelivering}
          onClose={() => {
            setScannedOrderPreview(null);
            if (scannerRef.current && mode === "camera") setTimeout(() => scannerRef.current.resume(), 1000);
          }}
          onDeliver={handleProceedToDeliver}
        />
      )}

      {/* ================= ADMIN BLOCKED OVERLAY (Highest Priority) ================= */}
      {adminStatus === "Blocked" && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-red-950/95 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="bg-white rounded-[2rem] p-10 max-w-md text-center shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6 border-8 border-red-100">
              <Ban size={40} className="text-red-600" strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Terminal Blocked</h2>
            <p className="text-slate-500 mt-3 font-medium leading-relaxed">
              This counter terminal has been actively suspended by the central administrator.
            </p>
            <div className="mt-8 bg-slate-50 px-6 py-4 rounded-xl border border-slate-100 w-full flex items-center gap-3 text-left">
              <ShieldAlert size={24} className="text-amber-500 shrink-0" />
              <p className="text-xs text-slate-600 font-bold">Please contact IT Support or access the Admin Panel to unblock and restore service to this terminal.</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= STANDARD LOCK SCREEN OVERLAY ================= */}
      <div 
        className={`fixed inset-0 z-[9500] flex items-center justify-center bg-black/70 backdrop-blur-2xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isLocked && adminStatus !== "Blocked" ? "opacity-100 pointer-events-auto visible" : "opacity-0 pointer-events-none invisible"
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

          <div className="flex justify-center gap-5 mb-12 h-4">
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

      {/* DASHBOARD WRAPPER */}
      <div 
        className={`flex h-screen w-full bg-[#F2F5F8] font-sans text-gray-800 overflow-hidden selection:bg-blue-200 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] origin-center ${
          isLocked || showOrderModal || adminStatus === "Blocked" ? "scale-[0.97] blur-sm brightness-50 pointer-events-none" : "scale-100 blur-0 brightness-100"
        }`}
      >
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} isMobile={window.innerWidth < 1024} />

        <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#F2F5F8] relative z-0 transition-all duration-300 lg:pl-64">
          <Navbar servedCount={queue.length} onMenuClick={() => setIsSidebarOpen(true)} />

          <div className="flex-1 overflow-y-auto p-4 lg:p-6 flex flex-col gap-6">
            
            <div className="w-full flex flex-col gap-6 min-w-0 h-[450px]">
              <div className="bg-white p-4 lg:p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col relative overflow-hidden h-full">
                
                <div className="bg-gray-100/80 p-1.5 rounded-2xl flex shadow-inner border border-black/5 w-full shrink-0 relative z-10">
                  <button onClick={() => handleModeSwitch("camera")} className={`flex-1 py-2.5 text-xs lg:text-sm font-bold rounded-xl transition-all duration-300 flex justify-center items-center gap-2 ${mode === "camera" ? "bg-white text-[#003B73] shadow-md" : "text-gray-500 hover:text-gray-700"}`}>
                    <QrCode size={16} /> <span className="hidden sm:inline">Camera Scanner</span>
                  </button>
                  <button onClick={() => handleModeSwitch("hardware")} className={`flex-1 py-2.5 text-xs lg:text-sm font-bold rounded-xl transition-all duration-300 flex justify-center items-center gap-2 ${mode === "hardware" ? "bg-white text-[#003B73] shadow-md" : "text-gray-500 hover:text-gray-700"}`}>
                    <Barcode size={16} /> <span className="hidden sm:inline">Hardware Scanner</span>
                  </button>
                  <button onClick={() => handleModeSwitch("manual")} className={`flex-1 py-2.5 text-xs lg:text-sm font-bold rounded-xl transition-all duration-300 flex justify-center items-center gap-2 ${mode === "manual" ? "bg-white text-[#003B73] shadow-md" : "text-gray-500 hover:text-gray-700"}`}>
                    <Keyboard size={16} /> <span className="hidden sm:inline">Manual Entry</span>
                  </button>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center mt-6 w-full h-full relative">
                  
                  {mode === "camera" && (
                    setupPhase ? (
                      <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 w-full max-w-sm mx-auto text-center">
                        <div className="w-28 h-28 bg-blue-50 rounded-full flex items-center justify-center mb-6 relative shadow-inner">
                          <QrCode size={40} className="text-[#003B73] animate-[bounce_3s_infinite] relative z-10" />
                          <div className="absolute inset-0 border-[3px] border-[#003B73]/20 rounded-full animate-ping"></div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">QR & Barcode Camera</h3>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">The camera will automatically read the code once it is clearly in frame.</p>
                        
                        {!hasBarcodeSupport && (
                          <div className="mb-4 flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg text-xs font-bold">
                            <AlertTriangle size={14} /> Barcode API not supported by browser.
                          </div>
                        )}

                        <button onClick={initCameraScanner} className="w-full bg-[#003B73] text-white py-3.5 rounded-xl font-bold text-sm shadow-[0_8px_20px_rgba(0,59,115,0.2)] hover:bg-[#002855] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                          <Camera size={18} /> Initialize Auto-Camera
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in duration-500">
                        <div className="bg-[#1C1C1E] w-full max-w-xl aspect-video rounded-3xl border-2 border-dashed border-gray-600 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                          <div id="qr-reader" className="w-full h-full absolute inset-0 [&>video]:object-cover" />
                          
                          {!isCameraActive ? (
                            <div className="text-center text-gray-400 p-4 relative z-10 bg-[#1C1C1E]"><CameraOff size={40} className="mx-auto mb-2 opacity-50" /><p className="text-xs font-medium">Camera Offline</p></div>
                          ) : (
                            <>
                              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-none"></div>
                              <div className="absolute aspect-square w-[70%] max-w-[280px] bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] rounded-2xl border border-white/20 pointer-events-none">
                                <div className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-green-400 rounded-tl-2xl"></div>
                                <div className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-green-400 rounded-tr-2xl"></div>
                                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-green-400 rounded-bl-2xl"></div>
                                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-green-400 rounded-br-2xl"></div>
                                <div className="w-full h-[2px] bg-green-400 absolute animate-[pulse_2s_infinite] shadow-[0_0_15px_rgba(74,222,128,1)]"></div>
                              </div>
                              <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                                <span className="bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wide flex items-center justify-center gap-2 w-max mx-auto">
                                  {isProcessing ? <Loader2 size={12} className="animate-spin text-green-400" /> : <ScanLine size={12} className="text-green-400"/>} 
                                  {isProcessing ? "Fetching Order..." : "Auto-Scanning..."}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex w-full max-w-xl mt-6">
                          <button onClick={() => { stopCamera(); setSetupPhase(true); }} className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 transition-all active:scale-[0.98]">
                            Stop Camera
                          </button>
                        </div>
                      </div>
                    )
                  )}

                  {mode === "hardware" && (
                    setupPhase ? (
                      <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 w-full max-w-sm mx-auto text-center">
                        <div className="w-28 h-28 bg-purple-50 rounded-full flex items-center justify-center mb-6 relative shadow-inner">
                          <Usb size={40} className="text-purple-600 absolute bottom-6 right-6 opacity-40" />
                          <Barcode size={50} className="text-purple-700 relative z-10 animate-[bounce_3s_infinite]" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">USB Scanner</h3>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">Connect your handheld scanner via USB or Bluetooth. The system will capture input automatically.</p>
                        <button onClick={initHardwareScanner} className="w-full bg-[#003B73] text-white py-3.5 rounded-xl font-bold text-sm shadow-[0_8px_20px_rgba(0,59,115,0.2)] hover:bg-[#002855] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                          Detect Scanner
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in duration-500 max-w-sm mx-auto text-center">
                        {hardwareReady ? (
                          <>
                            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 relative shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                              <Barcode size={36} className="text-green-600 relative z-10" />
                              <div className="absolute inset-x-4 h-[2px] bg-green-500 shadow-[0_0_10px_rgba(34,197,94,1)] rounded-full"></div>
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">Ready to Scan</h3>
                            <p className="text-sm text-gray-500 mb-6 px-4">Scanner connected. Point the hardware scanner at a QR code or barcode and pull the trigger.</p>
                          </>
                        ) : (
                          <>
                            <Loader2 size={40} className="text-blue-500 animate-spin mb-6" />
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Detecting Input</h3>
                            <p className="text-sm text-gray-500 mb-6">Please wait while the system registers hardware...</p>
                          </>
                        )}
                        <button onClick={() => setSetupPhase(true)} className="px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all active:scale-[0.98]">
                          Cancel Detection
                        </button>
                      </div>
                    )
                  )}

                  {mode === "manual" && (
                    setupPhase ? (
                      <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 w-full max-w-sm mx-auto text-center">
                        <div className="w-28 h-28 bg-orange-50 rounded-full flex items-center justify-center mb-6 shadow-inner relative">
                          <Keyboard size={48} className="text-orange-600 animate-[bounce_3s_infinite] relative z-10" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Manual Input</h3>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">Keyboard entry mode. Type the receipt ID exactly as it appears to pull up the docket.</p>
                        <button onClick={() => setSetupPhase(false)} className="w-full bg-[#003B73] text-white py-3.5 rounded-xl font-bold text-sm shadow-[0_8px_20px_rgba(0,59,115,0.2)] hover:bg-[#002855] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                          Open Keyboard Panel
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleManualEntry} className="flex flex-col w-full max-w-md mx-auto justify-center animate-in slide-in-from-bottom-8 duration-500">
                        <div className="bg-gray-50/80 p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Reference ID (Required)</label>
                            <input 
                              type="text" autoFocus required
                              placeholder="e.g. ORD-123456" 
                              className="w-full bg-white border border-gray-200 px-4 py-3.5 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#003B73]/20 focus:border-[#003B73] outline-none transition-all shadow-inner uppercase" 
                              value={manualItem.receiptId} 
                              onChange={(e) => setManualItem({...manualItem, receiptId: e.target.value})} 
                            />
                          </div>
                          <div>
                            <button disabled={isProcessing} type="submit" className="w-full h-[46px] bg-[#003B73] hover:bg-[#002855] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all disabled:opacity-70">
                              {isProcessing ? <Loader2 size={18} className="animate-spin" /> : "Fetch Docket"}
                            </button>
                          </div>
                        </div>
                      </form>
                    )
                  )}

                </div>
              </div>
            </div>

            <div className="w-full pb-6">
              <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden w-full">
                <div className="p-4 lg:p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h2 className="font-bold text-gray-800 text-base lg:text-lg">Served Transactions (History)</h2>
                  <span className="text-xs font-bold text-[#003B73] bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">Today: {queue.length}</span>
                </div>
                
                <div className="overflow-x-auto max-h-[350px]">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="bg-white text-xs text-gray-400 uppercase tracking-wider font-bold sticky top-0 shadow-sm z-10 border-b border-gray-100">
                      <tr>
                        <th className="py-4 px-6">Ref ID</th>
                        <th className="py-4 px-6">Source</th>
                        <th className="py-4 px-6">Total Amount</th>
                        <th className="py-4 px-6">Timestamp</th>
                        <th className="py-4 px-6">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-gray-700">
                      {queue.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-16 text-center text-gray-400 font-medium">
                            <CheckCircle2 size={32} className="mx-auto text-gray-300 mb-3" />
                            No orders processed yet today.
                          </td>
                        </tr>
                      ) : (
                        queue.map((order, idx) => (
                          <tr key={idx} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                            <td className="py-4 px-6 font-bold text-gray-900">{order.id || order.orderId}</td>
                            <td className="py-4 px-6 font-medium">{order.customer || order.user?.name || "Counter"}</td>
                            <td className="py-4 px-6 font-bold text-green-700">₹{order.totalAmount || (order.total && order.total.replace('₹', ''))}</td>
                            <td className="py-4 px-6 text-gray-500">{order.time || new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="py-4 px-6">
                              <span className="px-3 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-bold shadow-sm bg-emerald-50 text-emerald-700 border border-emerald-100">
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}