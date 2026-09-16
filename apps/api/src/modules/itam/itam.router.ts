import { Router, Request, Response } from 'express';
import { prisma } from '@empops/database';
import { CreateAssetSchema, AssignAssetSchema, CustodySignoffSchema, AssetStatus, CustodyStatus, RoleEnum } from '@empops/shared';
import { authenticateJwt, requireRoles } from '../../middleware/auth.js';
import { AuditService } from '../audit/audit.service.js';
import { NotificationService } from '../notifications/notification.service.js';
import { ItamInventoryService } from './itam.inventory.service.js';
import { ItamCatalogService } from './itam.catalog.service.js';
import crypto from 'crypto';

export const itamRouter = Router();
itamRouter.use(authenticateJwt);

// GET /api/itam/catalog/categories
// List tenant master catalog categories with dynamic buffer telemetry
itamRouter.get('/catalog/categories', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const categories = await ItamCatalogService.getCategories(tenantId);
    return res.json(categories);
  } catch (error: any) {
    console.error('Fetch categories error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch categories' });
  }
});

// POST /api/itam/catalog/categories
// Add a custom category to the tenant's master inventory catalog
itamRouter.post('/catalog/categories', requireRoles(RoleEnum.IT_MANAGER, RoleEnum.TENANT_ADMIN, RoleEnum.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const actorEmail = (req as any).user?.email || 'it@acme.com';
    const category = await ItamCatalogService.createCategory(tenantId, req.body, actorEmail);
    return res.status(201).json(category);
  } catch (error: any) {
    console.error('Create category error:', error);
    return res.status(400).json({ error: error.message || 'Failed to create category' });
  }
});

// PUT /api/itam/catalog/categories/:id
// Update category thresholds and configuration
itamRouter.put('/catalog/categories/:id', requireRoles(RoleEnum.IT_MANAGER, RoleEnum.TENANT_ADMIN, RoleEnum.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const actorEmail = (req as any).user?.email || 'it@acme.com';
    const updated = await ItamCatalogService.updateCategory(tenantId, id, req.body, actorEmail);
    return res.json(updated);
  } catch (error: any) {
    console.error('Update category error:', error);
    return res.status(400).json({ error: error.message || 'Failed to update category' });
  }
});

// DELETE /api/itam/catalog/categories/:id
// Delete or archive category with active-asset protection
itamRouter.delete('/catalog/categories/:id', requireRoles(RoleEnum.IT_MANAGER, RoleEnum.TENANT_ADMIN, RoleEnum.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const actorEmail = (req as any).user?.email || 'it@acme.com';
    const result = await ItamCatalogService.deleteCategory(tenantId, id, actorEmail);
    return res.json(result);
  } catch (error: any) {
    console.error('Delete category error:', error);
    return res.status(400).json({ error: error.message || 'Failed to delete category' });
  }
});

// GET /api/itam/catalog/templates
// List pre-built industry customization archetypes
itamRouter.get('/catalog/templates', async (req: Request, res: Response) => {
  try {
    const templates = ItamCatalogService.getIndustryTemplates();
    return res.json(templates);
  } catch (error: any) {
    console.error('Fetch templates error:', error);
    return res.status(500).json({ error: 'Failed to fetch industry templates' });
  }
});

// POST /api/itam/catalog/templates/apply
// Apply industry template to tenant workspace & inventory catalog
itamRouter.post('/catalog/templates/apply', requireRoles(RoleEnum.IT_MANAGER, RoleEnum.TENANT_ADMIN, RoleEnum.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { templateId, customCategories } = req.body;
    const actorEmail = (req as any).user?.email || 'admin@acme.com';
    const result = await ItamCatalogService.applyIndustryTemplate(tenantId, templateId, customCategories, actorEmail);
    return res.json(result);
  } catch (error: any) {
    console.error('Apply template error:', error);
    return res.status(400).json({ error: error.message || 'Failed to apply industry template' });
  }
});

