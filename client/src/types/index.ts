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

// ─── Sub-Content ──────────────────────────────────────────────────────────────
export interface SubContent {
  id: string;
  parentId: string;
  title: string;
  description: string;
  body: string;
  image?: string;
  status: ContentStatus;
  isLocked: boolean;
  currentReviewStage?: 1 | 2 | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  history: ApprovalHistoryEntry[];
  parentTitle?: string;
  creatorName?: string;
}

export interface SubContentProgress {
  total: number;
  approved: number;
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
  subContentProgress?: SubContentProgress;
  subContents?: SubContent[];
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
  submitContent: (id: string) => Promise<void>;
  approveContent: (id: string, comment?: string) => Promise<void>;
  rejectContent: (id: string, comment?: string) => Promise<void>;

  // Sub-Content
  createSubContent: (parentId: string, data: FormData) => Promise<SubContent>;
  updateSubContent: (id: string, data: FormData) => Promise<void>;
  deleteSubContent: (id: string) => Promise<void>;
  submitSubContent: (id: string) => Promise<void>;
  approveSubContent: (id: string, comment?: string) => Promise<void>;
  rejectSubContent: (id: string, comment?: string) => Promise<void>;

  // Filters
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;

  // Infinite Scroll & Stats
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  stats: any;
}
