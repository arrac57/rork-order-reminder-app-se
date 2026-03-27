import { Order, Company, OrderRecommendation } from '@/types/order';

export function generateRecommendations(
  orders: Order[],
  companies: Company[],
  limit: number = 3
): OrderRecommendation[] {
  const articleHistory: Record<string, { dates: string[]; companyId: string; quantity: number; articleName: string; articleNumber: string }> = {};

  for (const order of orders) {
    for (const item of order.items) {
      const key = `${item.articleNumber}_${order.companyId}`;
      if (!articleHistory[key]) {
        articleHistory[key] = {
          dates: [],
          companyId: order.companyId,
          quantity: item.quantity,
          articleName: item.articleName,
          articleNumber: item.articleNumber,
        };
      }
      articleHistory[key].dates.push(order.date);
      articleHistory[key].quantity = Math.round(
        (articleHistory[key].quantity + item.quantity) / 2
      );
    }
  }

  const recommendations: OrderRecommendation[] = [];
  const now = new Date();

  for (const key of Object.keys(articleHistory)) {
    const history = articleHistory[key];
    if (history.dates.length < 2) continue;

    const sorted = history.dates
      .map((d) => new Date(d).getTime())
      .sort((a, b) => a - b);

    let totalInterval = 0;
    for (let i = 1; i < sorted.length; i++) {
      totalInterval += sorted[i] - sorted[i - 1];
    }
    const avgIntervalMs = totalInterval / (sorted.length - 1);
    const avgIntervalDays = Math.round(avgIntervalMs / (1000 * 60 * 60 * 24));

    const lastOrderDate = new Date(sorted[sorted.length - 1]);
    const daysSinceLastOrder = Math.round(
      (now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const ratio = daysSinceLastOrder / avgIntervalDays;
    let urgency: 'high' | 'medium' | 'low' = 'low';
    if (ratio >= 1) urgency = 'high';
    else if (ratio >= 0.7) urgency = 'medium';

    const company = companies.find((c) => c.id === history.companyId);

    recommendations.push({
      articleName: history.articleName,
      articleNumber: history.articleNumber,
      quantity: history.quantity,
      companyId: history.companyId,
      companyName: company?.name ?? 'Okänt företag',
      avgIntervalDays,
      daysSinceLastOrder,
      urgency,
    });
  }

  recommendations.sort((a, b) => {
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    return (b.daysSinceLastOrder / b.avgIntervalDays) - (a.daysSinceLastOrder / a.avgIntervalDays);
  });

  return recommendations.slice(0, limit);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}
