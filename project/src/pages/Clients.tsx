import React, { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Eye, Upload, Download, Building2, X } from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { useLang } from '../context/LangContext';
import { Client, ClientStatus } from '../types';
import { formatDate } from '../utils/storage';
import ConfirmDialog from '../components/ConfirmDialog';
import ImportModal, { ImportColumn, ParsedRow } from '../components/ImportModal';

const IMPORT_COLUMNS: ImportColumn[] = [
  { key: 'nameEn',    label: 'Name (English)',    required: true, hint: 'e.g. Impact Corp' },
  { key: 'nameAr',    label: 'Name (Arabic)',     hint: 'الاسم بالعربي' },
  { key: 'industry',  label: 'Industry',          hint: 'e.g. Hospitality' },
  { key: 'status',    label: 'Status',            hint: 'active / not_active / pending / closed / on_hold' },
  { key: 'address1',  label: 'Address 1',         hint: 'e.g. Cairo, Egypt' },
  { key: 'address2',  label: 'Address 2',         hint: '(optional second address)' },
  { key: 'brief',     label: 'Brief',             hint: 'Short client overview' },
  { key: 'salesOwner',label: 'Sales Owner',       hint: 'Must match a team member name exactly' },
];

const CLIENT_TEMPLATE_ROWS: ParsedRow[] = [
  {
    'Name (English)': 'Impact Corp',
    'Name (Arabic)':  'إمباكت',
    'Industry':       'Hospitality',
    'Status':         'active',
    'Address 1':      'Cairo, Egypt',
    'Address 2':      '',
    'Brief':          'Key hospitality client',
    'Sales Owner':    '',
  },
  {
    'Name (English)': 'Blue Tower',
    'Name (Arabic)':  '',
    'Industry':       'Real Estate',
    'Status':         'pending',
    'Address 1':      'Alexandria',
    'Address 2':      '',
    'Brief':          '',
    'Sales Owner':    '',
  },
];

interface ClientsProps {
  onViewClient: (id: string) => void;
}

