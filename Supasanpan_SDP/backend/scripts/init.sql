-- Modify users table to add employee-specific fields
ALTER TABLE users
ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active',
ADD COLUMN last_login DATETIME,
ADD COLUMN join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN phone VARCHAR(20),
ADD COLUMN address TEXT,
ADD COLUMN emergency_contact VARCHAR(100),
ADD COLUMN position VARCHAR(100),
ADD COLUMN department VARCHAR(100);

-- Create employee_roles table
CREATE TABLE IF NOT EXISTS employee_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create employee_permissions table
CREATE TABLE IF NOT EXISTS employee_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT,
    permission_name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES employee_roles(id) ON DELETE CASCADE
);

-- Create employee_activity_logs table
CREATE TABLE IF NOT EXISTS employee_activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    priority ENUM('low', 'medium', 'high'),
    due_date DATETIME,
    assigned_to VARCHAR(100),
    progress INT DEFAULT 0,
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO employee_roles (name, description) VALUES
('admin', 'Full system access and management capabilities'),
('manager', 'Department management and oversight'),
('employee', 'Basic system access for daily operations');

-- Insert default permissions
INSERT INTO employee_permissions (role_id, permission_name) VALUES
(1, 'manage_users'),
(1, 'manage_roles'),
(1, 'view_reports'),
(1, 'manage_inventory'),
(1, 'manage_orders'),
(2, 'view_reports'),
(2, 'manage_inventory'),
(2, 'manage_orders'),
(3, 'view_inventory'),
(3, 'create_orders'); 