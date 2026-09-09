import React, { useState, useEffect, useRef } from "react";
import { 
  CheckCircle2, AlertCircle, Loader2, Lock, Delete, 
  User, Shield, MonitorSmartphone, Bell, AlertTriangle, 
  Save, X, Key, Fingerprint, MapPin
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { apiCall } from "../utils/api";

const Settings = () => {
  // --- LAYOUT & NAVIGATION STATE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("Profile");

  // Track window size for sidebar behavior
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- SECURITY: PERSISTENT LOCK SCREEN STATE ---
  const [isLocked, setIsLocked] = useState(() => {
    return localStorage.getItem("terminalLocked") === "true"; 
  });
  const [pin, setPin] = useState("");
  const [isPinError, setIsPinError] = useState(false);
  const [activeKey, setActiveKey] = useState(null);
  
  // Custom Settings State
  const [currentSavedPin, setCurrentSavedPin] = useState(() => localStorage.getItem("terminalPin") || "123456");
  const [autoLockTimer, setAutoLockTimer] = useState(() => localStorage.getItem("autoLockTimer") || "5");

  useEffect(() => {
    localStorage.setItem("terminalLocked", isLocked.toString());
  }, [isLocked]);

  useEffect(() => {
    localStorage.setItem("autoLockTimer", autoLockTimer);
  }, [autoLockTimer]);

  useEffect(() => {
    localStorage.setItem("terminalPin", currentSavedPin);
  }, [currentSavedPin]);

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
        timeout = setTimeout(() => setIsLocked(true), parseInt(autoLockTimer) * 60000); 
      }
    };
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      clearTimeout(timeout);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [isLocked, autoLockTimer]);

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
      if (pin === currentSavedPin) { 
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
  }, [pin, isLocked, currentSavedPin]);


  // ==========================================
  // --- SETTINGS PAGE STATE & API LOGIC ---
  // ==========================================
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    staffName: "Loading...",
    counterName: "Terminal",
    loginId: "loading@canteen.nin.in",
    empNumber: "N/A",
    location: "Main Block",
    status: "Active"
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [pinData, setPinData] = useState({
    currentPin: "",
    newPin: "",
    confirmPin: ""
  });

  // Fetch real profile data from backend on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiCall("/counter/profile", { method: "GET" });
        if (response.data) {
          setProfileData(response.data);
        }
      } catch (error) {
        console.warn("Could not fetch profile, falling back to local data.");
        setProfileData(prev => ({
          ...prev,
          staffName: localStorage.getItem("userName") || "Inventory Staff",
        }));
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }
    
    setIsSavingPassword(true);
    try {
      await apiCall("/counter/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({
          oldPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      showToast("Account password updated successfully.", "success");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      showToast(error.message || "Failed to update password.", "error");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handlePinSave = (e) => {
    e.preventDefault();
    if (pinData.currentPin !== currentSavedPin) {
      showToast("Current PIN is incorrect.", "error");
      return;
    }
    if (pinData.newPin.length !== 6) {
      showToast("New PIN must be exactly 6 digits.", "error");
      return;
    }
    if (pinData.newPin !== pinData.confirmPin) {
      showToast("New PINs do not match.", "error");
      return;
    }

    setCurrentSavedPin(pinData.newPin);
    setPinData({ currentPin: "", newPin: "", confirmPin: "" });
    showToast("Quick-Unlock PIN successfully updated.", "success");
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
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center"><CheckCircle2 className="text-green-400" size={14} /></div>
          ) : toast.type === "info" ? (
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center animate-spin"><Loader2 className="text-blue-400" size={14} /></div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center"><AlertCircle className="text-red-400" size={14} /></div>
          )}
          <span className="text-sm font-semibold text-gray-100 tracking-wide pr-2">{toast.message}</span>
        </div>
      </div>

      {/* LOCK SCREEN OVERLAY */}
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
            <p className="text-gray-400 text-sm font-medium tracking-wide">{profileData.counterName || "Terminal"} • {profileData.staffName}</p>
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

      {/* MAIN LAYOUT WRAPPER */}
      <div className={`flex h-screen w-full bg-[#FBFBFC] font-sans text-gray-800 overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] origin-center ${isLocked ? "scale-[0.97] blur-md brightness-50 pointer-events-none" : "scale-100 blur-0 brightness-100"}`}>
        
        {/* SIDEBAR */}
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} isMobile={isMobile} />

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-0 transition-all duration-300 lg:pl-64">
          
          <Navbar servedCount={0} onMenuClick={() => setIsSidebarOpen(true)} />

          <div className="flex-1 overflow-y-auto p-4 lg:p-8">
            <div className="max-w-[1200px] mx-auto">
              
              {/* PAGE HEADER */}
              <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Terminal Settings</h1>
                <p className="text-gray-500 font-medium mt-1">Manage terminal configurations, security, and preferences.</p>
              </div>

              <div className="flex flex-col md:flex-row gap-8 pb-20">
                
                {/* LEFT NAVIGATION COLUMN */}
                <div className="w-full md:w-64 shrink-0 bg-white rounded-3xl p-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-gray-100 h-max sticky top-4">
                  <nav className="flex flex-col space-y-1">
                    {[
                      { name: "Profile", icon: User },
                      { name: "Security", icon: Shield },
                      { name: "Preferences", icon: MonitorSmartphone }
                    ].map((tab) => (
                      <button
                        key={tab.name}
                        onClick={() => setActiveTab(tab.name)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                          activeTab === tab.name 
                            ? "bg-blue-50 text-[#003B73]" 
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <tab.icon size={18} />
                        {tab.name}
                      </button>
                    ))}
                    
                    <div className="w-full h-px bg-gray-100 my-2"></div>
                    
                    <button onClick={() => setIsLocked(true)} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-amber-500 hover:bg-amber-50 transition-all duration-200">
                      <Lock size={18} />
                      Lock Screen Now
                    </button>
                  </nav>
                </div>

                {/* RIGHT CONTENT AREA */}
                <div className="flex-1">
                  
                  {/* --- TAB 1: PROFILE (Read Only Digital ID) --- */}
                  {activeTab === "Profile" && (
                    <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden">
                      <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Digital Identity</h2>
                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-100">
                          {profileData.status}
                        </span>
                      </div>
                      
                      <div className="p-8">
                        {isLoadingProfile ? (
                          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Loader2 size={32} className="animate-spin mb-4 text-[#003B73]" />
                            <p>Loading profile data...</p>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pb-8 border-b border-gray-100">
                              <div className="w-24 h-24 bg-gradient-to-tr from-[#003B73] to-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-900/20 shrink-0">
                                {profileData.staffName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h3 className="text-2xl font-black text-gray-900 mb-1">{profileData.staffName}</h3>
                                <p className="text-gray-500 font-medium flex items-center gap-2"><Key size={14} className="text-gray-400"/> {profileData.loginId}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                              <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Fingerprint size={14}/> EMP Number</p>
                                <p className="text-lg font-bold text-gray-900">{profileData.empNumber || "Not Assigned"}</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><MonitorSmartphone size={14}/> Terminal Name</p>
                                <p className="text-lg font-bold text-gray-900">{profileData.counterName || "General Terminal"}</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><MapPin size={14}/> Location Block</p>
                                <p className="text-lg font-bold text-gray-900">{profileData.location || "Main Canteen"}</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Shield size={14}/> Access Level</p>
                                <p className="text-lg font-bold text-gray-900">Inventory Staff</p>
                              </div>
                            </div>

                            <div className="mt-8 bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                              <AlertCircle size={20} className="text-blue-500 shrink-0 mt-0.5" />
                              <p className="text-sm font-medium text-blue-900">
                                Your profile information is managed centrally. If your name, ID, or location is incorrect, please contact the system administrator to request an update.
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* --- TAB 2: SECURITY (Password & PIN) --- */}
                  {activeTab === "Security" && (
                    <div className="space-y-6">
                      
                      {/* Change Account Password */}
                      <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                          <h2 className="text-lg font-black text-gray-900 tracking-tight">Account Login Password</h2>
                          <p className="text-xs text-gray-500 font-medium mt-1">Change the password used to log into this terminal.</p>
                        </div>
                        <form onSubmit={handlePasswordSave} className="p-6 md:p-8 space-y-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 max-w-md">
                              <label className="text-xs font-bold text-gray-500 mb-2 block">Current Password</label>
                              <input 
                                type="password" required value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                placeholder="Enter current password"
                                className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-gray-50 border border-gray-200 focus:border-[#003B73] focus:ring-1 focus:ring-[#003B73] outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-gray-500 mb-2 block">New Password</label>
                              <input 
                                type="password" required value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                placeholder="Enter new password"
                                className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-white border border-gray-200 focus:border-[#003B73] focus:ring-1 focus:ring-[#003B73] outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-gray-500 mb-2 block">Confirm New Password</label>
                              <input 
                                type="password" required value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                placeholder="Re-enter new password"
                                className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-white border border-gray-200 focus:border-[#003B73] focus:ring-1 focus:ring-[#003B73] outline-none transition-all"
                              />
                            </div>
                          </div>
                          <div className="pt-2">
                            <button type="submit" disabled={isSavingPassword} className="bg-[#003B73] hover:bg-[#002855] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2">
                              {isSavingPassword ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Update Password
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Change Quick-Unlock PIN */}
                      <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                          <h2 className="text-lg font-black text-gray-900 tracking-tight">Quick-Unlock PIN</h2>
                          <p className="text-xs text-gray-500 font-medium mt-1">A local 6-digit PIN used to quickly unlock the screen when idle.</p>
                        </div>
                        <form onSubmit={handlePinSave} className="p-6 md:p-8 space-y-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 max-w-md">
                              <label className="text-xs font-bold text-gray-500 mb-2 block">Current 6-Digit PIN</label>
                              <input 
                                type="password" required maxLength={6} value={pinData.currentPin}
                                onChange={(e) => setPinData({...pinData, currentPin: e.target.value.replace(/\D/g,'')})}
                                placeholder="••••••"
                                className="w-full px-4 py-3 rounded-xl text-sm font-semibold tracking-widest bg-gray-50 border border-gray-200 focus:border-[#003B73] focus:ring-1 focus:ring-[#003B73] outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-gray-500 mb-2 block">New 6-Digit PIN</label>
                              <input 
                                type="password" required maxLength={6} value={pinData.newPin}
                                onChange={(e) => setPinData({...pinData, newPin: e.target.value.replace(/\D/g,'')})}
                                placeholder="••••••"
                                className="w-full px-4 py-3 rounded-xl text-sm font-semibold tracking-widest bg-white border border-gray-200 focus:border-[#003B73] focus:ring-1 focus:ring-[#003B73] outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-gray-500 mb-2 block">Confirm 6-Digit PIN</label>
                              <input 
                                type="password" required maxLength={6} value={pinData.confirmPin}
                                onChange={(e) => setPinData({...pinData, confirmPin: e.target.value.replace(/\D/g,'')})}
                                placeholder="••••••"
                                className="w-full px-4 py-3 rounded-xl text-sm font-semibold tracking-widest bg-white border border-gray-200 focus:border-[#003B73] focus:ring-1 focus:ring-[#003B73] outline-none transition-all"
                              />
                            </div>
                          </div>
                          <div className="pt-2">
                            <button type="submit" className="bg-[#003B73] hover:bg-[#002855] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center gap-2">
                              <Save size={16} /> Update Quick-PIN
                            </button>
                          </div>
                        </form>
                      </div>

                    </div>
                  )}

                  {/* --- TAB 3: PREFERENCES --- */}
                  {activeTab === "Preferences" && (
                    <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden">
                      <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">System Preferences</h2>
                        <p className="text-xs text-gray-500 font-medium mt-1">Configure local terminal behavior.</p>
                      </div>
                      
                      <div className="p-8 space-y-8">
                        <div>
                          <h3 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2"><MonitorSmartphone size={18} className="text-gray-400"/> Auto-Lock Idle Timer</h3>
                          <div className="max-w-md">
                            <label className="text-xs font-bold text-gray-500 mb-2 block">Require PIN after inactivity of:</label>
                            <select 
                              value={autoLockTimer}
                              onChange={(e) => {
                                setAutoLockTimer(e.target.value);
                                showToast(`Timer updated to ${e.target.value} minutes`, "success");
                              }}
                              className="w-full px-4 py-3 rounded-xl text-sm font-bold text-gray-700 bg-white border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-sm"
                            >
                              <option value="1">1 Minute</option>
                              <option value="3">3 Minutes</option>
                              <option value="5">5 Minutes (Recommended)</option>
                              <option value="10">10 Minutes</option>
                              <option value="30">30 Minutes</option>
                            </select>
                            <p className="text-xs text-gray-400 mt-3 font-medium leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                              To protect sensitive ICMR data, the terminal will lock and blur the screen when idle. Set a lower timer if this terminal is in a high-traffic area.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Settings;