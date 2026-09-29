import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, item }) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-sm overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">Delete Menu Item?</h3>
            <p className="text-xs text-stone-500">This action cannot be undone.</p>
          </div>
        </div>

        <p className="text-sm text-stone-600 mb-6 bg-stone-50 p-3 rounded-lg border border-stone-200">
          Are you sure you want to delete <span className="font-bold text-stone-900">"{item.name}"</span> from the menu?
        </p>

        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(item.id);
              onClose();
            }}
            className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-colors"
          >
            Delete Item
          </button>
        </div>

      </div>
    </div>
  );
}
