import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    MenuItem,
    Chip,
    Alert,
    Tooltip
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Payment as PaymentIcon, Download as DownloadIcon, Receipt as ReceiptIcon, ShoppingCart as ShoppingCartIcon, Search as SearchIcon, Close as CloseIcon, Print as PrintIcon } from '@mui/icons-material';
import axios from 'axios';

const Billing = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [openOrderDialog, setOpenOrderDialog] = useState(false);
    const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
    const [openOrderDetailsDialog, setOpenOrderDetailsDialog] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    const [newOrder, setNewOrder] = useState({
        items: [{ item_type: '', quantity: 1, price: 0, deposit: 0, total: 0 }],
        payment: {
            amount: '',
            method: 'cash'
        }
    });
    const [newPayment, setNewPayment] = useState({
        amount: '',
        method: 'cash'
    });
    const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });
    const [products, setProducts] = useState([]);
    const [orderErrors, setOrderErrors] = useState({});
    const [openInvoiceDialog, setOpenInvoiceDialog] = useState(false);
    const [invoiceData, setInvoiceData] = useState(null);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        fetchOrders();
        fetchProducts();
        // Get user role from localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.role) {
            setUserRole(user.role);
        }
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredOrders(orders);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = orders.filter(order => 
                order.customer_id.toString().includes(query)
            );
            setFilteredOrders(filtered);
        }
    }, [searchQuery, orders]);

    const fetchOrders = async () => {
        try {
            const response = await axios.get('/api/billing/orders', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setOrders(response.data);
            setFilteredOrders(response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
            showAlert('Error fetching orders', 'error');
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await axios.get('/api/products');
            setProducts(response.data);
        } catch (error) {
            showAlert('Error fetching products', 'error');
        }
    };

    const validateOrder = () => {
        const errors = {};
        // 1. At least one item
        if (!newOrder.items || newOrder.items.length === 0) {
            errors.items = 'Please add at least one item to the order.';
        }
        newOrder.items.forEach((item, idx) => {
            // 2. Product selected
            if (!item.product_id) {
                errors[`product_${idx}`] = 'Select a product.';
            }
            // 3. Quantity
            if (!item.quantity || isNaN(item.quantity) || item.quantity <= 0) {
                errors[`quantity_${idx}`] = 'Enter a valid quantity (>0).';
            } else {
                // Check stock if product exists
                const product = products.find(p => p.id === parseInt(item.product_id));
                if (product && item.quantity > product.stock) {
                    errors[`quantity_${idx}`] = `Only ${product.stock} in stock.`;
                }
            }
            // 4. Price
            if (!item.price || isNaN(item.price) || item.price <= 0) {
                errors[`price_${idx}`] = 'Enter a valid price (>0).';
            }
            // 5. Deposit
            if (item.deposit < 0 || isNaN(item.deposit)) {
                errors[`deposit_${idx}`] = 'Deposit cannot be negative.';
            } else if (item.deposit > item.quantity * item.price) {
                errors[`deposit_${idx}`] = 'Deposit cannot exceed total price.';
            }
            // 6. Total
            if ((item.total || 0) < 0) {
                errors[`total_${idx}`] = 'Total cannot be negative.';
            }
        });
        // 7. Payment Amount
        if (isNaN(newOrder.payment.amount) || newOrder.payment.amount === '' || Number(newOrder.payment.amount) < 0) {
            errors.payment_amount = 'Enter a valid payment amount (0 or more).';
        }
        // 8. Payment Method
        if (!newOrder.payment.method) {
            errors.payment_method = 'Select a payment method.';
        }
        setOrderErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateOrder = async () => {
        if (!validateOrder()) return;
        try {
            // Validate order items
            if (!newOrder.items || newOrder.items.length === 0) {
                showAlert('Please add at least one item to the order', 'error');
                return;
            }

            // Validate each item
            for (const item of newOrder.items) {
                if (!item.item_type || !item.quantity || !item.price) {
                    showAlert('Please fill in all item details', 'error');
                    return;
                }
            }

            const response = await axios.post('/api/billing/orders', newOrder, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            
            // If payment amount is provided, record the payment
            if (newOrder.payment && newOrder.payment.amount > 0) {
                if (!response.data.order || !response.data.order.invoice_id) {
                    throw new Error('No invoice ID received from order creation');
                }

                await axios.post('/api/billing/payments', {
                    invoice_id: response.data.order.invoice_id,
                    amount: parseFloat(newOrder.payment.amount),
                    method: newOrder.payment.method
                }, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
            }
            
            setOpenOrderDialog(false);
            setNewOrder({
                items: [{ item_type: '', quantity: 1, price: 0, deposit: 0, total: 0 }],
                payment: {
                    amount: '',
                    method: 'cash'
                }
            });
            fetchOrders();
            showAlert('Order created successfully', 'success');
        } catch (error) {
            console.error('Error creating order:', error);
            showAlert(error.response?.data?.error || 'Error creating order', 'error');
        }
    };

    const handleRecordPayment = async () => {
        try {
            if (!selectedOrder || !selectedOrder.invoice_id) {
                showAlert('No invoice selected for payment', 'error');
                return;
            }

            if (!newPayment.amount || newPayment.amount <= 0) {
                showAlert('Please enter a valid payment amount', 'error');
                return;
            }

            if (!newPayment.method) {
                showAlert('Please select a payment method', 'error');
                return;
            }

            // Get the current order details to check total amount
            const orderResponse = await axios.get(`/api/billing/orders/${selectedOrder.id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            const totalAmount = orderResponse.data.total_amount || 0;
            const currentPaid = orderResponse.data.total_paid || 0;
            const remainingBalance = totalAmount - currentPaid;

            if (parseFloat(newPayment.amount) > remainingBalance) {
                showAlert(`Payment amount cannot exceed remaining balance of Rs. ${remainingBalance.toFixed(2)}`, 'error');
                return;
            }

            await axios.post('/api/billing/payments', {
                invoice_id: selectedOrder.invoice_id,
                amount: parseFloat(newPayment.amount),
                method: newPayment.method
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            
            setOpenPaymentDialog(false);
            setNewPayment({ amount: '', method: 'cash' });
            fetchOrders();
            showAlert('Payment recorded successfully', 'success');
        } catch (error) {
            console.error('Error recording payment:', error);
            showAlert(error.response?.data?.error || 'Error recording payment', 'error');
        }
    };

    const handleViewInvoice = async (orderId) => {
        try {
            // Get the invoice details using the order ID
            const response = await axios.get(`/api/billing/invoices/order/${orderId}`, {
                headers: { 
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.data) {
                showAlert('Error loading invoice data', 'error');
                return;
            }

            setInvoiceData(response.data);
            setOpenInvoiceDialog(true);
        } catch (error) {
            console.error('Error fetching invoice:', error);
            if (error.response?.status === 404) {
                showAlert('No invoice found for this order', 'error');
            } else {
                showAlert(error.response?.data?.message || 'Error fetching invoice', 'error');
            }
        }
    };

    const handlePrintInvoice = () => {
        if (!invoiceData) {
            showAlert('No invoice data available to print', 'error');
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            showAlert('Please allow popups to print the invoice', 'error');
            return;
        }

        // Calculate the actual total paid (excluding balance)
        const totalPaid = invoiceData.payments ? 
            invoiceData.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) : 0;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Invoice</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            padding: 10px;
                            font-size: 12px;
                            max-width: 800px;
                            margin: 0 auto;
                        }
                        .header { 
                            text-align: center; 
                            margin-bottom: 15px;
                            border-bottom: 1px solid #ddd;
                            padding-bottom: 10px;
                        }
                        .header h1 {
                            font-size: 18px;
                            margin: 0;
                        }
                        .header p {
                            margin: 5px 0;
                            font-size: 12px;
                        }
                        .details { 
                            margin-bottom: 15px;
                            display: flex;
                            justify-content: space-between;
                        }
                        .details div {
                            flex: 1;
                        }
                        table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin-bottom: 15px;
                            font-size: 11px;
                        }
                        th, td { 
                            border: 1px solid #ddd; 
                            padding: 4px; 
                            text-align: left; 
                        }
                        th { 
                            background-color: #f5f5f5; 
                            font-weight: bold;
                        }
                        .total { 
                            text-align: right; 
                            font-weight: bold;
                            border-top: 2px solid #000;
                            padding-top: 5px;
                            margin-top: 5px;
                        }
                        .total p {
                            margin: 3px 0;
                        }
                        @media print {
                            body { 
                                padding: 0;
                                margin: 0;
                            }
                            .no-print { 
                                display: none; 
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>INVOICE</h1>
                        <p>Order ID: ${invoiceData.order_id}</p>
                        <p>Date: ${new Date(invoiceData.created_at).toLocaleDateString()}</p>
                    </div>
                    <div class="details">
                        <div>
                            <strong>Customer ID:</strong> ${invoiceData.customer_id || 'N/A'}<br>
                            <strong>Invoice ID:</strong> ${invoiceData.invoice_id}<br>
                            <strong>Status:</strong> ${invoiceData.status}
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoiceData.items.map(item => `
                                <tr>
                                    <td>${item.item_type || 'N/A'}</td>
                                    <td>${item.quantity || 0}</td>
                                    <td>Rs. ${Number(item.price || 0).toFixed(2)}</td>
                                    <td>Rs. ${Number(item.total || 0).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="total">
                        <p>Total Amount: Rs. ${Number(invoiceData.total_amount || 0).toFixed(2)}</p>
                        <p>Amount Paid: Rs. ${totalPaid.toFixed(2)}</p>
                        <p>Remaining Balance: Rs. ${(Number(invoiceData.total_amount || 0) - totalPaid).toFixed(2)}</p>
                    </div>
                    <div class="no-print" style="text-align: center; margin-top: 10px;">
                        <button onclick="window.print()" style="padding: 5px 10px;">Print Invoice</button>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleDeleteOrder = async (orderId) => {
        if (!canDeleteOrder()) {
            showAlert('You do not have permission to delete orders', 'error');
            return;
        }
        
        if (window.confirm('Are you sure you want to delete this order?')) {
            try {
                await axios.delete(`/api/billing/orders/${orderId}`, {
                    headers: { 
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });
                showAlert('Order deleted successfully', 'success');
                fetchOrders();
            } catch (error) {
                console.error('Error deleting order:', error);
                showAlert(error.response?.data?.message || 'Error deleting order', 'error');
            }
        }
    };

    const handleOrderRowClick = async (order) => {
        try {
            const response = await axios.get(`/api/billing/orders/${order.id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setSelectedOrderDetails(response.data);
            setOpenOrderDetailsDialog(true);
        } catch (error) {
            console.error('Error fetching order details:', error);
            showAlert('Error fetching order details', 'error');
        }
    };

    const showAlert = (message, severity) => {
        setAlert({ show: true, message, severity });
        setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 3000);
    };

    const handleOpenOrderDialog = () => {
        setNewOrder({
            items: [{ item_type: '', quantity: 1, price: 0, deposit: 0, total: 0 }],
            payment: {
                amount: '',
                method: 'cash'
            }
        });
        setOpenOrderDialog(true);
    };

    // Calculate total amount for the order
    const calculateOrderTotal = () => {
        return newOrder.items.reduce((sum, item) => sum + (item.total || 0), 0);
    };

    // Add function to check if user can delete
    const canDeleteOrder = () => {
        return userRole === 'admin' || userRole === 'manager';
    };

    return (
        <Box sx={{ p: 3, minHeight: '100vh', background: 'linear-gradient(135deg, rgba(240, 249, 255, 0.9) 0%, rgba(203, 235, 255, 0.9) 100%)' }}>
            {alert.show && (
                <Alert severity={alert.severity} sx={{ mb: 2 }}>
                    {alert.message}
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <ReceiptIcon sx={{ color: (theme) => theme.palette.primary.main, fontSize: 32, mr: 2, mb: 0.3 }} />
                        <Typography variant="h5" fontWeight={600} sx={{ lineHeight: 1 }}>
                            Billing Management
                        </Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenOrderDialog}
                            sx={{
                                bgcolor: (theme) => theme.palette.primary.main,
                                '&:hover': { bgcolor: (theme) => theme.palette.primary.dark },
                                ml: 8
                            }}
                        >
                            New Order
                        </Button>
                    </Box>
                </Grid>

                <Grid item xs={12}>
                    <Card sx={{ boxShadow: 3, borderRadius: 3, background: '#f5f8fd' }}>
                        <CardContent>
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
                                    placeholder="Search orders by customer ID..."
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

                            <TableContainer component={Paper} sx={{ boxShadow: 0, borderRadius: 3, overflowX: 'unset', background: '#f5f8fd' }}>
                                <Table size="small" sx={{ minWidth: 900, tableLayout: 'fixed' }}>
                                    <TableHead>
                                        <TableRow sx={{ background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.10) 0%, rgba(41, 128, 185, 0.10) 100%)' }}>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 15, px: 2 }}>Order ID</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 15, px: 2 }}>Customer ID</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 15, px: 2 }}>Items</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 15, px: 2 }}>Total</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 15, px: 2 }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 15, px: 2 }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredOrders.map((order, index) => (
                                            <TableRow 
                                                key={order.id}
                                                onClick={() => handleOrderRowClick(order)}
                                                sx={{ 
                                                    cursor: 'pointer',
                                                    '&:hover': { 
                                                        backgroundColor: 'rgba(52, 152, 219, 0.08)',
                                                        transition: 'background-color 0.2s'
                                                    },
                                                    ...(index === 0 && {
                                                        background: 'linear-gradient(135deg, rgba(46, 204, 113, 0.08) 0%, rgba(39, 174, 96, 0.08) 100%)',
                                                        '&:hover': {
                                                            background: 'linear-gradient(135deg, rgba(46, 204, 113, 0.12) 0%, rgba(39, 174, 96, 0.12) 100%)'
                                                        }
                                                    })
                                                }}
                                            >
                                                <TableCell sx={{ px: 2, fontSize: 15 }}>
                                                    {order.id}
                                                    {index === 0 && (
                                                        <Chip
                                                            label="New"
                                                            size="small"
                                                            color="success"
                                                            sx={{ 
                                                                ml: 1, 
                                                                height: 20,
                                                                '& .MuiChip-label': {
                                                                    px: 1,
                                                                    fontSize: '0.75rem'
                                                                }
                                                            }}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell sx={{ px: 2, fontSize: 15 }}>{order.customer_id}</TableCell>
                                                <TableCell sx={{ px: 2, fontSize: 15 }}>{order.total_items}</TableCell>
                                                <TableCell sx={{ px: 2, fontSize: 15 }}>Rs. {order.order_total}</TableCell>
                                                <TableCell sx={{ px: 2, fontSize: 15 }}>
                                                    <Chip
                                                        label={order.invoice_status}
                                                        color={order.invoice_status === 'paid' ? 'success' : order.invoice_status === 'cancelled' ? 'error' : 'warning'}
                                                        size="small"
                                                        sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ px: 2, fontSize: 15 }}>
                                                    {order.invoice_status !== 'paid' && (
                                                        <Tooltip title="Record Payment">
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedOrder(order);
                                                                    setOpenPaymentDialog(true);
                                                                }}
                                                                color="primary"
                                                            >
                                                                <PaymentIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip title="View Invoice">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleViewInvoice(order.id);
                                                            }}
                                                            color="primary"
                                                        >
                                                            <ReceiptIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {canDeleteOrder() && (
                                                        <Tooltip title="Delete Order">
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteOrder(order.id);
                                                                }}
                                                                color="error"
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* New Order Dialog */}
            <Dialog open={openOrderDialog} onClose={() => setOpenOrderDialog(false)} maxWidth="md" fullWidth
                PaperProps={{ sx: { borderRadius: 2, boxShadow: 3 } }}
            >
                <DialogTitle sx={{
                    background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.95) 0%, rgba(41, 128, 185, 0.95) 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <ShoppingCartIcon />
                    Create New Order
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                        {orderErrors.items && (
                            <Grid item xs={12}>
                                <Alert severity="error" sx={{ mb: 1 }}>{orderErrors.items}</Alert>
                            </Grid>
                        )}
                        {newOrder.items.map((item, index) => (
                            <Grid container spacing={2} alignItems="center" key={index} sx={index === 0 ? { mt: 2 } : {}}>
                                <Grid item xs={4}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Product"
                                        value={item.product_id || ''}
                                        onChange={(e) => {
                                            const productId = e.target.value;
                                            const product = products.find(p => p.id === parseInt(productId));
                                            const newItems = [...newOrder.items];
                                            newItems[index].product_id = productId;
                                            newItems[index].item_type = product ? product.name : '';
                                            newItems[index].price = product ? product.price : 0;
                                            newItems[index].total = newItems[index].quantity * (product ? product.price : 0) - newItems[index].deposit;
                                            setNewOrder({ ...newOrder, items: newItems });
                                        }}
                                        InputProps={{
                                            startAdornment: <ShoppingCartIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                        }}
                                        error={!!orderErrors[`product_${index}`]}
                                        helperText={orderErrors[`product_${index}`]}
                                    >
                                        <MenuItem value="">Select Product</MenuItem>
                                        {products.map((product) => (
                                            <MenuItem 
                                                key={product.id} 
                                                value={product.id}
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                                    }
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                                    <Box sx={{ 
                                                        width: 8, 
                                                        height: 8, 
                                                        borderRadius: '50%', 
                                                        mr: 1,
                                                        backgroundColor: product.stock > 0 ? '#4caf50' : '#f44336'
                                                    }} />
                                                    <Typography>{product.name}</Typography>
                                                </Box>
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center',
                                                    ml: 2,
                                                    color: product.stock > 0 ? 'success.main' : 'error.main',
                                                    fontSize: '0.875rem'
                                                }}>
                                                    <Typography variant="body2" sx={{ mr: 1 }}>
                                                        {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                        Rs. {product.price}
                                                    </Typography>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={2}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Quantity"
                                        value={item.quantity}
                                        onChange={(e) => {
                                            const newItems = [...newOrder.items];
                                            newItems[index].quantity = parseInt(e.target.value);
                                            newItems[index].total = newItems[index].quantity * newItems[index].price - newItems[index].deposit;
                                            setNewOrder({ ...newOrder, items: newItems });
                                        }}
                                        error={!!orderErrors[`quantity_${index}`]}
                                        helperText={orderErrors[`quantity_${index}`]}
                                    />
                                </Grid>
                                <Grid item xs={2}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Price"
                                        value={item.price}
                                        onChange={(e) => {
                                            const newItems = [...newOrder.items];
                                            newItems[index].price = parseFloat(e.target.value);
                                            newItems[index].total = newItems[index].quantity * newItems[index].price - newItems[index].deposit;
                                            setNewOrder({ ...newOrder, items: newItems });
                                        }}
                                        error={!!orderErrors[`price_${index}`]}
                                        helperText={orderErrors[`price_${index}`]}
                                    />
                                </Grid>
                                <Grid item xs={2}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Deposit"
                                        value={item.deposit}
                                        onChange={(e) => {
                                            const newItems = [...newOrder.items];
                                            newItems[index].deposit = parseFloat(e.target.value);
                                            newItems[index].total = newItems[index].quantity * newItems[index].price - newItems[index].deposit;
                                            setNewOrder({ ...newOrder, items: newItems });
                                        }}
                                        error={!!orderErrors[`deposit_${index}`]}
                                        helperText={orderErrors[`deposit_${index}`]}
                                    />
                                </Grid>
                                <Grid item xs={2}>
                                    <TextField
                                        fullWidth
                                        label="Total"
                                        value={item.total.toFixed(2)}
                                        InputProps={{ readOnly: true }}
                                        error={!!orderErrors[`total_${index}`]}
                                        helperText={orderErrors[`total_${index}`]}
                                    />
                                </Grid>
                                <Grid item xs={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                                    <Tooltip title="Remove Item">
                                        <IconButton
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newItems = newOrder.items.filter((_, i) => i !== index);
                                                setNewOrder({ ...newOrder, items: newItems });
                                            }}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Grid>
                            </Grid>
                        ))}
                        <Grid item xs={12}>
                            <Button
                                startIcon={<AddIcon />}
                                onClick={() => {
                                    setNewOrder({
                                        ...newOrder,
                                        items: [
                                            ...newOrder.items,
                                            { item_type: '', quantity: 1, price: 0, deposit: 0, total: 0 }
                                        ]
                                    });
                                }}
                                sx={{ borderRadius: 2, textTransform: 'none', mt: 1 }}
                            >
                                Add Item
                            </Button>
                        </Grid>

                        {/* Payment Section */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'primary.main', mt: 2 }}>
                                Payment Information
                            </Typography>
                            <Paper sx={{ 
                                p: 2, 
                                mt: 1,
                                background: 'linear-gradient(135deg, rgba(240, 249, 255, 0.9) 0%, rgba(203, 235, 255, 0.9) 100%)',
                                borderRadius: 2
                            }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Total Amount
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            Rs. {calculateOrderTotal().toFixed(2)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            type="text"
                                            label="Payment Amount"
                                            value={newOrder.payment.amount}
                                            onChange={(e) => {
                                                let value = e.target.value;
                                                if (newOrder.payment.amount === '0') {
                                                    value = value.replace(/^0/, '');
                                                }
                                                setNewOrder({
                                                    ...newOrder,
                                                    payment: {
                                                        ...newOrder.payment,
                                                        amount: value
                                                    }
                                                });
                                            }}
                                            onFocus={(e) => {
                                                if (e.target.value === '0') {
                                                    setNewOrder({
                                                        ...newOrder,
                                                        payment: {
                                                            ...newOrder.payment,
                                                            amount: ''
                                                        }
                                                    });
                                                }
                                            }}
                                            InputProps={{
                                                startAdornment: <PaymentIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                            }}
                                            error={!!orderErrors.payment_amount}
                                            helperText={orderErrors.payment_amount}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            select
                                            label="Payment Method"
                                            value={newOrder.payment.method}
                                            onChange={(e) => setNewOrder({
                                                ...newOrder,
                                                payment: {
                                                    ...newOrder.payment,
                                                    method: e.target.value
                                                }
                                            })}
                                            error={!!orderErrors.payment_method}
                                            helperText={orderErrors.payment_method}
                                        >
                                            <MenuItem value="cash">Cash</MenuItem>
                                            <MenuItem value="card">Card</MenuItem>
                                        </TextField>
                                    </Grid>
                                    {newOrder.payment.amount > 0 && (
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary">
                                                Remaining Balance
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium" color={calculateOrderTotal() - newOrder.payment.amount > 0 ? 'error.main' : 'success.main'}>
                                                Rs. {(calculateOrderTotal() - newOrder.payment.amount).toFixed(2)}
                                            </Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            </Paper>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button 
                        onClick={() => setOpenOrderDialog(false)}
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
                        onClick={handleCreateOrder} 
                        variant="contained" 
                        sx={{ 
                            borderRadius: 2, 
                            textTransform: 'none', 
                            px: 3,
                            background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.95) 0%, rgba(41, 128, 185, 0.95) 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, rgba(41, 128, 185, 0.95) 0%, rgba(52, 152, 219, 0.95) 100%)'
                            }
                        }}
                    >
                        Create Order
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Payment Dialog */}
            <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)}>
                <DialogTitle>Record Payment</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                type="text"
                                label="Amount"
                                value={newPayment.amount}
                                onChange={(e) => {
                                    let value = e.target.value;
                                    if (newPayment.amount === '0') {
                                        value = value.replace(/^0/, '');
                                    }
                                    setNewPayment({ ...newPayment, amount: value });
                                }}
                                onFocus={(e) => {
                                    if (e.target.value === '0') {
                                        setNewPayment({ ...newPayment, amount: '' });
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                select
                                label="Payment Method"
                                value={newPayment.method}
                                onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}
                            >
                                <MenuItem value="cash">Cash</MenuItem>
                                <MenuItem value="card">Card</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPaymentDialog(false)}>Cancel</Button>
                    <Button onClick={handleRecordPayment} variant="contained">
                        Record Payment
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Order Details Dialog */}
            <Dialog 
                open={openOrderDetailsDialog} 
                onClose={() => setOpenOrderDetailsDialog(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2, boxShadow: 3 } }}
            >
                <DialogTitle sx={{
                    background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.95) 0%, rgba(41, 128, 185, 0.95) 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <ReceiptIcon />
                    Order Details
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {selectedOrderDetails && (
                        <Box sx={{ mt: 2 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'primary.main' }}>
                                        Order Information
                                    </Typography>
                                    <Paper sx={{ 
                                        p: 2, 
                                        mt: 1,
                                        background: 'linear-gradient(135deg, rgba(240, 249, 255, 0.9) 0%, rgba(203, 235, 255, 0.9) 100%)',
                                        borderRadius: 2
                                    }}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Order ID
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {selectedOrderDetails.id}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Customer ID
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {selectedOrderDetails.customer_id}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Created At
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {new Date(selectedOrderDetails.created_at).toLocaleString()}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Status
                                                </Typography>
                                                <Chip
                                                    label={selectedOrderDetails.payment_status}
                                                    color={selectedOrderDetails.payment_status === 'paid' ? 'success' : 'warning'}
                                                    size="small"
                                                    sx={{ mt: 0.5, fontWeight: 600, textTransform: 'capitalize' }}
                                                />
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'primary.main' }}>
                                        Order Items
                                    </Typography>
                                    <TableContainer component={Paper} sx={{ 
                                        mt: 1,
                                        background: 'linear-gradient(135deg, rgba(240, 249, 255, 0.9) 0%, rgba(203, 235, 255, 0.9) 100%)',
                                        borderRadius: 2
                                    }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.10) 0%, rgba(41, 128, 185, 0.10) 100%)' }}>
                                                    <TableCell sx={{ fontWeight: 600 }}>Item Type</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Quantity</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Price</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Deposit</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {selectedOrderDetails.items?.map((item, index) => (
                                                    <TableRow key={index} hover>
                                                        <TableCell>{item.item_type}</TableCell>
                                                        <TableCell align="right">{item.quantity}</TableCell>
                                                        <TableCell align="right">Rs. {Number(item.price || 0).toFixed(2)}</TableCell>
                                                        <TableCell align="right">Rs. {Number(item.deposit || 0).toFixed(2)}</TableCell>
                                                        <TableCell align="right">Rs. {Number(item.total || 0).toFixed(2)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'primary.main' }}>
                                        Payment Information
                                    </Typography>
                                    <Paper sx={{ 
                                        p: 2, 
                                        mt: 1,
                                        background: 'linear-gradient(135deg, rgba(240, 249, 255, 0.9) 0%, rgba(203, 235, 255, 0.9) 100%)',
                                        borderRadius: 2
                                    }}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Total Amount
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    Rs. {Number(selectedOrderDetails.total_amount || 0).toFixed(2)}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Amount Paid
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    Rs. {Number(selectedOrderDetails.payments?.reduce((sum, payment) => 
                                                        sum + parseFloat(payment.amount), 0) || 0).toFixed(2)}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Remaining Balance
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium" color="error.main">
                                                    Rs. {(Number(selectedOrderDetails.total_amount || 0) - 
                                                        Number(selectedOrderDetails.payments?.reduce((sum, payment) => 
                                                            sum + parseFloat(payment.amount), 0) || 0)).toFixed(2)}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button 
                        onClick={() => setOpenOrderDetailsDialog(false)}
                        variant="outlined"
                        sx={{ 
                            borderRadius: 2,
                            textTransform: 'none',
                            px: 3
                        }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Invoice Dialog */}
            <Dialog 
                open={openInvoiceDialog} 
                onClose={() => setOpenInvoiceDialog(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2, boxShadow: 3 } }}
            >
                <DialogTitle sx={{
                    background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.95) 0%, rgba(41, 128, 185, 0.95) 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReceiptIcon />
                        Invoice
                    </Box>
                    <IconButton
                        onClick={handlePrintInvoice}
                        sx={{ color: 'white' }}
                    >
                        <PrintIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {invoiceData && (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    Invoice Details
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary" fontWeight="bold">
                                            Invoice ID
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {invoiceData.invoice_id}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary" fontWeight="bold">
                                            Order ID
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {invoiceData.order_id}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary" fontWeight="bold">
                                            Customer ID
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {invoiceData.customer_id}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary" fontWeight="bold">
                                            Date
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {new Date(invoiceData.created_at).toLocaleString()}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary" fontWeight="bold">
                                            Status
                                        </Typography>
                                        <Chip
                                            label={invoiceData.status}
                                            color={invoiceData.status === 'paid' ? 'success' : 'warning'}
                                            size="small"
                                            sx={{ mt: 0.5 }}
                                        />
                                    </Grid>
                                </Grid>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    Items
                                </Typography>
                                <TableContainer component={Paper} sx={{ mt: 1 }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Item</TableCell>
                                                <TableCell align="right">Quantity</TableCell>
                                                <TableCell align="right">Price</TableCell>
                                                <TableCell align="right">Total</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {invoiceData.items.map((item, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{item.item_type}</TableCell>
                                                    <TableCell align="right">{item.quantity}</TableCell>
                                                    <TableCell align="right">Rs. {Number(item.price).toFixed(2)}</TableCell>
                                                    <TableCell align="right">Rs. {Number(item.total).toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    Payment Information
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Total Amount
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            Rs. {Number(invoiceData.total_amount).toFixed(2)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Amount Paid
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            Rs. {Number(invoiceData.total_paid).toFixed(2)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="body2" color="text.secondary">
                                            Remaining Balance
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium" color="error.main">
                                            Rs. {Number(invoiceData.remaining_balance).toFixed(2)}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Grid>

                            {invoiceData.payments && invoiceData.payments.length > 0 && (
                                <Grid item xs={12}>
                                    <Typography variant="h6" gutterBottom>
                                        Payment History
                                    </Typography>
                                    <TableContainer component={Paper} sx={{ mt: 1 }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Date</TableCell>
                                                    <TableCell align="right">Amount</TableCell>
                                                    <TableCell>Method</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {invoiceData.payments.map((payment, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{new Date(payment.paid_at).toLocaleString()}</TableCell>
                                                        <TableCell align="right">Rs. {Number(payment.amount).toFixed(2)}</TableCell>
                                                        <TableCell>{payment.method}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenInvoiceDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Billing; 