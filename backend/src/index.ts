import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import notificationRoutes from './routes/notifications.js';

dotenv.config();

const app = express();
const port: number = Number(process.env.PORT) || 3001;

// CORS configuration - Allow all origins for mobile app development
app.use(cors({
  origin: true,  // Allow all origins (needed for Capacitor mobile apps)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Health check
const healthCheck = (req: any, res: any) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      notifications: {
        configured: !!process.env.FCM_SERVER_KEY,
        fcmKeyPresent: !!process.env.FCM_SERVER_KEY,
      },
      shopify: {
        adminApiConfigured: !!process.env.SHOPIFY_ADMIN_API_TOKEN,
      },
    },
    info: 'Storefront API is used directly from frontend - Admin API for order creation',
  });
};

app.get('/health', healthCheck);

// Routes
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server
app.listen(port, "0.0.0.0", () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 AlClean Backend Server`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📍 Port: ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔔 Firebase: ${process.env.FCM_SERVER_KEY ? 'Configured' : 'Not configured'}`);
  console.log('');
  console.log('📌 Note: Shopify integration uses Storefront API');
  console.log('         directly from the frontend app.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Available routes:');
  console.log('  GET  /health');
  console.log('  POST /api/notifications/register');
  console.log('  POST /api/notifications/send');
  console.log('  GET  /api/notifications/devices');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

export default app;
