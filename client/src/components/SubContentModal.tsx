import { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon, Send, Upload } from 'lucide-react';
import { useApp } from '../store/AppContext';
import type { SubContent } from '../types';
import { clsx } from 'clsx';
import { getImageUrl } from '../utils/helpers';
import toast from 'react-hot-toast';

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60',
];

interface Props {
  parentId: string;
  item?: SubContent;
  isOpen: boolean;
  onClose: () => void;
}

export function SubContentModal({ parentId, item, isOpen, onClose }: Props) {
  const { createSubContent, updateSubContent } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  
  // Image Logic State
  const [selectedPreset, setSelectedPreset] = useState(PLACEHOLDER_IMAGES[0]);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [pendingAction, setPendingAction] = useState<'draft' | 'submit' | null>(null);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description);
      setBody(item.body || '');
      
      // Initialize image states based on existing item.image
      if (item.image) {
        if (PLACEHOLDER_IMAGES.includes(item.image)) {
          setSelectedPreset(item.image);
          setCustomImageUrl('');
        } else {
          setSelectedPreset('');
          setCustomImageUrl(item.image);
        }
      } else {
        setSelectedPreset('');
        setCustomImageUrl('');
      }
      setImageFile(null);
    } else {
      setTitle('');
      setDescription('');
      setBody('');
      setSelectedPreset(PLACEHOLDER_IMAGES[0]);
      setCustomImageUrl('');
      setImageFile(null);
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const currentPreviewImage = imageFile 
    ? URL.createObjectURL(imageFile) 
    : getImageUrl(customImageUrl || selectedPreset);

  const handleSubmit = async (submitForReview: boolean) => {
    if (!title.trim() || !description.trim() || !body.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setPendingAction(submitForReview ? 'submit' : 'draft');
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('body', body);
      
      if (submitForReview) {
        formData.append('status', 'IN_REVIEW');
      }

      if (imageFile) {
        formData.append('imageFile', imageFile);
      } else {
        formData.append('image', customImageUrl || selectedPreset || '');
      }

      if (item) {
        await updateSubContent(item.id, formData);
        toast.success('Sub-content updated');
      } else {
        await createSubContent(parentId, formData);
        toast.success(submitForReview ? 'Sub-content submitted!' : 'Sub-content draft saved');
      }
      onClose();
    } catch (err) {
      // Error handled in context/api
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-900">
            {item ? 'Edit Sub-content' : 'Add Sub-content'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 text-gray-400 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Image Selection - REPLICATED LOGIC */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-tight">
              <ImageIcon className="h-3.5 w-3.5" />
              Cover Image
            </label>
            
            {/* Preview Area */}
            <div className="relative h-32 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 group">
              <img
                src={currentPreviewImage}
                alt="Preview"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGES[0];
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Selection Options */}
            <div className="space-y-4">
              {/* Presets */}
              <div className="flex flex-wrap gap-2">
                {PLACEHOLDER_IMAGES.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => {
                        setSelectedPreset(url);
                        setCustomImageUrl('');
                        setImageFile(null);
                    }}
                    className={clsx(
                      'h-10 w-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0',
                      selectedPreset === url && !customImageUrl && !imageFile
                        ? 'border-blue-500 shadow-sm outline outline-2 outline-blue-500/20'
                        : 'border-gray-100 hover:border-gray-300'
                    )}
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* File Upload */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <Upload className="h-2.5 w-2.5" /> Upload File
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setImageFile(e.target.files[0]);
                        setSelectedPreset('');
                        setCustomImageUrl('');
                      }
                    }}
                    className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer"
                  />
                </div>

                {/* Custom URL */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Image URL</span>
                  <input
                    type="url"
                    value={customImageUrl}
                    onChange={(e) => {
                      setCustomImageUrl(e.target.value);
                      setSelectedPreset('');
                      setImageFile(null);
                    }}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full rounded-xl border-gray-100 bg-gray-50/50 px-4 py-2 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Section 1 Analysis"
              className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1.5">
              Short Summary
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A one-sentence overview..."
              className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              required
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1.5">
              Detailed Content
            </label>
            <textarea
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="The full reviewable text goes here..."
              className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              required
            />
          </div>
        </div>

        {/* Footer Buttons - DUAL BUTTON LOGIC */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={!!pendingAction}
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
            >
              {pendingAction === 'draft' ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {item ? 'Save' : 'Save Draft'}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={!!pendingAction}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {pendingAction === 'submit' ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {item ? 'Save & Submit' : 'Submit for Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
