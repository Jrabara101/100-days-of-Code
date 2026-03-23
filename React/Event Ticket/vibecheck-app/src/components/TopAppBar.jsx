import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function TopAppBar({ title, showBack = false, transparent = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  return (
    <header className={`fixed top-0 w-full z-50 flex items-center justify-between px-6 py-4 transition-colors ${transparent ? 'bg-[#060e20]/60 backdrop-blur-xl' : 'bg-[#060e20]/80 backdrop-blur-2xl'}`}> 
        <div className="flex items-center gap-3">
            {showBack && (
                <button onClick={() => navigate(-1)} className="text-white/70 hover:text-white transition-colors scale-95 active:opacity-80 transition-transform -ml-2 p-2 rounded-full">
                    <span className="material-symbols-outlined pt-1">arrow_back</span>
                </button>
            )}
            {!showBack ? (
                <>
                <span className="material-symbols-outlined text-primary text-2xl pb-1">confirmation_number</span>
                <span className="font-headline font-extrabold tracking-tighter text-primary italic text-2xl">VibeCheck</span>
                </>
            ) : (
                <h1 className="font-headline font-bold tracking-tight text-white text-xl">{title}</h1>
            )}
        </div>

        {!showBack && (
            <div className="hidden md:flex items-center gap-8 font-label text-sm font-bold uppercase tracking-widest text-primary">
                <Link to="/" className={`px-3 py-1 rounded-lg transition-colors ${isHome ? 'bg-primary/10' : 'text-slate-400 hover:bg-primary/10'}`}>Explore</Link>
                <Link to="/search" className="text-slate-400 hover:bg-primary/10 transition-colors px-3 py-1 rounded-lg">Search</Link>
                <Link to="/my-tickets" className={`px-3 py-1 rounded-lg transition-colors ${location.pathname === '/my-tickets' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-primary/10'}`}>Tickets</Link>
            </div>
        )}

        <div className="flex items-center gap-4">
            {!showBack ? (
                 <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 ring-offset-2 ring-offset-background hover:scale-95 active:duration-150 cursor-pointer transition-transform">
                    <img className="w-full h-full object-cover" alt="User Profile Avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2ik1Y6dyeCy2p3-OjFq_wdfbeicR1dypThsoGTiebvYwUwQtq3fl2fgUIn8oWY31jPkBFFdoGBnhNPEwPiULw0PIsaib8qfgng8A4Y7K-xF9GxWDcMk-xTOvCuuiP1ht7jcK80TmIv1A6gzEWNNZcKlF0KkrN5rABGFz6Ehi3YZ3IeAnjhznjWeOP6OTLmkZhtigTyJwL0CV4e_t0A878ClJda28zQTq-yCoGLVSIl-kjxMS6MKKIcmDEaqQNObhJnIkUej0LetQ" />
                </div>
            ) : title === 'Checkout' ? (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/20 text-secondary border border-secondary/20">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                    <span className="text-[10px] font-bold tracking-widest uppercase font-label">Secure</span>
                </div>
            ) : (
                <span className="material-symbols-outlined text-primary">confirmation_number</span>
            )}
        </div>
    </header>
  );
}
