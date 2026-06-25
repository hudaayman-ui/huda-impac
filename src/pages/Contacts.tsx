import React, { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Phone, Mail, MessageCircle, Upload } from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { useLang } from '../context/LangContext';
import { Contact } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import ImportModal, { ImportColumn, ParsedRow } from '../components/ImportModal';

const EMPTY: Omit<Contact, 'id' | 'createdAt'> = {
  clientId: '', fullName: '', jobTitle: '', phones: [''], email: '', notes: '',
};

const IMPORT_COLUMNS: ImportColumn[] = [
  { key: 'fullName',     label: 'Full Name',     required: true, hint: 'e.g. Ahmed Hassan'  },
  { key: 'jobTitle',     label: 'Job Title',     hint: 'e.g. Purchasing Manager' },
  { key: 'phone1',       label: 'Phone 1',       hint: 'e.g. +201001234567' },
  { key: 'phone2',       label: 'Phone 2',       hint: 'e.g. +201009876543' },
  { key: 'email',        label: 'Email',         hint: 'e.g. ahmed@company.com' },
  { key: 'whatsapp',     label: 'WhatsApp',      hint: 'e.g. +201001234567' },
  { key: 'linkedClient', label: 'Linked Client', hint: 'Must match an existing client name exactly' },
  { key: 'notes',        label: 'Notes',         hint: 'Any internal notes' },
];

const TEMPLATE_ROWS: ParsedRow[] = [
  {
    'Full Name':     'Ahmed Hassan',
    'Job Title':     'Purchasing Manager',
    'Phone 1':       '+201001234567',
    'Phone 2':       '+201119876543',
    'Email':         'ahmed@company.com',
    'WhatsApp':      '+201001234567',
    'Linked Client': 'Example Corp',
    'Notes':         'Main decision maker',
  },
  {
    'Full Name':     'Sara Mostafa',
    'Job Title':     'Director',
    'Phone 1':       '+201559876543',
    'Phone 2':       '',
    'Email':         'sara@company.com',
    'WhatsApp':      '',
    'Linked Client': '',
    'Notes':         '',
  },
];

