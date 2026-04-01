import dotenv from 'dotenv';

// Load environment variables before importing route modules.
dotenv.config();

import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth.js';
import cartRoutes from './routes/cart.js';
import notificationRoutes from './routes/notifications.js';
import orderRoutes from './routes/orders.js';
import productRoutes from './routes/products.js';
import shopifyRoutes from './routes/shopify.js';

const app = express();
const port: number = Number(process.env.PORT) || 3001;

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json());

const healthCheck = (_req: express.Request, res: express.Response) => {
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
        storefrontConfigured: !!(
          process.env.SHOPIFY_STORE_DOMAIN &&
          process.env.SHOPIFY_STOREFRONT_TOKEN
        ),
      },
    },
    info: 'Shopify credentials are kept on the backend. Frontend should only call backend /api routes.',
  });
};

app.get('/health', healthCheck);

app.use('/api/notifications', notificationRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shopify', shopifyRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error('[Error]', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  },
);

app.listen(port, '0.0.0.0', () => {
  console.log('--------------------------------');
  console.log('AlClean Backend Server');
  console.log('--------------------------------');
  console.log(`Port: ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(
    `Firebase: ${process.env.FCM_SERVER_KEY ? 'Configured' : 'Not configured'}`,
  );
  console.log('Shopify credentials stay on the backend.');
  console.log('Frontend clients should only call backend /api routes.');
  console.log('');
  console.log('Available routes:');
  console.log('  GET  /health');
  console.log('  POST /api/notifications/register');
  console.log('  POST /api/notifications/send');
  console.log('  GET  /api/notifications/devices');
  console.log('  GET  /api/products');
  console.log('  GET  /api/products/:id');
  console.log('  GET  /api/products/collection/:handle');
  console.log('--------------------------------');
});

export default app;
