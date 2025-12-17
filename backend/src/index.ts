import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import notificationRoutes from './routes/notifications';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

<<<<<<< HEAD
// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000' , "http://localhost:5173"];
=======
// Middleware
>>>>>>> de0de505e4014953e8f2ba505d9abc568a55f9ac
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      notifications: {
        configured: !!process.env.FIREBASE_SERVER_KEY,
      },
    },
    info: 'Storefront API is used directly from frontend - no admin API needed',
  });
});

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
app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 AlClean Backend Server`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔔 Firebase: ${process.env.FIREBASE_SERVER_KEY ? 'Configured' : 'Not configured'}`);
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
