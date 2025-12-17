from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AlClean eCommerce API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shopify configuration
SHOPIFY_STORE_DOMAIN = os.getenv("SHOPIFY_STORE_DOMAIN", "alclean-pk.myshopify.com")
SHOPIFY_ADMIN_TOKEN = os.getenv("SHOPIFY_ADMIN_API_TOKEN")
SHOPIFY_API_VERSION = os.getenv("SHOPIFY_API_VERSION", "2025-07")

# In-memory storage for device tokens
device_tokens: Dict[str, Dict[str, Any]] = {}

# Pydantic models
class DeviceRegister(BaseModel):
    token: str
    platform: str = "web"
    timestamp: Optional[str] = None

class NotificationSend(BaseModel):
    title: str
    body: str
    type: str = "general"
    data: Optional[Dict[str, Any]] = None
    imageUrl: Optional[str] = None

class DeviceUnregister(BaseModel):
    token: str

class OrderItem(BaseModel):
    variantId: str
    quantity: int
    title: str
    price: float

class CreateOrderRequest(BaseModel):
    orderNumber: str
    customerName: str
    customerEmail: str
    customerPhone: str
    customerAddress: str
    city: str
    items: List[OrderItem]
    subtotal: float
    deliveryCharge: float
    total: float
    paymentMethod: str

# Helper to make Shopify Admin API calls
async def shopify_admin_graphql(query: str, variables: dict = None):
    if not SHOPIFY_ADMIN_TOKEN:
        raise HTTPException(status_code=500, detail="Shopify Admin API not configured")
    
    url = f"https://{SHOPIFY_STORE_DOMAIN}/admin/api/{SHOPIFY_API_VERSION}/graphql.json"
    headers = {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN,
    }
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers, timeout=30.0)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=f"Shopify API error: {response.text}")
        return response.json()

# Health check
@app.get("/api/health")
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "environment": os.getenv("NODE_ENV", "development"),
        "services": {
            "notifications": {
                "configured": bool(os.getenv("FIREBASE_API_KEY")),
            },
            "shopify": {
                "configured": bool(SHOPIFY_ADMIN_TOKEN),
            },
        },
        "info": "Storefront API is used directly from frontend - Admin API for order creation",
    }

# ==================== NOTIFICATIONS ====================

@app.post("/api/notifications/register")
async def register_device(data: DeviceRegister):
    """Register a device FCM token for push notifications"""
    if not data.token:
        raise HTTPException(status_code=400, detail="FCM token is required")
    
    device_info = {
        "token": data.token,
        "platform": data.platform,
        "registeredAt": data.timestamp or datetime.now().isoformat(),
        "lastActive": datetime.now().isoformat(),
    }
    
    device_tokens[data.token] = device_info
    
    print(f"[Notifications] Registered device: {data.platform} - {data.token[:20]}...")
    print(f"[Notifications] Total registered devices: {len(device_tokens)}")
    
    return {
        "success": True,
        "message": "Device registered successfully",
        "deviceCount": len(device_tokens),
    }

@app.post("/api/notifications/send")
async def send_notification(data: NotificationSend):
    """Send push notification to all registered devices"""
    if not data.title or not data.body:
        raise HTTPException(status_code=400, detail="Title and body are required")
    
    tokens = list(device_tokens.keys())
    
    if len(tokens) == 0:
        return {
            "success": True,
            "message": "No devices registered",
            "sentCount": 0,
        }
    
    print(f"[Notifications] Sending notification to {len(tokens)} devices:")
    print(f"  Title: {data.title}")
    print(f"  Body: {data.body}")
    print(f"  Type: {data.type}")
    
    # TODO: Implement actual FCM sending with Firebase Admin SDK
    
    return {
        "success": True,
        "message": f"Notification queued for {len(tokens)} devices",
        "sentCount": len(tokens),
        "notification": {"title": data.title, "body": data.body, "type": data.type},
    }

