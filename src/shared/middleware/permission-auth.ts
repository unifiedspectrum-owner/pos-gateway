/* Libraries imports */
import { Next } from "hono";

/* Shared module imports */
import { getCurrentISOString } from "@shared/utils";
import { USER_CONTEXT_KEY } from "@shared/constants";
import { AuthenticatedContext } from "@shared/middleware";

/* Auth management module imports */
import { checkUserExists, checkRoleExists } from "@auth-management/utils";

/* Permission validation types */
type PermissionType = 'create' | 'read' | 'update' | 'delete';

interface UserPermission {
  module_id: number;
  module_name: string;
  module_endpoint_pattern: string;
  can_create: number;
  can_read: number;
  can_update: number;
  can_delete: number;
}

/* Get user permissions - first check direct user permissions, then role permissions */
const GET_USER_PERMISSIONS_QUERY = `
  SELECT DISTINCT
    COALESCE(up.module_id, rp.module_id) as module_id,
    COALESCE(up.can_create, rp.can_create, 0) as can_create,
    COALESCE(up.can_read, rp.can_read, 0) as can_read,
    COALESCE(up.can_update, rp.can_update, 0) as can_update,
    COALESCE(up.can_delete, rp.can_delete, 0) as can_delete,
    m.name as module_name,
    m.endpoint_pattern as module_endpoint_pattern,
    CASE
      WHEN up.id IS NOT NULL THEN 'user_permission'
      ELSE 'role_permission'
    END as permission_source
  FROM modules m
  LEFT JOIN role_permissions rp ON m.id = rp.module_id
    AND rp.role_id = ?
    AND rp.is_active = 1
  LEFT JOIN user_permissions up ON m.id = up.module_id
    AND up.user_id = ?
    AND up.is_active = 1
    AND (up.expires_at IS NULL OR up.expires_at > datetime('now'))
  WHERE m.is_active = 1
    AND (rp.id IS NOT NULL OR up.id IS NOT NULL)
  ORDER BY m.display_order ASC;
`;

/* Check specific permission flag */
const checkPermissionFlag = (permission: UserPermission, type: PermissionType): boolean => {
  switch (type) {
    case 'create':
      return permission.can_create === 1;
    case 'read':
      return permission.can_read === 1;
    case 'update':
      return permission.can_update === 1;
    case 'delete':
      return permission.can_delete === 1;
    default:
      return false;
  }
};