const CLIENT_STATUSES: { value: ClientStatus; label: string; color: string }[] = [
  { value: 'active',     label: 'Active',      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'not_active', label: 'Not Active',  color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  { value: 'pending',    label: 'Pending',     color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'closed',     label: 'Closed',      color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { value: 'on_hold',    label: 'On Hold',     color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
];

function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const cfg = CLIENT_STATUSES.find(s => s.value === status) || CLIENT_STATUSES[0];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

type FormState = Omit<Client, 'id' | 'createdAt' | 'lastContactedAt'>;

const emptyForm = (): FormState => ({
  nameAr: '', nameEn: '', industry: '', status: 'active',
  addresses: [''], brief: '', notes: '', salesOwner: '',
});

export default function Clients({ onViewClient }: ClientsProps) {
  const { data, addClient, updateClient, deleteClient, addToast } = useCRM();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = data.clients.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      c.nameAr.toLowerCase().includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.industry.toLowerCase().includes(q);
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openAdd = () => { setForm(emptyForm()); setEditId(null); setShowForm(true); };
  const openEdit = (c: Client) => {
    setForm({
      nameAr: c.nameAr, nameEn: c.nameEn, industry: c.industry,
      status: c.status, addresses: c.addresses?.length ? [...c.addresses] : [''],
      brief: c.brief || '', notes: c.notes || '', salesOwner: c.salesOwner || '',
    });
    setEditId(c.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, addresses: form.addresses.filter(a => a.trim()) };
    if (editId) {
      updateClient(editId, payload);
      addToast('Client updated ✓');
    } else {
      addClient(payload);
      addToast('Client added ✓');
    }
    setShowForm(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteClient(deleteId);
    addToast('Client deleted');
    setDeleteId(null);
  };

  const resolveTeamMemberId = (name: string) => {
    const n = name.trim().toLowerCase();
    return n ? (data.team.find(m => m.name.toLowerCase() === n)?.id || '') : '';
  };

  const handleImport = (rows: ParsedRow[]) => {
    let imported = 0;
    rows.forEach(row => {
      if (!row.nameEn) return;
      addClient({
        nameEn:     row.nameEn,
        nameAr:     row.nameAr || '',
        industry:   row.industry || '',
        status:     (['active','not_active','pending','closed','on_hold'].includes(row.status)
                      ? row.status : 'active') as ClientStatus,
        addresses:  [row.address1, row.address2].filter(Boolean),
        brief:      row.brief || '',
        notes:      '',
        salesOwner: resolveTeamMemberId(row.salesOwner || ''),
      });
      imported++;
    });
    addToast(`Imported ${imported} client${imported !== 1 ? 's' : ''} ✓`);
  };

  const handleExport = () => {
    const headers = 'nameEn,nameAr,industry,status,address,brief\n';
    const rows = data.clients.map(c =>
      `${c.nameEn},${c.nameAr},${c.industry},${c.status},"${(c.addresses || []).join('; ')}","${c.brief || ''}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'clients.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const addAddress = () => setForm(f => ({ ...f, addresses: [...f.addresses, ''] }));
  const setAddress = (i: number, val: string) =>
    setForm(f => ({ ...f, addresses: f.addresses.map((a, idx) => idx === i ? val : a) }));
  const removeAddress = (i: number) =>
    setForm(f => ({ ...f, addresses: f.addresses.filter((_, idx) => idx !== i) }));

  const salesOwnerName = (id: string) => data.team.find(m => m.id === id)?.name || id;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold crm-text-primary">Clients</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-3 py-2 crm-btn-secondary rounded-xl text-sm transition-colors">
            <Upload size={15} />
            <span>Import from Excel</span>
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 crm-btn-secondary rounded-xl text-sm transition-colors">
            <Download size={15} />
            <span>Export</span>
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus size={15} />
            Add Client
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 crm-text-muted" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full crm-input rounded-xl pl-9 pr-4 py-2.5 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as ClientStatus | '')}
          className="crm-input rounded-xl px-3 py-2.5 text-sm"
        >
          <option value="">All Statuses</option>
          {CLIENT_STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <span className="crm-text-muted text-sm">{filtered.length} clients</span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(client => {
          const contactsCount = data.contacts.filter(c => c.clientId === client.id).length;
          const dealsCount = data.deals.filter(d => d.clientId === client.id).length;
          const projectsCount = data.projects.filter(p => p.clientId === client.id).length;
          const tasksCount = data.tasks.filter(t => t.linkedClientId === client.id && t.status !== 'done').length;
          const owner = data.team.find(m => m.id === client.salesOwner);

          return (
            <div key={client.id} className="crm-card rounded-2xl p-5 hover:crm-border-hover transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl crm-surface-elevated flex items-center justify-center flex-shrink-0">
                    <Building2 size={18} className="crm-text-muted" />
                  </div>
                  <div>
                    <h3 className="crm-text-primary font-semibold text-sm">{client.nameEn || client.nameAr}</h3>
                    {client.nameAr && client.nameEn && (
                      <p className="crm-text-muted text-xs">{client.nameAr}</p>
                    )}
                  </div>
                </div>
                <ClientStatusBadge status={client.status} />
              </div>

              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {client.industry && (
                  <span className="px-2 py-0.5 crm-surface-elevated crm-text-secondary rounded-lg text-xs">{client.industry}</span>
                )}
                {owner && (
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-lg text-xs">{owner.name}</span>
                )}
              </div>

              {client.brief && (
                <p className="crm-text-muted text-xs mb-3 line-clamp-2">{client.brief}</p>
              )}

              {(client.addresses || []).filter(a => a).slice(0, 1).map((addr, i) => (
                <p key={i} className="crm-text-muted text-xs mb-2 truncate">{addr}</p>
              ))}

              <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                {[
                  { label: 'Contacts', value: contactsCount },
                  { label: 'Deals', value: dealsCount },
                  { label: 'Projects', value: projectsCount },
                  { label: 'Tasks', value: tasksCount },
                ].map(stat => (
                  <div key={stat.label} className="crm-surface-elevated rounded-lg py-2">
                    <p className="crm-text-primary font-bold text-sm">{stat.value}</p>
                    <p className="crm-text-muted text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <p className="crm-text-muted text-xs">{formatDate(client.createdAt, data.settings.dateFormat)}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => onViewClient(client.id)} className="p-1.5 rounded-lg crm-text-muted hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="View">
                    <Eye size={14} />
                  </button>
                  <button onClick={() => openEdit(client)} className="p-1.5 rounded-lg crm-text-muted hover:crm-text-primary hover:crm-surface-elevated transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteId(client.id)} className="p-1.5 rounded-lg crm-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 crm-text-muted">
            <Building2 size={40} className="mx-auto mb-3 opacity-30" />
            <p>No clients found</p>
            <button onClick={openAdd} className="mt-3 text-blue-400 hover:text-blue-300 text-sm">
              + Add your first client
            </button>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="crm-modal w-full max-w-lg mx-4 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="crm-text-primary font-bold text-lg mb-5">
              {editId ? 'Edit Client' : 'Add Client'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Name (English) *</label>
                  <input required value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Name (Arabic)</label>
                  <input value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm" dir="rtl" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Industry</label>
                  <select value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm">
                    <option value="">— Select —</option>
                    {data.settings.dropdowns.industries.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ClientStatus }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm">
                    {CLIENT_STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block crm-text-secondary text-xs mb-1">Sales Owner</label>
                <select value={form.salesOwner} onChange={e => setForm(f => ({ ...f, salesOwner: e.target.value }))}
                  className="w-full crm-input rounded-xl px-3 py-2.5 text-sm">
                  <option value="">— None —</option>
                  {data.team.filter(m => m.active).map(m => (
                    <option key={m.id} value={m.id}>{m.name} — {m.role}</option>
                  ))}
                </select>
              </div>

              {/* Addresses */}
              <div>
                <label className="block crm-text-secondary text-xs mb-1">Addresses</label>
                {form.addresses.map((addr, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      value={addr}
                      onChange={e => setAddress(i, e.target.value)}
                      placeholder={`Address ${i + 1}`}
                      className="flex-1 crm-input rounded-xl px-3 py-2.5 text-sm"
                    />
                    {form.addresses.length > 1 && (
                      <button type="button" onClick={() => removeAddress(i)}
                        className="p-2 crm-text-muted hover:text-red-400 transition-colors">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addAddress}
                  className="text-blue-400 hover:text-blue-300 text-xs transition-colors">
                  + Add another address
                </button>
              </div>

              <div>
                <label className="block crm-text-secondary text-xs mb-1">Brief (Client Overview)</label>
                <textarea rows={3} value={form.brief}
                  onChange={e => setForm(f => ({ ...f, brief: e.target.value }))}
                  placeholder="Key info about this client..."
                  className="w-full crm-input rounded-xl px-3 py-2.5 text-sm resize-none" />
              </div>

              <div>
                <label className="block crm-text-secondary text-xs mb-1">Internal Notes</label>
                <textarea rows={2} value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full crm-input rounded-xl px-3 py-2.5 text-sm resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 crm-btn-secondary rounded-xl text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Delete Client"
          message="This will delete all contacts, deals, projects, and tasks linked to this client. Are you sure?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />)}

      {showImport && (
        <ImportModal
          title="Clients"
          columns={IMPORT_COLUMNS}
          templateRows={CLIENT_TEMPLATE_ROWS}
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}
