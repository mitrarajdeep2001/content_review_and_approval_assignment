import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { StatusBadge } from '../components/StatusBadge';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

export function EditContentPage() {
  const { id } = useParams<{ id: string }>();
  const currentUser = useRequireAuth(['CREATOR']);
  const { contentList, updateContent } = useApp();
  const navigate = useNavigate();

  const item = contentList.find((c) => c.id === id);

  const [form, setForm] = useState({
    title: '',
    description: '',
    body: '',
    image: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title,
        description: item.description,
        body: item.body,
        image: item.image,
      });
    }
  }, [item]);

  if (!currentUser) return null;

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Content not found</h2>
          <Link to="/" className="text-blue-600 hover:underline text-sm">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (item.status !== 'CHANGES_REQUESTED') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md shadow-sm text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Cannot Edit Content</h2>
          <p className="text-sm text-gray-500 mb-2">
            Content can only be edited when its status is{' '}
            <strong className="text-gray-700">Changes Requested</strong>.
          </p>
          <p className="text-sm text-gray-400 mb-5">
            Current status:{' '}
          </p>
          <div className="flex justify-center mb-6">
            <StatusBadge status={item.status} />
          </div>
          <Link
            to={`/content/${item.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            View Content
          </Link>
        </div>
      </div>
    );
  }

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) newErrors.title = 'Title is required.';
    else if (form.title.length < 5) newErrors.title = 'Title must be at least 5 characters.';
    if (!form.description.trim()) newErrors.description = 'Description is required.';
    if (!form.body.trim()) newErrors.body = 'Content body is required.';
    else if (form.body.length < 50) newErrors.body = 'Body must be at least 50 characters.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validate()) {
      toast.error('Please fix the errors before saving.');
      return;
    }
    if (!isDirty) {
      toast('No changes to save.', { icon: 'ℹ️' });
      return;
    }
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    updateContent(item.id, {
      title: form.title,
      description: form.description,
      body: form.body,
      image: form.image,
    });
    toast.success('Content updated! You can now resubmit for review.');
    navigate(`/content/${item.id}`);
    setIsLoading(false);
  };

  const updateField = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setIsDirty(true);
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
  };

  // Get the rejection comment from history
  const rejectionEntry = [...item.history].reverse().find((h) => h.action === 'REJECTED');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link
              to={`/content/${item.id}`}
              className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Edit Content</h1>
              <p className="text-sm text-gray-500">Address the requested changes before resubmitting</p>
            </div>
          </div>

          <button
            onClick={handleUpdate}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-60 shadow-sm"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </button>
        </div>

        {/* Rejection feedback banner */}
        {rejectionEntry?.comment && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800 mb-0.5">Changes Requested by Reviewer</p>
              <p className="text-sm text-red-700">"{rejectionEntry.comment}"</p>
              <p className="text-xs text-red-400 mt-1">— {rejectionEntry.actor}</p>
            </div>
          </div>
        )}

        <div className="space-y-5">
          {/* Cover image URL */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-3">Cover Image URL</label>
            <div className="flex gap-3">
              <div className="h-16 w-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                <img
                  src={form.image}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&auto=format&fit=crop&q=60';
                  }}
                />
              </div>
              <input
                type="url"
                value={form.image}
                onChange={(e) => updateField('image', e.target.value)}
                placeholder="https://..."
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Title */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              className={clsx(
                'w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
                errors.title ? 'border-red-300 bg-red-50' : 'border-gray-200'
              )}
            />
            {errors.title && <p className="mt-1.5 text-xs text-red-600">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              Short Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={2}
              className={clsx(
                'w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none',
                errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200'
              )}
            />
            {errors.description && <p className="mt-1.5 text-xs text-red-600">{errors.description}</p>}
          </div>

          {/* Body */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Content Body <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-3">Supports basic markdown: **bold**, ## Heading</p>
            <textarea
              value={form.body}
              onChange={(e) => updateField('body', e.target.value)}
              rows={16}
              className={clsx(
                'w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y font-mono',
                errors.body ? 'border-red-300 bg-red-50' : 'border-gray-200'
              )}
            />
            {errors.body && <p className="mt-1.5 text-xs text-red-600">{errors.body}</p>}
            <p className="mt-1.5 text-xs text-gray-400">{form.body.length} characters</p>
          </div>

          {/* Bottom actions */}
          <div className="flex items-center justify-between">
            <Link
              to={`/content/${item.id}`}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleUpdate}
              disabled={isLoading || !isDirty}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-60 shadow-sm"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
