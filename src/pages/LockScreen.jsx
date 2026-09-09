import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";

export default function LockScreen() {
  const [pin, setPin] = useState("");
  const [isError, setIsError] = useState(false);
  const [activeKey, setActiveKey] = useState(null); // Tracks hardware key presses for animation
  const navigate = useNavigate();

  // Number pad layout with sub-letters matching iOS
  const padKeys = [
    { num: "1", letters: "" },
    { num: "2", letters: "ABC" },
    { num: "3", letters: "DEF" },
    { num: "4", letters: "GHI" },
    { num: "5", letters: "JKL" },
    { num: "6", letters: "MNO" },
    { num: "7", letters: "PQRS" },
    { num: "8", letters: "TUV" },
    { num: "9", letters: "WXYZ" },
  ];

  // Handle number entry
  const handleNumPress = (num) => {
    setPin((prev) => {
      if (prev.length < 6 && !isError) return prev + num;
      return prev;
    });
  };

  // Handle backspace/delete
  const handleDelete = () => {
    setPin((prev) => {
      if (prev.length > 0 && !isError) return prev.slice(0, -1);
      return prev;
    });
  };

  // Hardware Keyboard Listener (Auto-capture & Animations)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is somehow focused on a random hidden input elsewhere
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (/^[0-9]$/.test(e.key)) {
        handleNumPress(e.key);
        setActiveKey(e.key); // Trigger visual press animation
      } else if (e.key === "Backspace" || e.key === "Delete") {
        handleDelete();
        setActiveKey("delete");
      }
    };

    const handleKeyUp = () => {
      setActiveKey(null); // Release visual press animation
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isError]);

  // Auto-verify when 6 digits are entered
  useEffect(() => {
    if (pin.length === 6) {
      if (pin === "123456") { // Replace with actual validation logic
        // Success: slight delay for smooth UX, then route
        setTimeout(() => navigate("/dashboard"), 200);
      } else {
        // Error: trigger shake animation
        setIsError(true);
        setTimeout(() => {
          setPin("");
          setIsError(false);
        }, 500); // Wait for shake animation to finish
      }
    }
  }, [pin, navigate]);

  return (
    <>
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-15px); }
            40%, 80% { transform: translateX(15px); }
          }
          .animate-shake {
            animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
          }
        `}
      </style>

      {/* Pure black background matching iPad lock screen */}
      <div className="min-h-screen relative flex items-center justify-center bg-black font-sans selection:bg-transparent overflow-hidden">
        
        <div className="relative z-10 flex flex-col items-center w-full max-w-md">
          
          {/* Top Branding Section */}
          <div className="flex flex-col items-center mb-10">
            <img 
              src="https://upload.wikimedia.org/wikipedia/en/thumb/a/a3/Indian_Council_of_Medical_Research_Logo.svg/1280px-Indian_Council_of_Medical_Research_Logo.svg.png" 
              alt="ICMR Logo" 
              className="h-12 w-auto mb-4 mix-blend-screen opacity-90 grayscale contrast-125"
            />
            <p className="text-gray-400 text-sm font-medium tracking-wide">Terminal 01 • Counter Staff</p>
          </div>

          {/* Lock Icon & Instruction */}
          <div className="flex flex-col items-center mb-6">
            <Lock size={20} className="text-white mb-6" />
            <h2 className="text-xl text-white font-medium tracking-wide">Enter Passcode</h2>
          </div>

          {/* 6-Digit PIN Indicator Dots */}
          <div className={`flex justify-center gap-6 mb-16 h-4 ${isError ? "animate-shake" : ""}`}>
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                  pin.length > i 
                    ? "bg-white scale-100" 
                    : "bg-transparent border-[1.5px] border-white/40"
                }`}
              />
            ))}
          </div>

          {/* iOS Style Numpad Grid */}
          <div className="grid grid-cols-3 gap-x-8 gap-y-4 px-6 w-full max-w-[340px]">
            {padKeys.map((key) => {
              // Check if this button is currently active via hardware keyboard OR touch
              const isActive = activeKey === key.num;
              
              return (
                <button
                  key={key.num}
                  onClick={() => handleNumPress(key.num)}
                  onPointerDown={() => setActiveKey(key.num)}
                  onPointerUp={() => setActiveKey(null)}
                  onPointerLeave={() => setActiveKey(null)}
                  className={`w-[78px] h-[78px] mx-auto rounded-full flex flex-col items-center justify-center transition-all duration-75 ${
                    isActive 
                      ? "bg-[#666666] scale-95" // Pressed state
                      : "bg-[#333333] hover:bg-[#444444]" // Default state
                  }`}
                >
                  <span className="text-white text-3xl font-normal leading-none mt-1">{key.num}</span>
                  <span className="text-[10px] text-white/70 font-semibold tracking-[0.1em] mt-0.5 h-3">
                    {key.letters}
                  </span>
                </button>
              );
            })}
            
            {/* Empty space for bottom left */}
            <div></div>

            {/* Zero Button */}
            <button
              onClick={() => handleNumPress("0")}
              onPointerDown={() => setActiveKey("0")}
              onPointerUp={() => setActiveKey(null)}
              onPointerLeave={() => setActiveKey(null)}
              className={`w-[78px] h-[78px] mx-auto rounded-full flex flex-col items-center justify-center transition-all duration-75 ${
                activeKey === "0" 
                  ? "bg-[#666666] scale-95" 
                  : "bg-[#333333] hover:bg-[#444444]"
              }`}
            >
              <span className="text-white text-3xl font-normal leading-none">0</span>
            </button>

            {/* Cancel/Delete Button */}
            <div className="flex items-center justify-center h-full">
              {pin.length > 0 && (
                <button
                  onClick={handleDelete}
                  onPointerDown={() => setActiveKey("delete")}
                  onPointerUp={() => setActiveKey(null)}
                  onPointerLeave={() => setActiveKey(null)}
                  className={`text-white/90 text-lg tracking-wide font-medium transition-all duration-75 ${
                    activeKey === "delete" ? "opacity-50 scale-95" : "hover:text-white"
                  }`}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}