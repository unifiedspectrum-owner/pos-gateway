/* Libraries imports */
import { Hono } from "hono";

/* Shared module imports */
import { getCSRFToken } from "@shared/services/csrf-token";

/* Initialize CSRF router */
const csrfRoutes = new Hono<{ Bindings: Env }>();

/* GET /csrf-token - Get CSRF token for client applications */
csrfRoutes.get('/token', getCSRFToken);

/* Export configured CSRF routes */
export { csrfRoutes };
