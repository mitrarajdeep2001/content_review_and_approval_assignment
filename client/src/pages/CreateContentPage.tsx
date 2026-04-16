import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Image, Type, AlignLeft, Eye, Send } from 'lucide-react';
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pendingAction, setPendingAction] = useState<'draft' | 'submit' | null>(null);
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

  const handleSave = async (submitForReview: boolean) => {
    if (!validate()) {
      toast.error('Please fix the errors before saving.');
      return;
    }
    setPendingAction(submitForReview ? 'submit' : 'draft');
    
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('body', form.body);
      
      if (submitForReview) {
        formData.append('status', 'IN_REVIEW');
      }
      
      if (imageFile) {
        formData.append('imageFile', imageFile);
      } else {
        formData.append('image', form.customImage || form.image);
      }
      
      const item = await createContent(formData);
      toast.success(submitForReview ? 'Content submitted for review!' : 'Draft saved successfully!');
      navigate(`/content/${item.id}`);
    } catch (error) {
      toast.error('Failed to save content');
    } finally {
      setPendingAction(null);
    }
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave(false)}
              disabled={!!pendingAction}
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-60 shadow-sm"
            >
              {pendingAction === 'draft' ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-gray-700" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save as Draft
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={!!pendingAction}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-60 shadow-sm"
            >
              {pendingAction === 'submit' ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit for Review
            </button>
          </div>
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
                    onClick={() => {
                        setForm((p) => ({ ...p, image: url, customImage: '' }));
                        setImageFile(null);
                    }}
                    className={clsx(
                      'h-12 w-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0',
                      form.image === url && !form.customImage && !imageFile
                        ? 'border-blue-500 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
                <button
                  onClick={() => {
                    setForm(p => ({ ...p, image: '', customImage: '' }));
                    setImageFile(null);
                  }}
                  className={clsx(
                    'h-12 w-16 rounded-lg border-2 border-dashed flex items-center justify-center text-xs font-semibold text-gray-400 transition-all flex-shrink-0',
                    !form.image && !form.customImage && !imageFile
                      ? 'border-blue-500 text-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:text-gray-500'
                  )}
                >
                  None
                </button>
              </div>

              {/* Custom Image Upload */}
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-gray-500 ml-1">Upload from computer</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                        setForm(p => ({ ...p, customImage: '', image: URL.createObjectURL(e.target.files![0]) }));
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
                    value={form.customImage}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, customImage: e.target.value, image: e.target.value }));
                      setImageFile(null);
                    }}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {form.customImage && (
                    <p className="text-[10px] text-emerald-600 font-medium ml-1 flex items-center gap-1">
                      <ArrowLeft className="h-2.5 w-2.5 rotate-180" /> Using custom URL
                    </p>
                  )}
                </div>
              </div>
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
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => handleSave(false)}
            disabled={!!pendingAction}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-60 shadow-sm"
          >
            {pendingAction === 'draft' ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-gray-700" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save as Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={!!pendingAction}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-60 shadow-sm"
          >
            {pendingAction === 'submit' ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Submit for Review
          </button>
        </div>
      </div>
    </div>
  );
}
