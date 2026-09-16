import { prisma } from '@empops/database';
import { AuditService } from '../audit/audit.service.js';

export interface CreateCategoryInput {
  code: string;
  name: string;
  tagPrefix: string;
  minSafetyBuffer?: number;
  usefulLifeMonths?: number;
  salvageValuePercent?: number;
  requiresCustodySign?: boolean;
  isSerialized?: boolean;
  icon?: string;
}

export interface InwardBatchInput {
  categoryId: string;
  brand: string;
  model: string;
  vendorName?: string;
  purchaseOrderNumber?: string;
  purchaseInvoiceNumber?: string;
  purchaseDate: string;
  purchaseCostPerUnit: number;
  warrantyExpiry?: string;
  locationId?: string;
  serialNumbers?: string[];
  quantity?: number;
}

export class ItamCatalogService {
  private static STANDARD_DEFAULTS = [
    {
      code: 'LAPTOP',
      name: 'Laptops & Workstations',
      tagPrefix: 'AST-LAP',
      minSafetyBuffer: 5,
      usefulLifeMonths: 36,
      salvageValuePercent: 5.0,
      requiresCustodySign: true,
      isSerialized: true,
      icon: 'Laptop',
    },
    {
      code: 'MONITOR',
      name: 'Monitors & Displays',
      tagPrefix: 'AST-MON',
      minSafetyBuffer: 3,
      usefulLifeMonths: 36,
      salvageValuePercent: 5.0,
      requiresCustodySign: false,
      isSerialized: true,
      icon: 'Monitor',
    },
    {
      code: 'DESKTOP',
      name: 'Desktops & Towers',
      tagPrefix: 'AST-DSK',
      minSafetyBuffer: 2,
      usefulLifeMonths: 36,
      salvageValuePercent: 5.0,
      requiresCustodySign: true,
      isSerialized: true,
      icon: 'Cpu',
    },
    {
      code: 'MOBILE',
      name: 'Smartphones & Cellular Devices',
      tagPrefix: 'AST-MOB',
      minSafetyBuffer: 2,
      usefulLifeMonths: 24,
      salvageValuePercent: 5.0,
      requiresCustodySign: true,
      isSerialized: true,
      icon: 'Smartphone',
    },
    {
      code: 'ACCESSORY',
      name: 'Peripherals & Docking Stations',
      tagPrefix: 'AST-ACC',
      minSafetyBuffer: 10,
      usefulLifeMonths: 12,
      salvageValuePercent: 0.0,
      requiresCustodySign: false,
      isSerialized: false,
      icon: 'Headphones',
    },
    {
      code: 'SERVER',
      name: 'Servers & Network Racks',
      tagPrefix: 'AST-SRV',
      minSafetyBuffer: 1,
      usefulLifeMonths: 60,
      salvageValuePercent: 10.0,
      requiresCustodySign: false,
      isSerialized: true,
      icon: 'Server',
    },
    {
      code: 'OTHER',
      name: 'General Workplace Equipment',
      tagPrefix: 'AST-GEN',
      minSafetyBuffer: 2,
      usefulLifeMonths: 36,
      salvageValuePercent: 0.0,
      requiresCustodySign: false,
      isSerialized: true,
      icon: 'Box',
    },
  ];

  /**
   * Auto-seed default categories for a tenant if none exist, and link orphan assets.
   */
  static async ensureDefaultCategories(tenantId: string) {
    const count = await prisma.assetCategoryMaster.count({ where: { tenantId } });
    if (count === 0) {
      for (const def of this.STANDARD_DEFAULTS) {
        await prisma.assetCategoryMaster.create({
          data: {
            tenantId,
            ...def,
          },
        });
      }
    }

    // Link existing assets that have null categoryId
    const unlinkedAssets = await prisma.asset.findMany({
      where: { tenantId, categoryId: null },
      select: { id: true, category: true },
    });

    if (unlinkedAssets.length > 0) {
      const allCategories = await prisma.assetCategoryMaster.findMany({ where: { tenantId } });
      const categoryMap = new Map(allCategories.map((c) => [c.code, c.id]));

      for (const asset of unlinkedAssets) {
        const catId = categoryMap.get(asset.category) || categoryMap.get('OTHER');
        if (catId) {
          await prisma.asset.update({
            where: { id: asset.id },
            data: { categoryId: catId },
          });
        }
      }
    }
  }

