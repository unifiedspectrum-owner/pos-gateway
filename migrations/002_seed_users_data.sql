-- ===== SEED DATA FOR REORGANIZED RBAC SYSTEM =====
-- Initial modules, roles, and permissions for the POS SaaS platform

-- ===== SYSTEM MODULES =====
INSERT OR IGNORE INTO modules (name, code, description, display_order, endpoint_pattern) VALUES
-- Core Platform Modules
('Subscription Plan Module', 'plan-management', 'Subscription plan management including features, add-ons, pricing tiers, and volume discounts', 1, '/plans/*'),
('Tenant Module', 'tenant-management', 'Tenant account lifecycle, provisioning, subscription management, and billing operations', 2, '/tenants/*'),
('User Module', 'user-management', 'User account management, profile administration, and user lifecycle operations', 3, '/users/*'),
('Role Module', 'role-management', 'Role-based access control, permissions management, and user role assignments', 4, '/users/roles/*'),
('Payment Module', 'payment-management', 'Payment processing, billing, and financial transaction management', 5, '/payments/*'),
('Countries Module', 'country-management', 'Country data, geographic information, and location services', 6, '/countries/*');

-- ===== SYSTEM ROLES =====
INSERT OR IGNORE INTO roles (name, description, display_order) VALUES
-- System-Level Roles
('Super Administrator', 'Full system access with all permissions across all tenants', 1),

-- Subscription Plan Module Roles
('Plan Creator', 'Can create new subscription plans and features', 10),
('Plan Reader', 'Can view subscription plans and pricing information', 11),
('Plan Editor', 'Can modify existing subscription plans and features', 12),
('Plan Manager', 'Can delete and archive subscription plans', 13),

-- Tenant Module Roles
('Tenant Creator', 'Can create new tenant accounts and provisions', 20),
('Tenant Reader', 'Can view tenant information and status', 21),
('Tenant Editor', 'Can modify tenant settings and configurations', 22),
('Tenant Manager', 'Can suspend, delete, and manage tenant lifecycle', 23),

-- User Module Roles
('User Creator', 'Can create new user accounts and assign roles', 30),
('User Reader', 'Can view user profiles and account information', 31),
('User Editor', 'Can modify user profiles and account settings', 32),
('User Manager', 'Can deactivate and delete user accounts', 33),

-- Role Module Roles
('Role Creator', 'Can create new roles and permission sets', 40),
('Role Reader', 'Can view roles and permission configurations', 41),
('Role Editor', 'Can modify role permissions and assignments', 42),
('Role Manager', 'Can delete roles and manage role lifecycle', 43),

-- Payment Module Roles
('Payment Creator', 'Can initiate payments and process transactions', 50),
('Payment Reader', 'Can view payment history and transaction details', 51),
('Payment Editor', 'Can modify payment methods and billing information', 52),
('Payment Manager', 'Can refund payments and manage financial operations', 53),

-- Countries Module Roles
('Country Creator', 'Can add new countries and geographic data', 60),
('Country Reader', 'Can view country information and geographic data', 61),
('Country Editor', 'Can modify country data and geographic information', 62),
('Country Manager', 'Can remove countries and manage geographic data', 63),

-- Composite Roles (Multiple Operations)
('Plan Administrator', 'Full access to subscription plan management (CRUD)', 100),
('Tenant Administrator', 'Full access to tenant management (CRUD)', 101),
('User Administrator', 'Full access to user management (CRUD)', 102),
('Role Administrator', 'Full access to role management (CRUD)', 103),
('Payment Administrator', 'Full access to payment management (CRUD)', 104),
('Country Administrator', 'Full access to country management (CRUD)', 105),

-- Business Roles (Cross-Module Access)
('Financial Officer', 'Financial operations across plans and payments', 200),
('Support Agent', 'Read-only access across all modules for customer support', 201),
('Operations Manager', 'Operational access to users, tenants, and plans', 202),
('System Auditor', 'Read-only access to all modules for auditing purposes', 203);

-- ===== ROLE PERMISSIONS =====
-- Super Administrator: Full access to all modules
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
SELECT 1, m.id, 1, 1, 1, 1, m.display_order
FROM modules m WHERE m.is_active = 1;

-- ===== SUBSCRIPTION PLAN MODULE PERMISSIONS =====
-- Plan Creator: Can only create plans
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (2, 1, 1, 0, 0, 0, 1);

-- Plan Reader: Can only read plans
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (3, 1, 0, 1, 0, 0, 1);

