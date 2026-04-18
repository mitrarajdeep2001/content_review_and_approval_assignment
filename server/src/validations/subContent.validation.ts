import { z } from 'zod';

export const subContentValidation = {
  createSubContent: z.object({
    params: z.object({
      parentId: z.string().uuid('Invalid parent ID'),
    }),
    body: z.object({
      title: z.string().min(1, 'Title is required').max(255),
      description: z.string().min(1, 'Description is required'),
      body: z.string().min(1, 'Body content is required'),
      image: z.any().optional(),
    }),
  }),

  updateSubContent: z.object({
    params: z.object({
      id: z.string().uuid('Invalid sub-content ID'),
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
      id: z.string().uuid('Invalid sub-content ID'),
    }),
  }),

  reviewAction: z.object({
    params: z.object({
      id: z.string().uuid('Invalid sub-content ID'),
    }),
    body: z.object({
      comment: z.string().optional(),
    }),
  }),

  rejectAction: z.object({
    params: z.object({
      id: z.string().uuid('Invalid sub-content ID'),
    }),
    body: z.object({
      comment: z.string().min(1, 'A comment is required when requesting changes'),
    }),
  }),
};
