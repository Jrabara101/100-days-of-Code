import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'

const ShowHidePassword = ({
  id,
  value,
  onChange,
  placeholder = 'Enter password',
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef(null)
  const eyeIconRef = useRef(null)
  const containerRef = useRef(null)

  // GSAP animation for eye icon
  useEffect(() => {
    if (eyeIconRef.current) {
      if (showPassword) {
        // Animate to "open eye" state
        gsap.to(eyeIconRef.current, {
          scale: 1.2,
          duration: 0.2,
          ease: 'back.out(1.7)',
          onComplete: () => {
            gsap.to(eyeIconRef.current, {
              scale: 1,
              duration: 0.15,
              ease: 'power2.out'
            })
          }
        })
      } else {
        // Animate to "closed eye" state
        gsap.to(eyeIconRef.current, {
          scale: 0.8,
          duration: 0.15,
          ease: 'power2.in',
          onComplete: () => {
            gsap.to(eyeIconRef.current, {
              scale: 1,
              duration: 0.2,
              ease: 'back.out(1.7)'
            })
          }
        })
      }
    }
  }, [showPassword])

  // Focus animation
  useEffect(() => {
    if (containerRef.current) {
      if (isFocused) {
        gsap.to(containerRef.current, {
          scale: 1.02,
          duration: 0.2,
          ease: 'power2.out'
        })
      } else {
        gsap.to(containerRef.current, {
          scale: 1,
          duration: 0.2,
          ease: 'power2.out'
        })
      }
    }
  }, [isFocused])

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
    
    // Add a subtle shake animation
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        x: -5,
        duration: 0.1,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      })
    }
  }

  return (
    <div 
      ref={containerRef}
      className={`password-input-container ${className} ${isFocused ? 'focused' : ''}`}
    >
      <input
        ref={inputRef}
        id={id}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="password-input"
        {...props}
      />
      <button
        type="button"
        className="toggle-password-btn"
        onClick={togglePasswordVisibility}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        tabIndex={0}
      >
        <svg
          ref={eyeIconRef}
          className="eye-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {showPassword ? (
            // Eye open (show password)
            <>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </>
          ) : (
            // Eye closed (hide password)
            <>
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </>
          )}
        </svg>
      </button>
    </div>
  )
}

export default ShowHidePassword

