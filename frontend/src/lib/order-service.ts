/**
 * Order Service
 * Manages orders and integrates with tracking API and Shopify
 */

import { CartItem } from "./cart";
import { authService } from "./auth";
import { notificationService } from "./notifications";

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
  shopifyOrderId?: string; // Shopify order ID
  shopifyDraftOrderId?: string; // Shopify draft order ID
}

const ORDERS_STORAGE_KEY = 'alclean_orders';

// Shopify configuration - all from environment variables
const SHOPIFY_DOMAIN = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SHOPIFY_STORE_DOMAIN) || '';
const SHOPIFY_ADMIN_TOKEN = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SHOPIFY_ADMIN_API_TOKEN) || '';
const SHOPIFY_API_VERSION = "2025-07";

class OrderService {
  private orders: Order[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadOrders();
  }

  /**
   * Load orders from localStorage
   */
  private loadOrders() {
    try {
      const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (stored) {
        this.orders = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  }

  /**
   * Save orders to localStorage
   */
  private saveOrders() {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(this.orders));
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving orders:', error);
    }
  }

  /**
   * Notify listeners of changes
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Subscribe to order changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Generate order number
   */
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `AC${timestamp.slice(-6)}${random}`;
  }

  /**
   * Create Shopify draft order via backend API
   */
  private async createShopifyDraftOrder(order: Order): Promise<{ draftOrderId: string; orderId?: string } | null> {
    try {
      // Use relative path - Kubernetes ingress routes /api/* to backend
      const endpoint = `/api/shopify/create-order`;
      
      console.log('[Shopify] Creating order via backend:', endpoint);
      console.log('[Shopify] Order data:', {
        orderNumber: order.orderNumber,
        customer: order.customerName,
        items: order.items.length,
        total: order.total
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          customerAddress: order.customerAddress,
          city: order.city,
          items: order.items.map(item => ({
            variantId: item.product.variantId,
            quantity: item.quantity,
            title: item.product.title,
            price: item.product.price,
          })),
          subtotal: order.subtotal,
          deliveryCharge: order.deliveryCharge,
          total: order.total,
          paymentMethod: order.paymentMethod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[Shopify] Backend error:', response.status, errorData);
        throw new Error(errorData.error || `Backend returned ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ [Shopify] Order created successfully:', result);
        return {
          draftOrderId: result.draftOrderId || '',
          orderId: result.orderId || '',
        };
      } else {
        console.error('[Shopify] Backend reported error:', result.error);
        throw new Error(result.error || 'Failed to create order');
      }
    } catch (error) {
      console.error('❌ [Shopify] Error creating draft order:', error);
      
      // Show helpful debugging info
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('🚨 BACKEND CONNECTION ERROR');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('');
        console.error('❌ Cannot connect to backend server');
        console.error(`📍 Endpoint: /api/shopify/create-order`);
        console.error('');
        console.error('📋 TO FIX THIS:');
        console.error('1. Make sure backend server is running on port 8001');
        console.error('2. Verify backend service status');
        console.error('3. Check backend logs for errors');
        console.error('');
        console.error('💡 The order is saved locally and will sync once backend is ready');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
      
      // Don't fail the entire order if Shopify creation fails
      return null;
    }
  }

  /**
   * Complete draft order (now handled by backend)
   */
  private async completeDraftOrder(draftOrderId: string): Promise<{ orderId: string } | null> {
    // Now handled by backend automatically
    return null;
  }

  /**
   * Create new order
   */
  async createOrder(
    cartItems: CartItem[],
    customerInfo: {
      name: string;
      email: string;
      phone: string;
      address: string;
      city: string;
    },
    deliveryCharge: number,
    paymentMethod: 'cod' | 'bank-transfer'
  ): Promise<Order> {
    const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const total = subtotal + deliveryCharge;

    const order: Order = {
      id: Date.now().toString(),
      orderNumber: this.generateOrderNumber(),
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
      customerAddress: customerInfo.address,
      city: customerInfo.city,
      items: cartItems,
      subtotal,
      deliveryCharge,
      total,
      paymentMethod,
      status: 'pending',
      createdAt: new Date().toISOString(),
      companyType: 'alclean',
    };

    // Create order in Shopify
    const shopifyResult = await this.createShopifyDraftOrder(order);
    if (shopifyResult) {
      order.shopifyDraftOrderId = shopifyResult.draftOrderId;
      if (shopifyResult.orderId) {
        order.shopifyOrderId = shopifyResult.orderId;
        order.status = 'processing';
      }
      console.log('[Order] Created in Shopify:', shopifyResult);
    } else {
      console.warn('[Order] Failed to create in Shopify, order saved locally only');
    }

    this.orders.unshift(order);
    this.saveOrders();

    // Send push notification
    await notificationService.sendNotification({
      title: 'Order Placed Successfully! 🎉',
      body: `Your order ${order.orderNumber} has been placed. Total: Rs.${total.toLocaleString()}`,
      type: 'order_update',
      data: { orderId: order.orderNumber },
      targetAudience: 'specific',
    });

    return order;
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
   * Get all orders for current user (combines local and Shopify)
   */
  async getUserOrders(): Promise<Order[]> {
    const user = authService.getCurrentUser();
    if (!user) return [];

    // Get local orders
    const localOrders = this.orders.filter(order => order.customerEmail === user.email);

    // Fetch Shopify orders
    const shopifyOrders = await this.fetchShopifyOrders();

    // Combine and deduplicate (prefer Shopify orders)
    const allOrders = [...shopifyOrders, ...localOrders];
    const uniqueOrders = allOrders.filter((order, index, self) =>
      index === self.findIndex(o => o.orderNumber === order.orderNumber)
    );

    // Sort by date (newest first)
    uniqueOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return uniqueOrders;
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
  async fetchTrackingData(): Promise<any[]> {
    try {
      const response = await fetch('https://app.albizco.com/end_points/get_tracking.php');
      const data = await response.json();
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

      // Send notification if status changed
      if (previousStatus !== 'in-transit') {
        await notificationService.sendNotification({
          title: 'Order Shipped! 📦',
          body: `Your order ${orderNumber} is now in transit via ${courier}. Tracking #: ${trackingNumber}`,
          type: 'delivery',
          data: { orderId: orderNumber, trackingNumber, courier },
          targetAudience: 'specific',
        });
      }
    }
  }

  /**
   * Sync orders with tracking API
   */
  async syncTrackingData() {
    const trackingData = await this.fetchTrackingData();
    const user = authService.getCurrentUser();
    
    if (!user) return;

    // Match orders with tracking data by phone number
    const userPhone = user.phone?.replace(/\D/g, '');
    
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
            
            // Send delivery notification
            if (previousStatus !== 'delivered') {
              notificationService.sendNotification({
                title: 'Order Delivered! ✅',
                body: `Your order ${order.orderNumber} has been delivered. Thank you for shopping with AlClean!`,
                type: 'delivery',
                data: { orderId: order.orderNumber },
                targetAudience: 'specific',
              });
            }
          } else if (tracking.tracking_number && previousTracking !== tracking.tracking_number) {
            order.status = 'in-transit';
            
            // Send tracking notification
            notificationService.sendNotification({
              title: 'Order Shipped! 📦',
              body: `Your order ${order.orderNumber} is now in transit via ${tracking.courier}.`,
              type: 'delivery',
              data: { orderId: order.orderNumber, trackingNumber: tracking.tracking_number },
              targetAudience: 'specific',
            });
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