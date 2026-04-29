import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PalmOps API',
      version: '1.0.0',
      description: 'API documentation for PalmOps (Palm Oil Purchasing System) Backend',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'Dashboard', description: 'Dashboard summary and statistics' },
      { name: 'Branches', description: 'Branch management' },
      { name: 'Stocks', description: 'Inventory and stock movement history' },
      { name: 'Sales', description: 'Palm oil sale management' },
      { name: 'Expenses', description: 'Branch expense management' },
      { name: 'Farmers', description: 'Farmer management' },
      { name: 'Vehicles', description: 'Vehicle management' },
      { name: 'Prices', description: 'Daily price management' },
      { name: 'WeighTickets', description: 'Weighing operations and ticket management' },
      { name: 'Auth', description: 'Authentication operations' },
      { name: 'MasterData', description: 'Master data management' }
    ]
  },

  apis: [
    './src/routes/*.ts',
    './src/routes/*.js',
    './src/index.ts'
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
console.log(`!!! Swagger checking paths: ${JSON.stringify(options.apis)} !!!`);
console.log(`!!! Swagger loaded with ${Object.keys((swaggerSpec as any).paths || {}).length} paths !!!`);
