import type { AuthUser } from '../types';

// ─── Demo Users ───────────────────────────────────────────────────────────────
export const DEMO_USERS: AuthUser[] = [
  {
    id: 'u1',
    name: 'Alex Morgan',
    email: 'alex@contentflow.io',
    role: 'CREATOR',
    avatar: 'https://ui-avatars.com/api/?name=Alex+Morgan&background=6d28d9&color=fff&size=64&bold=true',
  },
  {
    id: 'u2',
    name: 'Jordan Lee',
    email: 'jordan@contentflow.io',
    role: 'REVIEWER_L1',
    avatar: 'https://ui-avatars.com/api/?name=Jordan+Lee&background=0284c7&color=fff&size=64&bold=true',
  },
  {
    id: 'u3',
    name: 'Taylor Kim',
    email: 'taylor@contentflow.io',
    role: 'REVIEWER_L2',
    avatar: 'https://ui-avatars.com/api/?name=Taylor+Kim&background=0f766e&color=fff&size=64&bold=true',
  },
  {
    id: 'u4',
    name: 'Sam Reader',
    email: 'sam@contentflow.io',
    role: 'READER',
    avatar: 'https://ui-avatars.com/api/?name=Sam+Reader&background=14b8a6&color=fff&size=64&bold=true',
  },
];
