const pool = require('../../config/database');

const sampleProducts = [
  {
    id: 1,
    name: '500ml Bottle',
    price: 10,
    image: '/images/500ml-bottle.jpg',
    description: 'Compact 500ml water bottle, perfect for daily use',
    stock: 100
  },
  {
    id: 2,
    name: '1L Bottle',
    price: 15,
    image: '/images/1l-bottle.jpg',
    description: '1 liter water bottle with ergonomic design',
    stock: 100
  },
  {
    id: 3,
    name: '5L Bottle',
    price: 50,
    image: '/images/5l-bottle.jpg',
    description: 'Large 5 liter water bottle for family use',
    stock: 100
  },
  {
    id: 4,
    name: '20L Bottle',
    price: 150,
    image: '/images/20l-bottle.jpg',
    description: '20 liter water bottle with dispenser',
    stock: 100
  },
  {
    id: 5,
    name: 'Head Clip',
    price: 20,
    image: '/images/head-clip.jpg',
    description: 'Comfortable head clip for carrying water bottles',
    stock: 100
  },
  {
    id: 6,
    name: 'Bottle Holder',
    price: 30,
    image: '/images/bottle-holder.jpg',
    description: 'Durable bottle holder for easy transportation',
    stock: 100
  }
];

async function initializeDatabase() {
  const connection = await pool.getConnection();
  try {
    // Create database
    await connection.query('CREATE DATABASE IF NOT EXISTS water_plantation');
    await connection.query('USE water_plantation');

    // Create products table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        image VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        stock INT NOT NULL DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create invoices table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id VARCHAR(255) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        status ENUM('pending', 'completed', 'cancelled') DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create invoice_items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Insert sample products
    for (const product of sampleProducts) {
      await connection.query(
        'INSERT IGNORE INTO products (id, name, price, image, description, stock) VALUES (?, ?, ?, ?, ?, ?)',
        [product.id, product.name, product.price, product.image, product.description, product.stock]
      );
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    connection.release();
  }
}

initializeDatabase(); 