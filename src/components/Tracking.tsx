import image_8f03d5c7f7a5ad0420573e04e40e094b85ac1357 from '../assets/header.png';
import { Package, CheckCircle2, Truck, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { authService } from "../lib/auth";
import { toast } from "sonner";

interface Order {
  id: string;
  date: string;
  status: "delivered" | "in-transit" | "processing";
  items: number;
  total: number;
  trackingSteps: {
    label: string;
    date: string;
    completed: boolean;
  }[];
}

const mockOrders: Order[] = [
  {
    id: "ORD-2024-001",
    date: "Nov 5, 2025",
    status: "in-transit",
    items: 3,
    total: 4497,
    trackingSteps: [
      { label: "Order Placed", date: "Nov 5, 10:30 AM", completed: true },
      { label: "Processing", date: "Nov 5, 2:15 PM", completed: true },
      { label: "Shipped", date: "Nov 6, 9:00 AM", completed: true },
      { label: "Out for Delivery", date: "Expected Nov 7", completed: false },
      { label: "Delivered", date: "Pending", completed: false }
    ]
  },
  {
    id: "ORD-2024-002",
    date: "Oct 28, 2025",
    status: "delivered",
    items: 2,
    total: 3198,
    trackingSteps: [
      { label: "Order Placed", date: "Oct 28, 3:20 PM", completed: true },
      { label: "Processing", date: "Oct 28, 5:45 PM", completed: true },
      { label: "Shipped", date: "Oct 29, 8:30 AM", completed: true },
      { label: "Out for Delivery", date: "Oct 30, 7:00 AM", completed: true },
      { label: "Delivered", date: "Oct 30, 2:15 PM", completed: true }
    ]
  }
];

export function Tracking() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is logged in on component mount
  useEffect(() => {
    const checkAuth = async () => {
      if (!authService.isLoggedIn()) {
        toast.error("Please login to view your orders");
        authService.setRedirectAfterLogin("/tracking");
        navigate("/account", { replace: true });
      } else {
        setIsCheckingAuth(false);
        // Try to fetch real Shopify orders
        await loadOrders();
      }
    };
    
    checkAuth();
  }, [navigate]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      // Try to get Shopify orders
      const shopifyOrders = await authService.getCustomerOrders();
      
      if (shopifyOrders && shopifyOrders.length > 0) {
        // Convert Shopify orders to our format
        const convertedOrders = shopifyOrders.map(order => ({
          id: order.name || order.orderNumber?.toString(),
          date: new Date(order.processedAt).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }),
          status: order.fulfillmentStatus === 'FULFILLED' ? 'delivered' as const 
                 : order.fulfillmentStatus === 'IN_TRANSIT' ? 'in-transit' as const 
                 : 'processing' as const,
          items: order.lineItems.edges.length,
          total: parseFloat(order.totalPrice.amount),
          trackingSteps: generateTrackingSteps(order)
        }));
        
        setOrders(convertedOrders);
      } else {
        // Use mock orders
        setOrders(mockOrders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      // Fall back to mock orders
      setOrders(mockOrders);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTrackingSteps = (order: any) => {
    const processedDate = new Date(order.processedAt);
    const isDelivered = order.fulfillmentStatus === 'FULFILLED';
    
    return [
      { 
        label: "Order Placed", 
        date: processedDate.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: 'numeric', 
          minute: '2-digit' 
        }), 
        completed: true 
      },
      { 
        label: "Processing", 
        date: new Date(processedDate.getTime() + 2*60*60*1000).toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: 'numeric', 
          minute: '2-digit' 
        }), 
        completed: true 
      },
      { 
        label: "Shipped", 
        date: isDelivered ? new Date(processedDate.getTime() + 24*60*60*1000).toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: 'numeric', 
          minute: '2-digit' 
        }) : "Pending", 
        completed: isDelivered 
      },
      { 
        label: "Out for Delivery", 
        date: isDelivered ? new Date(processedDate.getTime() + 48*60*60*1000).toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: 'numeric', 
          minute: '2-digit' 
        }) : "Pending", 
        completed: isDelivered 
      },
      { 
        label: "Delivered", 
        date: isDelivered ? new Date(processedDate.getTime() + 48*60*60*1000).toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: 'numeric', 
          minute: '2-digit' 
        }) : "Pending", 
        completed: isDelivered 
      }
    ];
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-center">
          <Link to="/">
            <img src={image_8f03d5c7f7a5ad0420573e04e40e094b85ac1357} alt="AlClean" className="h-10 cursor-pointer" />
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl p-4 border border-gray-200"
            >
              {/* Order Header */}
              <div className="flex items-start justify-between mb-4 pb-4 border-b">
                <div>
                  <h3 className="text-gray-900 mb-1">Order {order.id}</h3>
                  <p className="text-gray-500 text-sm">{order.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-900">Rs.{order.total.toLocaleString()}</p>
                  <p className="text-gray-500 text-sm">{order.items} items</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                {order.status === "delivered" && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700">
                    <CheckCircle2 size={16} />
                    <span className="text-sm">Delivered</span>
                  </div>
                )}
                {order.status === "in-transit" && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                    <Truck size={16} />
                    <span className="text-sm">In Transit</span>
                  </div>
                )}
                {order.status === "processing" && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                    <Package size={16} />
                    <span className="text-sm">Processing</span>
                  </div>
                )}
              </div>

              {/* Tracking Steps */}
              <div className="space-y-3">
                {order.trackingSteps.map((step, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          step.completed
                            ? "bg-[#6DB33F] text-white"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        {step.completed ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-current" />
                        )}
                      </div>
                      {index < order.trackingSteps.length - 1 && (
                        <div
                          className={`w-0.5 h-8 ${
                            step.completed ? "bg-[#6DB33F]" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <p
                        className={
                          step.completed ? "text-gray-900" : "text-gray-400"
                        }
                      >
                        {step.label}
                      </p>
                      <p className="text-gray-500 text-sm">{step.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}