import dotenv from 'dotenv';

// Load environment variables before importing route modules.
dotenv.config();

import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import cartRoutes from './routes/cart.js';
import notificationRoutes from './routes/notifications.js';
import orderRoutes from './routes/orders.js';
import productRoutes from './routes/products.js';
import { startTrackingNotificationScheduler } from './services/tracking-notifications.js';
import { startNotificationAdminServer } from './notification-admin-server.js';

const app = express();
const port: number = Number(process.env.PORT) || 3001;
// Trust forwarded client addresses only from the configured proxy network.
// The loopback default is safe for Nginx running on the same host and avoids
// accepting spoofed X-Forwarded-* headers on direct network connections.
const trustProxy = process.env.TRUST_PROXY?.trim() || 'loopback';
app.set('trust proxy', trustProxy);
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const isProduction = process.env.NODE_ENV === 'production';
export function validateProductionConfiguration(env: NodeJS.ProcessEnv): void {
  if (!env.ALLOWED_ORIGINS?.split(',').some((origin) => origin.trim())) {
    throw new Error('ALLOWED_ORIGINS is required in production');
  }
  if (!(env.GOOGLE_CLIENT_IDS || env.GOOGLE_CLIENT_ID)) {
    throw new Error('GOOGLE_CLIENT_IDS is required in production');
  }
  if (
    !env.SHOPIFY_STORE_DOMAIN ||
    !env.SHOPIFY_STOREFRONT_TOKEN ||
    !env.SHOPIFY_ADMIN_API_TOKEN
  ) {
    throw new Error('Shopify storefront and Admin credentials are required in production');
  }
  if (
    !env.FIREBASE_PROJECT_ID ||
    !env.FIREBASE_PRIVATE_KEY ||
    !env.FIREBASE_CLIENT_EMAIL
  ) {
    throw new Error('Firebase credentials are required in production');
  }
}
if (isProduction) validateProductionConfiguration(process.env);

const nativeAppOrigins = ['https://localhost', 'capacitor://localhost'];
if (!isProduction) nativeAppOrigins.push('http://localhost');
const trustedOrigins = new Set([...allowedOrigins, ...nativeAppOrigins]);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

app.use(
  cors({
    origin:
      allowedOrigins.length > 0
        ? (origin, callback) => {
            if (!origin || trustedOrigins.has(origin)) {
              callback(null, true);
              return;
            }

            callback(new Error(`Origin not allowed by CORS: ${origin}`));
          }
        : !isProduction,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json({ limit: '32kb' }));

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

app.use(
  ['/api/auth/login', '/api/auth/signup', '/api/auth/recover', '/api/auth/google-login', '/api/auth/renew'],
  authLimiter,
);
app.use('/api/notifications/register', registrationLimiter);

app.use('/api/notifications', notificationRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

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
    const status = Number(err.status || err.statusCode);
    res
      .status(status >= 400 && status < 600 ? status : 500)
      .json({ error: err.message || 'Internal server error' });
  },
);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, '0.0.0.0', () => {
    console.log('--------------------------------');
    console.log('AlClean Backend Server');
    console.log('--------------------------------');
    console.log(`Port: ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Trust proxy: ${trustProxy}`);
    console.log(
      `Firebase: ${process.env.FCM_SERVER_KEY ? 'Configured' : 'Not configured'}`,
    );
    console.log('Shopify credentials stay on the backend.');
    console.log('Frontend clients should only call backend /api routes.');
    console.log('');
    console.log('Available routes:');
    console.log('  GET  /health');
    console.log('  POST /api/notifications/register');
    console.log('  GET  /api/products');
    console.log('  GET  /api/products/:id');
    console.log('  GET  /api/products/collection/:handle');
    console.log('--------------------------------');
    startTrackingNotificationScheduler();
  });
  startNotificationAdminServer();
}

export default app;