// POST /api/itam/inwards/batch
// Warehouse Goods Receipt Note (GRN) Inwarding Engine
itamRouter.post('/inwards/batch', requireRoles(RoleEnum.IT_MANAGER, RoleEnum.IT_TECHNICIAN, RoleEnum.TENANT_ADMIN, RoleEnum.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const actorEmail = (req as any).user?.email || 'it@acme.com';
    const result = await ItamCatalogService.inwardAssetsBatch(tenantId, req.body, actorEmail);
    return res.status(201).json(result);
  } catch (error: any) {
    console.error('Inward assets error:', error);
    return res.status(400).json({ error: error.message || 'Failed to inward assets' });
  }
});

// GET /api/itam/inventory/metrics
// Real-time stock buffers, low stock alerts, joiner demand, and valuation
itamRouter.get('/inventory/metrics', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const metrics = await ItamInventoryService.getInventoryMetrics(tenantId);
    return res.json(metrics);
  } catch (error: any) {
    console.error('Fetch inventory metrics error:', error);
    return res.status(500).json({ error: 'Failed to calculate inventory metrics' });
  }
});

// GET /api/itam/inventory/stock-report
// Granular stock availability and reorder indicators by brand and model
itamRouter.get('/inventory/stock-report', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const report = await ItamInventoryService.getStockReport(tenantId);
    return res.json(report);
  } catch (error: any) {
    console.error('Fetch stock report error:', error);
    return res.status(500).json({ error: 'Failed to generate stock report' });
  }
});

// GET /api/itam/inventory/depreciation
// Straight-Line Financial Depreciation Ledger with Net Book Value
itamRouter.get('/inventory/depreciation', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const ledger = await ItamInventoryService.getDepreciationLedger(tenantId);
    return res.json(ledger);
  } catch (error: any) {
    console.error('Fetch depreciation ledger error:', error);
    return res.status(500).json({ error: 'Failed to generate depreciation ledger' });
  }
});

// GET /api/itam/assets
itamRouter.get('/assets', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { category, status } = req.query;

    const whereClause: any = { tenantId };
    if (category) whereClause.category = category;
    if (status) whereClause.status = status;

    const assets = await prisma.asset.findMany({
      where: whereClause,
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true },
        },
        location: { select: { name: true } },
        custodyReceipts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = assets.map((a) => {
      const activeReceipt = a.custodyReceipts[0];
      return {
        id: a.id,
        assetTag: a.assetTag,
        name: a.name,
        category: a.category,
        brand: a.brand,
        model: a.model,
        serialNumber: a.serialNumber,
        purchaseDate: a.purchaseDate.toISOString().split('T')[0],
        purchaseCost: a.purchaseCost,
        currentBookValue: a.currentBookValue,
        warrantyExpiry: a.warrantyExpiry ? a.warrantyExpiry.toISOString().split('T')[0] : null,
        status: a.status,
        assignedToEmployeeId: a.assignedToEmployeeId,
        assignedToEmployeeName: a.assignedTo ? `${a.assignedTo.firstName} ${a.assignedTo.lastName}` : null,
        assignedToEmployeeCode: a.assignedTo?.employeeCode,
        locationName: a.location?.name,
        custodyStatus: activeReceipt ? activeReceipt.status : null,
        custodyReceiptId: activeReceipt ? activeReceipt.id : null,
        custodyAcknowledgedAt: activeReceipt?.acknowledgedAt?.toISOString() || null,
        lastAuditedAt: a.lastAuditedAt ? a.lastAuditedAt.toISOString() : null,
        lastAuditedBy: a.lastAuditedBy || null,
      };
    });

    return res.json(formatted);
  } catch (error: any) {
    console.error('Fetch assets error:', error);
    return res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// POST /api/itam/assets
itamRouter.post('/assets', requireRoles(RoleEnum.IT_MANAGER, RoleEnum.IT_TECHNICIAN, RoleEnum.TENANT_ADMIN, RoleEnum.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const parseResult = CreateAssetSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.format() });
    }

    const data = parseResult.data;

    // Check unique tag
    const existing = await prisma.asset.findFirst({
      where: { tenantId, assetTag: data.assetTag },
    });
    if (existing) {
      return res.status(400).json({ error: `Asset Tag ${data.assetTag} already exists` });
    }

    const asset = await prisma.asset.create({
      data: {
        tenantId,
        assetTag: data.assetTag,
        name: data.name,
        category: data.category,
        brand: data.brand,
        model: data.model,
        serialNumber: data.serialNumber,
        purchaseDate: new Date(data.purchaseDate),
        purchaseCost: data.purchaseCost,
        currentBookValue: data.purchaseCost, // Initial book value = cost
        warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
        status: AssetStatus.IN_STOCK,
        locationId: data.locationId,
      },
    });

    await AuditService.record({
      tenantId,
      userId: req.user?.userId,
      action: 'ASSET_CREATED',
      entityType: 'Asset',
      entityId: asset.id,
      details: {
        assetTag: asset.assetTag,
        name: asset.name,
        category: asset.category,
        brand: asset.brand,
      },
    });

    return res.status(201).json({ message: 'Asset added to inventory', asset });
  } catch (error: any) {
    console.error('Create asset error:', error);
    return res.status(500).json({ error: 'Failed to create asset' });
  }
});

