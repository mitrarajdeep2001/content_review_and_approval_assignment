// ─── Roles ────────────────────────────────────────────────────────────────────
export type Role = 'CREATOR' | 'REVIEWER_L1' | 'REVIEWER_L2';

// ─── Content Status ───────────────────────────────────────────────────────────
export type ContentStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED';

// ─── Approval History Entry ───────────────────────────────────────────────────
export interface ApprovalHistoryEntry {
  id: string;
  action: 'SUBMITTED' | 'APPROVED_L1' | 'APPROVED_L2' | 'REJECTED' | 'EDITED' | 'CREATED';
  actor: string;
  role: Role | 'SYSTEM';
  timestamp: string;
  comment?: string;
}

// ─── Content Item ─────────────────────────────────────────────────────────────
export interface ContentItem {
  id: string;
  title: string;
  image: string;
  description: string;
  body: string;
  status: ContentStatus;
  currentStage: 1 | 2;
  isLocked: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  history: ApprovalHistoryEntry[];
}

// ─── Auth User ────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
}

// ─── Filter State ─────────────────────────────────────────────────────────────
export interface FilterState {
  status: ContentStatus | 'ALL';
  search: string;
}

// ─── Context Types ────────────────────────────────────────────────────────────
export interface AppContextType {
  // Auth
  currentUser: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;

  // Content
  contentList: ContentItem[];
  createContent: (data: { title: string; body: string; description: string; image: string }) => ContentItem;
  updateContent: (id: string, data: Partial<Pick<ContentItem, 'title' | 'body' | 'description' | 'image'>>) => void;
  submitContent: (id: string) => void;
  approveContent: (id: string, comment?: string) => void;
  rejectContent: (id: string, comment?: string) => void;

  // Filters
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
}