  /**
   * Get all categories for a tenant with live asset counts and buffer levels
   */
  static async getCategories(tenantId: string) {
    await this.ensureDefaultCategories(tenantId);

    const categories = await prisma.assetCategoryMaster.findMany({
      where: { tenantId, isActive: true },
      include: {
        _count: {
          select: { assets: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Compute live stock buffer per category
    const stockCounts = await prisma.asset.groupBy({
      by: ['categoryId', 'status'],
      where: { tenantId },
      _count: { id: true },
    });

    const stockMap: Record<string, { inStock: number; assigned: number; inRepair: number }> = {};
    for (const row of stockCounts) {
      if (!row.categoryId) continue;
      if (!stockMap[row.categoryId]) {
        stockMap[row.categoryId] = { inStock: 0, assigned: 0, inRepair: 0 };
      }
      if (row.status === 'IN_STOCK') stockMap[row.categoryId].inStock += row._count.id;
      if (row.status === 'ASSIGNED') stockMap[row.categoryId].assigned += row._count.id;
      if (row.status === 'IN_REPAIR') stockMap[row.categoryId].inRepair += row._count.id;
    }

    return categories.map((c) => {
      const counts = stockMap[c.id] || { inStock: 0, assigned: 0, inRepair: 0 };
      const inStock = counts.inStock;
      const bufferHealth =
        inStock === 0
          ? 'CRITICAL'
          : inStock < c.minSafetyBuffer
          ? 'LOW'
          : inStock > c.minSafetyBuffer * 2
          ? 'SURPLUS'
          : 'HEALTHY';

      return {
        id: c.id,
        code: c.code,
        name: c.name,
        tagPrefix: c.tagPrefix,
        minSafetyBuffer: c.minSafetyBuffer,
        usefulLifeMonths: c.usefulLifeMonths,
        salvageValuePercent: c.salvageValuePercent,
        requiresCustodySign: c.requiresCustodySign,
        isSerialized: c.isSerialized,
        icon: c.icon,
        totalAssets: c._count.assets,
        inStockUnits: inStock,
        assignedUnits: counts.assigned,
        inRepairUnits: counts.inRepair,
        bufferHealth,
      };
    });
  }

  /**
   * Create a new category in tenant's master catalog
   */
  static async createCategory(tenantId: string, input: CreateCategoryInput, actorEmail = 'system') {
    const code = input.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
    const prefix = input.tagPrefix.trim().toUpperCase();

    // Check if code already exists for tenant
    const existing = await prisma.assetCategoryMaster.findUnique({
      where: {
        tenantId_code: { tenantId, code },
      },
    });

    if (existing) {
      if (!existing.isActive) {
        // Reactivate
        return prisma.assetCategoryMaster.update({
          where: { id: existing.id },
          data: {
            name: input.name,
            tagPrefix: prefix,
            minSafetyBuffer: input.minSafetyBuffer ?? existing.minSafetyBuffer,
            usefulLifeMonths: input.usefulLifeMonths ?? existing.usefulLifeMonths,
            salvageValuePercent: input.salvageValuePercent ?? existing.salvageValuePercent,
            requiresCustodySign: input.requiresCustodySign ?? existing.requiresCustodySign,
            isSerialized: input.isSerialized ?? existing.isSerialized,
            icon: input.icon ?? existing.icon,
            isActive: true,
          },
        });
      }
      throw new Error(`Category code ${code} already exists for this organization.`);
    }

    const category = await prisma.assetCategoryMaster.create({
      data: {
        tenantId,
        code,
        name: input.name.trim(),
        tagPrefix: prefix.startsWith('AST-') ? prefix : `AST-${prefix}`,
        minSafetyBuffer: input.minSafetyBuffer ?? 3,
        usefulLifeMonths: input.usefulLifeMonths ?? 36,
        salvageValuePercent: input.salvageValuePercent ?? 5.0,
        requiresCustodySign: input.requiresCustodySign ?? true,
        isSerialized: input.isSerialized ?? true,
        icon: input.icon || 'Box',
      },
    });

    await AuditService.record({
      tenantId,
      action: 'CATEGORY_CREATED',
      entityType: 'AssetCategoryMaster',
      entityId: category.id,
      details: { code, name: category.name, tagPrefix: category.tagPrefix, createdBy: actorEmail },
    });

    return category;
  }

  /**
   * Update category properties & buffer thresholds
   */
  static async updateCategory(
    tenantId: string,
    id: string,
    input: Partial<CreateCategoryInput>,
    actorEmail = 'system'
  ) {
    const category = await prisma.assetCategoryMaster.findFirst({
      where: { id, tenantId },
    });
    if (!category) throw new Error('Category not found');

    const updated = await prisma.assetCategoryMaster.update({
      where: { id },
      data: {
        name: input.name?.trim() ?? category.name,
        tagPrefix: input.tagPrefix?.trim().toUpperCase() ?? category.tagPrefix,
        minSafetyBuffer: input.minSafetyBuffer ?? category.minSafetyBuffer,
        usefulLifeMonths: input.usefulLifeMonths ?? category.usefulLifeMonths,
        salvageValuePercent: input.salvageValuePercent ?? category.salvageValuePercent,
        requiresCustodySign: input.requiresCustodySign ?? category.requiresCustodySign,
        isSerialized: input.isSerialized ?? category.isSerialized,
        icon: input.icon ?? category.icon,
      },
    });

    await AuditService.record({
      tenantId,
      action: 'CATEGORY_UPDATED',
      entityType: 'AssetCategoryMaster',
      entityId: id,
      details: { changes: input, updatedBy: actorEmail },
    });

    return updated;
  }

  /**
   * Delete or safe-deactivate category
   */
  static async deleteCategory(tenantId: string, id: string, actorEmail = 'system') {
    const category = await prisma.assetCategoryMaster.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { assets: true } } },
    });
    if (!category) throw new Error('Category not found');

    if (category._count.assets > 0) {
      await prisma.assetCategoryMaster.update({
        where: { id },
        data: { isActive: false },
      });
      await AuditService.record({
        tenantId,
        action: 'CATEGORY_DEACTIVATED',
        entityType: 'AssetCategoryMaster',
        entityId: id,
        details: { name: category.name, code: category.code, assetCount: category._count.assets, deactivatedBy: actorEmail },
      });
      return {
        success: true,
        action: 'DEACTIVATED',
        message: `Category "${category.name}" has ${category._count.assets} assets linked and was safely archived.`,
      };
    } else {
      await prisma.assetCategoryMaster.delete({ where: { id } });
      await AuditService.record({
        tenantId,
        action: 'CATEGORY_DELETED',
        entityType: 'AssetCategoryMaster',
        entityId: id,
        details: { name: category.name, code: category.code, deletedBy: actorEmail },
      });
      return {
        success: true,
        action: 'DELETED',
        message: `Category "${category.name}" was permanently deleted.`,
      };
    }
  }

  /**
   * Built-In Industry Archetypes & Templates
   */
  static getIndustryTemplates() {
    return [
      {
        id: 'TECH_SAAS',
        name: 'Tech & Cloud Software (SaaS)',
        tagline: 'High-growth tech, engineering firms, and digital workplace organizations',
        theme: 'CYBERPUNK_INDIGO',
        accentColor: '#6366f1',
        icon: 'Laptop',
        categories: [
          { code: 'LAPTOP', name: 'Engineering Workstations & Laptops', tagPrefix: 'AST-LAP', minSafetyBuffer: 5, usefulLifeMonths: 36, salvageValuePercent: 5.0, requiresCustodySign: true, isSerialized: true, icon: 'Laptop' },
          { code: 'MONITOR', name: 'High-Res 4K Coding Displays', tagPrefix: 'AST-MON', minSafetyBuffer: 3, usefulLifeMonths: 36, salvageValuePercent: 5.0, requiresCustodySign: false, isSerialized: true, icon: 'Monitor' },
          { code: 'MOBILE', name: 'QA Test Mobiles & Cellular Phones', tagPrefix: 'AST-MOB', minSafetyBuffer: 2, usefulLifeMonths: 24, salvageValuePercent: 5.0, requiresCustodySign: true, isSerialized: true, icon: 'Smartphone' },
          { code: 'ACCESSORY', name: 'USB-C Docks & Ergonomic Peripherals', tagPrefix: 'AST-ACC', minSafetyBuffer: 8, usefulLifeMonths: 12, salvageValuePercent: 0.0, requiresCustodySign: false, isSerialized: false, icon: 'Headphones' },
          { code: 'SERVER', name: 'DevOps Edge Servers & Racks', tagPrefix: 'AST-SRV', minSafetyBuffer: 1, usefulLifeMonths: 60, salvageValuePercent: 10.0, requiresCustodySign: false, isSerialized: true, icon: 'Server' },
        ],
        policies: { p1SlaHours: 24, graceMinutes: 15, autoProvisioning: true, currency: 'INR' },
      },
      {
        id: 'HEALTHCARE',
        name: 'Healthcare, Hospital & Pharma',
        tagline: 'Clinical hospitals, diagnostic laboratories, and life sciences research centers',
        theme: 'EMERALD_HEALTH',
        accentColor: '#10b981',
        icon: 'Activity',
        categories: [
          { code: 'MED_TAB', name: 'Point-of-Care Medical Tablets', tagPrefix: 'AST-MED', minSafetyBuffer: 6, usefulLifeMonths: 24, salvageValuePercent: 5.0, requiresCustodySign: true, isSerialized: true, icon: 'Laptop' },
          { code: 'SCN_POC', name: 'Clinical Barcode & Wristband Scanners', tagPrefix: 'AST-POC', minSafetyBuffer: 8, usefulLifeMonths: 36, salvageValuePercent: 5.0, requiresCustodySign: false, isSerialized: true, icon: 'Box' },
          { code: 'CLN_WORK', name: 'Stationary Nursing Station Towers', tagPrefix: 'AST-CLN', minSafetyBuffer: 4, usefulLifeMonths: 48, salvageValuePercent: 5.0, requiresCustodySign: true, isSerialized: true, icon: 'Cpu' },
          { code: 'COLD_LOG', name: 'Cold-Chain IoT Temperature Sensors', tagPrefix: 'AST-SNS', minSafetyBuffer: 5, usefulLifeMonths: 12, salvageValuePercent: 0.0, requiresCustodySign: false, isSerialized: true, icon: 'Box' },
          { code: 'LAB_PERI', name: 'Sterilized Laboratory Peripherals', tagPrefix: 'AST-LAB', minSafetyBuffer: 10, usefulLifeMonths: 12, salvageValuePercent: 0.0, requiresCustodySign: false, isSerialized: false, icon: 'Headphones' },
        ],
        policies: { p1SlaHours: 1, graceMinutes: 5, autoProvisioning: true, currency: 'INR' },
      },
      {
        id: 'LOGISTICS_MANUFACTURING',
        name: 'Manufacturing, Warehouse & Logistics',
        tagline: 'Assembly factories, fulfillment centers, and fleet distribution hubs',
        theme: 'AMBER_INDUSTRIAL',
        accentColor: '#f59e0b',
        icon: 'Boxes',
        categories: [
          { code: 'RUG_SCN', name: 'Rugged Industrial Laser Scanners', tagPrefix: 'AST-RUG', minSafetyBuffer: 8, usefulLifeMonths: 36, salvageValuePercent: 5.0, requiresCustodySign: true, isSerialized: true, icon: 'Box' },
          { code: 'THERM_PRN', name: 'High-Volume Shipping Label Printers', tagPrefix: 'AST-PRN', minSafetyBuffer: 3, usefulLifeMonths: 48, salvageValuePercent: 10.0, requiresCustodySign: false, isSerialized: true, icon: 'Server' },
          { code: 'FLIFT_MNT', name: 'Forklift Vehicle Mounted Displays', tagPrefix: 'AST-FLT', minSafetyBuffer: 2, usefulLifeMonths: 48, salvageValuePercent: 5.0, requiresCustodySign: true, isSerialized: true, icon: 'Monitor' },
          { code: 'FIELD_DEV', name: 'Drop-Tested Rugged Handhelds', tagPrefix: 'AST-FLD', minSafetyBuffer: 5, usefulLifeMonths: 24, salvageValuePercent: 5.0, requiresCustodySign: true, isSerialized: true, icon: 'Smartphone' },
          { code: 'WIFI_IND', name: 'Heavy-Duty Industrial Access Points', tagPrefix: 'AST-WAP', minSafetyBuffer: 3, usefulLifeMonths: 60, salvageValuePercent: 5.0, requiresCustodySign: false, isSerialized: true, icon: 'Server' },
        ],
        policies: { p1SlaHours: 4, graceMinutes: 10, autoProvisioning: true, currency: 'INR' },
      },
      {
        id: 'BFSI_FINTECH',
        name: 'Banking, Financial Services & BFSI',
        tagline: 'Regulated financial institutions, investment funds, and security-first enterprises',
        theme: 'NORDIC_OBSIDIAN',
        accentColor: '#38bdf8',
        icon: 'ShieldCheck',
        categories: [
          { code: 'FIN_SEC_PC', name: 'FIPS-Encrypted Financial Terminals', tagPrefix: 'AST-FIN', minSafetyBuffer: 6, usefulLifeMonths: 36, salvageValuePercent: 5.0, requiresCustodySign: true, isSerialized: true, icon: 'Laptop' },
          { code: 'FIDO_KEY', name: 'Hardware FIDO2 Security Key Vaults', tagPrefix: 'AST-KEY', minSafetyBuffer: 15, usefulLifeMonths: 24, salvageValuePercent: 0.0, requiresCustodySign: true, isSerialized: true, icon: 'Cpu' },
          { code: 'SUPER_MOB', name: 'Knox-Secured Supervised Phones', tagPrefix: 'AST-MDM', minSafetyBuffer: 4, usefulLifeMonths: 24, salvageValuePercent: 5.0, requiresCustodySign: true, isSerialized: true, icon: 'Smartphone' },
          { code: 'DUAL_TRD', name: 'Dual Bloomberg Trading Monitors', tagPrefix: 'AST-TRD', minSafetyBuffer: 4, usefulLifeMonths: 36, salvageValuePercent: 5.0, requiresCustodySign: false, isSerialized: true, icon: 'Monitor' },
          { code: 'HSM_BLADE', name: 'Hardware Security Modules (HSM)', tagPrefix: 'AST-HSM', minSafetyBuffer: 1, usefulLifeMonths: 60, salvageValuePercent: 10.0, requiresCustodySign: false, isSerialized: true, icon: 'Server' },
        ],
        policies: { p1SlaHours: 2, graceMinutes: 10, autoProvisioning: true, currency: 'INR' },
      },
    ];
  }

  /**
   * Apply Industry Template to Tenant Catalog
   */
  static async applyIndustryTemplate(
    tenantId: string,
    templateId: string,
    customCategories?: any[],
    actorEmail = 'system'
  ) {
    const templates = this.getIndustryTemplates();
    const selected = templates.find((t) => t.id === templateId) || templates[0];
    const categoriesToApply = customCategories && customCategories.length > 0 ? customCategories : selected.categories;

    const appliedCategories: any[] = [];

    for (const cat of categoriesToApply) {
      const code = cat.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
      const prefix = cat.tagPrefix.trim().toUpperCase();

      const existing = await prisma.assetCategoryMaster.findUnique({
        where: { tenantId_code: { tenantId, code } },
      });

      if (existing) {
        const updated = await prisma.assetCategoryMaster.update({
          where: { id: existing.id },
          data: {
            name: cat.name,
            tagPrefix: prefix.startsWith('AST-') ? prefix : `AST-${prefix}`,
            minSafetyBuffer: cat.minSafetyBuffer ?? existing.minSafetyBuffer,
            usefulLifeMonths: cat.usefulLifeMonths ?? existing.usefulLifeMonths,
            salvageValuePercent: cat.salvageValuePercent ?? existing.salvageValuePercent,
            requiresCustodySign: cat.requiresCustodySign ?? existing.requiresCustodySign,
            isSerialized: cat.isSerialized ?? existing.isSerialized,
            icon: cat.icon ?? existing.icon,
            isActive: true,
          },
        });
        appliedCategories.push(updated);
      } else {
        const created = await prisma.assetCategoryMaster.create({
          data: {
            tenantId,
            code,
            name: cat.name,
            tagPrefix: prefix.startsWith('AST-') ? prefix : `AST-${prefix}`,
            minSafetyBuffer: cat.minSafetyBuffer ?? 3,
            usefulLifeMonths: cat.usefulLifeMonths ?? 36,
            salvageValuePercent: cat.salvageValuePercent ?? 5.0,
            requiresCustodySign: cat.requiresCustodySign ?? true,
            isSerialized: cat.isSerialized ?? true,
            icon: cat.icon || 'Box',
          },
        });
        appliedCategories.push(created);
      }
    }

    await AuditService.record({
      tenantId,
      action: 'TEMPLATE_APPLIED',
      entityType: 'Tenant',
      entityId: tenantId,
      details: {
        templateId: selected.id,
        templateName: selected.name,
        categoriesCount: appliedCategories.length,
        appliedBy: actorEmail,
      },
    });

    return {
      template: selected,
      appliedCategoriesCount: appliedCategories.length,
      categories: appliedCategories,
    };
  }

  /**
   * Inward Assets (GRN - Goods Receipt Note) Batch Engine
   */
  static async inwardAssetsBatch(tenantId: string, input: InwardBatchInput, actorEmail = 'system') {
    const category = await prisma.assetCategoryMaster.findFirst({
      where: { id: input.categoryId, tenantId },
    });
    if (!category) throw new Error('Selected category does not exist in master catalog');

    const purchaseDate = new Date(input.purchaseDate || Date.now());
    const warrantyExpiry = input.warrantyExpiry ? new Date(input.warrantyExpiry) : null;
    const purchaseCost = Number(input.purchaseCostPerUnit);

    // Determine serial numbers and unit count
    let serials: string[] = [];
    if (category.isSerialized) {
      serials = (input.serialNumbers || [])
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (serials.length === 0) {
        throw new Error('Please provide at least one valid serial number for serialized items');
      }
    } else {
      const qty = Math.max(1, input.quantity || 1);
      for (let i = 1; i <= qty; i++) {
        serials.push(`BLK-${Date.now()}-${i}`);
      }
    }

    // Find latest sequence number for tag generation with category.tagPrefix
    const existingAssetsWithPrefix = await prisma.asset.findMany({
      where: {
        tenantId,
        assetTag: { startsWith: `${category.tagPrefix}-` },
      },
      select: { assetTag: true },
      orderBy: { assetTag: 'desc' },
      take: 10,
    });

    let currentMaxSeq = 100;
    for (const a of existingAssetsWithPrefix) {
      const parts = a.assetTag.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > currentMaxSeq) {
        currentMaxSeq = num;
      }
    }

    const createdAssets = [];
    for (let i = 0; i < serials.length; i++) {
      const serialNumber = serials[i];
      currentMaxSeq++;
      const assetTag = `${category.tagPrefix}-${currentMaxSeq.toString().padStart(5, '0')}`;

      // Check if serial already exists for tenant
      const duplicateSerial = await prisma.asset.findFirst({
        where: { tenantId, serialNumber },
      });
      if (duplicateSerial) {
        throw new Error(`Serial number "${serialNumber}" is already registered on asset ${duplicateSerial.assetTag}`);
      }

      const assetName = `${input.brand} ${input.model}`.trim();

      const newAsset = await prisma.asset.create({
        data: {
          tenantId,
          assetTag,
          name: assetName,
          categoryId: category.id,
          category: category.code,
          brand: input.brand.trim(),
          model: input.model.trim(),
          serialNumber,
          purchaseDate,
          purchaseCost,
          currentBookValue: purchaseCost,
          warrantyExpiry,
          status: 'IN_STOCK',
          locationId: input.locationId || null,
          lastAuditedAt: new Date(),
          lastAuditedBy: actorEmail,
        },
      });

      createdAssets.push(newAsset);
    }

    // Log Batch Audit Entry
    await AuditService.record({
      tenantId,
      action: 'ASSETS_INWARDED',
      entityType: 'Asset',
      entityId: category.id,
      details: {
        categoryCode: category.code,
        categoryName: category.name,
        brand: input.brand,
        model: input.model,
        unitsInwarded: createdAssets.length,
        totalCapEx: createdAssets.length * purchaseCost,
        tags: createdAssets.map((a) => a.assetTag),
        poNumber: input.purchaseOrderNumber,
        vendor: input.vendorName,
        inwardedBy: actorEmail,
      },
    });

    return {
      message: `Successfully inwarded ${createdAssets.length} unit(s) into warehouse inventory`,
      category: category.name,
      unitsInwarded: createdAssets.length,
      totalCapExAdded: createdAssets.length * purchaseCost,
      assets: createdAssets,
    };
  }
}
