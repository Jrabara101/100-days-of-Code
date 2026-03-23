import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function MyTickets() {
  const [tab, setTab] = useState('upcoming');
  
  return (
    <>
      <main className="pt-24 px-6 pb-32 max-w-2xl mx-auto space-y-8">
        {/* Search Section */}
        <section className="relative">
          <div className="flex items-center bg-surface-container-highest rounded-2xl px-4 py-3 group focus-within:ring-2 ring-primary-dim/30 transition-all">
            <span className="material-symbols-outlined text-outline mr-3">search</span>
            <input
              className="bg-transparent border-none outline-none focus:ring-0 text-on-surface placeholder:text-outline w-full font-headline font-medium"
              placeholder="Search events or venues..."
              type="text"
            />
            <span className="material-symbols-outlined text-outline ml-2 hover:text-primary transition-colors cursor-pointer">
              tune
            </span>
          </div>
        </section>

        {tab === 'upcoming' && (
          <section className="space-y-6">
            <div className="flex justify-between items-end">
              <h2 className="text-2xl font-bold font-headline text-on-surface">Upcoming</h2>
              <span className="text-sm font-semibold font-label uppercase tracking-widest text-primary">2 Events</span>
            </div>

            {/* Ticket Card 1 */}
            <div className="group relative overflow-hidden rounded-[2rem] bg-surface-container-low shadow-2xl transition-all duration-300 hover:scale-[1.01]">
              <div className="aspect-[16/9] relative overflow-hidden">
                <img
                  alt="Concert Stage"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYPcQpXHOCw1Dmrl3DivlfjQI1g_DOc8bzuGhgCNWH-9kWK0CjKs0xU_jITwwHOLna0NNJk0P8-uiHA0lHcXfzN3UBbBsKNPV-VNrocug4-mmNAdIqOgXrt21G-iZOM2HW_TMdM5UtaXd2WGdzNciXDmY3AnlqR3hER2-nd3iFUDdCtSuBxj5nvnhqYfP2Ug0HZuvzvDv_auROCMW6uOTcAj6egSYfWz_Jvbffyr9YMZObK1CoZSZ9FaAlyWxCPVv61Jvd5N4NbVw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent"></div>
                <div className="absolute top-4 right-4 bg-secondary/20 backdrop-blur-md px-3 py-1 rounded-full border border-secondary/30 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-tighter text-secondary">Official Ticket</span>
                </div>
              </div>
              <div className="p-6 -mt-12 relative z-10 glass-card mx-4 mb-4 rounded-3xl border border-white/5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-extrabold font-headline tracking-tight text-white mb-1">Neon Pulse 2024</h3>
                    <p className="text-sm text-outline flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      The Indigo Dome, SF
                    </p>
                  </div>
                  <div className="bg-primary/10 px-3 py-2 rounded-2xl text-center min-w-[50px]">
                    <span className="block text-primary font-black text-lg leading-none">24</span>
                    <span className="text-[10px] font-bold text-primary-fixed uppercase">Oct</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 py-4 border-t border-outline-variant/10 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
                    <span className="text-sm font-medium text-on-surface-variant">Doors 8:00 PM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">confirmation_number</span>
                    <span className="text-sm font-medium text-on-surface-variant">Sec GA, Row 2</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button className="col-span-2 gradient-primary text-black font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(186,158,255,0.3)] active:scale-95 transition-transform">
                    <span className="material-symbols-outlined">qr_code_2</span>
                    View QR Ticket
                  </button>
                  <button className="bg-surface-variant/50 hover:bg-surface-variant text-on-surface text-sm font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">ios_share</span>
                    Transfer
                  </button>
                  <button className="bg-surface-variant/50 hover:bg-surface-variant text-on-surface text-sm font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
                    Calendar
                  </button>
                </div>
              </div>
            </div>

            {/* Ticket Card 2 */}
            <div className="group relative overflow-hidden rounded-[2rem] bg-surface-container-low shadow-2xl transition-all duration-300 hover:scale-[1.01]">
              <div className="aspect-[16/9] relative overflow-hidden">
                <img
                  alt="Club Vibes"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBu1KjAgIOz4wdv3Lah5tffGGPyJJDH1LGeh_r2fG-BoGV3N0UG22AoxPHONIsA9uQ0P7AztrFJhIjLPbYsXngw0fSZ1rqTy_KyUEtXHS9OThYsSUOVoyIEQp3OkOQDt-3xvZ7zOIOu5cmxrW1lLhmiJfX3j1b4n_FD_oocyEunwa9IT8uDQBSy7dpu78oJd-KSv1vxe0k5cQ_9m-BSWAgHT2-wq5SiaWC_qwZg9ce88Z_tweSSXyvDfPlzO_qBVKTRBwUekvaNhhE"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent"></div>
                <div className="absolute top-4 right-4 bg-secondary/20 backdrop-blur-md px-3 py-1 rounded-full border border-secondary/30 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-tighter text-secondary">Official Ticket</span>
                </div>
              </div>
              <div className="p-6 -mt-12 relative z-10 glass-card mx-4 mb-4 rounded-3xl border border-white/5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-extrabold font-headline tracking-tight text-white mb-1">Midnight Resonance</h3>
                    <p className="text-sm text-outline flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      Warehouse 404, LA
                    </p>
                  </div>
                  <div className="bg-primary/10 px-3 py-2 rounded-2xl text-center min-w-[50px]">
                    <span className="block text-primary font-black text-lg leading-none">12</span>
                    <span className="text-[10px] font-bold text-primary-fixed uppercase">Nov</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 py-4 border-t border-outline-variant/10 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
                    <span className="text-sm font-medium text-on-surface-variant">Doors 11:30 PM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">confirmation_number</span>
                    <span className="text-sm font-medium text-on-surface-variant">VIP Access</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button className="col-span-2 gradient-primary text-black font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(186,158,255,0.3)] active:scale-95 transition-transform">
                    <span className="material-symbols-outlined">qr_code_2</span>
                    View QR Ticket
                  </button>
                  <button className="bg-surface-variant/50 hover:bg-surface-variant text-on-surface text-sm font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">ios_share</span>
                    Transfer
                  </button>
                  <button className="bg-surface-variant/50 hover:bg-surface-variant text-on-surface text-sm font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
                    Calendar
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Empty State */}
        {tab === 'past' && (
          <section className="py-16 flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-outline">event_busy</span>
            </div>
            <h3 className="text-xl font-bold font-headline">No past tickets</h3>
            <p className="text-outline max-w-[250px]">Looks like your calendar is empty. Time to find your next vibe!</p>
            <Link to="/" className="mt-4 bg-primary text-on-primary-container px-8 py-3 rounded-full font-bold">
              Explore Events
            </Link>
          </section>
        )}

        {/* Error State */}
        {tab === 'disputed' && (
           <section className="py-16 flex flex-col items-center text-center space-y-4 bg-error-container/10 rounded-[2rem] border border-error/20 p-8">
            <span className="material-symbols-outlined text-4xl text-error">error</span>
            <h3 className="text-xl font-bold font-headline text-on-error-container">Unable to load tickets</h3>
            <p className="text-outline text-sm">We're having trouble connecting to the system. Please try again later.</p>
            <button className="px-6 py-2 bg-surface-variant rounded-full text-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Retry
            </button>
          </section>
        )}
      </main>

      {/* Internal BottomNav for My Tickets */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-4 bg-[#060e20]/90 backdrop-blur-2xl rounded-t-[2rem] shadow-[0px_-10px_40px_rgba(0,0,0,0.4)]">
        <button 
          onClick={() => setTab('upcoming')}
          className={`flex flex-col items-center justify-center rounded-2xl px-5 py-2 duration-200 transition-all ${tab === 'upcoming' ? 'gradient-primary text-black' : 'text-slate-500 hover:text-primary scale-90'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: tab === 'upcoming' ? "'FILL' 1" : "" }}>
            event_available
          </span>
          <span className="font-headline text-[11px] font-semibold uppercase tracking-widest mt-1">Upcoming</span>
        </button>
        <button 
          onClick={() => setTab('past')}
          className={`flex flex-col items-center justify-center rounded-2xl px-5 py-2 duration-200 transition-all ${tab === 'past' ? 'gradient-primary text-black' : 'text-slate-500 hover:text-primary scale-90'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: tab === 'past' ? "'FILL' 1" : "" }}>
            history
          </span>
          <span className="font-headline text-[11px] font-semibold uppercase tracking-widest mt-1">Past</span>
        </button>
        <button 
          onClick={() => setTab('disputed')}
          className={`flex flex-col items-center justify-center rounded-2xl px-5 py-2 duration-200 transition-all ${tab === 'disputed' ? 'gradient-primary text-black' : 'text-slate-500 hover:text-primary scale-90'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: tab === 'disputed' ? "'FILL' 1" : "" }}>
            report_problem
          </span>
          <span className="font-headline text-[11px] font-semibold uppercase tracking-widest mt-1">Disputed</span>
        </button>
      </nav>
    </>
  );
}