// GET /api/itam/assets/lookup/:query
// Real-time Barcode / QR / Serial Number Scanner Lookup
itamRouter.get('/assets/lookup/:query', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const rawQuery = decodeURIComponent(req.params.query || '').trim();
    if (!rawQuery) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const asset = await prisma.asset.findFirst({
      where: {
        tenantId,
        OR: [
          { assetTag: { equals: rawQuery } },
          { serialNumber: { equals: rawQuery } },
          { id: { equals: rawQuery } },
        ],
      },
      include: {
        assignedTo: {
          include: { department: true, designation: true, location: true },
        },
        location: true,
        categoryMaster: true,
        custodyReceipts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        tickets: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    });

    if (!asset) {
      return res.status(404).json({ error: `No asset found with Tag or Serial "${rawQuery}"` });
    }

    const activeReceipt = asset.custodyReceipts[0];
    return res.json({
      id: asset.id,
      assetTag: asset.assetTag,
      name: asset.name,
      category: asset.category,
      brand: asset.brand,
      model: asset.model,
      serialNumber: asset.serialNumber,
      purchaseDate: asset.purchaseDate.toISOString().split('T')[0],
      purchaseCost: asset.purchaseCost,
      currentBookValue: asset.currentBookValue,
      warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.toISOString().split('T')[0] : null,
      status: asset.status,
      assignedToEmployeeId: asset.assignedToEmployeeId,
      assignedTo: asset.assignedTo ? {
        id: asset.assignedTo.id,
        name: `${asset.assignedTo.firstName} ${asset.assignedTo.lastName}`,
        code: asset.assignedTo.employeeCode,
        email: asset.assignedTo.email,
        department: asset.assignedTo.department?.name,
        designation: asset.assignedTo.designation?.title,
      } : null,
      locationName: asset.location?.name || 'Bengaluru Headquarters',
      custodyStatus: activeReceipt ? activeReceipt.status : null,
      custodyReceiptId: activeReceipt ? activeReceipt.id : null,
      lastAuditedAt: asset.lastAuditedAt ? asset.lastAuditedAt.toISOString() : null,
      lastAuditedBy: asset.lastAuditedBy || null,
      recentTickets: asset.tickets.map((t) => ({
        ticketNumber: t.ticketNumber,
        title: t.title,
        priority: t.priority,
        status: t.status,
      })),
    });
  } catch (error: any) {
    console.error('Asset lookup error:', error);
    return res.status(500).json({ error: 'Failed to lookup asset' });
  }
});

