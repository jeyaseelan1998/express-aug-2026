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
        cmsCookie: {
          type: 'apiKey',
          in: 'cookie',
          name: 'cms_token',
        },
      },
      parameters: {
        PageParam: {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', minimum: 1, default: 1 },
        },
        LimitParam: {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
        ResourceId: {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Mongo ObjectId of the record',
        },
      },
      schemas: {
        PageMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Missing, invalid or expired token',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        WrongScope: {
          description: 'Token is valid but not a CMS session',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        NotFoundError: {
          description: 'Record not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        ValidationFailed: {
          description: 'Request body or query failed validation',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        Conflict: {
          description: 'A record with that unique field already exists',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        RefNotFound: {
          description: 'A referenced document (media, brand, size, ...) does not exist',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Health check' },
      { name: 'Web Auth', description: 'Web-facing authentication endpoints' },
      { name: 'Web Media', description: 'Web-facing media endpoints' },
      { name: 'CMS Auth', description: 'CMS authentication endpoints' },
      { name: 'CMS Media', description: 'CMS media endpoints' },
      { name: 'CMS Product', description: 'CMS product management' },
      { name: 'CMS Brand', description: 'CMS brand management' },
      { name: 'CMS Category', description: 'CMS category management' },
      { name: 'CMS Style', description: 'CMS style management' },
      { name: 'CMS Color', description: 'CMS colour management' },
      { name: 'CMS Promo Code', description: 'CMS promo code management' },
      { name: 'CMS Size', description: 'CMS size management' },
      { name: 'CMS Social', description: 'CMS social link management' },
    ],
  },
  apis: ['./src/routes/**/*.js'],
};

module.exports = swaggerJsdoc(options);
