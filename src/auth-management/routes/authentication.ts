/* Libraries imports */
import { Hono } from "hono";

/* Shared module imports */
import { jwtAuthMiddleware, AuthenticatedUser } from "@shared/middleware";

/* Auth management module imports */
import { login, logout, refreshToken, forgotPassword, validateResetToken, resetPassword, verify2FA, generate2FA, enable2FA, disable2FA } from "@auth-management/services";

/* Initialize authentication router with environment bindings */
const authRoutes = new Hono<{ Bindings: Env; Variables: { user: AuthenticatedUser } }>();

/* Public authentication routes (no authentication required) */
/* POST /auth/login - User authentication with email and password */
authRoutes.post('/login', login);

/* POST /auth/forgot-password - Send password reset link to user email */
authRoutes.post('/forgot-password', forgotPassword);

/* GET /auth/validate-reset-token - Validate password reset token */
authRoutes.get('/validate-reset-token', validateResetToken);

/* POST /auth/reset-password - Change user password using reset token */
authRoutes.post('/reset-password', resetPassword);

/* Protected authentication routes (authentication required) */
/* Apply JWT authentication middleware to protected routes */
authRoutes.use('*', jwtAuthMiddleware);

/* POST /auth/refresh - Refresh access token using refresh token */
authRoutes.post('/refresh', refreshToken);

/* POST /auth/logout - User logout with session cleanup */
authRoutes.post('/logout', logout);

/* POST /auth/2fa/generate - Generate two-factor authentication credentials */
authRoutes.post('/2fa/generate', generate2FA);

/* POST /auth/2fa/enable - Verify OTP and enable two-factor authentication */
authRoutes.post('/2fa/enable', enable2FA);

/* POST /auth/2fa/disable - Disable two-factor authentication */
authRoutes.post('/2fa/disable', disable2FA);

/* POST /auth/2fa/verify - Verify 2FA token and provide authentication tokens */
authRoutes.post('/2fa/verify', verify2FA);

/* Export configured authentication routes for use in main application */
export { authRoutes };