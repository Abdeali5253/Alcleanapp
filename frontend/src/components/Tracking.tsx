import { Package, MapPin, Clock, Truck, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { authService } from "../lib/auth";
import { orderService, Order } from "../lib/order-service";
import { UnifiedHeader } from "./UnifiedHeader";

export function Tracking() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    if (!authService.isLoggedIn()) {
      setIsLoading(false);
      return;
    }

    try {
      const userOrders = await orderService.getUserOrders();
      setOrders(userOrders);
    } catch (error) {
      console.error('[Tracking] Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await orderService.syncTrackingData();
      loadOrders();
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in-transit':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-transit':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!authService.isLoggedIn()) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <UnifiedHeader />
        <div className="flex items-center justify-center px-4 pt-20">
          <div className="max-w-md w-full text-center bg-white rounded-2xl p-8 border border-gray-200">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-gray-900 text-xl mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">
              Please login to track your orders
            </p>
            <Button
              onClick={() => navigate("/account")}
              className="w-full bg-[#6DB33F] hover:bg-[#5da035]"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <UnifiedHeader />
        <div className="flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6DB33F] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <UnifiedHeader />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-gray-900 text-2xl">Track Your Orders</h1>
          <Button
            onClick={handleSync}
            disabled={isSyncing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-gray-900 text-xl mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-6">
              You haven't placed any orders. Start shopping to see your orders here.
            </p>
            <Button
              onClick={() => navigate("/products")}
              className="bg-[#6DB33F] hover:bg-[#5da035]"
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow"
              >
                {/* Order Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-900 font-mono">#{order.orderNumber}</span>
                      <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                        {order.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">Ordered on {formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900">Rs.{order.total.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{order.items.length} items</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <div className="space-y-2">
                    {order.items.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <img
                          src={item.product.image}
                          alt={item.product.title}
                          className="w-12 h-12 object-cover rounded-lg bg-gray-100"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{item.product.title}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm text-gray-900">Rs.{(item.product.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-xs text-gray-500 pl-15">
                        +{order.items.length - 2} more items
                      </p>
                    )}
                  </div>
                </div>

                {/* Tracking Info */}
                {order.trackingNumber && order.courier && (
                  <div className="border-t border-gray-200 pt-4 bg-blue-50 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <Truck className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 mb-1">
                          <span className="font-medium">Courier:</span> {order.courier}
                        </p>
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">Tracking #:</span> {order.trackingNumber}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delivery Info */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 mb-1">{order.customerName}</p>
                      <p className="text-sm text-gray-600">{order.customerAddress}</p>
                      <p className="text-sm text-gray-600">{order.city}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Bank Transfer'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-6 bg-gradient-to-r from-[#6DB33F]/10 to-blue-50 rounded-xl p-6 border border-[#6DB33F]/20">
          <h3 className="text-gray-900 mb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#6DB33F]" />
            Tracking Updates
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-[#6DB33F] mt-0.5">✓</span>
              <span>You'll receive real-time push notifications for order updates</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#6DB33F] mt-0.5">✓</span>
              <span>Notifications when your order is confirmed, shipped, and delivered</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#6DB33F] mt-0.5">✓</span>
              <span>1-2 days delivery for Karachi, Lahore, Islamabad, and Rawalpindi</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#6DB33F] mt-0.5">✓</span>
              <span>4-5 days delivery for other cities</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}