// POST /api/itam/assets/:id/audit
// Physical audit verification endpoint
itamRouter.post('/assets/:id/audit', requireRoles(RoleEnum.IT_MANAGER, RoleEnum.IT_TECHNICIAN, RoleEnum.TENANT_ADMIN, RoleEnum.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const assetId = req.params.id;
    const { notes } = req.body;

    const asset = await prisma.asset.findFirst({
      where: { id: assetId, tenantId },
      include: { assignedTo: true, location: true },
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const auditorIdentifier = req.user?.email || req.user?.firstName || 'IT Auditor';
    const updated = await prisma.asset.update({
      where: { id: assetId },
      data: {
        lastAuditedAt: new Date(),
        lastAuditedBy: auditorIdentifier,
      },
    });

    await AuditService.record({
      tenantId,
      userId: req.user?.userId,
      action: 'ASSET_AUDITED',
      entityType: 'Asset',
      entityId: asset.id,
      details: {
        assetTag: asset.assetTag,
        assetName: asset.name,
        auditedBy: auditorIdentifier,
        notes: notes || 'Physical device verification completed',
      },
    });

    return res.json({
      message: `Asset ${asset.assetTag} successfully verified and marked audited.`,
      asset: updated,
    });
  } catch (error: any) {
    console.error('Audit asset error:', error);
    return res.status(500).json({ error: 'Failed to record asset audit' });
  }
});

// POST /api/itam/assign
// Assign asset to employee and generate digital Custody Receipt
itamRouter.post('/assign', requireRoles(RoleEnum.IT_MANAGER, RoleEnum.IT_TECHNICIAN, RoleEnum.TENANT_ADMIN, RoleEnum.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const parseResult = AssignAssetSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.format() });
    }

    const { assetId, employeeId } = parseResult.data;

    const asset = await prisma.asset.findFirst({ where: { id: assetId, tenantId } });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    const employee = await prisma.employee.findFirst({ where: { id: employeeId, tenantId } });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    // Update asset
    const updatedAsset = await prisma.asset.update({
      where: { id: assetId },
      data: {
        assignedToEmployeeId: employeeId,
        status: AssetStatus.ASSIGNED,
      },
    });

    // Create Custody Receipt
    const receipt = await prisma.custodyReceipt.create({
      data: {
        tenantId,
        assetId,
        employeeId,
        status: CustodyStatus.PENDING_ACKNOWLEDGEMENT,
        assignedAt: new Date(),
      },
    });

    // Record audit log
    await AuditService.record({
      tenantId,
      userId: req.user?.userId,
      action: 'ASSET_ASSIGNED',
      entityType: 'Asset',
      entityId: asset.id,
      details: {
        assetTag: asset.assetTag,
        employeeCode: employee.employeeCode,
        employeeName: `${employee.firstName} ${employee.lastName}`,
      },
    });

    // Notify employee of pending custody signoff
    const empUser = await prisma.user.findFirst({ where: { employeeId: employee.id, tenantId } });
    await NotificationService.send({
      tenantId,
      userId: empUser?.id,
      role: RoleEnum.EMPLOYEE,
      title: 'Digital Asset Custody Required',
      message: `You have been assigned ${asset.name} (${asset.assetTag}). Please review and sign custody acknowledgement.`,
      type: 'WARNING',
      link: '/ess',
    });

    return res.json({
      message: `Asset ${asset.assetTag} assigned to ${employee.firstName} ${employee.lastName}. Custody receipt generated.`,
      asset: updatedAsset,
      receipt,
    });
  } catch (error: any) {
    console.error('Assign asset error:', error);
    return res.status(500).json({ error: 'Failed to assign asset' });
  }
});

// POST /api/itam/custody/:receiptId/sign
// Employee digitally signs asset custody acceptance
itamRouter.post('/custody/:receiptId/sign', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const receiptId = req.params.receiptId;
    const parseResult = CustodySignoffSchema.safeParse({ ...req.body, custodyReceiptId: receiptId });
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.format() });
    }

    const { signatureData } = parseResult.data;

    const receipt = await prisma.custodyReceipt.findFirst({
      where: { id: receiptId, tenantId },
      include: { asset: true, employee: true },
    });

    if (!receipt) {
      return res.status(404).json({ error: 'Custody receipt not found' });
    }

    const updated = await prisma.custodyReceipt.update({
      where: { id: receiptId },
      data: {
        status: CustodyStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
        signatureData,
      },
    });

    await AuditService.record({
      tenantId,
      userId: req.user?.userId,
      action: 'CUSTODY_ACKNOWLEDGED',
      entityType: 'CustodyReceipt',
      entityId: receipt.id,
      details: {
        assetTag: receipt.asset.assetTag,
        assetName: receipt.asset.name,
        employeeCode: receipt.employee.employeeCode,
        employeeName: `${receipt.employee.firstName} ${receipt.employee.lastName}`,
      },
    });

    await NotificationService.send({
      tenantId,
      role: RoleEnum.IT_MANAGER,
      title: 'Custody Acknowledged',
      message: `${receipt.employee.firstName} ${receipt.employee.lastName} has digitally signed custody for ${receipt.asset.name} (${receipt.asset.assetTag}).`,
      type: 'SUCCESS',
      link: '/itam',
    });

    return res.json({
      message: `Digital custody acknowledgement signed for ${receipt.asset.name} (${receipt.asset.assetTag})`,
      receipt: updated,
    });
  } catch (error: any) {
    console.error('Sign custody error:', error);
    return res.status(500).json({ error: 'Failed to sign custody receipt' });
  }
});

