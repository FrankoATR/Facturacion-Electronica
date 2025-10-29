import { prisma } from "../../config/prisma";
import { getMonthRange } from "../../common/date";

// Simple in-memory cache with TTL
interface CacheEntry {
  value: number;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 1000; // 60 seconds

/**
 * Get monthly billing total for the specified date
 * Aggregates all ISSUED invoices within the month in America/El_Salvador timezone
 */
export async function getMonthlyBillingTotal(options: { at?: Date } = {}): Promise<number> {
  const at = options.at || new Date();
  const cacheKey = `monthly-${at.getFullYear()}-${at.getMonth()}`;
  
  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }
  
  // Get month range in El Salvador timezone
  const { start, end } = getMonthRange(at);
  
  // Aggregate invoices
  const result = await prisma.invoice.aggregate({
    _sum: {
      total: true,
    },
    where: {
      status: "ISSUED",
      issuedAt: {
        gte: start,
        lte: end,
      },
    },
  });
  
  const total = Number(result._sum.total || 0);
  
  // Update cache
  cache.set(cacheKey, {
    value: total,
    timestamp: Date.now(),
  });
  
  return total;
}

/**
 * Clear the cache (useful for testing or manual refresh)
 */
export function clearMetricsCache(): void {
  cache.clear();
}

