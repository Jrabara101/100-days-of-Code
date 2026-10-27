import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CommandBar } from './components/CommandBar';
import { PeopleDirectoryView } from './components/PeopleDirectory/PeopleDirectoryView';
import { AttendanceCockpit } from './components/Attendance/AttendanceCockpit';
import { RolePermissionMatrix } from './components/RoleGovernance/RolePermissionMatrix';
import { MilestoneDigest } from './components/CultureRituals/MilestoneDigest';
import { Employee360Drawer } from './components/Profile360Drawer/Employee360Drawer';
import { storage } from './services/storageService';
import { Employee } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<'directory' | 'attendance' | 'roles' | 'pulse'>('directory');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [, setRerenderTick] = useState(0);

  // Initialize theme and subscribe to storage changes
  useEffect(() => {
    storage.setTheme(storage.getTheme());
    const unsubscribe = storage.subscribe(() => {
      setRerenderTick(prev => prev + 1);
      // Keep selectedEmployee synced if open
      if (selectedEmployee) {
        const fresh = storage.getEmployeeById(selectedEmployee.id);
        if (fresh) setSelectedEmployee(fresh);
      }
    });
    return unsubscribe;
  }, [selectedEmployee]);

  // Global keyboard shortcuts (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandBarOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-canvas-light dark:bg-canvas-dark text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Bar with Live Punch Stopwatch & RBAC Persona Switcher */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenCommandBar={() => setIsCommandBarOpen(true)}
      />

      {/* Main View Content Stage */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-6 py-6">
        {currentTab === 'directory' && (
          <PeopleDirectoryView
            onSelectEmployee={setSelectedEmployee}
            onOpenCommandBar={() => setIsCommandBarOpen(true)}
          />
        )}

        {currentTab === 'attendance' && (
          <AttendanceCockpit
            onSelectEmployee={setSelectedEmployee}
          />
        )}

        {currentTab === 'roles' && (
          <RolePermissionMatrix />
        )}

        {currentTab === 'pulse' && (
          <MilestoneDigest
            onSelectEmployee={setSelectedEmployee}
          />
        )}
      </main>

      {/* 360° Profile & Lifecycle Inspector Slide-Over Drawer */}
      <Employee360Drawer
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        onSelectEmployee={(emp) => setSelectedEmployee(emp)}
      />

      {/* Global Cmd+K Command Bar Palette */}
      <CommandBar
        isOpen={isCommandBarOpen}
        onClose={() => setIsCommandBarOpen(false)}
        onSelectEmployee={(emp) => setSelectedEmployee(emp)}
        onNavigateTab={(tab) => setCurrentTab(tab)}
        onOpenAddModal={() => {
          setCurrentTab('directory');
        }}
        onOpenExportCsv={() => {
          setCurrentTab('directory');
        }}
      />
    </div>
  );
}

export default App;
