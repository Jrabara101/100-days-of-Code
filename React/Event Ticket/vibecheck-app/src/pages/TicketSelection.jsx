import { Link } from 'react-router-dom';

export default function TicketSelection() {
  return (
    <>
      <main className="pt-20 pb-40">
        {/* React Router handles Back via Layout so no need for TopAppBar here */}

        {/* Hero Banner Section */}
        <section className="px-6 mb-8">
          <div className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-[2rem] overflow-hidden group">
            <img
              alt="Neon Dreams Midnight Rave"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuChUeV97YxVOCVg9Xwz-uYzs2Vru13Lk8LTULyDphT82OUTVGDVYwla4Q-WsOcxPkMpfZAL0fQfwcFwL_9nwGIC4_e0cPP-eXs8fclE5s8JgrfNzSf2Mc4Qx9E2gvy_n_Yolk7U1sonJHYpnnmtONOEefkZUoEDcpXTZIrsLqD9e-zOj--n2V1Joqrev6nBMESCHgdZnSbdRZwMIUYktXaDiTXMAVQ_jMQg_jiXUMTgDWGx7x3ca954mSa_2LVJSEEeKbjmhJ9KTxs"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent"></div>
            <div className="absolute bottom-6 left-8 right-8">
              <span className="inline-block px-3 py-1 bg-secondary text-on-secondary text-[10px] font-bold tracking-widest uppercase rounded-full mb-3">
                Trending
              </span>
              <h2 className="font-headline text-4xl md:text-6xl font-extrabold tracking-tighter text-white mb-2">
                Neon Dreams: Midnight Rave
              </h2>
              <div className="flex items-center gap-4 text-white/80 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-sm">calendar_today</span>
                  <span className="text-sm">AUG 24, 2024</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-sm">location_on</span>
                  <span className="text-sm">THE GRID, BERLIN</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ticket Tiers */}
        <section className="px-6 mb-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h3 className="font-headline text-2xl font-bold text-white mb-1">Select Tickets</h3>
              <p className="text-on-surface-variant text-sm">Choose your experience level</p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-secondary text-xs font-bold tracking-wider uppercase">
              <span className="material-symbols-outlined text-sm">verified</span>
              Official Resale Available
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container-low rounded-[2rem] p-6 flex flex-col justify-between transition-all hover:bg-surface-container border border-transparent hover:border-outline-variant/20 group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">confirmation_number</span>
                  </div>
                  <span className="text-2xl font-black text-white">$45</span>
                </div>
                <h4 className="font-headline text-xl font-bold text-white mb-2">General Admission</h4>
                <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
                  Experience the heart of the pulse with full access to the main dance floor and standard zones.
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 bg-surface-container-highest rounded-2xl p-2">
                  <button className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-white hover:bg-surface-container-high active:scale-90 transition-all">
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                  <span className="font-headline font-bold text-lg w-4 text-center">0</span>
                  <button className="w-10 h-10 rounded-xl bg-primary text-black flex items-center justify-center hover:brightness-110 active:scale-90 transition-all">
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-surface-container rounded-[2rem] p-6 flex flex-col justify-between border-2 border-primary/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 px-4 py-1 bg-primary text-black text-[10px] font-black uppercase tracking-tighter rounded-bl-xl">
                Popular
              </div>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">auto_awesome</span>
                  </div>
                  <span className="text-2xl font-black text-white">$75</span>
                </div>
                <h4 className="font-headline text-xl font-bold text-white mb-2">Vibe Experience</h4>
                <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
                  Immersive 360 visuals access, dedicated express bar entry, and limited edition event poster.
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 bg-surface-container-highest rounded-2xl p-2">
                  <button className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-white hover:bg-surface-container-high active:scale-90 transition-all">
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                  <span className="font-headline font-bold text-lg w-4 text-center">2</span>
                  <button className="w-10 h-10 rounded-xl bg-primary text-black flex items-center justify-center hover:brightness-110 active:scale-90 transition-all">
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low rounded-[2rem] p-6 flex flex-col justify-between transition-all hover:bg-surface-container border border-transparent hover:border-outline-variant/20 group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">diamond</span>
                  </div>
                  <span className="text-2xl font-black text-white">$120</span>
                </div>
                <h4 className="font-headline text-xl font-bold text-white mb-2">Royal Access</h4>
                <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
                  Elevated VIP lounge, private entrance, inclusive premium drinks, and artist meet-and-greet chance.
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 bg-surface-container-highest rounded-2xl p-2">
                  <button className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-white hover:bg-surface-container-high active:scale-90 transition-all">
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                  <span className="font-headline font-bold text-lg w-4 text-center">0</span>
                  <button className="w-10 h-10 rounded-xl bg-primary text-black flex items-center justify-center hover:brightness-110 active:scale-90 transition-all">
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Promo & Trust */}
        <section className="px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="bg-surface-container-low p-8 rounded-[2rem]">
            <label className="block font-headline font-bold text-white mb-4">Promo Code</label>
            <div className="flex gap-3">
              <input
                className="flex-1 bg-surface-container-highest border-none rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-primary-dim transition-all outline-none"
                placeholder="Enter code"
                type="text"
              />
              <button className="bg-surface-container-high px-8 rounded-2xl font-bold text-primary hover:bg-surface-variant transition-colors active:scale-95">
                Apply
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-surface-container-low transition-colors">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                <span className="material-symbols-outlined">shield_lock</span>
              </div>
              <div>
                <h5 className="font-bold text-white">Secure Transaction</h5>
                <p className="text-on-surface-variant text-xs">256-bit SSL encrypted checkout for your safety.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-surface-container-low transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined">repeat</span>
              </div>
              <div>
                <h5 className="font-bold text-white">Official Resale Hub</h5>
                <p className="text-on-surface-variant text-xs">Safe and verified ticket exchange platform.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky Checkout Bar */}
      <footer className="fixed bottom-0 left-0 w-full z-50 rounded-t-[24px] bg-[#060e20]/80 backdrop-blur-2xl shadow-[0px_-20px_40px_rgba(0,0,0,0.4)]">
        <div className="flex justify-between items-center px-8 py-6 w-full max-w-7xl mx-auto">
          <div className="text-white/80 flex flex-col items-start gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Subtotal</span>
            <div className="flex items-baseline gap-1">
              <span className="text-white text-2xl font-black font-headline">$150</span>
              <span className="text-white/50 text-xs font-medium">USD</span>
            </div>
          </div>
          <Link
            to="/checkout"
            className="gradient-primary text-black rounded-[1.5rem] px-8 py-3 font-bold flex items-center gap-3 hover:brightness-110 transition-all active:scale-[0.98] duration-200"
          >
            <span>Continue</span>
            <span className="material-symbols-outlined font-bold">arrow_forward</span>
          </Link>
        </div>
      </footer>
    </>
  );
}
