import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useCRM } from '../context/CRMContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useCRM();

  return (
    <div className="fixed bottom-24 left-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-white text-sm font-medium min-w-[220px] max-w-xs animate-slide-up ${
            toast.type === 'success' ? 'bg-emerald-600' :
            toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle size={16} /> :
           toast.type === 'error' ? <AlertCircle size={16} /> :
           <Info size={16} />}
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
