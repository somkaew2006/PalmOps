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
  },
  apis: [
    path.join(process.cwd(), 'src/routes/*.ts').replace(/\\/g, '/'),
  ],
};

const spec = swaggerJSDoc(options);
console.log('Paths found:', Object.keys(spec.paths || {}));
if (Object.keys(spec.paths || {}).length === 0) {
    console.log('No paths found. Checked files:', options.apis);
}
