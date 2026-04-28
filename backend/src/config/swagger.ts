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
  },
  apis: [
    path.join(__dirname, '../routes/*.ts').replace(/\\/g, '/'),
    path.join(__dirname, '../routes/*.js').replace(/\\/g, '/'),
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
console.log(`!!! Swagger checking paths: ${JSON.stringify(options.apis)} !!!`);
console.log(`!!! Swagger loaded with ${Object.keys((swaggerSpec as any).paths || {}).length} paths !!!`);
