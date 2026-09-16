import { prisma } from '@empops/database';

export interface CategoryStockBuffer {
  category: string;
  total: number;
  inStock: number;
  assigned: number;
  inRepair: number;
  minBuffer: number;
  bufferHealth: 'CRITICAL' | 'LOW' | 'HEALTHY' | 'SURPLUS';
  reorderNeeded: number;
}

export interface InventoryMetrics {
  totalAssets: number;
  inStockCount: number;
  assignedCount: number;
  inRepairCount: number;
  retiredCount: number;
  utilizationRate: number; // Percentage
  financials: {
    totalCapEx: number;
    netBookValue: number;
    totalDepreciated: number;
  };
  categoryBuffers: CategoryStockBuffer[];
  lowStockAlerts: {
    category: string;
    inStock: number;
    minBuffer: number;
    shortage: number;
    severity: 'CRITICAL' | 'WARNING';
  }[];
  joinerDemand: {
    upcomingJoinersCount: number;
    laptopsInStock: number;
    shortfall: number;
    status: 'OPTIMAL' | 'DEFICIT_WARNING';
  };
  warrantyStatus: {
    activeCount: number;
    expiring30DaysCount: number;
    expiring90DaysCount: number;
    expiredCount: number;
  };
}

export class ItamInventoryService {
  private static DEFAULT_MIN_BUFFERS: Record<string, number> = {
    LAPTOP: 5,
    MONITOR: 3,
    DESKTOP: 2,
    ACCESSORY: 10,
    MOBILE: 2,
    SERVER: 1,
    OTHER: 2,
  };

  static async getInventoryMetrics(tenantId: string): Promise<InventoryMetrics> {
    const assets = await prisma.asset.findMany({
      where: { tenantId },
      select: {
        id: true,
        category: true,
        status: true,
        purchaseCost: true,
        purchaseDate: true,
        warrantyExpiry: true,
      },
    });

    const totalAssets = assets.length;
    let inStockCount = 0;
    let assignedCount = 0;
    let inRepairCount = 0;
    let retiredCount = 0;
    let totalCapEx = 0;
    let totalNetBookValue = 0;

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 3600 * 1000);

    let activeWarranties = 0;
    let expiring30DaysCount = 0;
    let expiring90DaysCount = 0;
    let expiredWarranties = 0;

    // Grouping by category
    const catMap: Record<string, { total: number; inStock: number; assigned: number; inRepair: number }> = {};

    for (const a of assets) {
      if (a.status === 'IN_STOCK') inStockCount++;
      else if (a.status === 'ASSIGNED') assignedCount++;
      else if (a.status === 'IN_REPAIR') inRepairCount++;
      else if (a.status === 'RETIRED') retiredCount++;

      totalCapEx += a.purchaseCost || 0;

      // Straight-line depreciation calculation (36 months useful life for IT hardware)
      const purchaseDate = new Date(a.purchaseDate);
      const monthsOld = Math.max(0, (now.getFullYear() - purchaseDate.getFullYear()) * 12 + (now.getMonth() - purchaseDate.getMonth()));
      const monthlyDep = (a.purchaseCost || 0) / 36;
      const accumulatedDep = Math.min(a.purchaseCost || 0, monthlyDep * monthsOld);
      const nbv = Math.max(0, (a.purchaseCost || 0) - accumulatedDep);
      totalNetBookValue += nbv;

      // Warranty tracking
      if (a.warrantyExpiry) {
        const wDate = new Date(a.warrantyExpiry);
        if (wDate < now) {
          expiredWarranties++;
        } else {
          activeWarranties++;
          if (wDate <= thirtyDaysFromNow) {
            expiring30DaysCount++;
          } else if (wDate <= ninetyDaysFromNow) {
            expiring90DaysCount++;
          }
        }
      }

      const cat = a.category.toUpperCase();
      if (!catMap[cat]) {
        catMap[cat] = { total: 0, inStock: 0, assigned: 0, inRepair: 0 };
      }
      catMap[cat].total++;
      if (a.status === 'IN_STOCK') catMap[cat].inStock++;
      else if (a.status === 'ASSIGNED') catMap[cat].assigned++;
      else if (a.status === 'IN_REPAIR') catMap[cat].inRepair++;
    }

    // Fetch tenant's active categories from AssetCategoryMaster
    const tenantCategories = await prisma.assetCategoryMaster.findMany({
      where: { tenantId, isActive: true },
    });
    const categoryConfigMap = new Map(tenantCategories.map((c) => [c.code, c]));

    // Dynamic Category buffers combining tenant master and any existing assets
    const defaultCodes = ['LAPTOP', 'MONITOR', 'ACCESSORY', 'DESKTOP', 'MOBILE', 'SERVER'];
    const allCategories = Array.from(
      new Set([
        ...tenantCategories.map((c) => c.code),
        ...defaultCodes,
        ...Object.keys(catMap),
      ])
    );

    const categoryBuffers: CategoryStockBuffer[] = allCategories.map((cat) => {
      const data = catMap[cat] || { total: 0, inStock: 0, assigned: 0, inRepair: 0 };
      const catMaster = categoryConfigMap.get(cat);
      const minBuffer = catMaster?.minSafetyBuffer ?? (this.DEFAULT_MIN_BUFFERS[cat] || 3);
      let bufferHealth: 'CRITICAL' | 'LOW' | 'HEALTHY' | 'SURPLUS' = 'HEALTHY';

      if (data.inStock === 0) bufferHealth = 'CRITICAL';
      else if (data.inStock < minBuffer) bufferHealth = 'LOW';
      else if (data.inStock > minBuffer * 2.5) bufferHealth = 'SURPLUS';

      return {
        category: cat,
        total: data.total,
        inStock: data.inStock,
        assigned: data.assigned,
        inRepair: data.inRepair,
        minBuffer,
        bufferHealth,
        reorderNeeded: Math.max(0, minBuffer - data.inStock),
      };
    });

