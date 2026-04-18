import { z } from 'zod';

export const contentValidation = {
  createContent: z.object({
    body: z.object({
      title: z.string().min(1, 'Title is required').max(255),
      description: z.string().min(1, 'Description is required'),
      body: z.string().min(1, 'Body content is required'),
      status: z.enum(['DRAFT', 'IN_REVIEW']).optional(),
      image: z.any().optional(), // File path / string will be placed here or handled dynamically
    }),
  }),

  updateContent: z.object({
    params: z.object({
      id: z.string().uuid('Invalid content ID'),
    }),
    body: z.object({
      title: z.string().min(1, 'Title is required').max(255).optional(),
      description: z.string().min(1, 'Description is required').optional(),
      body: z.string().min(1, 'Body content is required').optional(),
      image: z.any().optional(),
    }),
  }),

  processAction: z.object({
    params: z.object({
      id: z.string().uuid('Invalid content ID'),
    }),
  }),

  reviewAction: z.object({
    params: z.object({
      id: z.string().uuid('Invalid content ID'),
    }),
    body: z.object({
      comment: z.string().optional(),
    }),
  }),

  rejectAction: z.object({
    params: z.object({
      id: z.string().uuid('Invalid content ID'),
    }),
    body: z.object({
      comment: z.string().min(1, 'A comment is required when requesting changes'),
    }),
  }),

  markRead: z.object({
    params: z.object({
      id: z.string().uuid('Invalid content ID'),
    }),
    body: z.object({
      isSubContent: z.boolean().optional(),
    }),
  }),
};
