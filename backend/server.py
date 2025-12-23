from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
import httpx
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AlClean Notification API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# FCM Configuration
FCM_SERVER_KEY = os.getenv("FCM_SERVER_KEY", "")
FCM_API_URL = "https://fcm.googleapis.com/fcm/send"

# In-memory storage for device tokens
device_tokens: Dict[str, Dict[str, Any]] = {}


class DeviceRegistration(BaseModel):
    token: str
    platform: Optional[str] = "android"
    timestamp: Optional[str] = None
    userId: Optional[str] = None


class NotificationPayload(BaseModel):
    title: str
    body: str
    type: Optional[str] = "general"
    data: Optional[Dict[str, str]] = None
    imageUrl: Optional[str] = None
    userId: Optional[str] = None


class TokenNotificationPayload(BaseModel):
    token: str
    title: str
    body: str
    type: Optional[str] = "general"
    data: Optional[Dict[str, str]] = None
    imageUrl: Optional[str] = None


async def send_fcm_notification(
    tokens: List[str],
    title: str,
    body: str,
    data: Optional[Dict[str, str]] = None,
    image_url: Optional[str] = None
) -> Dict[str, int]:
    """Send FCM notification to multiple tokens"""
    
    if not FCM_SERVER_KEY:
        print("[FCM] Server key not configured")
        return {"success": 0, "failure": len(tokens)}
    
    success_count = 0
    failure_count = 0
    
    async with httpx.AsyncClient() as client:
        for token in tokens:
            try:
                payload = {
                    "to": token,
                    "notification": {
                        "title": title,
                        "body": body,
                        "icon": "/logo.png",
                    },
                    "data": data or {},
                    "priority": "high",
                }
                
                if image_url:
                    payload["notification"]["image"] = image_url
                
                response = await client.post(
                    FCM_API_URL,
                    json=payload,
                    headers={
                        "Authorization": f"key={FCM_SERVER_KEY}",
                        "Content-Type": "application/json",
                    },
                    timeout=30.0
                )
                
                result = response.json()
                
                if result.get("success") == 1:
                    success_count += 1
                    print(f"[FCM] Sent to {token[:30]}...")
                else:
                    failure_count += 1
                    print(f"[FCM] Failed for {token[:30]}...: {result}")
                    
                    # Remove invalid tokens
                    if result.get("results", [{}])[0].get("error") in ["NotRegistered", "InvalidRegistration"]:
                        device_tokens.pop(token, None)
                        print(f"[FCM] Removed invalid token: {token[:30]}...")
                        
            except Exception as e:
                failure_count += 1
                print(f"[FCM] Error sending to {token[:30]}...: {e}")
    
    return {"success": success_count, "failure": failure_count}


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "notifications": {
                "configured": bool(FCM_SERVER_KEY),
                "registered_devices": len(device_tokens),
            }
        }
    }


@app.post("/api/notifications/register")
async def register_device(data: DeviceRegistration):
    """Register a device for push notifications"""
    
    device_tokens[data.token] = {
        "token": data.token,
        "platform": data.platform,
        "registeredAt": data.timestamp or datetime.utcnow().isoformat(),
        "lastActive": datetime.utcnow().isoformat(),
        "userId": data.userId,
    }
    
    print(f"[Notifications] Registered device: {data.platform} - {data.token[:30]}...")
    print(f"[Notifications] Total registered devices: {len(device_tokens)}")
    
    return {
        "success": True,
        "message": "Device registered successfully",
        "deviceCount": len(device_tokens),
    }


@app.post("/api/notifications/send")
async def send_notification(data: NotificationPayload):
    """Send push notification to all registered devices"""
    
    # Get target tokens
    if data.userId:
        tokens = [t for t, d in device_tokens.items() if d.get("userId") == data.userId]
    else:
        tokens = list(device_tokens.keys())
    
    if not tokens:
        return {
            "success": True,
            "message": "No devices registered",
            "sentCount": 0,
        }
    
    print(f"[Notifications] Sending '{data.title}' to {len(tokens)} devices...")
    
    result = await send_fcm_notification(
        tokens,
        data.title,
        data.body,
        {"type": data.type, **(data.data or {})},
        data.imageUrl
    )
    
    print(f"[Notifications] Sent: {result['success']}, Failed: {result['failure']}")
    
    return {
        "success": True,
        "message": f"Notification sent to {result['success']} devices ({result['failure']} failed)",
        "sentCount": result["success"],
        "failedCount": result["failure"],
        "notification": {"title": data.title, "body": data.body, "type": data.type},
    }


@app.post("/api/notifications/send-to-token")
async def send_to_token(data: TokenNotificationPayload):
    """Send push notification to a specific FCM token"""
    
    print(f"[Notifications] Sending to specific token: {data.token[:30]}...")
    
    result = await send_fcm_notification(
        [data.token],
        data.title,
        data.body,
        {"type": data.type, **(data.data or {})},
        data.imageUrl
    )
    
    return {
        "success": result["success"] > 0,
        "message": "Notification sent!" if result["success"] > 0 else "Failed to send notification",
        "result": result,
    }


@app.get("/api/notifications/devices")
async def get_devices():
    """Get list of registered devices"""
    
    devices = [
        {
            "platform": d["platform"],
            "registeredAt": d["registeredAt"],
            "lastActive": d["lastActive"],
            "userId": d.get("userId"),
            "tokenPreview": d["token"][:30] + "...",
        }
        for d in device_tokens.values()
    ]
    
    return {
        "success": True,
        "count": len(devices),
        "devices": devices,
        "fcmConfigured": bool(FCM_SERVER_KEY),
    }


@app.delete("/api/notifications/unregister")
async def unregister_device(token: str):
    """Unregister a device token"""
    
    deleted = device_tokens.pop(token, None) is not None
    
    return {
        "success": True,
        "message": "Device unregistered" if deleted else "Device not found",
    }


@app.get("/api/notifications/status")
async def get_status():
    """Get notification service status"""
    
    platforms = {"android": 0, "ios": 0, "web": 0}
    for d in device_tokens.values():
        platform = d.get("platform", "web")
        if platform in platforms:
            platforms[platform] += 1
    
    return {
        "success": True,
        "status": {
            "fcmConfigured": bool(FCM_SERVER_KEY),
            "registeredDevices": len(device_tokens),
            "platforms": platforms,
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
