import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  variant = 'danger',
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-4">
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${variant === 'danger' ? 'bg-rose-100' : 'bg-teal-100'}`}>
          <AlertTriangle className={`h-6 w-6 ${variant === 'danger' ? 'text-rose-600' : 'text-teal-600'}`} />
        </div>
        <p className="pt-2 text-sm text-gray-600">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button className="btn-secondary" onClick={onClose}>
          Annuler
        </button>
        <button
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.98] ${variant === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-teal-700 hover:bg-teal-800'}`}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
