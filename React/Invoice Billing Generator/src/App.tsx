import React, { useState, useEffect } from 'react';
import { Invoice, Client, BillableTimeEntry, ReimbursableExpense } from './types';
import { ApiService } from './services/api';
import { RevenueCommandDashboard } from './components/dashboard/RevenueCommandDashboard';
import { InvoiceStudioEditor } from './components/studio/InvoiceStudioEditor';
import { HostedClientPortal } from './components/portal/HostedClientPortal';

type AppView = 'dashboard' | 'studio' | 'portal';

export function App() {
  const [view, setView] = useState<AppView>('dashboard');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [timeEntries, setTimeEntries] = useState<BillableTimeEntry[]>([]);
  const [expenses, setExpenses] = useState<ReimbursableExpense[]>([]);
  
  // Selected invoice for studio or portal
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load initial data and parse URL routing
  useEffect(() => {
    async function loadData() {
      try {
        const [invs, cls, times, exps] = await Promise.all([
          ApiService.getInvoices(),
          ApiService.getClients(),
          ApiService.getBillableTime(),
          ApiService.getExpenses(),
        ]);

        setInvoices(invs);
        setClients(cls);
        setTimeEntries(times);
        setExpenses(exps);

        // Check if URL has a token like /pay/:token or #/pay/:token
        const path = window.location.pathname;
        const hash = window.location.hash;
        const payMatch = path.match(/\/pay\/([^/]+)/) || hash.match(/#\/pay\/([^/]+)/);

        if (payMatch && payMatch[1]) {
          const token = payMatch[1];
          const matchedInvoice = await ApiService.getInvoiceByToken(token);
          if (matchedInvoice) {
            setActiveInvoice(matchedInvoice);
            setView('portal');
          }
        }
      } catch (err) {
        console.error('Failed to load application data', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleInvoiceUpdated = (updated: Invoice) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === updated.id ? updated : inv))
    );
    if (activeInvoice?.id === updated.id) {
      setActiveInvoice(updated);
    }
  };

  const handleSaveInvoice = async (invoice: Invoice) => {
    const saved = await ApiService.saveInvoice(invoice);
    handleInvoiceUpdated(saved);
    setView('dashboard');
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    const sent = await ApiService.saveInvoice(invoice);
    handleInvoiceUpdated(sent);
    setActiveInvoice(sent);
    setView('portal');
  };

  const handleOpenPortal = (invoice: Invoice) => {
    setActiveInvoice(invoice);
    window.history.pushState(null, '', `#/pay/${invoice.public_token}`);
    setView('portal');
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setActiveInvoice(invoice);
    setView('studio');
  };

  const handleNewInvoice = () => {
    setActiveInvoice(null);
    setView('studio');
  };

  const handleBackToDashboard = () => {
    window.history.pushState(null, '', window.location.pathname);
    setView('dashboard');
  };

  const handleResetData = async () => {
    if (window.confirm('Reset all demo invoices, payments, and telemetry to initial state?')) {
      await ApiService.resetToDefault();
      const [invs, cls] = await Promise.all([
        ApiService.getInvoices(),
        ApiService.getClients(),
      ]);
      setInvoices(invs);
      setClients(cls);
      setActiveInvoice(null);
      setView('dashboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-vault-950 flex flex-col items-center justify-center text-slate-400 font-sans">
        <div className="w-8 h-8 rounded-full border-2 border-stripe border-t-transparent animate-spin mb-4"></div>
        <span className="text-xs font-mono tracking-wider">INITIALIZING LEDGER ENGINE...</span>
      </div>
    );
  }

  if (view === 'portal' && activeInvoice) {
    return (
      <HostedClientPortal
        invoice={activeInvoice}
        onInvoiceUpdated={handleInvoiceUpdated}
        onBackToDashboard={handleBackToDashboard}
      />
    );
  }

  if (view === 'studio') {
    return (
      <InvoiceStudioEditor
        initialInvoice={activeInvoice || undefined}
        clients={clients}
        timeEntries={timeEntries}
        expenses={expenses}
        onSave={handleSaveInvoice}
        onSend={handleSendInvoice}
        onPreviewPortal={(inv) => {
          setActiveInvoice(inv);
          setView('portal');
        }}
        onBack={handleBackToDashboard}
      />
    );
  }

  return (
    <RevenueCommandDashboard
      invoices={invoices}
      clients={clients}
      timeEntries={timeEntries}
      expenses={expenses}
      onNewInvoice={handleNewInvoice}
      onEditInvoice={handleEditInvoice}
      onOpenPortal={handleOpenPortal}
      onInvoiceUpdated={handleInvoiceUpdated}
      onResetData={handleResetData}
    />
  );
}

export default App;
