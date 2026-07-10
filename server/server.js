const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const { env } = require('./env');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const allowedOrigins = [env.CLIENT_URL].filter(Boolean);
const publicPath = path.join(__dirname, 'public');
const brokenDownloadPlaceholder = `
<svg xmlns="https://www.w3.org/2000/svg" width="720" height="260" viewBox="0 0 720 260">
  <rect width="720" height="260" rx="14" fill="#f8fafc"/>
  <rect x="1" y="1" width="718" height="258" rx="13" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="12 10"/>
  <text x="360" y="112" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#334155">Image is broken</text>
  <text x="360" y="154" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#475569">We are working to fix it.</text>
</svg>
`.trim();

function setPublicAssetHeaders(res) {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
}

app.use(helmet());
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(cookieParser());
app.use('/public', express.static(publicPath, {
    setHeaders: setPublicAssetHeaders,
}));
app.get('/public/downloads/*', (req, res) => {
    setPublicAssetHeaders(res);
    res.type('image/svg+xml').status(200).send(brokenDownloadPlaceholder);
});

app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

app.use('/api/v1', routes);
app.use(notFound);
app.use(errorHandler);

function startServer() {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = { app, startServer };
