import type { Part, Transaction } from '@/lib/types';

export type ReplenishmentRecommendation = {
  partId: string;
  partName: string;
  currentQuantity: number;
  reorderPoint: number;
  maxStock: number;
  averageDailyDemand: number;
  averageDailySupply: number;
  netDailyConsumption: number; // demand - supply
  daysUntilReorderThreshold: number | null; // null if not depleting
  neededByDate: string | null; // ISO date when to place order to avoid dipping below threshold
  recommendedOrderQty: number; // 0 if not needed
};

function toStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.round((toStartOfDay(b).getTime() - toStartOfDay(a).getTime()) / MS_PER_DAY));
}

export function computeReplenishmentPlan(
  parts: Part[],
  transactions: Transaction[],
  options?: { lookbackDays?: number; vendorLeadTimeDays?: number; safetyDays?: number }
): ReplenishmentRecommendation[] {
  const lookbackDays = options?.lookbackDays ?? 90;
  const vendorLeadTimeDays = Math.max(0, options?.vendorLeadTimeDays ?? 14);
  const safetyDays = Math.max(0, options?.safetyDays ?? 7);

  const today = toStartOfDay(new Date());
  const lookbackStart = new Date(today);
  lookbackStart.setDate(today.getDate() - lookbackDays);

  const relevantTx = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d >= lookbackStart && d <= today;
  });

  const byPart: Record<string, { demandQty: number; supplyQty: number; countDemandDays: Set<string>; countSupplyDays: Set<string> }> = {};

  for (const tx of relevantTx) {
    const key = tx.partName;
    if (!byPart[key]) {
      byPart[key] = { demandQty: 0, supplyQty: 0, countDemandDays: new Set(), countSupplyDays: new Set() };
    }
    const day = new Date(tx.date).toISOString().split('T')[0];
    if (tx.type === 'demand') {
      byPart[key].demandQty += tx.quantity;
      byPart[key].countDemandDays.add(day);
    } else {
      byPart[key].supplyQty += tx.quantity;
      byPart[key].countSupplyDays.add(day);
    }
  }

  const results: ReplenishmentRecommendation[] = parts.map(part => {
    const agg = byPart[part.name];
    // Average per-day over lookback period; if no data, assume very low demand to avoid divide-by-zero surprises
    const avgDailyDemand = agg ? Math.round(agg.demandQty / lookbackDays) : 0; // discrete per-day
    const avgDailySupply = agg ? Math.round(agg.supplyQty / lookbackDays) : 0; // discrete per-day
    const netDailyConsumption = Math.max(0, avgDailyDemand - avgDailySupply);

    let daysUntilReorderThreshold: number | null = null;
    let neededByDate: string | null = null;
    let recommendedOrderQty = 0;

    if (netDailyConsumption > 0) {
      const buffer = Math.max(0, part.quantity - part.reorderPoint);
      const daysToThreshold = buffer <= 0 ? 0 : Math.floor(buffer / netDailyConsumption);
      daysUntilReorderThreshold = Math.max(0, daysToThreshold);

      // When to place order: before we hit threshold, accounting for vendor lead time
      const placeOrderInDays = Math.max(0, daysUntilReorderThreshold - vendorLeadTimeDays);
      const neededDate = new Date(today);
      neededDate.setDate(today.getDate() + placeOrderInDays);
      neededByDate = neededDate.toISOString().split('T')[0];

      // How much to order: cover lead time + safety and try to top up towards maxStock
      const coverageDays = vendorLeadTimeDays + safetyDays;
      const requiredForCoverage = Math.ceil(netDailyConsumption * coverageDays);
      const spaceToMax = Math.max(0, part.maxStock - part.quantity);
      recommendedOrderQty = Math.min(spaceToMax, Math.max(0, requiredForCoverage));
    }

    return {
      partId: part.id,
      partName: part.name,
      currentQuantity: part.quantity,
      reorderPoint: part.reorderPoint,
      maxStock: part.maxStock,
      averageDailyDemand: avgDailyDemand,
      averageDailySupply: avgDailySupply,
      netDailyConsumption: netDailyConsumption,
      daysUntilReorderThreshold,
      neededByDate,
      recommendedOrderQty,
    };
  });

  // Only include items that actually need attention soon
  const actionable = results.filter(r => r.netDailyConsumption > 0 && r.recommendedOrderQty > 0);

  // Sort by urgency: sooner needed date first, then lower buffer
  actionable.sort((a, b) => {
    if (a.neededByDate && b.neededByDate) {
      return new Date(a.neededByDate).getTime() - new Date(b.neededByDate).getTime();
    }
    if (a.neededByDate) return -1;
    if (b.neededByDate) return 1;
    return (a.currentQuantity - a.reorderPoint) - (b.currentQuantity - b.reorderPoint);
  });

  return actionable;
}


