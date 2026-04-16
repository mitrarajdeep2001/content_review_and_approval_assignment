import { Link } from 'react-router-dom';
import { Eye, Edit2, Lock } from 'lucide-react';
import type { ContentItem } from '../types';
import type { Role } from '../types';
import { StatusBadge } from './StatusBadge';
import { truncate, formatRelative } from '../utils/helpers';
import { clsx } from 'clsx';

interface Props {
  item: ContentItem;
  currentRole?: Role;
}

export function ContentCard({ item, currentRole }: Props) {
  const canEdit =
    currentRole === 'CREATOR' && item.status === 'CHANGES_REQUESTED';

  return (
    <article className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Thumbnail */}
      <div className="relative h-44 overflow-hidden bg-gray-100">
        <img
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&auto=format&fit=crop&q=60';
          }}
        />
        {/* Lock overlay */}
        {item.isLocked && (
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2 py-0.5 text-xs font-medium text-gray-600 shadow-sm border border-gray-200">
              <Lock className="h-3 w-3" />
              Locked
            </span>
          </div>
        )}
        {/* Status overlay */}
        <div className="absolute bottom-2 left-2 flex flex-col gap-1 items-start">
          <StatusBadge status={item.status} size="sm" />
          {item.status === 'IN_REVIEW' && item.currentReviewStage && (
            <span className="rounded-md bg-white/90 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-bold text-gray-700 border border-gray-200 uppercase tracking-tight">
              Stage {item.currentReviewStage}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 leading-snug text-sm line-clamp-2">
            {item.title}
          </h3>
        </div>

        <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-2">
          {truncate(item.description, 120)}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{formatRelative(item.updatedAt)}</span>

          <div className="flex items-center gap-1.5">
            {canEdit && (
              <Link
                to={`/edit/${item.id}`}
                className={clsx(
                  'inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                  'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                )}
              >
                <Edit2 className="h-3 w-3" />
                Edit
              </Link>
            )}
            <Link
              to={`/content/${item.id}`}
              className={clsx(
                'inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
              )}
            >
              <Eye className="h-3 w-3" />
              View
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
