/* CORS Allowed Origins */
export const ALLOWED_ORIGINS = ['http://localhost:3000', 'http://localhost:3000/', 'https://pos-frontend-demo.subscription-907.workers.dev', 'https://api.greenresolu.com'];

/* Application URLs */
export const FRONTEND_APP_URL = 'http://localhost:3000';
// export const FRONTEND_APP_URL = 'https://pos-frontend-demo.subscription-907.workers.dev';

export const POS_GATEWAY_BASE_URL = 'http://127.0.0.1:8787';
export const POS_API_BASE_URL = 'http://127.0.0.1:8787';
// export const BACKEND_APP_BASE_URL = 'https://pos-backend.subscription-907.workers.dev';

/* Cache Configuration */
export const CONFIG_CACHE_TTL = 24 * 60 * 60 * 1000; /* 1 day cache duration */

/* Request Body Size Limits */
export const MAX_REQUEST_BODY_SIZE_MB = 10; /* 10MB max request body size */

/* Context variable keys */
export const USER_CONTEXT_KEY = 'user';
