const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const indexRouter = require('./routes/index');
const swaggerSpec = require('./config/swagger');
const { corsOptions } = require('./config/cors');
const { notFound, errorHandler } = require('./middlewares/error.middleware');

const app = express();

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

app.use('/', indexRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
