#!/bin/bash

# AlClean Backend Deployment Script for AWS EC2
# This script sets up and deploys the Node.js backend on an EC2 instance

echo "=========================================="
echo "AlClean Backend EC2 Deployment"
echo "=========================================="

# Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x LTS
echo "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"

# Install PM2 for process management
echo "Installing PM2..."
sudo npm install -g pm2

# Create app directory
echo "Creating app directory..."
sudo mkdir -p /var/www/alclean-backend
sudo chown -R $USER:$USER /var/www/alclean-backend

# Clone or copy the backend code
echo "Setting up backend code..."
cd /var/www/alclean-backend

# Copy backend files (you'll need to upload these)
# For now, create placeholder structure
mkdir -p src/routes

echo "Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "alclean-backend",
  "version": "1.0.0",
  "description": "AlClean Backend API Server",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.0",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2"
  }
}
EOF

echo "Installing dependencies..."
npm install

# Create .env file template
echo "Creating .env template..."
cat > .env << 'EOF'
# AlClean Backend Environment Variables
PORT=3001
NODE_ENV=production

# Firebase Cloud Messaging (for push notifications)
FCM_SERVER_KEY=your_fcm_server_key_here

# Shopify Admin API (optional - for order management)
SHOPIFY_ADMIN_API_TOKEN=your_shopify_admin_token_here
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
EOF

echo ""
echo "=========================================="
echo "IMPORTANT: Update /var/www/alclean-backend/.env"
echo "with your actual FCM_SERVER_KEY"
echo "=========================================="

# Setup PM2 ecosystem file
echo "Creating PM2 ecosystem file..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'alclean-backend',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
EOF

# Setup firewall
echo "Configuring firewall..."
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 3001/tcp    # Backend API
sudo ufw allow 80/tcp      # HTTP (for future nginx)
sudo ufw allow 443/tcp     # HTTPS (for future nginx)
echo "y" | sudo ufw enable

echo ""
echo "=========================================="
echo "Deployment setup complete!"
echo ""
echo "Next steps:"
echo "1. Upload your backend source code to /var/www/alclean-backend/src/"
echo "2. Update /var/www/alclean-backend/.env with your FCM_SERVER_KEY"
echo "3. Build: cd /var/www/alclean-backend && npm run build"
echo "4. Start: pm2 start ecosystem.config.js"
echo "5. Save PM2 config: pm2 save"
echo "6. Setup startup: pm2 startup"
echo "=========================================="
