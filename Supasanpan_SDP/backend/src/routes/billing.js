const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const { auth } = require('../../middleware/auth');

// Disable ONLY_FULL_GROUP_BY mode
const disableOnlyFullGroupBy = async (connection) => {
    try {
        await connection.query('SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,"ONLY_FULL_GROUP_BY",""));');
        console.log('Disabled ONLY_FULL_GROUP_BY mode');
    } catch (error) {
        console.error('Error disabling ONLY_FULL_GROUP_BY mode:', error);
    }
};

// Get all orders with their details
router.get('/orders', auth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await disableOnlyFullGroupBy(connection);
        console.log('Fetching orders...');
        const [orders] = await connection.query(`
            SELECT o.*, 
                   COUNT(oi.id) as total_items,
                   SUM(oi.total) as order_total,
                   MAX(i.status) as invoice_status,
                   MAX(i.invoice_id) as invoice_id
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN invoices i ON o.id = i.order_id
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `);
        console.log('Orders fetched:', orders);
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    } finally {
        connection.release();
    }
});

// Get a single order with items
router.get('/orders/:id', auth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const orderId = req.params.id;

        // Get order details
        const [order] = await connection.query(
            `SELECT o.*, i.total_amount, i.status as payment_status 
             FROM orders o 
             LEFT JOIN invoices i ON o.id = i.order_id 
             WHERE o.id = ?`,
            [orderId]
        );

        if (!order.length) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Get order items
        const [items] = await connection.query(
            'SELECT * FROM order_items WHERE order_id = ?',
            [orderId]
        );

        // Get payments
        const [payments] = await connection.query(
            `SELECT p.* FROM payments p 
             JOIN invoices i ON p.invoice_id = i.id 
             WHERE i.order_id = ?`,
            [orderId]
        );

        res.json({
            ...order[0],
            items,
            payments
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ message: 'Error fetching order details' });
    } finally {
        connection.release();
    }
});

// Get the latest order number
const getLatestOrderNumber = async (connection) => {
    const [result] = await connection.query(
        'SELECT order_id FROM orders ORDER BY id DESC LIMIT 1'
    );
    if (result.length === 0) return 0;
    return parseInt(result[0].order_id.replace('ORD', ''));
};

// Get the latest invoice number
const getLatestInvoiceNumber = async (connection) => {
    const [result] = await connection.query(
        'SELECT invoice_id FROM invoices ORDER BY id DESC LIMIT 1'
    );
    if (result.length === 0) return 0;
    return parseInt(result[0].invoice_id.replace('INV', ''));
};

// Get the latest customer number
const getLatestCustomerNumber = async (connection) => {
    try {
        const [result] = await connection.query(
            'SELECT customer_id FROM orders ORDER BY id DESC LIMIT 1'
        );
        console.log('Latest customer ID found:', result);
        
        if (result.length === 0) {
            console.log('No existing customer IDs found, starting from 1');
            return 0;
        }

        const lastCustomerId = result[0].customer_id;
        console.log('Last customer ID:', lastCustomerId);
        
        // Extract the number part from the customer ID
        const match = lastCustomerId.match(/CUS-\d{4}-(\d+)/);
        if (!match) {
            console.log('No match found in customer ID format');
            return 0;
        }

        const number = parseInt(match[1]);
        console.log('Extracted number:', number);
        return number;
    } catch (error) {
        console.error('Error getting latest customer number:', error);
        return 0;
    }
};

// Generate customer ID
const generateCustomerId = async (connection) => {
    try {
        const year = new Date().getFullYear();
        const latestNum = await getLatestCustomerNumber(connection);
        console.log('Latest customer number:', latestNum);
        
        const nextNum = latestNum + 1;
        const newCustomerId = `CUS-${year}-${nextNum.toString().padStart(4, '0')}`;
        console.log('Generated new customer ID:', newCustomerId);
        
        return newCustomerId;
    } catch (error) {
        console.error('Error generating customer ID:', error);
        throw error;
    }
};

