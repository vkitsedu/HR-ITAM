import { Router, Request, Response } from 'express';
import { authenticateJwt } from '../../middleware/auth.js';
import { AiService } from './ai.service.js';

export const aiRouter = Router();
aiRouter.use(authenticateJwt);

// POST /api/ai/triage - Comprehensive ticket triage & resolution copilot
aiRouter.post('/triage', async (req: Request, res: Response) => {
  try {
    const { title, description, category, priority, linkedAssetTag, linkedAssetName, requesterName } = req.body;

    if (!title && !description) {
      return res.status(400).json({ error: 'Title or description is required for triage' });
    }

    const result = await AiService.triageTicket({
      title: title || '',
      description: description || '',
      category,
      priority,
      linkedAssetTag,
      linkedAssetName,
      requesterName,
    });

    return res.json(result);
  } catch (error: any) {
    console.error('AI Triage error:', error);
    return res.status(500).json({ error: 'Failed to generate AI ticket triage' });
  }
});

// POST /api/ai/suggest - Quick category & priority suggestions while typing
aiRouter.post('/suggest', async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;
    const result = await AiService.triageTicket({
      title: title || '',
      description: description || '',
    });

    return res.json({
      suggestedCategory: result.suggestedCategory,
      suggestedPriority: result.suggestedPriority,
      estimatedResolutionMinutes: result.estimatedResolutionMinutes,
    });
  } catch (error: any) {
    console.error('AI Suggest error:', error);
    return res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});
