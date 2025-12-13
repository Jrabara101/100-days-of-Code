import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  error?: string;
  touched?: boolean;
  isTextArea?: boolean;
}

const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  touched, 
  isTextArea = false,
  className = '',
  ...props 
}) => {
  const baseClasses = "w-full bg-[#0a0a0a] border text-white px-4 py-3 rounded-md outline-none transition-all duration-200 focus:ring-1 focus:ring-primary/50 placeholder-gray-600";
  const borderClass = touched && error ? "border-red-500 focus:border-red-500" : "border-border focus:border-gray-500";

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-gray-400 text-sm font-medium ml-1">
        {label}
      </label>
      
      {isTextArea ? (
        <textarea
          className={`${baseClasses} ${borderClass} min-h-[120px] resize-y ${className}`}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          className={`${baseClasses} ${borderClass} ${className}`}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      
      <div className={`text-red-500 text-xs h-4 ml-1 transition-opacity duration-200 ${touched && error ? 'opacity-100' : 'opacity-0'}`}>
        {error}
      </div>
    </div>
  );
};

export default Input;