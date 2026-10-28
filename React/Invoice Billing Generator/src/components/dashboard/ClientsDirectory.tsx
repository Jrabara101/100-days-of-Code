import React, { useState } from 'react';
import { Client } from '../../types';
import { Users, Mail, MapPin, Building, Plus, Search, ExternalLink, CreditCard } from 'lucide-react';

interface ClientsDirectoryProps {
  clients: Client[];
  onSelectClient?: (client: Client) => void;
  onNewClient?: () => void;
}

export const ClientsDirectory: React.FC<ClientsDirectoryProps> = ({
  clients,
  onSelectClient,
  onNewClient,
}) => {
  const [search, setSearch] = useState('');

  const filteredClients = clients.filter(
    (c) =>
      c.company_name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_name.toLowerCase().includes(search.toLowerCase()) ||
      c.billing_email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-vault-850/80 border border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white">Clients Directory</h2>
          <p className="text-xs text-slate-400">
            Saved corporate client billing profiles, tax/VAT IDs, and default payment terms.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Filter clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-vault-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-stripe transition w-48 sm:w-60"
            />
          </div>
          <button
            onClick={onNewClient}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stripe hover:bg-stripe-hover text-white text-xs font-medium rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          <div
            key={client.id}
            onClick={() => onSelectClient?.(client)}
            className="p-4 rounded-xl bg-vault-850/60 border border-slate-800 hover:border-slate-700 transition cursor-pointer group space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {client.avatar_url ? (
                  <img
                    src={client.avatar_url}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border border-slate-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                    {client.company_name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-stripe-light transition">
                    {client.company_name}
                  </h3>
                  <span className="text-xs text-slate-400">{client.contact_name}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-300 border border-slate-700">
                Net {client.payment_terms_days}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span className="truncate">{client.billing_email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {client.billing_address.city}, {client.billing_address.country}
                </span>
              </div>
              {client.tax_id_vat && (
                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                  <span>TAX ID:</span>
                  <span className="text-slate-300">{client.tax_id_vat}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-emerald-400 font-mono">
                <CreditCard className="w-3 h-3" />
                {client.stripe_customer_id ? 'Stripe Vaulted' : 'Direct ACH'}
              </span>
              <span className="text-slate-400 font-mono uppercase">{client.currency}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
