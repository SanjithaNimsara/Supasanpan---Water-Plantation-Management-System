const pool = require('../../config/database');

exports.createInvoice = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { customerId, items, total } = req.body;
    let calculatedTotal = 0;

    // Validate and update products
    for (const item of items) {
      const [product] = await connection.execute(
        'SELECT * FROM products WHERE id = ? FOR UPDATE',
        [item.productId]
      );

      if (!product.length) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }

      if (product[0].stock < item.quantity) {
        throw new Error(`Insufficient stock for product ID ${item.productId}`);
      }

      // Update product stock
      await connection.execute(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.productId]
      );

      calculatedTotal += product[0].price * item.quantity;
    }

    // Verify total matches
    if (Math.abs(calculatedTotal - total) > 0.01) {
      throw new Error('Total amount mismatch');
    }

    // Create invoice
    const [invoiceResult] = await connection.execute(
      'INSERT INTO invoices (customer_id, total, status) VALUES (?, ?, ?)',
      [customerId, calculatedTotal, 'completed']
    );

    const invoiceId = invoiceResult.insertId;

    // Create invoice items
    for (const item of items) {
      const [product] = await connection.execute(
        'SELECT price FROM products WHERE id = ?',
        [item.productId]
      );

      await connection.execute(
        'INSERT INTO invoice_items (invoice_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [invoiceId, item.productId, item.quantity, product[0].price]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice: {
        id: invoiceId,
        customerId,
        total: calculatedTotal,
        status: 'completed'
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: error.message || 'Failed to create invoice' });
  } finally {
    connection.release();
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const { customerId } = req.query;
    let query = `
      SELECT i.*, 
             GROUP_CONCAT(
               CONCAT(ii.product_id, ':', ii.quantity, ':', ii.price)
             ) as items
      FROM invoices i
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
    `;
    const params = [];

    if (customerId) {
      query += ' WHERE i.customer_id = ?';
      params.push(customerId);
    }

    query += ' GROUP BY i.id ORDER BY i.created_at DESC LIMIT 50';

    const [invoices] = await pool.execute(query, params);

    // Format the response
    const formattedInvoices = invoices.map(invoice => ({
      ...invoice,
      items: invoice.items ? invoice.items.split(',').map(item => {
        const [productId, quantity, price] = item.split(':');
        return {
          productId: parseInt(productId),
          quantity: parseInt(quantity),
          price: parseFloat(price)
        };
      }) : []
    }));

    res.json(formattedInvoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const [invoices] = await pool.execute(
      `SELECT i.*, 
              o.order_id,
              o.customer_id,
              GROUP_CONCAT(
                CONCAT(ii.product_id, ':', ii.quantity, ':', ii.price)
              ) as items
       FROM invoices i
       LEFT JOIN orders o ON i.order_id = o.id
       LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
       WHERE i.id = ?
       GROUP BY i.id`,
      [req.params.id]
    );

    if (!invoices.length) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoices[0];
    const formattedInvoice = {
      ...invoice,
      items: invoice.items ? invoice.items.split(',').map(item => {
        const [productId, quantity, price] = item.split(':');
        return {
          productId: parseInt(productId),
          quantity: parseInt(quantity),
          price: parseFloat(price)
        };
      }) : []
    };

    res.json(formattedInvoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

exports.getInvoiceByOrderId = async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId, 10);
    console.log('Looking for invoice with order_id:', orderId);

    const [invoices] = await pool.execute(
      `SELECT i.*, o.order_id, o.customer_id
       FROM invoices i
       JOIN orders o ON i.order_id = o.id
       WHERE i.order_id = ?`,
      [orderId]
    );

    console.log('Invoices found:', invoices);

    if (!invoices.length) {
      return res.status(404).json({ error: 'Invoice not found for this order' });
    }

    // Then get the order items
    const [items] = await pool.execute(
      `SELECT oi.item_type, oi.quantity, oi.price, oi.total
       FROM order_items oi
       WHERE oi.order_id = ?`,
      [orderId]
    );

    // Get payments if any
    const [payments] = await pool.execute(
      `SELECT p.amount, p.method, p.paid_at
       FROM payments p
       JOIN invoices i ON p.invoice_id = i.id
       WHERE i.order_id = ?`,
      [orderId]
    );

    // Calculate total paid
    const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

    // Combine all data
    const invoice = {
      ...invoices[0],
      items: items,
      payments: payments,
      total_paid: totalPaid,
      remaining_balance: parseFloat(invoices[0].total_amount) - totalPaid
    };

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice by order ID:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
}; 