// Create a new order
router.post('/orders', auth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await disableOnlyFullGroupBy(connection);
        await connection.beginTransaction();

        const { items } = req.body;
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('No items provided for order');
        }

        // Generate new IDs
        const latestOrderNum = await getLatestOrderNumber(connection);
        const newOrderId = `ORD${(latestOrderNum + 1).toString().padStart(4, '0')}`;
        const customerId = await generateCustomerId(connection);

        console.log('Creating order with IDs:', { newOrderId, customerId });

        // Insert order with new IDs
        const [result] = await connection.query(
            'INSERT INTO orders (order_id, customer_id) VALUES (?, ?)',
            [newOrderId, customerId]
        );

        const orderId = result.insertId;
        console.log('Order created with ID:', orderId);

        // Insert order items
        for (const item of items) {
            // Check if product exists and has enough stock
            const [product] = await connection.query(
                'SELECT * FROM products WHERE id = ?',
                [item.product_id]
            );

            if (!product.length) {
                throw new Error(`Product with ID ${item.product_id} not found`);
            }

            if (product[0].stock < item.quantity) {
                throw new Error(`Insufficient stock for product ${item.item_type}`);
            }

            // Insert order item
            await connection.query(
                `INSERT INTO order_items (
                    order_id, product_id, item_type, quantity, price, deposit, total
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    item.product_id,
                    item.item_type,
                    item.quantity,
                    item.price,
                    item.deposit || 0,
                    item.total
                ]
            );

            // Update product stock
            await connection.query(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        // Create invoice with new invoice ID
        const [orderTotal] = await connection.query(
            'SELECT SUM(total) as total FROM order_items WHERE order_id = ?',
            [orderId]
        );

        const latestInvoiceNum = await getLatestInvoiceNumber(connection);
        const newInvoiceId = `INV${(latestInvoiceNum + 1).toString().padStart(4, '0')}`;

        console.log('Creating invoice:', { newInvoiceId, orderId, total: orderTotal[0].total });

        // Create invoice and get its ID
        const [invoiceResult] = await connection.query(
            'INSERT INTO invoices (invoice_id, order_id, total_amount) VALUES (?, ?, ?)',
            [newInvoiceId, orderId, orderTotal[0].total]
        );

        const invoiceId = invoiceResult.insertId;
        console.log('Invoice created with ID:', invoiceId);

        await connection.commit();
        console.log('Transaction committed successfully');

        // Get the complete order details
        const [newOrder] = await connection.query(`
            SELECT o.*, 
                   COUNT(oi.id) as total_items,
                   SUM(oi.total) as order_total,
                   MAX(i.status) as invoice_status,
                   MAX(i.invoice_id) as invoice_id,
                   MAX(i.id) as invoice_id_num
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN invoices i ON o.id = i.order_id
            WHERE o.id = ?
            GROUP BY o.id
        `, [orderId]);

        console.log('Order details:', newOrder[0]);

        res.status(201).json({ 
            message: 'Order created successfully',
            order: newOrder[0]
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating order:', error);
        res.status(500).json({ 
            message: 'Error creating order', 
            error: error.message 
        });
    } finally {
        connection.release();
    }
});

// Get all invoices
router.get('/invoices', auth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [invoices] = await connection.query(`
            SELECT i.*, o.customer_id, o.order_id
            FROM invoices i
            JOIN orders o ON i.order_id = o.id
            ORDER BY i.created_at DESC
        `);
        res.json(invoices);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ message: 'Error fetching invoices' });
    } finally {
        connection.release();
    }
});

// Get a single invoice
router.get('/invoices/:id', auth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [invoice] = await connection.query(`
            SELECT i.*, o.customer_id, o.order_id
            FROM invoices i
            JOIN orders o ON i.order_id = o.id
            WHERE i.id = ?
        `, [req.params.id]);

        if (!invoice.length) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.json(invoice[0]);
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({ message: 'Error fetching invoice' });
    } finally {
        connection.release();
    }
});

// Delete an invoice
router.delete('/invoices/:id', auth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Check if invoice exists
        const [invoice] = await connection.query(
            'SELECT * FROM invoices WHERE id = ?',
            [req.params.id]
        );

        if (!invoice.length) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Delete associated payments first
        await connection.query(
            'DELETE FROM payments WHERE invoice_id = ?',
            [req.params.id]
        );

        // Delete the invoice
        await connection.query(
            'DELETE FROM invoices WHERE id = ?',
            [req.params.id]
        );

        await connection.commit();
        res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting invoice:', error);
        res.status(500).json({ message: 'Error deleting invoice' });
    } finally {
        connection.release();
    }
});

// Download invoice as PDF
router.get('/invoices/:id/download', auth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [invoice] = await connection.query(`
            SELECT i.*, o.customer_id, o.order_id
            FROM invoices i
            JOIN orders o ON i.order_id = o.id
            WHERE i.id = ?
        `, [req.params.id]);

        if (!invoice.length) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // TODO: Implement PDF generation
        // For now, return a simple text response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice[0].invoice_id}.pdf`);
        res.send('PDF content will be implemented');
    } catch (error) {
        console.error('Error downloading invoice:', error);
        res.status(500).json({ message: 'Error downloading invoice' });
    } finally {
        connection.release();
    }
});