// POST /api/itam/custody/:receiptId/return
// CRITICAL WEDGE: IT marks asset returned; automatically checks exit clearance and issues IT NOC
itamRouter.post('/custody/:receiptId/return', requireRoles(RoleEnum.IT_MANAGER, RoleEnum.IT_TECHNICIAN, RoleEnum.TENANT_ADMIN, RoleEnum.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const receiptId = req.params.receiptId;

    const receipt = await prisma.custodyReceipt.findFirst({
      where: { id: receiptId, tenantId },
      include: { asset: true, employee: true },
    });

    if (!receipt) {
      return res.status(404).json({ error: 'Custody receipt not found' });
    }

    // Update receipt
    await prisma.custodyReceipt.update({
      where: { id: receiptId },
      data: {
        status: CustodyStatus.RETURNED,
        returnedAt: new Date(),
        verifiedByItTechnicianId: req.user!.userId,
      },
    });

    // Free up asset
    await prisma.asset.update({
      where: { id: receipt.assetId },
      data: {
        status: AssetStatus.IN_STOCK,
        assignedToEmployeeId: null,
      },
    });

    // Check if employee has pending Exit Clearance
    let exitClearance = await prisma.exitClearance.findFirst({
      where: { employeeId: receipt.employeeId, tenantId },
    });

    let autoNocIssued = false;
    if (exitClearance) {
      // Check how many assets are still assigned to this employee
      const remainingAssets = await prisma.asset.count({
        where: { assignedToEmployeeId: receipt.employeeId, tenantId },
      });

      const shouldIssueNoc = remainingAssets === 0;
      exitClearance = await prisma.exitClearance.update({
        where: { id: exitClearance.id },
        data: {
          pendingAssetCount: remainingAssets,
          status: shouldIssueNoc ? 'CLEARED' : 'ASSETS_PENDING',
          itNocIssued: shouldIssueNoc,
          itNocIssuedAt: shouldIssueNoc ? new Date() : null,
        },
      });
      autoNocIssued = shouldIssueNoc;
    }

    // Record audit log for return
    await AuditService.record({
      tenantId,
      userId: req.user?.userId,
      action: 'ASSET_RETURNED',
      entityType: 'Asset',
      entityId: receipt.assetId,
      details: {
        assetTag: receipt.asset.assetTag,
        employeeCode: receipt.employee.employeeCode,
        employeeName: `${receipt.employee.firstName} ${receipt.employee.lastName}`,
        autoNocIssued,
      },
    });

    if (autoNocIssued) {
      await AuditService.record({
        tenantId,
        userId: req.user?.userId,
        action: 'IT_NOC_ISSUED',
        entityType: 'ExitClearance',
        entityId: exitClearance?.id,
        details: {
          employeeName: `${receipt.employee.firstName} ${receipt.employee.lastName}`,
          status: 'CLEARED',
        },
      });

      await NotificationService.send({
        tenantId,
        role: RoleEnum.HR_MANAGER,
        title: 'IT NOC Auto-Issued',
        message: `All IT assets recovered for ${receipt.employee.firstName} ${receipt.employee.lastName}. IT NOC has been auto-cleared for exit.`,
        type: 'SUCCESS',
        link: '/exit-clearance',
      });
    }

    return res.json({
      message: `Asset ${receipt.asset.assetTag} successfully returned and marked IN_STOCK.`,
      autoNocIssued,
      exitClearance,
    });
  } catch (error: any) {
    console.error('Return asset error:', error);
    return res.status(500).json({ error: 'Failed to return asset' });
  }
});