-- Plan Editor: Can read and update plans
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (4, 1, 0, 1, 1, 0, 1);

-- Plan Manager: Can delete plans
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (5, 1, 0, 1, 0, 1, 1);

-- ===== TENANT MODULE PERMISSIONS =====
-- Tenant Creator: Can only create tenants
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (6, 2, 1, 0, 0, 0, 1);

-- Tenant Reader: Can only read tenants
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (7, 2, 0, 1, 0, 0, 1);

-- Tenant Editor: Can read and update tenants
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (8, 2, 0, 1, 1, 0, 1);

-- Tenant Manager: Can delete tenants
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (9, 2, 0, 1, 0, 1, 1);

-- ===== USER MODULE PERMISSIONS =====
-- User Creator: Can only create users
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (10, 3, 1, 0, 0, 0, 1);

-- User Reader: Can only read users
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (11, 3, 0, 1, 0, 0, 1);

-- User Editor: Can read and update users
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (12, 3, 0, 1, 1, 0, 1);

-- User Manager: Can delete users
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (13, 3, 0, 1, 0, 1, 1);

-- ===== ROLE MODULE PERMISSIONS =====
-- Role Creator: Can only create roles
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (14, 4, 1, 0, 0, 0, 1);

-- Role Reader: Can only read roles
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (15, 4, 0, 1, 0, 0, 1);

-- Role Editor: Can read and update roles
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (16, 4, 0, 1, 1, 0, 1);

-- Role Manager: Can delete roles
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (17, 4, 0, 1, 0, 1, 1);

-- ===== PAYMENT MODULE PERMISSIONS =====
-- Payment Creator: Can only create payments
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (18, 5, 1, 0, 0, 0, 1);

-- Payment Reader: Can only read payments
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (19, 5, 0, 1, 0, 0, 1);

-- Payment Editor: Can read and update payments
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (20, 5, 0, 1, 1, 0, 1);

-- Payment Manager: Can delete payments
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (21, 5, 0, 1, 0, 1, 1);

-- ===== COUNTRIES MODULE PERMISSIONS =====
-- Country Creator: Can only create countries
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (22, 6, 1, 0, 0, 0, 1);

-- Country Reader: Can only read countries
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (23, 6, 0, 1, 0, 0, 1);

-- Country Editor: Can read and update countries
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (24, 6, 0, 1, 1, 0, 1);

-- Country Manager: Can delete countries
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (25, 6, 0, 1, 0, 1, 1);

-- ===== COMPOSITE ROLE PERMISSIONS (FULL CRUD ACCESS) =====
-- Plan Administrator: Full CRUD access to plans
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (26, 1, 1, 1, 1, 1, 1);

-- Tenant Administrator: Full CRUD access to tenants
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (27, 2, 1, 1, 1, 1, 1);

-- User Administrator: Full CRUD access to users
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (28, 3, 1, 1, 1, 1, 1);

-- Role Administrator: Full CRUD access to roles
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (29, 4, 1, 1, 1, 1, 1);

-- Payment Administrator: Full CRUD access to payments
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (30, 5, 1, 1, 1, 1, 1);

-- Country Administrator: Full CRUD access to countries
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES (31, 6, 1, 1, 1, 1, 1);

-- ===== BUSINESS ROLE PERMISSIONS (CROSS-MODULE ACCESS) =====
-- Financial Officer: Plans and Payments access
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES
(32, 1, 0, 1, 1, 0, 1), -- Plan read/update
(32, 5, 1, 1, 1, 0, 2); -- Payment CRU

-- Support Agent: Read-only access to all modules
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
SELECT 33, m.id, 0, 1, 0, 0, m.display_order
FROM modules m WHERE m.is_active = 1;

-- Operations Manager: Operational access to users, tenants, and plans
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
VALUES
(34, 1, 1, 1, 1, 0, 1), -- Plan CRU
(34, 2, 1, 1, 1, 0, 2), -- Tenant CRU
(34, 3, 1, 1, 1, 0, 3); -- User CRU

-- System Auditor: Read-only access to all modules
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete, display_order)
SELECT 35, m.id, 0, 1, 0, 0, m.display_order
FROM modules m WHERE m.is_active = 1;

