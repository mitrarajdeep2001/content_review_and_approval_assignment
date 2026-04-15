import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Image, Type, AlignLeft, Eye } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60',
];

export function CreateContentPage() {
  const currentUser = useRequireAuth(['CREATOR']);
  const { createContent } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    body: '',
    image: PLACEHOLDER_IMAGES[0],
    customImage: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!currentUser) return null;

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

  const handleSaveDraft = async () => {
    if (!validate()) {
      toast.error('Please fix the errors before saving.');
      return;
    }
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const item = createContent({
      title: form.title,
      description: form.description,
      body: form.body,
      image: form.customImage || form.image,
    });
    toast.success('Draft saved successfully!');
    navigate(`/content/${item.id}`);
    setIsLoading(false);
  };

  const selectedImage = form.customImage || form.image;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Create New Content</h1>
              <p className="text-sm text-gray-500">Draft will be saved and can be submitted for review</p>
            </div>
          </div>

          <button
            onClick={handleSaveDraft}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-60 shadow-sm"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save as Draft
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

        {activeTab === 'edit' ? (
          <div className="space-y-5">
            {/* Image Selection */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
                <Image className="h-4 w-4 text-gray-400" />
                Cover Image
              </label>

              {/* Preview */}
              <div className="relative h-40 rounded-xl overflow-hidden bg-gray-100 mb-4">
                <img
                  src={selectedImage}
                  alt="Cover preview"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGES[0];
                  }}
                />
              </div>

              {/* Preset images */}
              <div className="flex gap-2 mb-3">
                {PLACEHOLDER_IMAGES.map((url) => (
                  <button
                    key={url}
                    onClick={() => setForm((p) => ({ ...p, image: url, customImage: '' }))}
                    className={clsx(
                      'h-12 w-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0',
                      form.image === url && !form.customImage
                        ? 'border-blue-500 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Custom URL */}
              <input
                type="url"
                value={form.customImage}
                onChange={(e) => setForm((p) => ({ ...p, customImage: e.target.value }))}
                placeholder="Or paste a custom image URL..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Title */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
                <Type className="h-4 w-4 text-gray-400" />
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => {
                  setForm((p) => ({ ...p, title: e.target.value }));
                  if (errors.title) setErrors((p) => ({ ...p, title: '' }));
                }}
                placeholder="Enter a compelling title for your content..."
                className={clsx(
                  'w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
                  errors.title ? 'border-red-300 bg-red-50' : 'border-gray-200'
                )}
              />
              {errors.title && (
                <p className="mt-1.5 text-xs text-red-600">{errors.title}</p>
              )}
              <p className="mt-1.5 text-xs text-gray-400">{form.title.length} characters</p>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
                <AlignLeft className="h-4 w-4 text-gray-400" />
                Short Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => {
                  setForm((p) => ({ ...p, description: e.target.value }));
                  if (errors.description) setErrors((p) => ({ ...p, description: '' }));
                }}
                placeholder="A brief summary of what this content covers..."
                rows={2}
                className={clsx(
                  'w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none',
                  errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200'
                )}
              />
              {errors.description && (
                <p className="mt-1.5 text-xs text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Body */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-1">
                <AlignLeft className="h-4 w-4 text-gray-400" />
                Content Body <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-400 mb-3">
                Supports basic markdown: **bold**, ## Heading
              </p>
              <textarea
                value={form.body}
                onChange={(e) => {
                  setForm((p) => ({ ...p, body: e.target.value }));
                  if (errors.body) setErrors((p) => ({ ...p, body: '' }));
                }}
                placeholder={`Write your full content here...\n\n## Section Heading\n\nYour paragraph text goes here. Use **bold** for emphasis.\n\n## Another Section\n\nContinue writing...`}
                rows={16}
                className={clsx(
                  'w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y font-mono',
                  errors.body ? 'border-red-300 bg-red-50' : 'border-gray-200'
                )}
              />
              {errors.body && (
                <p className="mt-1.5 text-xs text-red-600">{errors.body}</p>
              )}
              <p className="mt-1.5 text-xs text-gray-400">{form.body.length} characters</p>
            </div>
          </div>
        ) : (
          /* Preview Tab */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Cover image */}
            <div className="h-56">
              <img
                src={selectedImage}
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
                            return <strong key={i} className="font-semibold text-gray-800">{part.replace(/\*\*/g, '')}</strong>;
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

        {/* Bottom save button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveDraft}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-60 shadow-sm"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save as Draft
          </button>
        </div>
      </div>
    </div>
  );
}
