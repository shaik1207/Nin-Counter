import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiCall } from "../utils/api";
import {
  User,
  Key,
  CheckCircle2,
  AlertCircle,
  BadgeCheck,
  Terminal,
  Loader2,
  Clock,
  ShieldCheck,
  MonitorSmartphone
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  const [formData, setFormData] = useState({
    fullName: "",
    employeeId: "",
    password: "",
  });

  // Live Terminal Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Toast Timer
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification((prev) => ({ ...prev, show: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const showToast = (message, type = "success") => {
    setNotification({ show: true, message, type });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ✅ CONNECTED TO BACKEND
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.employeeId || !formData.password) {
      showToast("Please provide your Employee ID and Password.", "error");
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN API CALL ---
        const response = await apiCall("/counter/auth/login", {
          method: "POST",
          body: JSON.stringify({
            employeeId: formData.employeeId,
            password: formData.password
          })
        });

        localStorage.setItem("authToken", response.token);
        localStorage.setItem("userName", response.user.name);
        localStorage.setItem("userRole", response.user.role);
        localStorage.setItem("employeeId", response.user.employeeId);
        localStorage.setItem("isAuth", "true");

        showToast(`Authentication successful. Welcome ${response.user.name.split(' ')[0]}!`, "success");

        setTimeout(() => {
          navigate("/dashboard");
        }, 1200);

      } else {
        // --- REGISTER API CALL ---
        if (!formData.fullName) {
          showToast("Full Name is required for registration.", "error");
          setIsLoading(false);
          return;
        }

        await apiCall("/counter/auth/register", {
          method: "POST",
          body: JSON.stringify({
            name: formData.fullName,
            employeeId: formData.employeeId,
            password: formData.password
          })
        });

        showToast("Terminal operator registered! Please log in.", "success");

        setTimeout(() => {
          setIsLogin(true);
          setFormData({ ...formData, password: "" }); 
        }, 1500);
      }
    } catch (error) {
      const errorMsg = error.message === "Failed to fetch" 
        ? "Terminal Offline. Check server connection." 
        : error.message;
      showToast(errorMsg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans overflow-hidden">
      
      {/* GLOBAL TOAST NOTIFICATION */}
      <div className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-[9999] transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${notification.show ? "translate-y-0 opacity-100 scale-100" : "-translate-y-12 opacity-0 scale-90"}`}>
        <div className="bg-[#1C1C1E]/95 backdrop-blur-3xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.3)] rounded-full px-5 py-2.5 flex items-center gap-3">
          {notification.type === "success" ? (
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="text-green-400" size={14} />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="text-red-400" size={14} />
            </div>
          )}
          <span className="text-sm font-semibold text-gray-100 tracking-wide pr-2">{notification.message}</span>
        </div>
      </div>

      {/* LEFT PANE: TERMINAL BRANDING */}
      <div className="hidden lg:flex w-5/12 bg-[#003B73] relative flex-col justify-between p-12 overflow-hidden shadow-2xl z-10">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[50%] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-xl mb-8 p-3">
            <img 
              src="https://upload.wikimedia.org/wikipedia/en/thumb/a/a3/Indian_Council_of_Medical_Research_Logo.svg/1280px-Indian_Council_of_Medical_Research_Logo.svg.png" 
              alt="ICMR Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-4xl xl:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            NIN E-Canteen<br/>Counter System
          </h1>
          <p className="text-blue-200 text-lg font-medium max-w-md leading-relaxed">
            Secure Point-of-Sale terminal for authorized ICMR-NIN personnel. Verify identity to access the dispatch queue.
          </p>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl text-white">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <MonitorSmartphone size={24} className="text-blue-300" />
              <div>
                <p className="text-xs font-bold text-blue-300 uppercase tracking-widest">Terminal ID</p>
                <p className="text-sm font-bold tracking-wide">POS-T01</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-green-500/20 text-green-300 px-3 py-1.5 rounded-full border border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-xs font-bold uppercase tracking-wider">Online</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-0.5">System Time</p>
              <p className="text-lg font-black tracking-widest tabular-nums">
                {currentTime.toLocaleTimeString('en-IN', { hour12: false })}
              </p>
            </div>
            <ShieldCheck size={32} className="text-blue-300 opacity-50" />
          </div>
        </div>
      </div>

      {/* RIGHT PANE: AUTHENTICATION FORM */}
      <div className="w-full lg:w-7/12 flex flex-col justify-center items-center bg-[#F8FAFC] p-6 sm:p-12 relative">
        <div className="w-full max-w-md">
          
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2">
              {isLogin ? "Operator Login" : "Register Operator"}
            </h2>
            <p className="text-gray-500 font-medium">
              {isLogin ? "Enter your ID to access the counter dashboard." : "Create a new terminal access profile."}
            </p>
          </div>

          <div className="bg-gray-200/60 p-1.5 rounded-2xl flex mb-8">
            <button
              onClick={() => { setIsLogin(true); setFormData({ ...formData, password: "" }); }}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${isLogin ? "bg-white text-[#003B73] shadow-[0_2px_10px_rgba(0,0,0,0.05)]" : "text-gray-500 hover:text-gray-700"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setFormData({ ...formData, password: "" }); }}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${!isLogin ? "bg-white text-[#003B73] shadow-[0_2px_10px_rgba(0,0,0,0.05)]" : "text-gray-500 hover:text-gray-700"}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {!isLogin && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Operator Full Name</label>
                <div className="relative">
                  <User size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#003B73]/20 focus:border-[#003B73] outline-none transition-all shadow-sm placeholder:font-medium placeholder:text-gray-400"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Employee ID</label>
              <div className="relative">
                <BadgeCheck size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  placeholder="e.g. EMP001"
                  className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#003B73]/20 focus:border-[#003B73] outline-none transition-all shadow-sm uppercase placeholder:font-medium placeholder:text-gray-400 placeholder:normal-case"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Secure Passcode</label>
              <div className="relative">
                <Key size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-lg tracking-widest font-black text-gray-900 focus:ring-2 focus:ring-[#003B73]/20 focus:border-[#003B73] outline-none transition-all shadow-sm placeholder:text-sm placeholder:tracking-normal placeholder:font-medium placeholder:text-gray-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#003B73] hover:bg-[#002855] text-white py-4.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(0,59,115,0.15)] transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 text-base h-14 mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  <Terminal size={20} /> {isLogin ? "Unlock Terminal" : "Create Operator Profile"}
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}