import { Router, Request, Response } from 'express';
import { prisma } from '@empops/database';
import { CreateTicketSchema, TicketStatus, TicketPriority } from '@empops/shared';
import { authenticateJwt } from '../../middleware/auth.js';

export const itsmRouter = Router();
itsmRouter.use(authenticateJwt);

// GET /api/itsm/tickets
itsmRouter.get('/tickets', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { status, category, priority } = req.query;

    const whereClause: any = { tenantId };
    if (status) whereClause.status = status;
    if (category) whereClause.category = category;
    if (priority) whereClause.priority = priority;

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        requester: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
        linkedAsset: { select: { id: true, assetTag: true, name: true, category: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = tickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      title: t.title,
      description: t.description,
      category: t.category,
      priority: t.priority,
      status: t.status,
      requesterId: t.requesterId,
      requesterName: `${t.requester.firstName} ${t.requester.lastName}`,
      requesterEmail: t.requester.email,
      assigneeId: t.assigneeId,
      assigneeName: t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : 'Unassigned',
      linkedAssetId: t.linkedAssetId,
      linkedAssetTag: t.linkedAsset?.assetTag,
      linkedAssetName: t.linkedAsset?.name,
      responseDueAt: t.responseDueAt ? t.responseDueAt.toISOString() : null,
      resolutionDueAt: t.resolutionDueAt ? t.resolutionDueAt.toISOString() : null,
      isSlaBreached: t.resolutionDueAt ? new Date() > t.resolutionDueAt && t.status !== TicketStatus.RESOLVED && t.status !== TicketStatus.CLOSED : false,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      commentsCount: t.comments.length,
      comments: t.comments,
    }));

    return res.json(formatted);
  } catch (error: any) {
    console.error('Fetch tickets error:', error);
    return res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// POST /api/itsm/tickets
itsmRouter.post('/tickets', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const parseResult = CreateTicketSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.format() });
    }

    const { title, description, category, priority, linkedAssetId } = parseResult.data;

    // Generate unique sequential ticket number
    const count = await prisma.ticket.count({ where: { tenantId } });
    const ticketNumber = `TKT-${String(count + 101).padStart(5, '0')}`;

    // Calculate SLA deadlines
    const now = Date.now();
    let responseHours = 8;
    let resolutionHours = 48;

    if (priority === TicketPriority.CRITICAL) {
      responseHours = 1;
      resolutionHours = 4;
    } else if (priority === TicketPriority.URGENT) {
      responseHours = 2;
      resolutionHours = 8;
    } else if (priority === TicketPriority.HIGH) {
      responseHours = 4;
      resolutionHours = 24;
    }

    const ticket = await prisma.ticket.create({
      data: {
        tenantId,
        ticketNumber,
        requesterId: req.user!.userId,
        title,
        description,
        category,
        priority,
        status: TicketStatus.NEW,
        linkedAssetId,
        responseDueAt: new Date(now + responseHours * 3600 * 1000),
        resolutionDueAt: new Date(now + resolutionHours * 3600 * 1000),
      },
      include: {
        requester: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    return res.status(201).json({ message: 'Ticket created successfully', ticket });
  } catch (error: any) {
    console.error('Create ticket error:', error);
    return res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// PUT /api/itsm/tickets/:id
itsmRouter.put('/tickets/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const ticketId = req.params.id;
    const { status, assigneeId, priority } = req.body;

    const data: any = {};
    if (status) data.status = status;
    if (assigneeId !== undefined) data.assigneeId = assigneeId;
    if (priority) data.priority = priority;

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data,
      include: {
        assignee: { select: { firstName: true, lastName: true } },
      },
    });

    return res.json({ message: 'Ticket updated successfully', ticket: updated });
  } catch (error: any) {
    console.error('Update ticket error:', error);
    return res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// POST /api/itsm/tickets/:id/comments
itsmRouter.post('/tickets/:id/comments', async (req: Request, res: Response) => {
  try {
    const ticketId = req.params.id;
    const { content, isInternal } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content cannot be empty' });
    }

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId,
        authorId: req.user!.userId,
        authorName: `${req.user!.firstName} ${req.user!.lastName}`,
        content,
        isInternal: Boolean(isInternal),
      },
    });

    return res.status(201).json({ message: 'Comment added', comment });
  } catch (error: any) {
    console.error('Add comment error:', error);
    return res.status(500).json({ error: 'Failed to add comment' });
  }
});
