import express from 'express'; // reload
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import authRoutes from './routes/authRoutes';
import farmerRoutes from './routes/farmerRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import priceRoutes from './routes/priceRoutes';
import weighRoutes from './routes/weighRoutes';
import branchRoutes from './routes/branchRoutes';
import saleRoutes from './routes/saleRoutes';
import expenseRoutes from './routes/expenseRoutes';
import productRoutes from './routes/productRoutes';
import customerRoutes from './routes/customerRoutes';
import { getDashboardStats } from './controllers/statsController';
import { getReportData } from './controllers/reportController';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import { protect } from './middlewares/authMiddleware';
import { tenantMiddleware } from './middlewares/tenantMiddleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - Host: ${req.hostname}`);
  next();
});

// 🏢 Multi-tenant Middleware (ต้องอยู่ก่อน Routes)
app.use(tenantMiddleware);


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/master-data', productRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/weigh', weighRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

/**
 * @swagger
 * /api/stats/summary:
 *   get:
 *     summary: Get dashboard summary statistics
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: integer
 *         description: Filter by branch ID
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
app.get('/api/stats/summary', protect, getDashboardStats);
app.use('/api/reports', protect, getReportData);


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PalmOps API is running' });
});

app.get('/api/test-log', (req, res) => {
  require('fs').appendFileSync('D:\\A\\Application\\PalmOps\\backend\\request_debug.log', '--- TEST LOG AT ' + new Date().toISOString() + ' ---\n');
  res.json({ message: 'Log written' });
});

// Swagger API Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs-json', (req, res) => res.json(swaggerSpec));
app.get('/api-docs', (req, res) => res.redirect('/docs'));

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/docs`);
});

export default app;
