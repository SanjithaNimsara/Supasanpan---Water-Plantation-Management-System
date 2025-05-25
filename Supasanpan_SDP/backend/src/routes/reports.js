const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const { auth } = require('../../middleware/auth');
const { Parser } = require('json2csv');

// Helper: get date filter
function getDateFilter(timeRange) {
  switch (timeRange) {
    case 'day':
      return 'DATE(o.created_at) = CURDATE()';
    case 'week':
      return 'YEARWEEK(o.created_at, 1) = YEARWEEK(CURDATE(), 1)';
    case 'month':
      return 'YEAR(o.created_at) = YEAR(CURDATE()) AND MONTH(o.created_at) = MONTH(CURDATE())';
    case 'year':
      return 'YEAR(o.created_at) = YEAR(CURDATE())';
    default:
      return '1';
  }
}

// Billing report main endpoint
router.get('/billing', auth, async (req, res) => {
  const timeRange = req.query.timeRange || 'week';
  const dateFilter = getDateFilter(timeRange);
  const connection = await pool.getConnection();
  try {
    // Revenue over time
    const [revenueData] = await connection.query(
      `SELECT DATE(o.created_at) as date, SUM(oi.total) as revenue
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE ${dateFilter}
       GROUP BY DATE(o.created_at)
       ORDER BY date`
    );
    // Payment methods
    const [paymentMethods] = await connection.query(
      `SELECT p.method as name, SUM(p.amount) as value
       FROM payments p
       LEFT JOIN invoices i ON p.invoice_id = i.id
       LEFT JOIN orders o ON i.order_id = o.id
       WHERE ${dateFilter}
       GROUP BY p.method`
    );
    // Product sales
    const [productSales] = await connection.query(
      `SELECT pr.name, SUM(oi.quantity) as sales, SUM(oi.total) as revenue
       FROM order_items oi
       LEFT JOIN products pr ON oi.product_id = pr.id
       LEFT JOIN orders o ON oi.order_id = o.id
       WHERE ${dateFilter}
       GROUP BY pr.name
       ORDER BY sales DESC`
    );
    // Sales trend
    const [salesData] = await connection.query(
      `SELECT DATE(o.created_at) as date, COUNT(o.id) as sales, SUM(oi.quantity) as orders
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE ${dateFilter}
       GROUP BY DATE(o.created_at)
       ORDER BY date`
    );
    res.json({ revenueData, paymentMethods, productSales, salesData });
  } catch (error) {
    console.error('Error fetching report data:', error);
    res.status(500).json({ error: 'Error fetching report data' });
  } finally {
    connection.release();
  }
});

// Export billing report as CSV
router.get('/billing/export', auth, async (req, res) => {
  const timeRange = req.query.timeRange || 'week';
  const dateFilter = getDateFilter(timeRange);
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      `SELECT o.order_id, o.created_at, pr.name as product, oi.quantity, oi.price, oi.total, i.invoice_id, i.total_amount
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products pr ON oi.product_id = pr.id
       LEFT JOIN invoices i ON o.id = i.order_id
       WHERE ${dateFilter}
       ORDER BY o.created_at DESC`
    );
    const parser = new Parser();
    const csv = parser.parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('billing_report.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ error: 'Error exporting report' });
  } finally {
    connection.release();
  }
});

// Top products report
router.get('/billing/top-products', auth, async (req, res) => {
  const timeRange = req.query.timeRange || 'week';
  const dateFilter = getDateFilter(timeRange);
  const connection = await pool.getConnection();
  try {
    const [topProducts] = await connection.query(
      `SELECT pr.name, SUM(oi.quantity) as sales, SUM(oi.total) as revenue
       FROM order_items oi
       LEFT JOIN products pr ON oi.product_id = pr.id
       LEFT JOIN orders o ON oi.order_id = o.id
       WHERE ${dateFilter}
       GROUP BY pr.name
       ORDER BY sales DESC
       LIMIT 10`
    );
    res.json({ topProducts });
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ error: 'Error fetching top products' });
  } finally {
    connection.release();
  }
});

// Sales by product (was: by category)
router.get('/billing/sales-by-category', auth, async (req, res) => {
  const timeRange = req.query.timeRange || 'week';
  const dateFilter = getDateFilter(timeRange);
  const connection = await pool.getConnection();
  try {
    const [salesByProduct] = await connection.query(
      `SELECT pr.name as product, SUM(oi.quantity) as sales, SUM(oi.total) as revenue
       FROM order_items oi
       LEFT JOIN products pr ON oi.product_id = pr.id
       LEFT JOIN orders o ON oi.order_id = o.id
       WHERE ${dateFilter}
       GROUP BY pr.name
       ORDER BY sales DESC`
    );
    res.json({ salesByProduct });
  } catch (error) {
    console.error('Error fetching sales by product:', error);
    res.status(500).json({ error: 'Error fetching sales by product' });
  } finally {
    connection.release();
  }
});

module.exports = router; 