// Record a payment
router.post('/payments', auth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { invoice_id, amount, method } = req.body;
        
        // Validate required fields
        if (!invoice_id) {
            throw new Error('Invoice ID is required');
        }
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            throw new Error('Valid amount is required');
        }
        if (!method) {
            throw new Error('Payment method is required');
        }

        console.log('Processing payment for invoice:', invoice_id);

        // Get invoice details
        const [invoice] = await connection.query(
            'SELECT id, total_amount, status FROM invoices WHERE invoice_id = ?',
            [invoice_id]
        );

        console.log('Found invoice:', invoice);

        if (!invoice.length) {
            throw new Error(`Invoice ${invoice_id} not found. Please check the invoice ID and try again.`);
        }

        // Check if invoice is already paid
        if (invoice[0].status === 'paid') {
            throw new Error(`Invoice ${invoice_id} is already paid`);
        }

        const actualInvoiceId = invoice[0].id;
        const totalAmount = invoice[0].total_amount;

        console.log('Invoice details:', { actualInvoiceId, totalAmount });

        // Insert payment
        const [paymentResult] = await connection.query(
            'INSERT INTO payments (invoice_id, amount, method, amount_paid, change_amount) VALUES (?, ?, ?, ?, ?)',
            [actualInvoiceId, amount, method, amount, 0]
        );

        console.log('Payment inserted:', paymentResult);

        // Check if invoice is fully paid
        const [payments] = await connection.query(
            'SELECT SUM(amount) as total_paid FROM payments WHERE invoice_id = ?',
            [actualInvoiceId]
        );

        const totalPaid = Number(payments[0].total_paid) || 0;
        console.log('Total paid amount:', totalPaid);

        if (totalPaid >= totalAmount) {
            await connection.query(
                'UPDATE invoices SET status = "paid" WHERE id = ?',
                [actualInvoiceId]
            );
            console.log('Invoice marked as paid');
        }

        await connection.commit();
        console.log('Payment transaction committed successfully');

        // Get updated invoice details
        const [updatedInvoice] = await connection.query(`
            SELECT i.*, 
                   o.customer_id,
                   COALESCE(SUM(p.amount), 0) as paid_amount,
                   COALESCE(SUM(p.change_amount), 0) as total_change
            FROM invoices i
            JOIN orders o ON i.order_id = o.id
            LEFT JOIN payments p ON i.id = p.invoice_id
            WHERE i.id = ?
            GROUP BY i.id
        `, [actualInvoiceId]);

        res.status(201).json({ 
            message: 'Payment recorded successfully',
            payment_details: {
                invoice_id: invoice_id,
                amount: parseFloat(amount).toFixed(2),
                total_paid: totalPaid.toFixed(2),
                remaining_balance: (totalAmount - totalPaid).toFixed(2)
            },
            invoice: updatedInvoice[0]
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error recording payment:', error);
        res.status(500).json({ 
            message: 'Error recording payment', 
            error: error.message 
        });
    } finally {
        connection.release();
    }
});

// Delete an order and all related data
router.delete('/orders/:id', auth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const orderId = req.params.id;

        // Delete related payments (if any)
        await connection.query(
            `DELETE p FROM payments p
             JOIN invoices i ON p.invoice_id = i.id
             WHERE i.order_id = ?`, [orderId]
        );

        // Delete related invoices
        await connection.query(
            'DELETE FROM invoices WHERE order_id = ?', [orderId]
        );

        // Delete related order items
        await connection.query(
            'DELETE FROM order_items WHERE order_id = ?', [orderId]
        );

        // Delete the order itself
        await connection.query(
            'DELETE FROM orders WHERE id = ?', [orderId]
        );

        await connection.commit();
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting order:', error);
        res.status(500).json({ message: 'Error deleting order', error: error.message });
    } finally {
        connection.release();
    }
});

// Get invoice by order ID
router.get('/invoices/order/:orderId', auth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        // Get invoice details
        const [invoices] = await connection.query(`
            SELECT i.*, o.customer_id, o.order_id
            FROM invoices i
            JOIN orders o ON i.order_id = o.id
            WHERE i.order_id = ?
        `, [req.params.orderId]);

        if (!invoices.length) {
            return res.status(404).json({ message: 'Invoice not found for this order' });
        }

        const invoice = invoices[0];

        // Get order items
        const [items] = await connection.query(`
            SELECT oi.*, p.name as item_name
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [req.params.orderId]);

        // Get payments
        const [payments] = await connection.query(`
            SELECT p.*
            FROM payments p
            WHERE p.invoice_id = ?
            ORDER BY p.created_at ASC
        `, [invoice.id]);

        // Calculate total paid amount
        const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

        // Combine all data
        const invoiceData = {
            ...invoice,
            items: items,
            payments: payments,
            total_paid: totalPaid,
            remaining_balance: parseFloat(invoice.total_amount) - totalPaid
        };

        res.json(invoiceData);
    } catch (error) {
        console.error('Error fetching invoice by order ID:', error);
        res.status(500).json({ message: 'Error fetching invoice' });
    } finally {
        connection.release();
    }
});

module.exports = router; 