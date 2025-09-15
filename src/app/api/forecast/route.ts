import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
// AI functionality removed for lighter build
import { computeReplenishmentPlan } from '@/lib/forecast';
import { demoParts, demoTransactions } from '@/lib/data';

const BodySchema = z.object({
  partName: z.string(),
  vendorLeadTimeDays: z.number().min(0).default(14),
  seasonalVariations: z.string().optional(),
  // Optional explicit data; if not provided, use demo data (or client-side will pass real state soon)
  parts: z.any().optional(),
  transactions: z.any().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const body = BodySchema.parse(json);

    const parts = Array.isArray(body.parts) ? body.parts : demoParts;
    const transactions = Array.isArray(body.transactions) ? body.transactions : demoTransactions;

    const plan = computeReplenishmentPlan(parts, transactions, {
      lookbackDays: 90,
      vendorLeadTimeDays: body.vendorLeadTimeDays,
      safetyDays: 7,
    });

    const selected = plan.find(p => p.partName === body.partName) || null;

    // Simple local forecast (AI removed for lighter build)
    // Calculate dynamic confidence score based on data quality
    const partTransactions = transactions.filter(t => t.partName === body.partName);
    const transactionCount = partTransactions.length;
    const dataQuality = Math.min(transactionCount / 10, 1); // More transactions = higher confidence
    const leadTimeVariability = Math.max(0.1, 1 - (body.vendorLeadTimeDays / 30)); // Shorter lead times = higher confidence
    const confidenceScore = Math.min(0.95, Math.max(0.45, (dataQuality * 0.6 + leadTimeVariability * 0.4)));
    
    const ai = {
      predictedShortageDate: new Date(Date.now() + (body.vendorLeadTimeDays * 24 * 60 * 60 * 1000)),
      confidenceScore: confidenceScore,
      reasoning: `Based on ${transactionCount} transactions and ${body.vendorLeadTimeDays}-day lead time`
    };

    return NextResponse.json({ plan, selectedPart: selected, ai });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to forecast' }, { status: 400 });
  }
}


