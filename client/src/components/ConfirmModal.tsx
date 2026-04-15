import { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'success';
  requireComment?: boolean;
  commentPlaceholder?: string;
  onConfirm: (comment?: string) => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  requireComment = false,
  commentPlaceholder = 'Add a comment (optional)...',
  onConfirm,
  onCancel,
}: Props) {
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!isOpen) setComment('');
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isSuccess = variant === 'success';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 animate-in zoom-in-95 duration-150">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div
            className={clsx(
              'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full',
              isSuccess ? 'bg-emerald-100' : 'bg-red-100'
            )}
          >
            {isSuccess ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-red-600" />
            )}
          </div>

          <h3 className="text-center text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-center text-sm text-gray-500 mb-5">{description}</p>

          {/* Comment textarea */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={commentPlaceholder}
            rows={3}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-4"
          />

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => onConfirm(comment || undefined)}
              disabled={requireComment && !comment.trim()}
              className={clsx(
                'flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                isSuccess
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
