export interface Company {
  id: string;
  name: string;
  contactInfo?: string;
}

export interface OrderItem {
  id: string;
  articleName: string;
  articleNumber: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  companyId: string;
  items: OrderItem[];
  date: string;
  deliveryDate?: string;
  notes?: string;
}

export interface OrderRecommendation {
  articleName: string;
  articleNumber: string;
  quantity: number;
  companyId: string;
  companyName: string;
  avgIntervalDays: number;
  daysSinceLastOrder: number;
  urgency: 'high' | 'medium' | 'low';
}

export interface SavedArticle {
  id: string;
  companyId: string;
  articleName: string;
  articleNumber: string;
  lastPrice: number;
  orderCount: number;
  lastOrderDate: string;
}

export interface CompanyAnalytics {
  companyId: string;
  companyName: string;
  totalOrders: number;
  totalItems: number;
  totalSpent: number;
  firstOrderDate: string;
  lastOrderDate: string;
  monthlyData: MonthlyOrderData[];
  topArticles: ArticleStats[];
}

export interface MonthlyOrderData {
  month: string;
  orderCount: number;
  totalSpent: number;
  itemCount: number;
}

export interface ArticleStats {
  articleName: string;
  articleNumber: string;
  totalQuantity: number;
  totalSpent: number;
  avgPrice: number;
  priceHistory: { date: string; price: number }[];
  orderCount: number;
}

export interface AppSettings {
  reminderEnabled: boolean;
  reminderTime: string;
  notificationPermissionGranted: boolean;
}