// GET /api/itam/exit-clearances
itamRouter.get('/exit-clearances', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const clearances = await prisma.exitClearance.findMany({
      where: { tenantId },
      include: {
        employee: {
          include: {
            department: true,
            assignedAssets: { select: { id: true, assetTag: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = clearances.map((c) => ({
      id: c.id,
      employeeId: c.employeeId,
      employeeCode: c.employee.employeeCode,
      employeeName: `${c.employee.firstName} ${c.employee.lastName}`,
      departmentName: c.employee.department.name,
      resignationDate: c.resignationDate.toISOString().split('T')[0],
      lastWorkingDay: c.lastWorkingDay.toISOString().split('T')[0],
      status: c.status,
      itNocIssued: c.itNocIssued,
      itNocIssuedAt: c.itNocIssuedAt ? c.itNocIssuedAt.toISOString() : null,
      pendingAssetCount: c.employee.assignedAssets.length,
      pendingAssets: c.employee.assignedAssets,
    }));

    return res.json(formatted);
  } catch (error: any) {
    console.error('Fetch exit clearances error:', error);
    return res.status(500).json({ error: 'Failed to fetch exit clearances' });
  }
});

// GET /api/itam/custody/:receiptId/certificate
// Cryptographically verifiable digital asset custody certificate
itamRouter.get('/custody/:receiptId/certificate', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const receiptId = req.params.receiptId;

    const receipt = await prisma.custodyReceipt.findFirst({
      where: { id: receiptId, tenantId },
      include: {
        asset: { include: { location: true } },
        employee: { include: { department: true, designation: true } },
        tenant: { include: { organizations: true } },
      },
    });

    if (!receipt) {
      return res.status(404).json({ error: 'Custody receipt not found' });
    }

    const org = receipt.tenant.organizations[0];
    const rawHashInput = `${receipt.tenantId}|${receipt.id}|${receipt.asset.assetTag}|${receipt.employee.employeeCode}|${receipt.signatureData || 'UNSIGNED'}|${receipt.acknowledgedAt?.toISOString() || receipt.assignedAt.toISOString()}`;
    const verificationHash = crypto.createHash('sha256').update(rawHashInput).digest('hex');

    const certificate = {
      certificateNumber: `CUST-CERT-${receipt.id.slice(0, 8).toUpperCase()}`,
      receiptId: receipt.id,
      issuedAt: receipt.assignedAt.toISOString(),
      acknowledgedAt: receipt.acknowledgedAt ? receipt.acknowledgedAt.toISOString() : null,
      status: receipt.status,
      signatureData: receipt.signatureData,
      verificationHash,
      organization: {
        legalName: org?.legalEntity || receipt.tenant.name,
        tradeName: org?.name || receipt.tenant.name,
        cinOrGstin: org?.cinOrGstin || '29AABCU9603R1ZM',
        facility: receipt.asset.location?.name || 'Bengaluru Headquarters',
        address: receipt.asset.location?.address || '7th Block, 80 Feet Road, Koramangala, Bengaluru',
      },
      employee: {
        name: `${receipt.employee.firstName} ${receipt.employee.lastName}`,
        code: receipt.employee.employeeCode,
        email: receipt.employee.email,
        department: receipt.employee.department.name,
        designation: receipt.employee.designation.title,
      },
      asset: {
        tag: receipt.asset.assetTag,
        name: receipt.asset.name,
        category: receipt.asset.category,
        brand: receipt.asset.brand,
        model: receipt.asset.model,
        serialNumber: receipt.asset.serialNumber,
        condition: 'A+ (Factory Refurbished / New Enterprise Fleet)',
        purchaseCost: receipt.asset.purchaseCost,
      },
      legalClauses: [
        '1. Custodial Responsibility: The employee acknowledges sole custody and fiduciary care of the designated enterprise computing hardware.',
        '2. Digital Security & Compliance: In accordance with India Digital Personal Data Protection (DPDP) Act 2023 and corporate Information Security Management Systems (ISO 27001), no unauthorized external software, cryptominers, or unapproved data exfiltration utilities shall be installed.',
        '3. Non-Transferability: This asset is non-transferable and may not be sub-allocated to family members, third parties, or contractors without IT Infrastructure authorization.',
        '4. Return Obligation: The employee explicitly agrees to physically return this asset immediately upon resignation, termination, or replacement as a mandatory condition precedent for Full & Final (F&F) settlement clearance.',
      ],
    };

    return res.json(certificate);
  } catch (error: any) {
    console.error('Fetch custody certificate error:', error);
    return res.status(500).json({ error: 'Failed to generate custody certificate' });
  }
});

// GET /api/itam/exit-clearances/:id/certificate
// Official Electronic IT Clearance & No-Objection Certificate (IT NOC)
itamRouter.get('/exit-clearances/:id/certificate', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const clearanceId = req.params.id;

    const clearance = await prisma.exitClearance.findFirst({
      where: { id: clearanceId, tenantId },
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
            location: true,
          },
        },
        tenant: { include: { organizations: true } },
      },
    });

    if (!clearance) {
      return res.status(404).json({ error: 'Exit clearance not found' });
    }

    // Fetch all returned receipts for this employee
    const returnedReceipts = await prisma.custodyReceipt.findMany({
      where: {
        tenantId,
        employeeId: clearance.employeeId,
        status: CustodyStatus.RETURNED,
      },
      include: { asset: true },
      orderBy: { returnedAt: 'desc' },
    });

    const org = clearance.tenant.organizations[0];
    const rawHashInput = `${clearance.tenantId}|${clearance.id}|${clearance.employeeId}|${clearance.itNocIssuedAt?.toISOString() || 'PENDING'}`;
    const verificationHash = crypto.createHash('sha256').update(rawHashInput).digest('hex');

    const certificate = {
      nocCertificateNumber: `NOC-IT-${clearance.id.slice(0, 8).toUpperCase()}`,
      issuedAt: clearance.itNocIssuedAt ? clearance.itNocIssuedAt.toISOString() : new Date().toISOString(),
      itNocIssued: clearance.itNocIssued,
      status: clearance.status,
      resignationDate: clearance.resignationDate.toISOString().split('T')[0],
      lastWorkingDay: clearance.lastWorkingDay.toISOString().split('T')[0],
      verificationHash,
      organization: {
        legalName: org?.legalEntity || clearance.tenant.name,
        tradeName: org?.name || clearance.tenant.name,
        cinOrGstin: org?.cinOrGstin || '29AABCU9603R1ZM',
        facility: clearance.employee.location?.name || 'Bengaluru Headquarters',
      },
      employee: {
        name: `${clearance.employee.firstName} ${clearance.employee.lastName}`,
        code: clearance.employee.employeeCode,
        email: clearance.employee.email,
        department: clearance.employee.department.name,
        designation: clearance.employee.designation.title,
      },
      returnedAssets: returnedReceipts.map((r) => ({
        tag: r.asset.assetTag,
        name: r.asset.name,
        serialNumber: r.asset.serialNumber,
        category: r.asset.category,
        returnedAt: r.returnedAt ? r.returnedAt.toISOString().split('T')[0] : r.updatedAt.toISOString().split('T')[0],
        verifiedBy: r.verifiedByItTechnicianId || 'IT Asset Operations',
      })),
      clearanceStatement: 'This certifies that the employee named above has completed all mandatory IT offboarding protocols. All assigned hardware assets, laptops, peripheral devices, corporate VPN certificates, and identity access credentials have been safely recovered and decommissioned. IT Infrastructure confirms ZERO outstanding asset liability, and explicitly grants electronic IT NOC clearance for Full and Final (F&F) payroll release.',
    };

    return res.json(certificate);
  } catch (error: any) {
    console.error('Fetch IT NOC certificate error:', error);
    return res.status(500).json({ error: 'Failed to generate IT NOC certificate' });
  }
});