    const lowStockAlerts = categoryBuffers
      .filter((b) => b.bufferHealth === 'CRITICAL' || b.bufferHealth === 'LOW')
      .map((b) => ({
        category: b.category,
        inStock: b.inStock,
        minBuffer: b.minBuffer,
        shortage: b.minBuffer - b.inStock,
        severity: (b.bufferHealth === 'CRITICAL' ? 'CRITICAL' : 'WARNING') as 'CRITICAL' | 'WARNING',
      }));

    // HR Joiner Demand in next 30 days
    const upcomingEmployees = await prisma.employee.findMany({
      where: {
        tenantId,
        status: { in: ['PROBATION', 'CONFIRMED'] },
      },
      select: {
        id: true,
        joiningDate: true,
        assignedAssets: { select: { id: true } },
      },
    });

    // Unassigned employees or those joined in last 30 days / joining soon
    const unprovisionedJoiners = upcomingEmployees.filter((e) => e.assignedAssets.length === 0);
    const laptopsInStock = catMap['LAPTOP']?.inStock || 0;
    const shortfall = Math.max(0, unprovisionedJoiners.length - laptopsInStock);

    const utilizationRate = totalAssets > 0 ? Math.round((assignedCount / (totalAssets - retiredCount || 1)) * 100) : 0;

    return {
      totalAssets,
      inStockCount,
      assignedCount,
      inRepairCount,
      retiredCount,
      utilizationRate,
      financials: {
        totalCapEx,
        netBookValue: Math.round(totalNetBookValue),
        totalDepreciated: Math.round(totalCapEx - totalNetBookValue),
      },
      categoryBuffers,
      lowStockAlerts,
      joinerDemand: {
        upcomingJoinersCount: unprovisionedJoiners.length,
        laptopsInStock,
        shortfall,
        status: shortfall > 0 ? 'DEFICIT_WARNING' : 'OPTIMAL',
      },
      warrantyStatus: {
        activeCount: activeWarranties,
        expiring30DaysCount,
        expiring90DaysCount,
        expiredCount: expiredWarranties,
      },
    };
  }

  static async getStockReport(tenantId: string) {
    const assets = await prisma.asset.findMany({
      where: { tenantId },
      select: {
        id: true,
        category: true,
        brand: true,
        model: true,
        status: true,
        purchaseCost: true,
      },
    });

    const groupMap: Record<string, {
      category: string;
      brand: string;
      model: string;
      totalUnits: number;
      inStockUnits: number;
      assignedUnits: number;
      inRepairUnits: number;
      totalCost: number;
    }> = {};

    for (const a of assets) {
      const key = `${a.category}|${a.brand}|${a.model}`;
      if (!groupMap[key]) {
        groupMap[key] = {
          category: a.category,
          brand: a.brand,
          model: a.model,
          totalUnits: 0,
          inStockUnits: 0,
          assignedUnits: 0,
          inRepairUnits: 0,
          totalCost: 0,
        };
      }
      groupMap[key].totalUnits++;
      if (a.status === 'IN_STOCK') groupMap[key].inStockUnits++;
      else if (a.status === 'ASSIGNED') groupMap[key].assignedUnits++;
      else if (a.status === 'IN_REPAIR') groupMap[key].inRepairUnits++;
      groupMap[key].totalCost += a.purchaseCost || 0;
    }

    return Object.values(groupMap).map((item) => {
      const avgCost = Math.round(item.totalCost / (item.totalUnits || 1));
      const deployedRatio = item.totalUnits > 0 ? Math.round((item.assignedUnits / item.totalUnits) * 100) : 0;
      return {
        ...item,
        averageUnitCost: avgCost,
        deployedRatio,
        reorderRecommended: item.inStockUnits <= 1 && item.totalUnits >= 3,
      };
    });
  }

  static async getDepreciationLedger(tenantId: string) {
    const assets = await prisma.asset.findMany({
      where: { tenantId },
      include: {
        categoryMaster: true,
        assignedTo: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
          },
        },
        location: { select: { name: true } },
      },
      orderBy: { purchaseDate: 'asc' },
    });

    const now = new Date();

    return assets.map((a) => {
      const purchaseDate = new Date(a.purchaseDate);
      const monthsOld = Math.max(0, (now.getFullYear() - purchaseDate.getFullYear()) * 12 + (now.getMonth() - purchaseDate.getMonth()));
      const usefulLifeMonths = a.categoryMaster?.usefulLifeMonths || 36;
      const monthlyDep = (a.purchaseCost || 0) / usefulLifeMonths;
      const accumulatedDep = Math.min(a.purchaseCost || 0, monthlyDep * monthsOld);
      const netBookValue = Math.max(0, (a.purchaseCost || 0) - accumulatedDep);
      const depreciationPercent = (a.purchaseCost || 0) > 0 ? Math.round((accumulatedDep / a.purchaseCost) * 100) : 100;
      const isFullyDepreciated = netBookValue === 0;

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
        usefulLifeMonths,
        ageInMonths: monthsOld,
        monthlyDepreciation: Math.round(monthlyDep),
        accumulatedDepreciation: Math.round(accumulatedDep),
        netBookValue: Math.round(netBookValue),
        depreciationPercent,
        status: a.status,
        isFullyDepreciated,
        custodian: a.assignedTo
          ? `${a.assignedTo.firstName} ${a.assignedTo.lastName} (${a.assignedTo.employeeCode})`
          : 'In Stock (Unassigned)',
        department: a.assignedTo?.department?.name || 'Central IT Store',
        location: a.location?.name || 'HQ',
      };
    });
  }
}
