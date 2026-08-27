const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'express-aug-2026 API',
      version: '1.0.0',
      description: 'API documentation for the express-aug-2026 boilerplate',
    },
    servers: [
      {
        url: process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`,
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
    tags: [
      { name: 'Health', description: 'Health check' },
      { name: 'Web Auth', description: 'Web-facing authentication endpoints' },
      { name: 'Web Media', description: 'Web-facing media endpoints' },
      { name: 'CMS Auth', description: 'CMS authentication endpoints' },
      { name: 'CMS Media', description: 'CMS media endpoints' },
    ],
  },
  apis: ['./src/routes/**/*.js'],
};

module.exports = swaggerJsdoc(options);
