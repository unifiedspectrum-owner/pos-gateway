/* Libraries imports */
import { Hono } from "hono";

/* Shared module imports */
import { forwardToPOSWorker } from "@shared/services";

/* Initialize POS worker router */
const posWorkerRoutes = new Hono<{ Bindings: Env }>();

/* Catch-all route - Forward all requests to POS worker */
posWorkerRoutes.all('*', forwardToPOSWorker);

/* Export configured POS worker routes */
export { posWorkerRoutes };
