import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  TextField,
  Paper,
  IconButton,
  Badge,
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import RemoveShoppingCartIcon from '@mui/icons-material/RemoveShoppingCart';

const products = [
  {
    id: 1,
    name: '500ml Bottle',
    price: 10,
    image: '/images/500ml-bottle.jpg',
  },
  {
    id: 2,
    name: '1L Bottle',
    price: 15,
    image: '/images/1l-bottle.jpg',
  },
  {
    id: 3,
    name: '5L Bottle',
    price: 50,
    image: '/images/5l-bottle.jpg',
  },
  {
    id: 4,
    name: '20L Bottle',
    price: 150,
    image: '/images/20l-bottle.jpg',
  },
  {
    id: 5,
    name: 'Head Clip',
    price: 20,
    image: '/images/head-clip.jpg',
  },
  {
    id: 6,
    name: 'Bottle Holder',
    price: 30,
    image: '/images/bottle-holder.jpg',
  },
];

const ShopItems = () => {
  const [cart, setCart] = useState({});
  const [customerId, setCustomerId] = useState('');

  const handleAddToCart = (productId) => {
    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  const handleRemoveFromCart = (productId) => {
    setCart((prev) => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId] -= 1;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const calculateTotal = () => {
    return Object.entries(cart).reduce((total, [productId, quantity]) => {
      const product = products.find((p) => p.id === parseInt(productId));
      return total + product.price * quantity;
    }, 0);
  };

  const handleCheckout = async () => {
    if (!customerId) {
      alert('Please enter a customer ID');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          items: Object.entries(cart).map(([productId, quantity]) => ({
            productId: parseInt(productId),
            quantity,
          })),
          total: calculateTotal(),
        }),
      });

      if (response.ok) {
        setCart({});
        alert('Purchase successful! Invoice has been generated.');
      } else {
        throw new Error('Failed to process purchase');
      }
    } catch (error) {
      console.error('Error processing purchase:', error);
      alert('Failed to process purchase. Please try again.');
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Customer Information
        </Typography>
        <TextField
          label="Customer ID"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          fullWidth
          margin="normal"
        />
      </Paper>

      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            <Card>
              <CardMedia
                component="img"
                height="200"
                image={product.image}
                alt={product.name}
              />
              <CardContent>
                <Typography variant="h6">{product.name}</Typography>
                <Typography variant="body1" color="text.secondary">
                  ₹{product.price}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton
                    color="primary"
                    onClick={() => handleAddToCart(product.id)}
                  >
                    <AddShoppingCartIcon />
                  </IconButton>
                  <Badge badgeContent={cart[product.id] || 0} color="primary">
                    <Typography variant="body1">In Cart</Typography>
                  </Badge>
                  {cart[product.id] > 0 && (
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveFromCart(product.id)}
                    >
                      <RemoveShoppingCartIcon />
                    </IconButton>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {Object.keys(cart).length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Cart Summary
          </Typography>
          {Object.entries(cart).map(([productId, quantity]) => {
            const product = products.find((p) => p.id === parseInt(productId));
            return (
              <Box
                key={productId}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 1,
                }}
              >
                <Typography>
                  {product.name} x {quantity}
                </Typography>
                <Typography>₹{product.price * quantity}</Typography>
              </Box>
            );
          })}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mt: 2,
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6">Total</Typography>
            <Typography variant="h6">₹{calculateTotal()}</Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCheckout}
            sx={{ mt: 2 }}
            fullWidth
          >
            Checkout
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default ShopItems; 