-- ===== SAMPLE USERS =====
/* Default admin user for system initialization */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_at, updated_at
) VALUES (
    1, 'System', 'Administrator', 'super-admin@pos.com', '+1234567890',
    '$2b$12$L5PQ94SSskbIYiyHY4afEemHa7hxG.2ZCQVae9va0wWqKpdVpPb0i', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* Sample Support Agent */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    33, 'Demo', 'Support', 'support@posplatform.com', '+1987654321',
    '$2b$12$OOvZep.uoWACzELjIDyNke6eXRBYT8oc5CzEQLgfCsJeRheO1/zyS', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* Sample Operations Manager */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    34, 'Jane', 'Operations', 'operations@posplatform.com', '+1555000001',
    '$2b$12$sm2KsvwL4g1yXUaExMItTOrEUSbriUeJj/rbK1ui3pmopHwrNLpMy', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* Sample User Administrator */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    28, 'John', 'UserAdmin', 'useradmin@posplatform.com', '+1555000002',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* Sample Plan Reader */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    3, 'Alice', 'PlanViewer', 'planviewer@posplatform.com', '+1555000003',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* ===== SUBSCRIPTION PLAN MODULE USERS ===== */
/* Plan Creator */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    2, 'Sarah', 'PlanCreator', 'plancreator@posplatform.com', '+1555000004',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* Plan Editor */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    4, 'Michael', 'PlanEditor', 'planeditor@posplatform.com', '+1555000005',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* Plan Manager */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    5, 'Robert', 'PlanManager', 'planmanager@posplatform.com', '+1555000006',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* ===== TENANT MODULE USERS ===== */
/* Tenant Creator */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    6, 'Lisa', 'TenantCreator', 'tenantcreator@posplatform.com', '+1555000007',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* Tenant Reader */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    7, 'David', 'TenantReader', 'tenantreader@posplatform.com', '+1555000008',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* Tenant Editor */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    8, 'Jennifer', 'TenantEditor', 'tenanteditor@posplatform.com', '+1555000009',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* Tenant Manager */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    9, 'Christopher', 'TenantManager', 'tenantmanager@posplatform.com', '+1555000010',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* ===== USER MODULE USERS ===== */
/* User Creator */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    10, 'Amanda', 'UserCreator', 'usercreator@posplatform.com', '+1555000011',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* User Reader */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    11, 'Kevin', 'UserReader', 'userreader@posplatform.com', '+1555000012',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* User Editor */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    12, 'Michelle', 'UserEditor', 'usereditor@posplatform.com', '+1555000013',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* User Manager */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    13, 'Daniel', 'UserManager', 'usermanager@posplatform.com', '+1555000014',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* ===== ROLE MODULE USERS ===== */
/* Role Creator */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    14, 'Jessica', 'RoleCreator', 'rolecreator@posplatform.com', '+1555000015',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* Role Reader */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    15, 'Andrew', 'RoleReader', 'rolereader@posplatform.com', '+1555000016',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* Role Editor */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    16, 'Stephanie', 'RoleEditor', 'roleeditor@posplatform.com', '+1555000017',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* Role Manager */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    17, 'Ryan', 'RoleManager', 'rolemanager@posplatform.com', '+1555000018',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* ===== PAYMENT MODULE USERS ===== */
/* Payment Creator */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    18, 'Nicole', 'PaymentCreator', 'paymentcreator@posplatform.com', '+1555000019',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* Payment Reader */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    19, 'Brandon', 'PaymentReader', 'paymentreader@posplatform.com', '+1555000020',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* Payment Editor */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    20, 'Rachel', 'PaymentEditor', 'paymenteditor@posplatform.com', '+1555000021',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* Payment Manager */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    21, 'Gregory', 'PaymentManager', 'paymentmanager@posplatform.com', '+1555000022',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* ===== COUNTRIES MODULE USERS ===== */
/* Country Creator */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    22, 'Lauren', 'CountryCreator', 'countrycreator@posplatform.com', '+1555000023',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* Country Reader */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    23, 'Jonathan', 'CountryReader', 'countryreader@posplatform.com', '+1555000024',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* Country Editor */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    24, 'Samantha', 'CountryEditor', 'countryeditor@posplatform.com', '+1555000025',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* Country Manager */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    25, 'Nathan', 'CountryManager', 'countrymanager@posplatform.com', '+1555000026',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* ===== COMPOSITE ROLE USERS ===== */
/* Plan Administrator */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    26, 'Ashley', 'PlanAdmin', 'planadmin@posplatform.com', '+1555000027',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* Tenant Administrator */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    27, 'Tyler', 'TenantAdmin', 'tenantadmin@posplatform.com', '+1555000028',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* Role Administrator */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    29, 'Megan', 'RoleAdmin', 'roleadmin@posplatform.com', '+1555000029',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* Payment Administrator */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    30, 'Jason', 'PaymentAdmin', 'paymentadmin@posplatform.com', '+1555000030',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* Country Administrator */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    31, 'Kimberly', 'CountryAdmin', 'countryadmin@posplatform.com', '+1555000031',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* ===== BUSINESS ROLE USERS ===== */
/* Financial Officer */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    32, 'Eric', 'FinancialOfficer', 'financialofficer@posplatform.com', '+1555000032',
    '$2b$12$T0y/FwU2q9of3AeVnKj5SOC0Cl.qyb8nyuAO.ANNDuPV4HQu0sISK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

/* System Auditor */
INSERT OR IGNORE INTO users (
    role_id, f_name, l_name, email, phone,
    password_hash, status, email_verified, phone_verified,
    email_verified_at, phone_verified_at, created_by, created_at, updated_at
) VALUES (
    35, 'Melissa', 'SystemAuditor', 'systemauditor@posplatform.com', '+1555000033',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LlewdBPj.UIQ8PO4GK', /* Default: 'admin123' */
    'active', 1, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- ===== USER LOGIN STATISTICS INITIALIZATION =====
/* Initialize login statistics for all users */
INSERT OR IGNORE INTO user_login_statistics (
    user_id, total_logins, successful_logins, failed_logins,
    consecutive_failed_attempts, active_sessions, max_concurrent_sessions,
    password_changes_count, account_lockouts_count, created_at, updated_at
) VALUES
-- System Administrator (higher session limit)
(1, 0, 0, 0, 0, 0, 5, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- Plan Module Users
(2, 0, 0, 0, 0, 0, 3, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Plan Creator
(3, 0, 0, 0, 0, 0, 3, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Plan Reader
(4, 0, 0, 0, 0, 0, 3, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Plan Editor
(5, 0, 0, 0, 0, 0, 3, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Plan Manager
-- Tenant Module Users
(6, 0, 0, 0, 0, 0, 3, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Tenant Creator
(7, 0, 0, 0, 0, 0, 2, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Tenant Reader
(8, 0, 0, 0, 0, 0, 3, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Tenant Editor
(9, 0, 0, 0, 0, 0, 3, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Tenant Manager
-- User Module Users
(10, 0, 0, 0, 0, 0, 3, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- User Creator
(11, 0, 0, 0, 0, 0, 2, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- User Reader
(12, 0, 0, 0, 0, 0, 3, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- User Editor
(13, 0, 0, 0, 0, 0, 3, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- User Manager
-- Role Module Users
(14, 0, 0, 0, 0, 0, 3, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Role Creator
(15, 0, 0, 0, 0, 0, 2, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Role Reader
(16, 0, 0, 0, 0, 0, 3, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Role Editor
(17, 0, 0, 0, 0, 0, 3, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Role Manager
-- Payment Module Users
(18, 0, 0, 0, 0, 0, 3, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Payment Creator
(19, 0, 0, 0, 0, 0, 2, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Payment Reader
(20, 0, 0, 0, 0, 0, 3, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Payment Editor
(21, 0, 0, 0, 0, 0, 3, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Payment Manager
-- Countries Module Users
(22, 0, 0, 0, 0, 0, 3, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Country Creator
(23, 0, 0, 0, 0, 0, 2, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Country Reader
(24, 0, 0, 0, 0, 0, 3, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Country Editor
(25, 0, 0, 0, 0, 0, 3, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Country Manager
-- Composite Role Users (higher session limits for administrators)
(26, 0, 0, 0, 0, 0, 4, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Plan Administrator
(27, 0, 0, 0, 0, 0, 4, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Tenant Administrator
(28, 0, 0, 0, 0, 0, 4, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- User Administrator
(29, 0, 0, 0, 0, 0, 4, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Role Administrator
(30, 0, 0, 0, 0, 0, 4, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Payment Administrator
(31, 0, 0, 0, 0, 0, 4, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Country Administrator
-- Business Role Users
(32, 0, 0, 0, 0, 0, 4, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Financial Officer
(33, 0, 0, 0, 0, 0, 3, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Support Agent
(34, 0, 0, 0, 0, 0, 4, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Operations Manager
(35, 0, 0, 0, 0, 0, 2, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP); -- System Auditor