@app.get("/api/notifications/devices")
async def get_devices():
    """Get list of registered devices"""
    devices = [
        {
            "platform": d["platform"],
            "registeredAt": d["registeredAt"],
            "lastActive": d["lastActive"],
            "tokenPreview": d["token"][:20] + "...",
        }
        for d in device_tokens.values()
    ]
    
    return {
        "success": True,
        "count": len(devices),
        "devices": devices,
    }

@app.delete("/api/notifications/unregister")
async def unregister_device(data: DeviceUnregister):
    """Unregister a device token"""
    if not data.token:
        raise HTTPException(status_code=400, detail="Token is required")
    
    deleted = device_tokens.pop(data.token, None) is not None
    
    return {
        "success": True,
        "message": "Device unregistered" if deleted else "Device not found",
    }

# ==================== SHOPIFY ORDERS ====================

@app.post("/api/shopify/create-order")
async def create_shopify_order(order_data: CreateOrderRequest):
    """Create a draft order in Shopify and complete it"""
    try:
        # Prepare line items
        line_items = [
            {"variantId": item.variantId, "quantity": item.quantity}
            for item in order_data.items
        ]
        
        name_parts = order_data.customerName.split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        
        # Create draft order mutation
        mutation = """
        mutation draftOrderCreate($input: DraftOrderInput!) {
          draftOrderCreate(input: $input) {
            draftOrder {
              id
              name
              totalPrice
              status
              legacyResourceId
            }
            userErrors {
              field
              message
            }
          }
        }
        """
        
        variables = {
            "input": {
                "lineItems": line_items,
                "email": order_data.customerEmail,
                "phone": order_data.customerPhone,
                "shippingAddress": {
                    "firstName": first_name,
                    "lastName": last_name,
                    "address1": order_data.customerAddress,
                    "city": order_data.city,
                    "country": "Pakistan",
                    "countryCode": "PK",
                    "phone": order_data.customerPhone,
                },
                "billingAddress": {
                    "firstName": first_name,
                    "lastName": last_name,
                    "address1": order_data.customerAddress,
                    "city": order_data.city,
                    "country": "Pakistan",
                    "countryCode": "PK",
                    "phone": order_data.customerPhone,
                },
                "shippingLine": {
                    "title": f"Delivery to {order_data.city}",
                    "price": str(order_data.deliveryCharge),
                },
                "note": f"AlClean App Order - {order_data.orderNumber}\nPayment Method: {'Cash on Delivery' if order_data.paymentMethod == 'cod' else 'Bank Transfer'}",
                "tags": ["alclean-app", order_data.paymentMethod],
            }
        }
        
        print(f"[Shopify] Creating order: {order_data.orderNumber}")
        result = await shopify_admin_graphql(mutation, variables)
        
        if result.get("data", {}).get("draftOrderCreate", {}).get("userErrors"):
            errors = result["data"]["draftOrderCreate"]["userErrors"]
            if errors:
                error_msgs = [e["message"] for e in errors]
                raise HTTPException(status_code=400, detail=f"Shopify errors: {', '.join(error_msgs)}")
        
        draft_order = result.get("data", {}).get("draftOrderCreate", {}).get("draftOrder")
        if not draft_order:
            raise HTTPException(status_code=500, detail="Failed to create draft order")
        
        print(f"[Shopify] Draft order created: {draft_order['id']}")
        
        # Try to complete the draft order
        order = None
        try:
            complete_mutation = """
            mutation draftOrderComplete($id: ID!) {
              draftOrderComplete(id: $id) {
                draftOrder {
                  id
                  order {
                    id
                    name
                    legacyResourceId
                  }
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """
            complete_result = await shopify_admin_graphql(complete_mutation, {"id": draft_order["id"]})
            order = complete_result.get("data", {}).get("draftOrderComplete", {}).get("draftOrder", {}).get("order")
            if order:
                print(f"[Shopify] Order completed: {order['id']}")
        except Exception as e:
            print(f"[Shopify] Failed to complete draft order: {e}")
        
        return {
            "success": True,
            "draftOrderId": draft_order["id"],
            "orderId": order["id"] if order else None,
            "orderName": order["name"] if order else draft_order["name"],
            "message": "Order created successfully in Shopify",
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Shopify] Error creating order: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
