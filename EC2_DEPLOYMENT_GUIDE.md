# AWS EC2 Backend Deployment Guide for AlClean

## Prerequisites
- AWS EC2 instance running (Ubuntu 22.04 recommended)
- Public IP: `44.251.139.38`
- SSH key pair configured
- Security group with ports 22, 3001 open

---

## Step 1: Connect to EC2

```bash
ssh -i your-key.pem ubuntu@44.251.139.38
```

---

## Step 2: Initial Server Setup

Run these commands on your EC2 instance:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node -v  # Should show v20.x.x
npm -v

# Install PM2 for process management
sudo npm install -g pm2

# Install Git
sudo apt install -y git
```

---

## Step 3: Setup Application Directory

```bash
# Create directory
sudo mkdir -p /var/www/alclean-backend
sudo chown -R $USER:$USER /var/www/alclean-backend
cd /var/www/alclean-backend
```

---

## Step 4: Upload Backend Code

**Option A: Clone from GitHub (if your backend is in the repo)**
```bash
git clone https://github.com/Abdeali5253/Alcleanapp.git temp
cp -r temp/backend/* .
rm -rf temp
```

**Option B: Upload via SCP from your local machine**
```bash
# Run this from your LOCAL machine (not EC2)
scp -i your-key.pem -r ./backend/* ubuntu@44.251.139.38:/var/www/alclean-backend/
```

---

## Step 5: Configure Environment

```bash
cd /var/www/alclean-backend

# Create .env file
nano .env
```

Add the following content:
```
PORT=3001
NODE_ENV=production
FCM_SERVER_KEY=your_fcm_server_key_here
```

**To get FCM_SERVER_KEY:**
1. Go to Firebase Console → Project Settings
2. Click "Cloud Messaging" tab
3. Under "Cloud Messaging API (Legacy)", copy the Server Key

---

## Step 6: Install Dependencies & Build

```bash
cd /var/www/alclean-backend

# Install dependencies
npm install

# Build TypeScript (if applicable)
npm run build
```

---

## Step 7: Start the Server with PM2

```bash
# Start the application
pm2 start dist/index.js --name alclean-backend

# OR if using ts-node
pm2 start src/index.ts --interpreter ./node_modules/.bin/ts-node --name alclean-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs
```

---

## Step 8: Configure Security Group (AWS Console)

Make sure your EC2 Security Group allows:
- **Port 22** (SSH) - Your IP only
- **Port 3001** (Backend API) - 0.0.0.0/0 (or specific IPs)

---

## Step 9: Verify Deployment

Test from your local machine:
```bash
curl http://44.251.139.38:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-24T...",
  "services": {
    "notifications": { "configured": true }
  }
}
```

---

## Step 10: Update Your App

After deployment, update the frontend to use the production URL:

**Option A: Set environment variable**
Create `frontend/.env`:
```
VITE_BACKEND_URL=http://44.251.139.38:3001
```

**Option B: Set production flag**
In `frontend/.env`:
```
VITE_USE_PRODUCTION=true
```

Then rebuild your Capacitor app:
```bash
cd frontend
npm run build
npx cap sync android
```

---

## Useful PM2 Commands

```bash
# View logs
pm2 logs alclean-backend

# Restart server
pm2 restart alclean-backend

# Stop server
pm2 stop alclean-backend

# View status
pm2 status
```

---

## Optional: Setup Nginx (for HTTPS/Domain)

If you want to use a domain name and HTTPS:

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/alclean
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/alclean /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Troubleshooting

**Backend not starting?**
```bash
pm2 logs alclean-backend --lines 50
```

**Port already in use?**
```bash
sudo lsof -i :3001
sudo kill -9 <PID>
```

**Firewall blocking?**
```bash
sudo ufw allow 3001/tcp
```
