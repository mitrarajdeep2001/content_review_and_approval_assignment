import { useEffect, useState } from 'react';
import { Plus, ListChecks } from 'lucide-react';
import { SubContentCard } from './SubContentCard';
import { SubContentModal } from './SubContentModal';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';
import { useApp } from '../store/AppContext';
import type { SubContent, ContentItem } from '../types';
import axios from 'axios';

interface Props {
  parent: ContentItem;
}

export function SubContentList({ parent }: Props) {
  const { currentUser } = useApp();
  const [items, setItems] = useState<SubContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SubContent | undefined>();

  const fetchItems = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/content/${parent.id}/sub-content`, { withCredentials: true });
      setItems(response.data);
    } catch (error) {
      console.error('Failed to fetch sub-contents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [parent.id]);

  const handleOpenModal = (item?: SubContent) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  if (loading) return <div className="py-10 flex justify-center"><LoadingSpinner size="md" /></div>;

  const canAdd =
    currentUser?.role === 'CREATOR' && parent.status === 'APPROVED';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Sub-Contents</h3>
          <span className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            {items.length}
          </span>
        </div>
        {canAdd && (
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add New
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No sub-contents yet"
          description="Break down this content into smaller reviewable units."
          icon={<ListChecks className="h-8 w-8 text-gray-300" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3">
          {items.map((item) => (
            <SubContentCard 
              key={item.id} 
              item={item} 
              currentUser={currentUser!} 
              onEdit={handleOpenModal} 
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <SubContentModal
          parentId={parent.id}
          item={editingItem}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            fetchItems(); // Refresh list after close (might have added/edited)
          }}
        />
      )}
    </div>
  );
}
