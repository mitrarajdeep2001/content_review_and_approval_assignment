import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, Image as ImageIcon, Type, AlignLeft, Eye } from 'lucide-react';

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60',
];
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
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
      // If it's not a placeholder, set it as customImageUrl
      if (item.image && !PLACEHOLDER_IMAGES.includes(item.image)) {
        setCustomImageUrl(item.image);
      }
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

  const isEditable = item.status === 'DRAFT' || item.status === 'CHANGES_REQUESTED';

  if (!isEditable) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md shadow-sm text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Cannot Edit Content</h2>
          <p className="text-sm text-gray-500 mb-2">
            Content can only be edited when it is a <strong className="text-gray-700">Draft</strong> or has <strong className="text-gray-700">Changes Requested</strong>.
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
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('body', form.body);
      
      if (imageFile) {
        formData.append('imageFile', imageFile);
      } else {
        formData.append('image', customImageUrl || form.image || '');
      }

      await updateContent(item.id, formData);
      toast.success('Content updated! You can now resubmit for review.');
      navigate(`/content/${item.id}`);
    } catch (error) {
      toast.error('Failed to update content');
    } finally {
      setIsLoading(false);
    }
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Tab Toggle */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {(['edit', 'preview'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors capitalize',
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab === 'edit' ? <Type className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {tab}
            </button>
          ))}
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

        {activeTab === 'edit' ? (
          <div className="space-y-5">
          {/* Image Selection */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
              <ImageIcon className="h-4 w-4 text-gray-400" />
              Cover Image
            </label>

            {/* Preview */}
            <div className="relative h-44 rounded-xl overflow-hidden bg-gray-100 mb-4 group">
              <img
                src={imageFile ? URL.createObjectURL(imageFile) : (customImageUrl || form.image)}
                alt="Cover preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGES[0];
                }}
              />
              {(!form.image && !customImageUrl && !imageFile) && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm font-medium">
                  No image selected
                </div>
              )}
            </div>

            {/* Preset images */}
            <div className="flex flex-wrap gap-2 mb-4">
              {PLACEHOLDER_IMAGES.map((url) => (
                <button
                  key={url}
                  onClick={() => {
                      setForm((p) => ({ ...p, image: url }));
                      setCustomImageUrl('');
                      setImageFile(null);
                      setIsDirty(true);
                  }}
                  className={clsx(
                    'h-12 w-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0',
                    form.image === url && !customImageUrl && !imageFile
                      ? 'border-blue-500 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
              <button
                onClick={() => {
                  setForm(p => ({ ...p, image: '' }));
                  setCustomImageUrl('');
                  setImageFile(null);
                  setIsDirty(true);
                }}
                className={clsx(
                  'h-12 w-16 rounded-lg border-2 border-dashed flex items-center justify-center text-xs font-semibold text-gray-400 transition-all flex-shrink-0',
                  !form.image && !customImageUrl && !imageFile
                    ? 'border-blue-500 text-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:text-gray-500'
                )}
              >
                None
              </button>
            </div>

            {/* Custom Image Upload & URL */}
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-gray-500 ml-1">Upload from computer</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setImageFile(e.target.files[0]);
                      setCustomImageUrl('');
                      setForm(p => ({ ...p, image: '' }));
                      setIsDirty(true);
                    }
                  }}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"
                />
                {imageFile && (
                  <p className="text-[10px] text-blue-600 font-medium ml-1 flex items-center gap-1">
                    <Save className="h-2.5 w-2.5" /> File selected: {imageFile.name}
                  </p>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                  <span className="bg-white px-2 text-gray-300">OR</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-gray-500 ml-1">Paste image URL</span>
                <input
                  type="url"
                  value={customImageUrl}
                  onChange={(e) => {
                    setCustomImageUrl(e.target.value);
                    setForm((p) => ({ ...p, image: '' }));
                    setImageFile(null);
                    setIsDirty(true);
                  }}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {customImageUrl && (
                  <p className="text-[10px] text-emerald-600 font-medium ml-1 flex items-center gap-1">
                    <Save className="h-2.5 w-2.5" /> Using custom URL
                  </p>
                )}
              </div>
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
        ) : (
          /* Preview Tab */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Cover image */}
            <div className="h-56">
              <img
                src={imageFile ? URL.createObjectURL(imageFile) : (customImageUrl || form.image)}
                alt="Preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGES[0];
                }}
              />
            </div>
            <div className="p-8">
              {form.title ? (
                <h1 className="text-2xl font-bold text-gray-900 mb-3">{form.title}</h1>
              ) : (
                <div className="h-8 bg-gray-100 rounded-lg w-3/4 mb-3" />
              )}
              {form.description && (
                <p className="text-gray-500 text-sm italic border-l-4 border-gray-100 pl-4 mb-6">
                  {form.description}
                </p>
              )}
              {form.body ? (
                <div className="space-y-3">
                  {form.body.split('\n\n').map((paragraph, idx) => {
                    if (!paragraph.trim()) return null;
                    if (paragraph.startsWith('## ')) {
                      return (
                        <h2 key={idx} className="text-base font-bold text-gray-800 mt-5 mb-1">
                          {paragraph.replace('## ', '')}
                        </h2>
                      );
                    }
                    const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
                    return (
                      <p key={idx} className="text-sm text-gray-600 leading-relaxed">
                        {parts.map((part, i) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return (
                              <strong key={i} className="font-semibold text-gray-800">
                                {part.replace(/\*\*/g, '')}
                              </strong>
                            );
                          }
                          return <span key={i}>{part}</span>;
                        })}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-full" />
                  <div className="h-4 bg-gray-100 rounded w-5/6" />
                  <div className="h-4 bg-gray-100 rounded w-4/6" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