/* Permission validation middleware for checking user access rights */
export const permissionAuthMiddleware = async (c: AuthenticatedContext, next: Next) => {
  try {
    /* Get authenticated user from JWT middleware */
    const user = c.get(USER_CONTEXT_KEY);

    if (!user) {
      return c.json({
        success: false,
        message: "AUTHENTICATION_REQUIRED",
        error: "User authentication is required for this operation",
        timestamp: getCurrentISOString()
      }, 401);
    }

    /* Get request details for permission validation */
    const requestMethod = c.req.method;
    const requestPath = c.req.path;

    /* Super admin has all permissions */
    if (user.role_id === 1) {
      await next();
      return;
    }

    /* Check user and role existence in parallel for better performance */
    const [userValidation, roleValidation] = await Promise.all([
      checkUserExists(parseInt(`${user.id}`), c.env),
      checkRoleExists(user.role_id, c.env)
    ]);

    /* Check user validation first */
    if (!userValidation.isValid) {
      /* Log unauthorized access attempt */
      console.error("[PERMISSION-AUTH] 403: Invalid user access attempt", {
        userId: user.id,
        userName: user.name,
        roleId: user.role_id,
        requestMethod,
        requestPath,
        reason: userValidation.error || "User does not exist or is inactive",
        timestamp: getCurrentISOString()
      });

      return c.json({
        success: false,
        message: "INVALID_USER",
        error: userValidation.error || "User is invalid or inactive",
        timestamp: getCurrentISOString()
      }, 403);
    }

    /* Check role validation */
    if (!roleValidation.isValid) {
      /* Log unauthorized access attempt */
      console.error("[PERMISSION-AUTH] 403: Invalid role access attempt", {
        userId: user.id,
        userName: user.name,
        roleId: user.role_id,
        requestMethod,
        requestPath,
        reason: roleValidation.error || "User role does not exist or is inactive",
        timestamp: getCurrentISOString()
      });

      return c.json({
        success: false,
        message: "INVALID_ROLE",
        error: roleValidation.error || "User role is invalid or inactive",
        timestamp: getCurrentISOString()
      }, 403);
    }

    /* Get user permissions from database - checks both user_permissions and role_permissions */
    const permissionsResult = await c.env.POS_DB_GLOBAL.prepare(GET_USER_PERMISSIONS_QUERY)
      .bind(user.role_id, user.id)
      .all<UserPermission>();

    if (!permissionsResult.success) {
      return c.json({
        success: false,
        message: "PERMISSION_CHECK_FAILED",
        error: "Failed to retrieve user permissions",
        timestamp: getCurrentISOString()
      }, 500);
    }

    const permissions = permissionsResult.results;

    /* Find matching module by endpoint pattern */
    const matchingModule = permissions.find(permission => {
      const pattern = permission.module_endpoint_pattern;
      if (!pattern) return false;

      /* Handle exact match for patterns ending with /* */
      if (pattern.endsWith('/*')) {
        const basePath = pattern.slice(0, -2); // Remove /*
        /* Match exact base path or base path with additional segments */
        return requestPath === basePath || requestPath.startsWith(basePath + '/');
      }

      /* Convert endpoint pattern to regex for matching */
      const regexPattern = pattern
        .replace(/\*/g, '.*')
        .replace(/:\w+/g, '[^/]+');

      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(requestPath);
    });

    if (!matchingModule) {
      /* Log unauthorized access attempt */
      console.error("[PERMISSION-AUTH] 403: Unauthorized access attempt - no module found", {
        userId: user.id,
        userName: user.name,
        roleId: user.role_id,
        requestMethod,
        requestPath,
        reason: `No module found for endpoint: ${requestPath}`,
        timestamp: getCurrentISOString()
      });

      return c.json({
        success: false,
        message: "ACCESS_DENIED",
        error: "You do not have permission to access this endpoint",
        timestamp: getCurrentISOString()
      }, 403);
    }

    /* Map HTTP methods to permission types */
    let requiredPermission: PermissionType;
    switch (requestMethod.toUpperCase()) {
      case 'POST':
        requiredPermission = 'create';
        break;
      case 'GET':
        requiredPermission = 'read';
        break;
      case 'PUT':
      case 'PATCH':
        requiredPermission = 'update';
        break;
      case 'DELETE':
        requiredPermission = 'delete';
        break;
      default:
        return c.json({
          success: false,
          message: "ACCESS_DENIED",
          error: `Unsupported HTTP method: ${requestMethod}`,
          timestamp: getCurrentISOString()
        }, 403);
    }

    /* Check if user has the required permission */
    const hasPermission = checkPermissionFlag(matchingModule, requiredPermission);

    if (!hasPermission) {
      /* Log unauthorized access attempt */
      console.error("[PERMISSION-AUTH] 403: Unauthorized access attempt - insufficient permissions", {
        userId: user.id,
        userName: user.name,
        roleId: user.role_id,
        requestMethod,
        requestPath,
        moduleName: matchingModule.module_name,
        requiredPermission,
        reason: `Insufficient permissions: ${requiredPermission} access denied for ${matchingModule.module_name}`,
        timestamp: getCurrentISOString()
      });

      return c.json({
        success: false,
        message: "ACCESS_DENIED",
        error: `You do not have ${requiredPermission} permission for ${matchingModule.module_name}`,
        timestamp: getCurrentISOString()
      }, 403);
    }

    /* Log successful permission validation for audit */
    console.log("[PERMISSION-AUTH] 200: Permission validation successful", {
      userId: user.id,
      userName: user.name,
      roleId: user.role_id,
      moduleName: matchingModule.module_name,
      permissionType: requiredPermission,
      requestMethod,
      requestPath,
      timestamp: getCurrentISOString()
    });

    /* Continue to next middleware/handler */
    await next();

  } catch (error) {
    /* Log error details for debugging */
    const errorMessage = error instanceof Error ? error.message : 'Permission validation failed';
    console.error("[PERMISSION-AUTH] 500: Permission validation middleware error", {
      error: errorMessage,
      timestamp: getCurrentISOString()
    });

    return c.json({
      success: false,
      message: "PERMISSION_VALIDATION_ERROR",
      error: "An error occurred while validating permissions",
      timestamp: getCurrentISOString()
    }, 500);
  }
};