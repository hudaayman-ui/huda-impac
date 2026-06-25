import React, { useState } from 'react';
import { Plus, Pencil, Trash2, UserCog, Mail, Phone, Building, Check, X } from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { TeamMember } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';

type FormState = Omit<TeamMember, 'id' | 'createdAt'>;

const emptyForm = (): FormState => ({
  name: '', role: '', phones: [''], email: '', department: '', active: true,
});

export default function Team() {
  const { data, addTeamMember, updateTeamMember, deleteTeamMember, addToast } = useCRM();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineForm, setInlineForm] = useState<FormState>(emptyForm());

  const openAdd = () => { setForm(emptyForm()); setEditId(null); setShowForm(true); };
  const openEdit = (m: TeamMember) => {
    setForm({
      name: m.name, role: m.role,
      phones: m.phones?.length ? [...m.phones] : [''],
      email: m.email, department: m.department, active: m.active,
    });
    setEditId(m.id);
    setShowForm(true);
  };

  const startInlineEdit = (m: TeamMember) => {
    setInlineForm({
      name: m.name, role: m.role,
      phones: m.phones?.length ? [...m.phones] : [''],
      email: m.email, department: m.department, active: m.active,
    });
    setInlineEditId(m.id);
  };

  const saveInlineEdit = () => {
    if (!inlineEditId) return;
    updateTeamMember(inlineEditId, {
      ...inlineForm,
      phones: inlineForm.phones.filter(p => p.trim()),
    });
    addToast('Member updated ✓');
    setInlineEditId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, phones: form.phones.filter(p => p.trim()) };
    if (editId) {
      updateTeamMember(editId, payload);
      addToast('Member updated ✓');
    } else {
      addTeamMember(payload);
      addToast('Member added ✓');
    }
    setShowForm(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteTeamMember(deleteId);
    addToast('Member deleted');
    setDeleteId(null);
  };

  const addPhone = (setter: React.Dispatch<React.SetStateAction<FormState>>) =>
    setter(f => ({ ...f, phones: [...f.phones, ''] }));
  const removePhone = (setter: React.Dispatch<React.SetStateAction<FormState>>, i: number) =>
    setter(f => ({ ...f, phones: f.phones.filter((_, idx) => idx !== i) }));
  const setPhone = (setter: React.Dispatch<React.SetStateAction<FormState>>, i: number, val: string) =>
    setter(f => ({ ...f, phones: f.phones.map((p, idx) => idx === i ? val : p) }));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold crm-text-primary">Team</h1>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors">
          <Plus size={15} />
          Add Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.team.map(member => {
          const taskCount = data.tasks.filter(t => t.assignedTo === member.id && t.status !== 'done').length;
          const dealCount = data.deals.filter(d => d.assignedTo === member.id).length;
          const isInline = inlineEditId === member.id;

          return (
            <div key={member.id}
              className={`crm-card rounded-2xl p-5 transition-all ${!member.active ? 'opacity-60' : ''}`}>
              {isInline ? (
                /* Inline edit form */
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="crm-text-secondary text-xs font-medium">Editing member</span>
                    <div className="flex gap-1">
                      <button onClick={saveInlineEdit} className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500">
                        <Check size={13} />
                      </button>
                      <button onClick={() => setInlineEditId(null)} className="p-1.5 rounded-lg crm-surface-elevated crm-text-muted hover:crm-text-primary">
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                  <input placeholder="Name" value={inlineForm.name}
                    onChange={e => setInlineForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full crm-input rounded-xl px-3 py-2 text-sm" />
                  <input placeholder="Role / Title" value={inlineForm.role}
                    onChange={e => setInlineForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full crm-input rounded-xl px-3 py-2 text-sm" />
                  <input type="email" placeholder="Email" value={inlineForm.email}
                    onChange={e => setInlineForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full crm-input rounded-xl px-3 py-2 text-sm" />
                  <select value={inlineForm.department}
                    onChange={e => setInlineForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full crm-input rounded-xl px-3 py-2 text-sm">
                    <option value="">— Department —</option>
                    {data.settings.dropdowns.departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <div>
                    {inlineForm.phones.map((ph, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <input value={ph} onChange={e => setPhone(setInlineForm, i, e.target.value)}
                          placeholder="Phone number"
                          className="flex-1 crm-input rounded-xl px-3 py-2 text-sm" />
                        {inlineForm.phones.length > 1 && (
                          <button type="button" onClick={() => removePhone(setInlineForm, i)}
                            className="crm-text-muted hover:text-red-400">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addPhone(setInlineForm)}
                      className="text-blue-400 hover:text-blue-300 text-xs">+ Add phone</button>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={inlineForm.active}
                      onChange={e => setInlineForm(f => ({ ...f, active: e.target.checked }))}
                      className="w-4 h-4 accent-blue-600" />
                    <span className="crm-text-secondary text-sm">Active</span>
                  </label>
                </div>
              ) : (
                /* Normal card view */
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {member.name[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <h3 className="crm-text-primary font-semibold">{member.name}</h3>
                        <p className="crm-text-secondary text-sm">{member.role}</p>
                        {!member.active && (
                          <span className="text-xs text-red-400">Inactive</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => startInlineEdit(member)}
                        className="p-1.5 rounded-lg crm-text-muted hover:crm-text-primary hover:crm-surface-elevated transition-colors"
                        title="Quick edit">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteId(member.id)}
                        className="p-1.5 rounded-lg crm-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    {(member.phones || []).filter(p => p).map((ph, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Phone size={12} className="crm-text-muted flex-shrink-0" />
                        <a href={`tel:${ph}`} className="crm-text-secondary text-sm hover:text-blue-400 transition-colors">{ph}</a>
                      </div>
                    ))}
                    {member.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={12} className="crm-text-muted flex-shrink-0" />
                        <a href={`mailto:${member.email}`} className="crm-text-secondary text-sm hover:text-blue-400 transition-colors truncate">{member.email}</a>
                      </div>
                    )}
                    {member.department && (
                      <div className="flex items-center gap-2">
                        <Building size={12} className="crm-text-muted flex-shrink-0" />
                        <span className="crm-text-secondary text-sm">{member.department}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="crm-surface-elevated rounded-xl py-2">
                      <p className="crm-text-primary font-bold text-lg">{taskCount}</p>
                      <p className="crm-text-muted text-xs">Open Tasks</p>
                    </div>
                    <div className="crm-surface-elevated rounded-xl py-2">
                      <p className="crm-text-primary font-bold text-lg">{dealCount}</p>
                      <p className="crm-text-muted text-xs">Deals</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {data.team.length === 0 && (
          <div className="col-span-full text-center py-16 crm-text-muted">
            <UserCog size={40} className="mx-auto mb-3 opacity-30" />
            <p>No team members yet</p>
            <button onClick={openAdd} className="mt-3 text-blue-400 hover:text-blue-300 text-sm">
              + Add your first team member
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="crm-modal w-full max-w-md mx-4 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="crm-text-primary font-bold text-lg mb-5">
              {editId ? 'Edit Team Member' : 'Add Team Member'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Role / Title</label>
                  <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm" />
                </div>
              </div>

              <div>
                <label className="block crm-text-secondary text-xs mb-1">Phone Numbers</label>
                {form.phones.map((ph, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={ph} onChange={e => setPhone(setForm, i, e.target.value)}
                      placeholder="+20 1xx xxxx xxxx"
                      className="flex-1 crm-input rounded-xl px-3 py-2.5 text-sm" />
                    {form.phones.length > 1 && (
                      <button type="button" onClick={() => removePhone(setForm, i)}
                        className="crm-text-muted hover:text-red-400 px-2">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addPhone(setForm)}
                  className="text-blue-400 hover:text-blue-300 text-xs">
                  + Add phone number
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Department</label>
                  <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm">
                    <option value="">— Select —</option>
                    {data.settings.dropdowns.departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.active}
                  onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                  className="w-4 h-4 accent-blue-600" />
                <span className="crm-text-secondary text-sm">Active member</span>
              </label>

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
          title="Delete Team Member"
          message="Assigned tasks and deals will remain. Are you sure you want to delete this member?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
