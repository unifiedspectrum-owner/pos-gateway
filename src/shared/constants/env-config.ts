import { env } from "cloudflare:workers";

/* Cloudflare bindings */
export const POS_DB_GLOBAL = env.POS_DB_GLOBAL;
export const POS_BACKEND = env.POS_BACKEND;
