import { Router, Request, Response, NextFunction } from 'express';
import { IMemberService } from '../../types';

/**
 * GET /api/members/:memberId
 *
 * Returns the member profile so AI agents can inspect a member
 * before requesting recommendations.
 */
export function createMembersRouter(memberService: IMemberService): Router {
  const router = Router();

  router.get('/api/members/:memberId', async (req: Request<{ memberId: string }>, res: Response, next: NextFunction) => {
    try {
      const member = await memberService.getMember(req.params.memberId);
      res.json(member);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
