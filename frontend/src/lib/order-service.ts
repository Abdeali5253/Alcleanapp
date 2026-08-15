import { CartItem } from "./cart";
import { authService } from "./auth";
import { BACKEND_URL } from "./base-url";

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  city: string;
  items: CartItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  paymentMethod: 'cod' | 'bank-transfer';
  status: 'pending' | 'processing' | 'in-transit' | 'delivered';
  createdAt: string;
  trackingNumber?: string;
  courier?: string;
  companyType?: string;
  trackingStatusText?: string;
  trackingLastUpdated?: string;
  courierTrackingError?: string;
  ratingEligible?: boolean;
  localDelivery?: {
    city: string;
    managerName: string;
    phone: string;
    estimatedWindow: string;
    note: string;
  } | null;
  trackingTimeline?: {
    status: 'pending' | 'processing' | 'in-transit' | 'delivered';
    label: string;
    details?: string;
    location?: string;
    timestamp?: string;
    completed: boolean;
    source: 'system' | 'courier';
  }[];
  shopifyOrderId?: string; // Shopify order ID
  shopifyDraftOrderId?: string; // Shopify draft order ID
}

class OrderService {
  private orders: Order[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    localStorage.removeItem('alclean_orders');
    window.addEventListener("alclean-before-logout", () => {
      this.orders = [];
      this.notifyListeners();
    });
  }

  /**
   * Notify consumers after an in-memory order update.
   */
  private saveOrders() {
    this.notifyListeners();
  }

  /**
   * Notify listeners of changes
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Fetch orders from Shopify for current user
   */
  async fetchShopifyOrders(): Promise<Order[]> {
    const user = authService.getCurrentUser();
    if (!user || !user.accessToken) {
      console.log('[Orders] No user or access token');
      return [];
    }

    try {
      // Import getCustomer from shopify
      const { getCustomer } = await import('./shopify');
      const customerData = await getCustomer(user.accessToken);
      
      if (!customerData || !customerData.orders) {
        console.log('[Orders] No orders found in Shopify');
        return [];
      }

      // Transform Shopify orders to our Order format
      const shopifyOrders: Order[] = customerData.orders.edges.map((edge: any) => {
        const order = edge.node;
        const lineItems = order.lineItems.edges.map((itemEdge: any) => {
          const item = itemEdge.node;
          return {
            product: {
              id: item.variant?.id || '',
              title: item.title,
              image: item.variant?.image?.url || '',
              price: parseFloat(item.variant?.price?.amount || '0'),
              variantId: item.variant?.id || '',
            },
            quantity: item.quantity,
          };
        });

        return {
          id: order.id,
          orderNumber: `#${order.orderNumber}`,
          customerName: `${customerData.firstName} ${customerData.lastName}`,
          customerEmail: customerData.email,
          customerPhone: customerData.phone || '',
          customerAddress: '', // Shopify doesn't return address in order list
          city: '',
          items: lineItems,
          subtotal: parseFloat(order.totalPrice.amount),
          deliveryCharge: 0, // Not available in Shopify order
          total: parseFloat(order.totalPrice.amount),
          paymentMethod: 'cod', // Default
          status: this.mapShopifyStatus(order.financialStatus, order.fulfillmentStatus),
          createdAt: order.processedAt,
          shopifyOrderId: order.id,
        };
      });

      console.log(`[Orders] Fetched ${shopifyOrders.length} orders from Shopify`);
      return shopifyOrders;
    } catch (error) {
      console.error('[Orders] Error fetching Shopify orders:', error);
      return [];
    }
  }

  /**
   * Map Shopify status to our status
   */
  private mapShopifyStatus(financialStatus: string, fulfillmentStatus: string): Order['status'] {
    if (fulfillmentStatus === 'FULFILLED') return 'delivered';
    if (fulfillmentStatus === 'PARTIALLY_FULFILLED' || fulfillmentStatus === 'IN_PROGRESS') return 'in-transit';
    if (financialStatus === 'PAID' || financialStatus === 'PARTIALLY_PAID') return 'processing';
    return 'pending';
  }

  /**
   * Get all orders for current user from Shopify.
   */
  async getUserOrders(): Promise<Order[]> {
    const user = authService.getCurrentUser();
    if (!user) return [];

    const orders = await this.fetchShopifyOrders();
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    this.orders = orders;
    this.notifyListeners();
    return orders;
  }

  /**
   * Get order by order number
   */
  getOrderByNumber(orderNumber: string): Order | null {
    return this.orders.find(order => order.orderNumber === orderNumber) || null;
  }

  /**
   * Fetch tracking data from server API
   */
  async fetchTrackingData(orderId?: string): Promise<any[]> {
    try {
      const url = new URL('https://app.albizco.com/end_points/get_tracking.php');
      url.searchParams.set('comapny_type', 'Alclean');
      if (orderId) {
        url.searchParams.set('order_id', orderId.replace(/^#/, ''));
      }

      const response = await fetch(url.toString());
      const data = await response.json();
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.data)) return data.data;
      if (data && typeof data === 'object') return [data];
      return data;
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      return [];
    }
  }

  /**
   * Update order with tracking information
   */
  async updateOrderTracking(orderNumber: string, trackingNumber: string, courier: string) {
    const order = this.getOrderByNumber(orderNumber);
    if (order) {
      const previousStatus = order.status;
      order.trackingNumber = trackingNumber;
      order.courier = courier;
      order.status = 'in-transit';
      this.saveOrders();

      // Notifications are handled by backend
    }
  }

  /**
   * Sync orders with tracking API
   */
  async syncTrackingData() {
    const user = authService.getCurrentUser();

    if (!user) return;

    // Match orders with tracking data by phone number
    const userPhone = user.phone?.replace(/\D/g, '');
    const userOrders = this.orders.filter(order => order.customerEmail === user.email);
    const trackingData = (
      await Promise.all(
        userOrders.map(order => this.fetchTrackingData(order.orderNumber)),
      )
    ).flat();

    trackingData.forEach((tracking: any) => {
      const trackingPhone = tracking.phone?.replace(/\D/g, '');

      if (trackingPhone === userPhone) {
        const order = this.orders.find(o => o.orderNumber === tracking.order_id);
        if (order) {
          const previousStatus = order.status;
          const previousTracking = order.trackingNumber;

          order.trackingNumber = tracking.tracking_number;
          order.courier = tracking.courier;

          // Update status based on tracking
          if (tracking.status?.toLowerCase().includes('delivered')) {
            order.status = 'delivered';

            // Notifications handled by backend
          } else if (tracking.tracking_number && previousTracking !== tracking.tracking_number) {
            order.status = 'in-transit';
            // Notifications handled by backend
          }

        }
      }
    });

    this.saveOrders();
  }

  /**
   * Get tracking details for an order
   */
  async getTrackingDetails(orderNumber: string): Promise<any> {
    const order = this.getOrderByNumber(orderNumber);
    if (!order || !order.trackingNumber) {
      return null;
    }

    // Fetch real-time tracking from courier APIs
    // This would integrate with Daewoo/PostEx APIs
    return {
      orderNumber: order.orderNumber,
      trackingNumber: order.trackingNumber,
      courier: order.courier,
      status: order.status,
      // Add more tracking details from courier API
    };
  }
}

export const orderService = new OrderService();
