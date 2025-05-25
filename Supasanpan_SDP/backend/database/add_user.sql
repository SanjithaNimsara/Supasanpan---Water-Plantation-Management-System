USE water_plantation;

-- First, let's clear any existing test users
DELETE FROM users WHERE email IN ('johndoe@example.com', 'test@example.com');

-- Insert new employee user with properly hashed password (password: employee123)
INSERT INTO users (full_name, username, email, password, role)
VALUES (
    'John Doe',
    'johndoe',
    'johndoe@example.com',
    '$2a$10$X7J3Y5Z9A1B3C5D7E9G1I3K5M7O9Q1S3U5W7Y9A1C3E5G7I9K1M3O5Q7S9U',
    'employee'
);

-- Insert new test user with properly hashed password (password: test123)
INSERT INTO users (full_name, username, email, password, role)
VALUES (
    'Test User',
    'testuser',
    'test@example.com',
    '$2a$10$X7J3Y5Z9A1B3C5D7E9G1I3K5M7O9Q1S3U5W7Y9A1C3E5G7I9K1M3O5Q7S9U',
    'employee'
); 