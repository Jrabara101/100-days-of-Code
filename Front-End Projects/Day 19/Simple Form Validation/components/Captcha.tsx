import React, { useState } from 'react';
import { Loader2, Check } from 'lucide-react';

interface CaptchaProps {
  onVerify: (verified: boolean) => void;
  error?: string;
}

const Captcha: React.FC<CaptchaProps> = ({ onVerify, error }) => {
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  const handleClick = () => {
    if (checked || loading) return;

    setLoading(true);
    // Simulate network request for captcha verification
    setTimeout(() => {
      setLoading(false);
      setChecked(true);
      onVerify(true);
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className={`relative w-full max-w-[300px] h-[74px] bg-[#222] rounded-[3px] border ${error ? 'border-red-500' : 'border-[#d3d3d3] border-opacity-20'} shadow-sm flex items-center justify-between px-3`}>
        <div className="flex items-center gap-3">
          <div 
            onClick={handleClick}
            className={`w-[28px] h-[28px] border-[2px] rounded-[2px] bg-white cursor-pointer flex items-center justify-center hover:border-gray-400 transition-colors ${checked ? 'border-transparent' : 'border-[#c1c1c1]'}`}
          >
            {loading && <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />}
            {checked && <Check className="w-7 h-7 text-green-600" strokeWidth={3} />}
          </div>
          <span className="text-[#dedede] text-sm font-normal select-none cursor-default" onClick={handleClick}>
            I'm not a robot
          </span>
        </div>
        
        <div className="flex flex-col items-center justify-center opacity-70">
           <svg role="img" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-gray-400 mb-[2px]">
                <path d="M12.02 0C18.669 0 24.06 5.381 24.06 12.02C24.06 18.659 18.669 24.04 12.02 24.04C5.371 24.04 0 18.659 0 12.02C0 5.381 5.371 0 12.02 0ZM12.02 21.661C17.346 21.661 21.679 17.346 21.679 12.02C21.679 6.694 17.346 2.379 12.02 2.379C6.694 2.379 2.361 6.694 2.361 12.02C2.361 17.346 6.694 21.661 12.02 21.661ZM17.202 9.38C17.653 10.331 17.904 11.391 17.904 12.512C17.904 15.761 15.269 18.396 12.02 18.396C8.771 18.396 6.136 15.761 6.136 12.512C6.136 9.263 8.771 6.628 12.02 6.628C12.33 6.628 12.64 6.657 12.941 6.706V8.98C12.65 8.941 12.34 8.911 12.02 8.911C10.02 8.911 8.419 10.512 8.419 12.512C8.419 14.512 10.02 16.113 12.02 16.113C14.02 16.113 15.621 14.512 15.621 12.512C15.621 11.831 15.461 11.191 15.18 10.631L17.202 9.38ZM15.861 6.077L14.43 7.509C15.02 8.169 15.42 8.99 15.53 9.911H17.842C17.691 8.45 16.941 7.129 15.861 6.077ZM8.179 6.097C7.099 7.149 6.349 8.47 6.198 9.931H8.51C8.62 9.01 9.02 8.189 9.61 7.529L8.179 6.097Z"/>
            </svg>
            <span className="text-[9px] text-gray-400 leading-tight">reCAPTCHA</span>
            <div className="text-[8px] text-gray-400 leading-tight">
                <span className="hover:underline cursor-pointer">Privacy</span> - <span className="hover:underline cursor-pointer">Terms</span>
            </div>
        </div>
      </div>
       <div className={`text-red-500 text-xs h-4 ml-1 transition-opacity duration-200 ${error ? 'opacity-100' : 'opacity-0'}`}>
        {error}
      </div>
    </div>
  );
};

export default Captcha;