import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState('credit');

  return (
    <>
      <main className="pt-24 pb-40 px-6 max-w-lg mx-auto space-y-8">
        {/* Section 1: Order Summary */}
        <section className="space-y-4">
          <div className="flex items-end justify-between px-1">
            <h2 className="font-headline font-bold text-lg tracking-tight">Order Summary</h2>
            <Link to="/event/neon-pulse" className="text-primary text-sm font-semibold hover:underline">Edit</Link>
          </div>
          <div className="glass-card rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">confirmation_number</span>
            </div>
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-surface-container-highest flex-shrink-0">
                  <img
                    className="w-full h-full object-cover"
                    alt="Neon lights reflection"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwSw2--QGQ97-wEZ3X4TzpOTKDWWgNMPLICD5rJJBNcV2XbjEu2QOaPsxIchN2Kavp1TTu7WG8dtlvPnAgPkMmyCMsmUXEEJjytjo8dVLIE82H7zUP5JJ_KTZthyAGPCyuao3aytzje6qakOyTs0fbzjBDi_r8L7nSUdg__AKj4ETncru6ZMR8WXKhtf9cqqYcPm5bSRmR3PScwstU86rhAx2SlyotIe_hbulPH_mgCcLDdwc7faVxNuKYCFxnBcN0IYCElfK_eRI"
                  />
                </div>
                <div>
                  <h3 className="font-headline font-extrabold text-white tracking-tight">Neon Pulse 2024</h3>
                  <p className="text-on-surface-variant text-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">calendar_today</span> Oct 24, 10:00 PM
                  </p>
                </div>
              </div>
              <div className="h-px bg-outline-variant/20"></div>
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Ticket Type</span>
                  <span className="font-bold text-primary">Vibe Experience</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Quantity</span>
                  <p className="font-bold text-white">
                    2x <span className="text-sm font-normal text-on-surface-variant ml-1">$75.00 ea</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Personal Info */}
        <section className="space-y-4">
          <h2 className="font-headline font-bold text-lg tracking-tight px-1">Personal Details</h2>
          <div className="space-y-4">
            <div className="group">
              <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2 ml-1">
                Full Name
              </label>
              <input
                className="w-full bg-surface-container-highest border-none rounded-2xl p-4 text-white focus:ring-0 border-b-2 border-transparent focus:border-primary-dim transition-all outline-none placeholder:text-outline"
                placeholder="Alex Rivera"
                type="text"
              />
            </div>
            <div className="group">
              <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2 ml-1">
                Email Address
              </label>
              <input
                className="w-full bg-surface-container-highest border-none rounded-2xl p-4 text-white focus:ring-0 border-b-2 border-transparent focus:border-primary-dim transition-all outline-none placeholder:text-outline"
                placeholder="alex.r@afterdark.com"
                type="email"
              />
            </div>
          </div>
        </section>

        {/* Section 3: Payment Method */}
        <section className="space-y-4">
          <h2 className="font-headline font-bold text-lg tracking-tight px-1">Payment Method</h2>
          <div className="grid grid-cols-1 gap-3">
            <label
              className={`relative flex items-center gap-4 p-4 glass-card rounded-2xl cursor-pointer hover:bg-surface-container-highest/60 transition-all ${paymentMethod === 'credit' ? 'border-b-2 border-primary-dim' : ''}`}
            >
              <input 
                checked={paymentMethod === 'credit'} 
                onChange={() => setPaymentMethod('credit')}
                className="hidden peer" 
                name="payment" 
                type="radio" 
              />
              <span className={`material-symbols-outlined ${paymentMethod === 'credit' ? 'text-primary' : 'text-on-surface-variant'}`} style={paymentMethod === 'credit' ? { fontVariationSettings: "'FILL' 1" } : {}}>
                credit_card
              </span>
              <span className={`font-semibold ${paymentMethod === 'credit' ? 'text-white' : 'text-on-surface-variant'}`}>Credit Card</span>
              {paymentMethod === 'credit' && <span className="ml-auto material-symbols-outlined text-primary text-xl">check_circle</span>}
            </label>

            <label
              className={`relative flex items-center gap-4 p-4 glass-card rounded-2xl cursor-pointer hover:bg-surface-container-highest/60 transition-all ${paymentMethod === 'apple' ? 'border-b-2 border-primary-dim' : ''}`}
            >
              <input 
                checked={paymentMethod === 'apple'} 
                onChange={() => setPaymentMethod('apple')}
                className="hidden peer" 
                name="payment" 
                type="radio" 
              />
              <div className="w-6 h-6 flex items-center justify-center bg-white rounded-md">
                <span className="text-black font-black text-[10px]">Pay</span>
              </div>
              <span className={`font-semibold ${paymentMethod === 'apple' ? 'text-white' : 'text-on-surface-variant'}`}>Apple Pay</span>
              {paymentMethod === 'apple' && <span className="ml-auto material-symbols-outlined text-primary text-xl">check_circle</span>}
            </label>

            <label
              className={`relative flex items-center gap-4 p-4 glass-card rounded-2xl cursor-pointer hover:bg-surface-container-highest/60 transition-all ${paymentMethod === 'google' ? 'border-b-2 border-primary-dim' : ''}`}
            >
              <input 
                checked={paymentMethod === 'google'} 
                onChange={() => setPaymentMethod('google')}
                className="hidden peer" 
                name="payment" 
                type="radio" 
              />
              <div className="w-6 h-6 flex items-center justify-center bg-[#4285F4] rounded-md">
                <span className="text-white font-black text-[10px]">G</span>
              </div>
              <span className={`font-semibold ${paymentMethod === 'google' ? 'text-white' : 'text-on-surface-variant'}`}>Google Pay</span>
              {paymentMethod === 'google' && <span className="ml-auto material-symbols-outlined text-primary text-xl">check_circle</span>}
            </label>
          </div>
        </section>

        {/* Section 4: Card Details (Conditional) */}
        {paymentMethod === 'credit' && (
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <div className="group">
                <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2 ml-1">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-surface-container-highest border-none rounded-2xl p-4 pl-12 text-white outline-none focus:ring-0 border-b-2 border-transparent focus:border-primary-dim transition-all placeholder:text-outline"
                    placeholder="0000 0000 0000 0000"
                    type="text"
                  />
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                    lock
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2 ml-1">
                    Expiry
                  </label>
                  <input
                    className="w-full bg-surface-container-highest border-none rounded-2xl p-4 text-white outline-none focus:ring-0 border-b-2 border-transparent focus:border-primary-dim transition-all placeholder:text-outline"
                    placeholder="MM/YY"
                    type="text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2 ml-1">
                    CVV
                  </label>
                  <input
                    className="w-full bg-surface-container-highest border-none rounded-2xl p-4 text-white outline-none focus:ring-0 border-b-2 border-transparent focus:border-primary-dim transition-all placeholder:text-outline"
                    placeholder="***"
                    type="password"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Trust Signals */}
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="flex items-center gap-2 text-on-surface-variant/60 text-xs font-label uppercase tracking-tighter">
            <span className="material-symbols-outlined text-sm">verified_user</span>
            Verified Secure Checkout
          </div>
          <div className="flex gap-6 grayscale opacity-30">
            <span className="material-symbols-outlined text-4xl">branding_watermark</span>
            <span className="material-symbols-outlined text-4xl">shield_with_heart</span>
            <span className="material-symbols-outlined text-4xl">potted_plant</span>
          </div>
        </div>
      </main>

      {/* Sticky Pay Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-between items-center px-8 py-6 pb-10 bg-[#060e20]/90 backdrop-blur-3xl rounded-t-[2.5rem] shadow-[0px_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col justify-center">
          <span className="text-xs font-label text-on-surface-variant uppercase tracking-widest">Total Amount</span>
          <span className="text-white text-2xl font-headline font-extrabold tracking-tight">
            $150.00 <span className="text-xs font-normal text-on-surface-variant">USD</span>
          </span>
        </div>
        <button onClick={() => alert("Checkout complete! Now navigating to 'My Tickets'...") || window.location.assign("/my-tickets")} className="gradient-primary text-black px-10 py-5 rounded-2xl shadow-[0_0_20px_rgba(186,158,255,0.3)] flex items-center gap-2 font-headline font-extrabold hover:brightness-110 transition-all active:scale-[0.98] duration-150 group">
          Pay Now
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>
      </nav>
    </>
  );
}
