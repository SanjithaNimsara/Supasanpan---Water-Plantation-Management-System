const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const { auth } = require('../../middleware/auth');

// Get all roles
router.get('/roles/all', auth, async (req, res) => {
    try {
        const [roles] = await pool.query(`
            SELECT r.*, 
                   GROUP_CONCAT(p.permission_name) as permissions
            FROM employee_roles r
            LEFT JOIN employee_permissions p ON r.id = p.role_id
            GROUP BY r.id
        `);
        res.json(roles);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ message: 'Error fetching roles' });
    }
});

// Get all employees
router.get('/', auth, async (req, res) => {
    try {
        const [employees] = await pool.query(`
            SELECT 
                u.id, u.full_name, u.username, u.email, u.role,
                u.status, u.last_login, u.join_date, u.phone,
                u.position, u.department,
                er.name as role_name,
                er.description as role_description
            FROM users u
            LEFT JOIN employee_roles er ON u.role = er.name
            WHERE u.role IN ('manager', 'employee')
            ORDER BY u.join_date DESC
        `);
        res.json(employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ message: 'Error fetching employees' });
    }
});

// Get employee by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const [employees] = await pool.query(`
            SELECT 
                u.*,
                er.name as role_name,
                er.description as role_description
            FROM users u
            LEFT JOIN employee_roles er ON u.role = er.name
            WHERE u.id = ?
        `, [req.params.id]);

        if (employees.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Get employee activity logs
        const [logs] = await pool.query(
            'SELECT * FROM employee_activity_logs WHERE employee_id = ? ORDER BY created_at DESC LIMIT 10',
            [req.params.id]
        );

        res.json({ ...employees[0], activity_logs: logs });
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ message: 'Error fetching employee' });
    }
});

// Get employee activity logs
router.get('/:id/logs', auth, async (req, res) => {
    try {
        const [logs] = await pool.query(
            'SELECT * FROM employee_activity_logs WHERE employee_id = ? ORDER BY created_at DESC',
            [req.params.id]
        );
        res.json(logs);
    } catch (error) {
        console.error('Error fetching employee logs:', error);
        res.status(500).json({ message: 'Error fetching employee logs' });
    }
});

// Update employee
router.put('/:id', auth, async (req, res) => {
    try {
        const {
            full_name,
            email,
            phone,
            address,
            emergency_contact,
            position,
            department,
            status
        } = req.body;

        await pool.query(`
            UPDATE users 
            SET 
                full_name = ?,
                email = ?,
                phone = ?,
                address = ?,
                emergency_contact = ?,
                position = ?,
                department = ?,
                status = ?
            WHERE id = ?
        `, [
            full_name,
            email,
            phone,
            address,
            emergency_contact,
            position,
            department,
            status,
            req.params.id
        ]);

        // Log the activity
        await pool.query(
            'INSERT INTO employee_activity_logs (employee_id, action, description) VALUES (?, ?, ?)',
            [req.params.id, 'update', 'Employee information updated']
        );

        res.json({ message: 'Employee updated successfully' });
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ message: 'Error updating employee' });
    }
});

// Update employee role
router.put('/:id/role', auth, async (req, res) => {
    try {
        const { role } = req.body;

        // Verify role exists
        const [roles] = await pool.query(
            'SELECT id FROM employee_roles WHERE name = ?',
            [role]
        );

        if (roles.length === 0) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        await pool.query(
            'UPDATE users SET role = ? WHERE id = ?',
            [role, req.params.id]
        );

        // Log the activity
        await pool.query(
            'INSERT INTO employee_activity_logs (employee_id, action, description) VALUES (?, ?, ?)',
            [req.params.id, 'role_update', `Role updated to ${role}`]
        );

        res.json({ message: 'Employee role updated successfully' });
    } catch (error) {
        console.error('Error updating employee role:', error);
        res.status(500).json({ message: 'Error updating employee role' });
    }
});

// Delete employee
router.delete('/:id', auth, async (req, res) => {
    try {
        console.log('Delete request received for employee ID:', req.params.id);
        
        // First check if the employee exists
        const [employee] = await pool.query(
            'SELECT * FROM users WHERE id = ? AND role IN ("manager", "employee")',
            [req.params.id]
        );

        console.log('Employee check result:', employee);

        if (employee.length === 0) {
            console.log('Employee not found');
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Delete the employee
        const [deleteResult] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        console.log('Delete query result:', deleteResult);

        if (deleteResult.affectedRows === 0) {
            console.log('No rows were deleted');
            return res.status(500).json({ message: 'Failed to delete employee' });
        }

        console.log('Employee deleted successfully');
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ 
            message: 'Error deleting employee',
            error: error.message 
        });
    }
});

module.exports = router; 