import { Link, useLocation } from 'react-router-dom';

export default function BottomNavBar() {
  const location = useLocation();

  const navItems = [
    { name: 'Explore', icon: 'explore', path: '/' },
    { name: 'Search', icon: 'search', path: '/search' },
    { name: 'Tickets', icon: 'confirmation_number', path: '/my-tickets' },
    { name: 'Profile', icon: 'person', path: '/profile' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-2 bg-[#060e20]/60 backdrop-blur-xl z-50 rounded-t-3xl shadow-[0px_-10px_30px_rgba(0,0,0,0.5)] md:hidden">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center rounded-xl px-4 py-2 transition-all tap-highlight-transparent active:scale-90 transition-transform ${isActive ? 'text-primary bg-primary/20' : 'text-slate-500 hover:text-primary'}`}
            >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                  {item.icon}
                </span>
                <span className="font-inter text-[11px] font-bold uppercase tracking-widest mt-1">
                  {item.name}
                </span>
            </Link>
          );
        })}
    </nav>
  );
}
