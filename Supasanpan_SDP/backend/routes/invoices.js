const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { auth } = require('../middleware/auth');

// Get all invoices
router.get('/', auth, invoiceController.getInvoices);

// Create new invoice
router.post('/', auth, invoiceController.createInvoice);

// Update invoice status
router.put('/:id/status', auth, invoiceController.updateInvoiceStatus);

module.exports = router; 