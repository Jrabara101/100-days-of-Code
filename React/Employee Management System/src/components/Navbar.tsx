import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Home, 
  Plane, 
  Coffee, 
  Clock, 
  Search, 
  Moon, 
  Sun, 
  RotateCcw, 
  ChevronDown, 
  ShieldCheck, 
  Users, 
  Calendar, 
  Award,
  Sparkles,
  Layers
} from 'lucide-react';
import { storage } from '../services/storageService';
import { Employee, PunchLocation, AttendanceStatus } from '../types';
import confetti from 'canvas-confetti';

interface NavbarProps {
  currentTab: 'directory' | 'attendance' | 'roles' | 'pulse';
  onTabChange: (tab: 'directory' | 'attendance' | 'roles' | 'pulse') => void;
  onOpenCommandBar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenCommandBar
}) => {
  const [activeEmp, setActiveEmp] = useState<Employee | undefined>(storage.getActiveEmployee());
  const [allEmployees, setAllEmployees] = useState<Employee[]>(storage.getEmployees());
  const [theme, setTheme] = useState<'dark' | 'light'>(storage.getTheme());
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showPunchMenu, setShowPunchMenu] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<PunchLocation>('office');

  // Sync state on storage updates
  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setActiveEmp(storage.getActiveEmployee());
      setAllEmployees(storage.getEmployees());
      setTheme(storage.getTheme());
    });
    return unsubscribe;
  }, []);

  // Shift stopwatch
  useEffect(() => {
    if (!activeEmp) return;

    const updateTimer = () => {
      const activePunch = storage.getActivePunch(activeEmp.id);
      if (activePunch && activePunch.clockIn) {
        const inMs = new Date(activePunch.clockIn).getTime();
        const nowMs = Date.now();
        const breakMs = (activePunch.breakMinutes || 0) * 60 * 1000;
        const netSeconds = Math.max(0, Math.floor((nowMs - inMs - breakMs) / 1000));
        setElapsedSeconds(netSeconds);
      } else {
        setElapsedSeconds(0);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeEmp]);

  const formatSeconds = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isClockedIn = activeEmp?.attendanceStatus === 'clocked_in_office' || 
                      activeEmp?.attendanceStatus === 'clocked_in_remote' || 
                      activeEmp?.attendanceStatus === 'on_break';

  const isOnBreak = activeEmp?.attendanceStatus === 'on_break';

  const handleClockIn = (location: PunchLocation) => {
    if (!activeEmp) return;
    storage.clockIn(activeEmp.id, location);
    setShowPunchMenu(false);

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.1 }
    });
  };

  const handleClockOut = () => {
    if (!activeEmp) return;
    storage.clockOut(activeEmp.id);
    setShowPunchMenu(false);
  };

  const handleToggleBreak = () => {
    if (!activeEmp) return;
    storage.toggleBreak(activeEmp.id);
  };

  const handleSwitchPersona = (empId: string) => {
    storage.setActiveUserId(empId);
    setShowPersonaMenu(false);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    storage.setTheme(nextTheme);
  };

  const handleReset = () => {
    if (window.confirm('Reset all demo state to enterprise seed data? Any new employees, attendance logs or permission tweaks will be restored to initial defaults.')) {
      storage.resetToDefaults();
    }
  };

  const activeRole = storage.getRoles().find(r => r.id === activeEmp?.roleId);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-divider-light dark:border-divider-dark bg-canvas-light/90 dark:bg-canvas-dark/90 backdrop-blur-md transition-colors">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand & Main Navigation */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand to-indigo-400 flex items-center justify-center shadow-lg shadow-brand/25 text-white font-bold tracking-tight">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base tracking-tight text-slate-900 dark:text-white">
                  AURA
                </span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-brand/10 text-brand dark:text-brand-dark tracking-wide uppercase">
                  People OS
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-tight">
                Workforce, Governance & Attendance
              </p>
            </div>
          </div>

          {/* Module Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-surface-light dark:bg-surface-dark p-1 rounded-xl border border-divider-light dark:border-divider-dark">
            <button
              onClick={() => onTabChange('directory')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'directory'
                  ? 'bg-elevated-light dark:bg-elevated-dark text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>People & Org</span>
            </button>

            <button
              onClick={() => onTabChange('attendance')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'attendance'
                  ? 'bg-elevated-light dark:bg-elevated-dark text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Attendance & PTO</span>
              {storage.getAttendanceLogs().some(l => l.status === 'missing_out_punch') && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => onTabChange('roles')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'roles'
                  ? 'bg-elevated-light dark:bg-elevated-dark text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Role Governance (RBAC)</span>
            </button>

            <button
              onClick={() => onTabChange('pulse')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'pulse'
                  ? 'bg-elevated-light dark:bg-elevated-dark text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Culture Pulse</span>
            </button>
          </nav>
        </div>

        {/* Center: Live Hybrid Punch Clock Widget */}
        <div className="flex items-center">
          <div className="relative">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark shadow-sm">
              {/* Presence Dot & Live Duration */}
              <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    isOnBreak ? 'bg-amber-500' :
                    isClockedIn ? 'bg-emerald-500' : 'bg-slate-400'
                  }`} />
                  {isClockedIn && !isOnBreak && (
                    <span className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
                  )}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {isClockedIn ? formatSeconds(elapsedSeconds) : '00:00:00'}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                      isOnBreak ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                      isClockedIn ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                      'bg-slate-500/10 text-slate-500'
                    }`}>
                      {isOnBreak ? 'On Break' : isClockedIn ? (activeEmp?.attendanceStatus === 'clocked_in_office' ? 'Office' : 'Remote') : 'Off Duty'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-4 w-px bg-divider-light dark:bg-divider-dark mx-0.5" />

              {/* Action Buttons */}
              {isClockedIn ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleToggleBreak}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                      isOnBreak 
                        ? 'bg-amber-500 text-white shadow-sm' 
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Coffee className="w-3 h-3" />
                    <span>{isOnBreak ? 'Resume' : 'Break'}</span>
                  </button>
                  <button
                    onClick={handleClockOut}
                    className="px-2 py-1 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                  >
                    Clock Out
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowPunchMenu(!showPunchMenu)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-transform active:scale-95"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Clock In</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {/* Punch Mode Dropdown */}
                  {showPunchMenu && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark p-1.5 shadow-xl z-50 animate-fadeIn">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                        Select Work Mode
                      </div>
                      <button
                        onClick={() => handleClockIn('office')}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Building2 className="w-4 h-4 text-emerald-500" />
                        <div className="text-left">
                          <p className="font-semibold">🏢 In Office</p>
                          <p className="text-[10px] text-slate-400">Headquarters desk</p>
                        </div>
                      </button>
                      <button
                        onClick={() => handleClockIn('remote')}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Home className="w-4 h-4 text-cobalt-500 text-blue-500" />
                        <div className="text-left">
                          <p className="font-semibold">🏡 Remote / WFH</p>
                          <p className="text-[10px] text-slate-400">Home workspace</p>
                        </div>
                      </button>
                      <button
                        onClick={() => handleClockIn('travel')}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Plane className="w-4 h-4 text-violet-500" />
                        <div className="text-left">
                          <p className="font-semibold">✈️ Client Travel</p>
                          <p className="text-[10px] text-slate-400">Onsite or in transit</p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Search, Persona Switcher, Theme, Reset */}
        <div className="flex items-center gap-2.5">
          {/* Cmd+K Search Launcher */}
          <button
            onClick={onOpenCommandBar}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-xs"
            title="Search people, actions, and filters (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline text-slate-400">Search</span>
            <kbd className="hidden sm:inline font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              ⌘K
            </kbd>
          </button>

          {/* Role Persona Switcher (RBAC Simulator) */}
          <div className="relative">
            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark hover:border-brand/40 transition-all text-xs"
              title="Switch Active Persona to Test RBAC Permissions"
            >
              <div className="relative">
                <img
                  src={activeEmp?.avatarUrl}
                  alt={activeEmp?.firstName}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-white/10"
                />
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-surface-dark ${
                  activeEmp?.attendanceStatus === 'clocked_in_office' ? 'bg-emerald-500' :
                  activeEmp?.attendanceStatus === 'clocked_in_remote' ? 'bg-blue-500' :
                  activeEmp?.attendanceStatus === 'on_break' ? 'bg-amber-500' : 'bg-slate-400'
                }`} />
              </div>
              <div className="text-left hidden md:block">
                <p className="font-semibold text-slate-900 dark:text-white leading-none">
                  {activeEmp?.firstName} {activeEmp?.lastName}
                </p>
                <span className="text-[10px] text-brand dark:text-brand-dark font-medium leading-tight">
                  {activeRole?.name}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Persona Switcher Dropdown */}
            {showPersonaMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark p-2 shadow-2xl z-50 animate-fadeIn">
                <div className="px-2 py-1.5 border-b border-divider-light dark:border-divider-dark mb-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    Simulate RBAC Persona
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Switch user to verify scoped permissions & field shielding in real time.
                  </p>
                </div>
                <div className="max-h-72 overflow-y-auto space-y-1">
                  {allEmployees.slice(0, 6).map((emp) => {
                    const empRole = storage.getRoles().find(r => r.id === emp.roleId);
                    const isSelected = emp.id === activeEmp?.id;
                    return (
                      <button
                        key={emp.id}
                        onClick={() => handleSwitchPersona(emp.id)}
                        className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-left text-xs transition-colors ${
                          isSelected 
                            ? 'bg-brand/10 text-brand dark:text-brand-dark font-semibold' 
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <img
                          src={emp.avatarUrl}
                          alt={emp.firstName}
                          className="w-7 h-7 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{emp.firstName} {emp.lastName}</p>
                          <p className="text-[10px] text-slate-500 truncate">{empRole?.name}</p>
                        </div>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-brand" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Toggle Obsidian Dark / Pristine Light Mode"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Reset Demo Data Button */}
          <button
            onClick={handleReset}
            className="p-2 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-500 hover:text-amber-500 hover:border-amber-500/40 transition-colors"
            title="Reset All Demo Data to Defaults"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
