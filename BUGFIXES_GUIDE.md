# AlClean App - Bug Fixes & Configuration Guide

## 🔴 CRITICAL FIX 1: FCM Server Key Missing

Your backend shows `🔔 Firebase: Not configured`. You MUST add the FCM Server Key.

### Step 1: Get FCM Server Key
1. Go to https://console.firebase.google.com
2. Select your AlClean project
3. Click ⚙️ gear icon → **Project Settings**
4. Click **Cloud Messaging** tab
5. Find "Cloud Messaging API (Legacy)" section
6. If disabled, click **Enable Cloud Messaging API (Legacy)**
7. Copy the **Server key** (starts with "AAAA...")

### Step 2: Add to Backend .env
Open `backend/.env` and add:
```
FCM_SERVER_KEY=AAAA_your_server_key_here
```

### Step 3: Restart Backend
```bash
npm run dev:backend
```

Now you should see `🔔 Firebase: Configured` in the console.

---

## 🔴 FIX 2: Remove Notification Prompt Banner

The "Stay Updated" notification banner is annoying. To disable it:

### Option A: Never show the prompt
Open `frontend/src/components/NotificationPrompt.tsx` and replace the entire content with:

```tsx
// Notification prompt disabled for better UX
export function NotificationPrompt() {
  return null;
}
```

### Option B: Auto-enable notifications silently (recommended)
Open `frontend/src/lib/notifications.ts` and in the `initialize()` method, after initialization completes, add auto-registration for native platforms.

---

## 🔴 FIX 3: Equipment Showing in Cleaning Chemicals

The filtering needs to be stricter. Update `frontend/src/components/Home.tsx`:

### Find this code (around line 102-127):
```tsx
// Get products for each section
const offers = getProductsInCollections(['supreme-offer']);
const fabric = getProductsInCollections(['fabric-washing']);
const mopBuckets = getProductsInCollections(['home-page-mop-buckets', 'mop-buckets']);
const chemicals = getProductsInCollections(['top-cleaning-chemicals', 'industrial-cleaning-chemicals', 'cleaning-chemicals']);
```

### Replace with:
```tsx
// EQUIPMENT KEYWORDS - Products with these in title are NOT chemicals
const EQUIPMENT_KEYWORDS = [
  'bucket', 'mop', 'wringer', 'trolley', 'cart', 'dustbin', 'bin',
  'brush', 'broom', 'scrubber', 'sponge', 'cloth', 'towel', 'wiper',
  'glove', 'dispenser', 'tissue', 'machine', 'vacuum', 'polish',
  'squeegee', 'duster', 'holder', 'stand', 'rack', 'caddy',
  'tool', 'equipment', 'robot', 'viper', 'vipers', 'dryer', 'rods',
  'cleaning pad', 'hand dryer', 'aluminum rod', 'aluminium rod',
  'aluminum', 'aluminium', 'telescopic pole', 'cleaning pole', 'pole',
  'pad', 'floor pad', 'cleaning pads'
];

// Helper function to check if product is equipment
const isEquipment = (product: Product) => {
  const title = product.title.toLowerCase();
  return EQUIPMENT_KEYWORDS.some(keyword => title.includes(keyword.toLowerCase()));
};

// Get products for each section
const offers = getProductsInCollections(['supreme-offer']);
const fabric = getProductsInCollections(['fabric-washing']);
const mopBuckets = getProductsInCollections(['home-page-mop-buckets', 'mop-buckets']);

// Get cleaning chemicals but EXCLUDE equipment products
const chemicalsRaw = getProductsInCollections(['top-cleaning-chemicals', 'industrial-cleaning-chemicals', 'cleaning-chemicals']);
const chemicals = chemicalsRaw.filter(product => !isEquipment(product));

console.log('[Home] Loaded from collections:', {
  supremeOffers: offers.length,
  fabricWashing: fabric.length,
  mopBuckets: mopBuckets.length,
  cleaningChemicals: chemicals.length,
  filteredOutEquipment: chemicalsRaw.length - chemicals.length,
});
```

---

## 🔴 FIX 4: EC2 SSH Connection Issues

### Common Causes:
1. **Security Group not allowing SSH (Port 22)**
2. **Wrong SSH key**
3. **Using wrong username**

### Check Security Group:
1. Go to AWS Console → EC2 → Security Groups
2. Find the security group attached to your instance
3. Check **Inbound Rules**:
   - Type: SSH
   - Protocol: TCP
   - Port: 22
   - Source: `0.0.0.0/0` (or your IP)

### Correct SSH Command:
```bash
# For Ubuntu AMI:
ssh -i "your-key.pem" ubuntu@44.251.139.38

# For Amazon Linux AMI:
ssh -i "your-key.pem" ec2-user@44.251.139.38
```

### MobaXterm Settings:
1. Session → SSH
2. Remote host: `44.251.139.38`
3. Specify username: `ubuntu` (or `ec2-user`)
4. Advanced SSH settings → Use private key → Select your `.pem` file

### Key Permission (if on WSL/Linux):
```bash
chmod 400 your-key.pem
```

---

## 🔴 FIX 5: Upload Backend to EC2 (After SSH Works)

### Using SCP (from Windows PowerShell):
```powershell
scp -i "your-key.pem" -r .\backend\* ubuntu@44.251.139.38:/home/ubuntu/alclean-backend/
```

### Using FileZilla:
1. Open FileZilla
2. Edit → Settings → SFTP → Add key file (your .pem)
3. Host: `sftp://44.251.139.38`
4. Username: `ubuntu`
5. Port: `22`
6. Drag and drop backend folder

### Using MobaXterm (after connected):
1. Connect via SSH
2. Use the file browser on the left panel
3. Drag and drop files

---

## Quick Checklist

- [ ] Added `FCM_SERVER_KEY` to `backend/.env`
- [ ] Disabled/modified NotificationPrompt component
- [ ] Added equipment filtering in Home.tsx
- [ ] Verified Security Group allows port 22
- [ ] Can SSH to EC2 instance
- [ ] Uploaded backend to EC2
- [ ] Backend running on EC2 with PM2
