import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Typography,
    Alert,
    Snackbar,
    Chip,
    Card,
    CardContent,
    Grid
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Inventory as InventoryIcon, Description as DescriptionIcon, AttachMoney as AttachMoneyIcon, Storage as StorageIcon, Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import axios from 'axios';
import Tooltip from '@mui/material/Tooltip';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        stock: '',
        description: ''
    });
    const [formErrors, setFormErrors] = useState({
        name: '',
        price: '',
        stock: '',
        description: ''
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredProducts(products);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = products.filter(product => 
                product.name.toLowerCase().includes(query) ||
                product.description.toLowerCase().includes(query) ||
                product.price.toString().includes(query)
            );
            setFilteredProducts(filtered);
        }
    }, [searchQuery, products]);

    const fetchProducts = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/products');
            setProducts(response.data);
            setFilteredProducts(response.data);
        } catch (error) {
            showSnackbar('Error fetching products', 'error');
        }
    };

    const handleOpen = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                price: product.price,
                stock: product.stock,
                description: product.description
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                price: '',
                stock: '',
                description: ''
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditingProduct(null);
        setFormData({
            name: '',
            price: '',
            stock: '',
            description: ''
        });
        setFormErrors({
            name: '',
            price: '',
            stock: '',
            description: ''
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'price') {
            // Only allow numbers and decimal point
            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setFormData({
                    ...formData,
                    [name]: value
                });
            }
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const validateForm = () => {
        let errors = {};
        let isValid = true;

        // Name validation
        if (!formData.name.trim()) {
            errors.name = 'Product name is required';
            isValid = false;
        } else if (formData.name.trim().length < 3) {
            errors.name = 'Product name must be at least 3 characters';
            isValid = false;
        } else if (/^\d+$/.test(formData.name.trim())) {
            errors.name = 'Product name cannot be purely numeric';
            isValid = false;
        }

        // Price validation
        if (!formData.price) {
            errors.price = 'Price is required';
            isValid = false;
        } else {
            const price = parseFloat(formData.price);
            if (isNaN(price) || price <= 0) {
                errors.price = 'Price must be a positive number';
                isValid = false;
            } else if (formData.price.split('.')[1]?.length > 2) {
                errors.price = 'Price can have maximum 2 decimal places';
                isValid = false;
            }
        }

        // Stock validation
        if (!formData.stock) {
            errors.stock = 'Stock quantity is required';
            isValid = false;
        } else {
            const stock = parseInt(formData.stock);
            if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
                errors.stock = 'Stock must be a positive whole number';
                isValid = false;
            }
        }

        // Description validation
        if (!formData.description.trim()) {
            errors.description = 'Description is required';
            isValid = false;
        } else if (formData.description.trim().length < 10) {
            errors.description = 'Description must be at least 10 characters';
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            showSnackbar('Please fix the errors in the form', 'error');
            return;
        }

        try {
            if (editingProduct) {
                await axios.put(`http://localhost:5000/api/products/${editingProduct.id}`, formData);
                showSnackbar('Product updated successfully');
            } else {
                await axios.post('http://localhost:5000/api/products', formData);
                showSnackbar('Product added successfully');
            }
            handleClose();
            fetchProducts();
        } catch (error) {
            showSnackbar('Error saving product', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await axios.delete(`http://localhost:5000/api/products/${id}`);
                showSnackbar('Product deleted successfully');
                fetchProducts();
            } catch (error) {
                showSnackbar('Error deleting product', 'error');
            }
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({
            ...snackbar,
            open: false
        });
    };

    const handleRowClick = (product) => {
        setSelectedProduct(product);
        setDetailsOpen(true);
    };

    const handleCloseDetails = () => {
        setDetailsOpen(false);
        setSelectedProduct(null);
    };

    return (
        <Box sx={{ p: 3, minHeight: '100vh', background: 'linear-gradient(135deg, rgba(240, 249, 255, 0.9) 0%, rgba(203, 235, 255, 0.9) 100%)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ 
                    color: '#2c3e50',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <InventoryIcon /> Products Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpen()}
                    sx={{
                        background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #2980b9 0%, #2573a7 100%)',
                        }
                    }}
                >
                    Add New Product
                </Button>
            </Box>

            {/* Search Bar */}
            <Paper 
                elevation={0}
                sx={{ 
                    p: 2, 
                    mb: 3, 
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 2,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                }}
            >
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search products by name, description, or price..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <Box sx={{ mr: 1, color: 'text.secondary' }}>
                                <SearchIcon />
                            </Box>
                        ),
                        endAdornment: searchQuery && (
                            <IconButton
                                size="small"
                                onClick={() => setSearchQuery('')}
                                sx={{ color: 'text.secondary' }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        )
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                                borderColor: 'rgba(0, 0, 0, 0.1)',
                            },
                            '&:hover fieldset': {
                                borderColor: 'rgba(0, 0, 0, 0.2)',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#3498db',
                            },
                        },
                    }}
                />
            </Paper>

            {/* Product Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ 
                        background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                        color: 'white'
                    }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Total Products</Typography>
                            <Typography variant="h4">{products.length}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ 
                        background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                        color: 'white'
                    }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>In Stock</Typography>
                            <Typography variant="h4">
                                {products.filter(p => p.stock >= 10).length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ 
                        background: 'linear-gradient(135deg, #f1c40f 0%, #f39c12 100%)',
                        color: 'white'
                    }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Low Stock</Typography>
                            <Typography variant="h4">
                                {products.filter(p => p.stock > 0 && p.stock < 10).length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ 
                        background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                        color: 'white'
                    }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Out of Stock</Typography>
                            <Typography variant="h4">
                                {products.filter(p => p.stock === 0).length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <TableContainer component={Paper} sx={{ 
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                borderRadius: 2,
                background: '#f5f8fd'
            }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ 
                            background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.10) 0%, rgba(41, 128, 185, 0.10) 100%)'
                        }}>
                            <TableCell sx={{ fontWeight: 700, fontSize: 15, px: 2 }}>Product ID</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: 15, px: 2 }}>Product Name</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: 15, px: 2 }}>Price</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: 15, px: 2 }}>Stock Quantity</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: 15, px: 2 }}>Stock Status</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: 15, px: 2 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredProducts.map((product) => (
                            <TableRow 
                                key={product.id} 
                                hover 
                                onClick={() => handleRowClick(product)}
                                sx={{ 
                                    '&:hover': { background: 'rgba(52, 152, 219, 0.05)', cursor: 'pointer' },
                                    '&:last-child td, &:last-child th': { border: 0 }
                                }}
                            >
                                <TableCell sx={{ px: 2, fontSize: 15 }}>
                                    <Chip 
                                        label={`#${product.id}`}
                                        size="small"
                                        sx={{ 
                                            background: '#e8eaf6',
                                            fontWeight: 500
                                        }}
                                    />
                                </TableCell>
                                <TableCell sx={{ px: 2, fontSize: 15 }}>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {product.name}
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ px: 2, fontSize: 15 }}>
                                    <Typography variant="body1" sx={{ 
                                        color: '#2c3e50',
                                        fontWeight: 600
                                    }}>
                                        Rs. {product.price}
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ px: 2, fontSize: 15 }}>
                                    <Typography variant="body1">
                                        {product.stock} units
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ px: 2, fontSize: 15 }}>
                                    <Chip
                                        label={
                                            product.stock === 0 
                                                ? 'Out of Stock' 
                                                : product.stock < 10 
                                                    ? 'Low Stock' 
                                                    : 'In Stock'
                                        }
                                        color={
                                            product.stock === 0 
                                                ? 'error' 
                                                : product.stock < 10 
                                                    ? 'warning' 
                                                    : 'success'
                                        }
                                        size="small"
                                        sx={{ 
                                            fontWeight: 500,
                                            minWidth: 100,
                                            textTransform: 'capitalize'
                                        }}
                                    />
                                </TableCell>
                                <TableCell sx={{ px: 2, fontSize: 15 }}>
                                    <Tooltip title="Edit Product">
                                        <IconButton 
                                            onClick={() => handleOpen(product)}
                                            sx={{ 
                                                color: '#3498db',
                                                '&:hover': { color: '#2980b9' }
                                            }}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete Product">
                                        <IconButton 
                                            onClick={() => handleDelete(product.id)}
                                            sx={{ 
                                                color: '#e74c3c',
                                                '&:hover': { color: '#c0392b' }
                                            }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Product Details Dialog */}
            <Dialog
                open={detailsOpen}
                onClose={handleCloseDetails}
                maxWidth="sm"
                fullWidth
                PaperProps={{ 
                    sx: { 
                        borderRadius: 1,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        background: '#ffffff'
                    } 
                }}
            >
                <DialogTitle sx={{ 
                    background: '#ffffff',
                    color: '#2c3e50',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 2,
                    borderBottom: '1px solid #e0e0e0'
                }}>
                    <InventoryIcon sx={{ color: '#3498db' }} />
                    <Typography variant="h6" sx={{ fontWeight: 500 }}>
                        Product Details
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    {selectedProduct && (
                        <Box>
                            <Box sx={{ 
                                p: 3,
                                background: '#f8fafc',
                                borderBottom: '1px solid #e0e0e0'
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="h6" sx={{ 
                                        fontWeight: 600,
                                        color: '#2c3e50'
                                    }}>
                                        {selectedProduct.name}
                                    </Typography>
                                    <Chip
                                        label={
                                            selectedProduct.stock === 0 
                                                ? 'Out of Stock' 
                                                : selectedProduct.stock < 10 
                                                    ? 'Low Stock' 
                                                    : 'In Stock'
                                        }
                                        color={
                                            selectedProduct.stock === 0 
                                                ? 'error' 
                                                : selectedProduct.stock < 10 
                                                    ? 'warning' 
                                                    : 'success'
                                        }
                                        size="small"
                                        sx={{ 
                                            fontWeight: 500,
                                            minWidth: 100
                                        }}
                                    />
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    Product ID: #{selectedProduct.id}
                                </Typography>
                            </Box>

                            <Box sx={{ p: 3 }}>
                                <Grid container spacing={3}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Price
                                        </Typography>
                                        <Typography variant="h6" sx={{ 
                                            color: '#2c3e50',
                                            fontWeight: 600
                                        }}>
                                            Rs. {selectedProduct.price}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Stock Quantity
                                        </Typography>
                                        <Typography variant="h6" sx={{ 
                                            color: '#2c3e50',
                                            fontWeight: 600
                                        }}>
                                            {selectedProduct.stock} units
                                        </Typography>
                                    </Grid>
                                </Grid>

                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Description
                                    </Typography>
                                    <Typography variant="body1" sx={{ 
                                        color: '#34495e',
                                        lineHeight: 1.6,
                                        background: '#f8fafc',
                                        p: 2,
                                        borderRadius: 1
                                    }}>
                                        {selectedProduct.description}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ 
                    p: 2,
                    borderTop: '1px solid #e0e0e0',
                    background: '#f8fafc'
                }}>
                    <Button 
                        onClick={handleCloseDetails}
                        variant="outlined"
                        sx={{ 
                            borderRadius: 1,
                            textTransform: 'none',
                            borderColor: '#e0e0e0',
                            color: '#2c3e50',
                            '&:hover': {
                                borderColor: '#3498db',
                                color: '#3498db'
                            }
                        }}
                    >
                        Close
                    </Button>
                    <Button 
                        onClick={() => {
                            handleCloseDetails();
                            handleOpen(selectedProduct);
                        }}
                        variant="contained"
                        startIcon={<EditIcon />}
                        sx={{
                            borderRadius: 1,
                            textTransform: 'none',
                            background: '#3498db',
                            '&:hover': {
                                background: '#2980b9'
                            }
                        }}
                    >
                        Edit Product
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: 2, boxShadow: 3 } }}
            >
                <DialogTitle sx={{ 
                    background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.95) 0%, rgba(41, 128, 185, 0.95) 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <InventoryIcon />
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Box component="form">
                        <TextField
                            fullWidth
                            label="Product Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            margin="normal"
                            required
                            error={!!formErrors.name}
                            helperText={formErrors.name}
                            sx={{ mb: 2 }}
                            InputProps={{
                                startAdornment: <DescriptionIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Price"
                            name="price"
                            type="text"
                            value={formData.price}
                            onChange={handleChange}
                            margin="normal"
                            required
                            error={!!formErrors.price}
                            helperText={formErrors.price}
                            sx={{ mb: 2 }}
                            InputProps={{
                                startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>Rs.</Typography>
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Stock Quantity"
                            name="stock"
                            type="number"
                            value={formData.stock}
                            onChange={handleChange}
                            margin="normal"
                            required
                            error={!!formErrors.stock}
                            helperText={formErrors.stock}
                            sx={{ mb: 2 }}
                            InputProps={{
                                startAdornment: <StorageIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            margin="normal"
                            multiline
                            rows={4}
                            required
                            error={!!formErrors.description}
                            helperText={formErrors.description}
                            sx={{ mb: 2 }}
                            InputProps={{
                                startAdornment: <DescriptionIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button 
                        onClick={handleClose}
                        variant="outlined"
                        sx={{ 
                            borderRadius: 2,
                            textTransform: 'none',
                            px: 3
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained"
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            px: 3,
                            background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #2980b9 0%, #2573a7 100%)',
                            }
                        }}
                    >
                        {editingProduct ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Products; 