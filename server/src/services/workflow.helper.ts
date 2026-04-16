import { db } from '../db/index.js';
import { approvalLogs } from '../db/schema.js';

export type ReviewAction =
  | 'CREATED'
  | 'SUBMITTED'
  | 'APPROVED_L1'
  | 'APPROVED_L2'
  | 'APPROVED'
  | 'REJECTED'
  | 'EDITED';

export const workflowHelper = {
  /**
   * Logs an entry into the approval history.
   */
  async logApproval(data: {
    contentId?: string;
    subContentId?: string;
    reviewerId: string;
    status: 'DRAFT' | 'IN_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED';
    action: ReviewAction;
    comment?: string | null;
    stage?: number | null;
  }) {
    await db.insert(approvalLogs).values({
      ...data,
      createdAt: new Date(),
    });
  },

  /**
   * Validates if the reviewer has the correct role for the current stage.
   */
  validateStageRole(currentReviewStage: number | null, reviewerRole: string) {
    if (currentReviewStage === 1 && reviewerRole !== 'REVIEWER_L1') {
      throw new Error('Only REVIEWER_L1 can perform this action for Stage 1');
    }
    if (currentReviewStage === 2 && reviewerRole !== 'REVIEWER_L2') {
      throw new Error('Only REVIEWER_L2 can perform this action for Stage 2');
    }
  },

  /**
   * Determines the next stage in the workflow.
   */
  calculateNextStage(currentStage: number | null): number | null {
    if (currentStage === 1) return 2;
    return null;
  },

  /**
   * Determines the next status based on whether there's a next stage.
   */
  calculateNextStatus(nextStage: number | null): 'IN_REVIEW' | 'APPROVED' {
    return nextStage !== null ? 'IN_REVIEW' : 'APPROVED';
  }
};
