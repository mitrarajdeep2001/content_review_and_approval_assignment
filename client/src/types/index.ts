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
  action: 'SUBMITTED' | 'APPROVED' | 'APPROVED_L1' | 'APPROVED_L2' | 'REJECTED' | 'EDITED' | 'CREATED';
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
  isLocked: boolean;
  currentReviewStage?: 1 | 2 | null;
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
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;

  // Content
  contentList: ContentItem[];
  createContent: (formData: FormData) => Promise<ContentItem>;
  updateContent: (id: string, formData: FormData) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
  submitContent: (id: string) => void;
  approveContent: (id: string, comment?: string) => void;
  rejectContent: (id: string, comment?: string) => void;

  // Filters
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
}
