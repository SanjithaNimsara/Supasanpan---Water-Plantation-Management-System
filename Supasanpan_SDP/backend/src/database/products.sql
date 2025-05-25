-- Drop the table if it exists
DROP TABLE IF EXISTS products;

-- Create the products table
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add some sample data
INSERT INTO products (name, price, stock, description) VALUES
('Mineral Water 500ml', 1.50, 100, 'Pure mineral water in 500ml bottle'),
('Mineral Water 1L', 2.50, 75, 'Pure mineral water in 1L bottle'),
('Spring Water 500ml', 1.75, 50, 'Natural spring water in 500ml bottle'),
('Spring Water 1L', 3.00, 60, 'Natural spring water in 1L bottle'),
('Distilled Water 500ml', 2.00, 40, 'Distilled water for laboratory use'),
('Distilled Water 1L', 3.50, 30, 'Distilled water for laboratory use'); 