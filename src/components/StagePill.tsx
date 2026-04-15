import { clsx } from 'clsx';

interface Props {
  stage: 1 | 2;
  active?: boolean;
}

export function StagePill({ stage, active = false }: Props) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border',
        active
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : 'bg-gray-50 text-gray-500 border-gray-200'
      )}
    >
      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
        <text x="6" y="9" textAnchor="middle" fill="currentColor" fontSize="7" fontWeight="700">
          {stage}
        </text>
      </svg>
      Stage {stage}
    </span>
  );
}
