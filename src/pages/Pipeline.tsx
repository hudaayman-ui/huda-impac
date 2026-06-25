import React, { useState } from 'react';
import { Plus, Search, Pencil, Trash2, AlertTriangle, List, LayoutGrid, Clock } from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { useLang } from '../context/LangContext';
import { Deal } from '../types';
import { formatDate, daysBetween, todayStr } from '../utils/storage';
import ConfirmDialog from '../components/ConfirmDialog';

interface PipelineProps {
  onDealWon?: (deal: Deal) => void;
}

type FormState = Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'activityLog'>;

const emptyForm = (firstStageId: string): FormState => ({
  name: '', clientId: '', stageId: firstStageId, probability: 20,
  expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  assignedTo: '', notes: '',
});

export default function Pipeline({ onDealWon }: PipelineProps) {
  const { data, addDeal, updateDeal, deleteDeal, addDealActivity, addToast } = useCRM();
  const { lang } = useLang();

  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm('lead'));
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dragDeal, setDragDeal] = useState<string | null>(null);
  const [lostDialogDealId, setLostDialogDealId] = useState<string | null>(null);
  const [lostReason, setLostReason] = useState('');

  const today = todayStr();
  const stages = [...data.settings.pipelineStages].sort((a, b) => a.order - b.order);
  const threshold = data.settings.notifications.noActivityDealThreshold;

  const filtered = data.deals.filter(d => {
    const q = search.toLowerCase();
    const client = data.clients.find(c => c.id === d.clientId);
    return !q || d.name.toLowerCase().includes(q) || (client?.nameEn || client?.nameAr || '').toLowerCase().includes(q);
  });

  const getDealsByStage = (stageId: string) => filtered.filter(d => d.stageId === stageId);

  const openAdd = () => {
    setForm(emptyForm(stages[0]?.id || 'lead'));
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (deal: Deal) => {
    setForm({
      name: deal.name, clientId: deal.clientId, stageId: deal.stageId,
      probability: deal.probability, expectedCloseDate: deal.expectedCloseDate,
      assignedTo: deal.assignedTo, notes: deal.notes,
    });
    setEditId(deal.id);
    setShowForm(true);
  };

  const handleStageChange = (dealId: string, newStageId: string) => {
    const stage = stages.find(s => s.id === newStageId);
    const deal = data.deals.find(d => d.id === dealId);
    if (!deal) return;

    if (stage?.type === 'lost') {
      updateDeal(dealId, { stageId: newStageId });
      setLostDialogDealId(dealId);
      return;
    }
    updateDeal(dealId, { stageId: newStageId });
    if (stage) addDealActivity(dealId, `Stage changed to: ${stage.nameEn}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      updateDeal(editId, form);
      addToast('Deal updated ✓');
    } else {
      addDeal(form);
      addToast('Deal added ✓');
    }
    setShowForm(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteDeal(deleteId);
    addToast('Deal deleted');
    setDeleteId(null);
  };

  const handleDrop = (stageId: string) => {
    if (!dragDeal) return;
    handleStageChange(dragDeal, stageId);
    setDragDeal(null);
  };

  const isInactive = (deal: Deal) => {
    const stage = stages.find(s => s.id === deal.stageId);
    if (stage?.type === 'lost') return false;
    return daysBetween(deal.updatedAt, today) >= threshold;
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold crm-text-primary">Pipeline</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center crm-surface border crm-border rounded-xl p-1">
            <button onClick={() => setView('kanban')}
              className={`p-1.5 rounded-lg transition-colors ${view === 'kanban' ? 'bg-blue-600 text-white' : 'crm-text-secondary hover:crm-text-primary'}`}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setView('table')}
              className={`p-1.5 rounded-lg transition-colors ${view === 'table' ? 'bg-blue-600 text-white' : 'crm-text-secondary hover:crm-text-primary'}`}>
              <List size={16} />
            </button>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus size={15} />
            Add Deal
          </button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 crm-text-muted" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search deals..."
          className="w-full crm-input rounded-xl pl-9 pr-4 py-2.5 text-sm" />
      </div>

      {view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map(stage => {
            const stageDeals = getDealsByStage(stage.id);
            return (
              <div
                key={stage.id}
                className="flex-shrink-0 w-64 crm-card rounded-2xl overflow-hidden"
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(stage.id)}
              >
                <div className="p-3 border-b crm-border" style={{ borderTopColor: stage.color, borderTopWidth: 3 }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: stage.color }} />
                    <span className="crm-text-primary text-sm font-semibold">{stage.nameEn}</span>
                    <span className="px-1.5 py-0.5 crm-surface-elevated crm-text-muted rounded-full text-xs ml-auto">{stageDeals.length}</span>
                  </div>
                </div>

                <div className="p-3 space-y-3 min-h-[80px]">
                  {stageDeals.map(deal => {
                    const client = data.clients.find(c => c.id === deal.clientId);
                    const inactive = isInactive(deal);
                    return (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={() => setDragDeal(deal.id)}
                        onDragEnd={() => setDragDeal(null)}
                        className={`crm-card-inner rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all hover:crm-border-hover ${inactive ? 'border border-yellow-500/30' : ''} ${dragDeal === deal.id ? 'opacity-50' : ''}`}
                      >
                        {inactive && (
                          <div className="flex items-center gap-1 mb-2">
                            <Clock size={11} className="text-yellow-400" />
                            <span className="text-yellow-400 text-xs">{daysBetween(deal.updatedAt, today)}d inactive</span>
                          </div>
                        )}
                        <p className="crm-text-primary text-sm font-medium mb-1 leading-tight">{deal.name}</p>
                        {client && <p className="crm-text-muted text-xs mb-2">{client.nameEn || client.nameAr}</p>}
                        <div className="flex items-center justify-between text-xs crm-text-muted">
                          <span>{deal.probability}%</span>
                          {deal.expectedCloseDate && (
                            <span>{formatDate(deal.expectedCloseDate, data.settings.dateFormat)}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t crm-border">
                          <button onClick={() => openEdit(deal)} className="p-1 crm-text-muted hover:crm-text-primary"><Pencil size={12} /></button>
                          <button onClick={() => setDeleteId(deal.id)} className="p-1 crm-text-muted hover:text-red-400"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="crm-card rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b crm-border">
                {['Deal', 'Client', 'Stage', 'Prob.', 'Close Date', 'Assigned', ''].map((h, i) => (
                  <th key={i} className="text-left crm-text-muted text-xs font-medium py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(deal => {
                const stage = stages.find(s => s.id === deal.stageId);
                const client = data.clients.find(c => c.id === deal.clientId);
                const member = data.team.find(m => m.id === deal.assignedTo);
                const inactive = isInactive(deal);
                return (
                  <tr key={deal.id} className="border-b crm-border hover:crm-surface-elevated transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {inactive && <AlertTriangle size={13} className="text-yellow-400 flex-shrink-0" />}
                        <span className="crm-text-primary text-sm">{deal.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 crm-text-secondary text-sm">{client ? (client.nameEn || client.nameAr) : '—'}</td>
                    <td className="py-3 px-4">
                      {stage && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium"
                          style={{ background: stage.color + '25', color: stage.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: stage.color }} />
                          {stage.nameEn}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 crm-text-secondary text-sm">{deal.probability}%</td>
                    <td className="py-3 px-4 crm-text-secondary text-sm">{formatDate(deal.expectedCloseDate, data.settings.dateFormat)}</td>
                    <td className="py-3 px-4 crm-text-secondary text-sm">{member?.name || '—'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(deal)} className="p-1.5 rounded-lg crm-text-muted hover:crm-text-primary hover:crm-surface-elevated transition-colors"><Pencil size={13} /></button>
                        <button onClick={() => setDeleteId(deal.id)} className="p-1.5 rounded-lg crm-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 crm-text-muted">No deals found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Deal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="crm-modal w-full max-w-lg mx-4 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="crm-text-primary font-bold text-lg mb-5">
              {editId ? 'Edit Deal' : 'Add Deal'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block crm-text-secondary text-xs mb-1">Deal Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full crm-input rounded-xl px-3 py-2.5 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Client *</label>
                  <select required value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm">
                    <option value="">— Select Client —</option>
                    {data.clients.map(c => <option key={c.id} value={c.id}>{c.nameEn || c.nameAr}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Stage</label>
                  <select value={form.stageId} onChange={e => setForm(f => ({ ...f, stageId: e.target.value }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm">
                    {stages.map(s => <option key={s.id} value={s.id}>{s.nameEn}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Probability (%)</label>
                  <input type="number" min="0" max="100" value={form.probability}
                    onChange={e => setForm(f => ({ ...f, probability: +e.target.value }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Expected Close Date</label>
                  <input type="date" value={form.expectedCloseDate}
                    onChange={e => setForm(f => ({ ...f, expectedCloseDate: e.target.value }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm" />
                </div>
              </div>
              <div>
                <label className="block crm-text-secondary text-xs mb-1">Assigned To</label>
                <select value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                  className="w-full crm-input rounded-xl px-3 py-2.5 text-sm">
                  <option value="">— None —</option>
                  {data.team.filter(m => m.active).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block crm-text-secondary text-xs mb-1">Notes</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full crm-input rounded-xl px-3 py-2.5 text-sm resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 crm-btn-secondary rounded-xl text-sm font-medium transition-colors">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Delete Deal"
          message="Are you sure you want to delete this deal?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {lostDialogDealId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="crm-modal w-full max-w-sm mx-4 rounded-2xl p-6">
            <h3 className="crm-text-primary font-bold mb-4">Loss Reason</h3>
            <select value={lostReason} onChange={e => setLostReason(e.target.value)}
              className="w-full crm-input rounded-xl px-3 py-2.5 text-sm mb-4">
              <option value="">— Select reason —</option>
              {data.settings.dropdowns.lostReasons.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={() => { setLostDialogDealId(null); setLostReason(''); }}
                className="flex-1 py-2.5 crm-btn-secondary rounded-xl text-sm">Cancel</button>
              <button onClick={() => {
                if (lostDialogDealId) {
                  updateDeal(lostDialogDealId, { lostReason });
                  addDealActivity(lostDialogDealId, `Deal marked as lost: ${lostReason}`);
                  addToast('Deal marked as lost');
                }
                setLostDialogDealId(null);
                setLostReason('');
              }} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