export default function Contacts() {
  const { data, addContact, updateContact, deleteContact, addToast } = useCRM();
  const { lang } = useLang();

  const [search, setSearch]           = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [showForm, setShowForm]       = useState(false);
  const [showImport, setShowImport]   = useState(false);
  const [editId, setEditId]           = useState<string | null>(null);
  const [form, setForm]               = useState(EMPTY);
  const [deleteId, setDeleteId]       = useState<string | null>(null);

  const filtered = data.contacts.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || c.fullName.toLowerCase().includes(q)
      || c.email.toLowerCase().includes(q)
      || c.phones.some(p => p.includes(q));
    const matchClient = !clientFilter || c.clientId === clientFilter;
    return matchSearch && matchClient;
  });

  const openAdd = () => {
    setForm({ ...EMPTY, clientId: clientFilter || '' });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (c: Contact) => {
    setForm({
      clientId: c.clientId, fullName: c.fullName, jobTitle: c.jobTitle,
      phones: [...c.phones], email: c.email, notes: c.notes,
    });
    setEditId(c.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhones = form.phones.filter(p => p.trim());
    const payload = { ...form, phones: cleanPhones.length ? cleanPhones : [] };
    if (editId) {
      updateContact(editId, payload);
      addToast('Contact updated ✓');
    } else {
      addContact(payload);
      addToast('Contact added ✓');
    }
    setShowForm(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteContact(deleteId);
    addToast('Contact deleted');
    setDeleteId(null);
  };

  const addPhone   = () => setForm(f => ({ ...f, phones: [...f.phones, ''] }));
  const removePhone = (i: number) => setForm(f => ({ ...f, phones: f.phones.filter((_, idx) => idx !== i) }));
  const setPhone   = (i: number, val: string) => setForm(f => ({ ...f, phones: f.phones.map((p, idx) => idx === i ? val : p) }));

  const getClient = (id: string) => data.clients.find(c => c.id === id);

  // Resolve client name → id (case-insensitive, try nameEn then nameAr)
  const resolveClientId = (nameRaw: string): string => {
    const name = nameRaw.trim().toLowerCase();
    if (!name) return '';
    return data.clients.find(c =>
      c.nameEn.toLowerCase() === name || c.nameAr.toLowerCase() === name
    )?.id || '';
  };

  const handleImport = (rows: ParsedRow[]) => {
    let imported = 0;
    let skipped = 0;
    rows.forEach(row => {
      if (!row.fullName) { skipped++; return; }
      const phones = [row.phone1, row.phone2, row.whatsapp]
        .map(p => p.trim())
        .filter(Boolean)
        .filter((p, i, arr) => arr.indexOf(p) === i); // deduplicate
      addContact({
        clientId:  resolveClientId(row.linkedClient),
        fullName:  row.fullName,
        jobTitle:  row.jobTitle || '',
        phones:    phones.length ? phones : [],
        email:     row.email || '',
        notes:     row.notes || '',
      });
      imported++;
    });
    addToast(`Imported ${imported} contact${imported !== 1 ? 's' : ''}${skipped ? `, ${skipped} skipped` : ''} ✓`);
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold crm-text-primary">Contacts</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 crm-btn-secondary rounded-xl text-sm font-medium transition-colors"
          >
            <Upload size={15} />
            Import from Excel
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus size={15} />
            Add Contact
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 crm-text-muted" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full crm-input rounded-xl pl-9 pr-4 py-2.5 text-sm"
          />
        </div>
        <select
          value={clientFilter} onChange={e => setClientFilter(e.target.value)}
          className="crm-input rounded-xl px-3 py-2.5 text-sm"
        >
          <option value="">All Clients</option>
          {data.clients.map(c => (
            <option key={c.id} value={c.id}>{c.nameEn || c.nameAr}</option>
          ))}
        </select>
        <span className="crm-text-muted text-sm">{filtered.length} contacts</span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(contact => {
          const client = getClient(contact.clientId);
          return (
            <div
              key={contact.id}
              className="crm-card rounded-2xl p-4 hover:crm-border-hover transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="crm-text-primary font-semibold">{contact.fullName}</h3>
                  <p className="crm-text-secondary text-sm">{contact.jobTitle}</p>
                  {client && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs">
                      {client.nameEn || client.nameAr}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(contact)}
                    className="p-1.5 rounded-lg crm-text-muted hover:crm-text-primary hover:crm-surface-elevated transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteId(contact.id)}
                    className="p-1.5 rounded-lg crm-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                {contact.phones.filter(p => p).map((ph, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Phone size={12} className="crm-text-muted flex-shrink-0" />
                    <a href={`tel:${ph}`} className="text-blue-400 text-sm hover:underline flex-1">{ph}</a>
                    <a
                      href={`https://wa.me/${ph.replace(/\D/g, '')}`}
                      target="_blank" rel="noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 p-1 rounded-lg hover:bg-emerald-500/10 transition-colors"
                      title="WhatsApp"
                    >
                      <MessageCircle size={14} />
                    </a>
                  </div>
                ))}
                {contact.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="crm-text-muted flex-shrink-0" />
                    <a href={`mailto:${contact.email}`} className="text-blue-400 text-sm hover:underline truncate">
                      {contact.email}
                    </a>
                  </div>
                )}
              </div>

              {contact.notes && (
                <p className="mt-2 crm-text-muted text-xs line-clamp-2">{contact.notes}</p>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 crm-text-muted">
            <Phone size={40} className="mx-auto mb-3 opacity-30" />
            <p>No contacts found</p>
            <button onClick={openAdd} className="mt-3 text-blue-400 hover:text-blue-300 text-sm">
              + Add your first contact
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="crm-modal rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="crm-text-primary font-bold text-lg mb-5">
              {editId ? 'Edit Contact' : 'Add Contact'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block crm-text-secondary text-xs mb-1">Client</label>
                <select
                  value={form.clientId}
                  onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                  className="w-full crm-input rounded-xl px-3 py-2.5 text-sm"
                >
                  <option value="">— None —</option>
                  {data.clients.map(c => (
                    <option key={c.id} value={c.id}>{c.nameEn || c.nameAr}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Full Name *</label>
                  <input
                    required value={form.fullName}
                    onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Job Title</label>
                  <input
                    value={form.jobTitle}
                    onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block crm-text-secondary text-xs mb-1">Phone Numbers</label>
                {form.phones.map((ph, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <input
                      value={ph} onChange={e => setPhone(i, e.target.value)}
                      placeholder="+20 1xx xxxx xxxx"
                      className="flex-1 crm-input rounded-xl px-3 py-2.5 text-sm"
                    />
                    {form.phones.length > 1 && (
                      <button type="button" onClick={() => removePhone(i)}
                        className="crm-text-muted hover:text-red-400 px-2 text-lg leading-none">×</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addPhone} className="text-blue-400 text-xs hover:text-blue-300 transition-colors">
                  + Add phone
                </button>
              </div>

              <div>
                <label className="block crm-text-secondary text-xs mb-1">Email</label>
                <input
                  type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full crm-input rounded-xl px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block crm-text-secondary text-xs mb-1">Notes</label>
                <textarea
                  rows={2} value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full crm-input rounded-xl px-3 py-2.5 text-sm resize-none"
                />
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
          title="Delete Contact"
          message="Are you sure you want to delete this contact?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {showImport && (
        <ImportModal
          title="Contacts"
          columns={IMPORT_COLUMNS}
          templateRows={TEMPLATE_ROWS}
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}
