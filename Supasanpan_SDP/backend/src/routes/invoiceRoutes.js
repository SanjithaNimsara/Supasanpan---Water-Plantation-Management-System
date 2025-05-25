const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

// Create a new invoice
router.post('/', invoiceController.createInvoice);

// Get all invoices (with optional customerId filter)
router.get('/', invoiceController.getInvoices);

// Get invoice by order ID
router.get('/order/:orderId', invoiceController.getInvoiceByOrderId);

// Get a specific invoice by ID
router.get('/:id', invoiceController.getInvoiceById);

module.exports = router; 