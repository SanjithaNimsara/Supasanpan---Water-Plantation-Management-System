import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Box,
    Card,
    CardContent,
    Grid,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Chip,
    Alert,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Divider,
    FormControlLabel,
    Checkbox,
    FormGroup,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel
} from '@mui/material';
import { Delete as DeleteIcon, Receipt as ReceiptIcon, AttachMoney as MoneyIcon, FileDownload as FileDownloadIcon } from '@mui/icons-material';
import axios from 'axios';

const Invoices = () => {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState([]);
    const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });
    const [openInvoiceDetailsDialog, setOpenInvoiceDetailsDialog] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showUnpaidOnly, setShowUnpaidOnly] = useState(false);
    const [openExportDialog, setOpenExportDialog] = useState(false);
    const [exportOptions, setExportOptions] = useState({
        includeHeaders: true,
        dateFormat: 'DD/MM/YYYY',
        fileFormat: 'csv',
        columns: {
            invoiceId: true,
            orderId: true,
            customerId: true,
            totalAmount: true,
            paidAmount: true,
            status: true,
            date: true,
            paymentMethod: false
        }
    });
    const [dailySummary, setDailySummary] = useState({
        totalSales: 0,
        totalPaid: 0,
        totalInvoices: 0,
        pendingAmount: 0
    });

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/billing/invoices', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            console.log('Fetched invoices:', response.data);
            setInvoices(response.data);
            calculateDailySummary(response.data);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            showAlert('Error fetching invoices', 'error');
        }
    };

    const calculateDailySummary = (invoiceData) => {
        const today = new Date().toLocaleDateString();
        console.log('Calculating summary for date:', today);

        const todayInvoices = invoiceData.filter(invoice => {
            const invoiceDate = new Date(invoice.created_at).toLocaleDateString();
            const isToday = invoiceDate === today;
            console.log(`Invoice ${invoice.id}: Date ${invoiceDate}, Is Today: ${isToday}`);
            return isToday;
        });

        console.log('Today\'s invoices:', todayInvoices);

        // Sum total sales and total paid for today
        let totalSales = 0;
        let totalPaid = 0;
        let totalInvoices = 0;
        let pendingAmount = 0;
        todayInvoices.forEach(invoice => {
            const amount = parseFloat(invoice.total_amount) || 0;
            let paid = parseFloat(invoice.paid_amount) || 0;
            totalSales += amount;
            totalPaid += paid;
            totalInvoices += 1;
            // If paid is greater than amount, only consider amount for pending calculation
            if (paid > amount) {
                paid = amount;
            }
            pendingAmount += (amount - paid);
        });

        // Round all amounts to 2 decimal places
        totalSales = Math.round(totalSales * 100) / 100;
        totalPaid = Math.round(totalPaid * 100) / 100;
        pendingAmount = Math.round(pendingAmount * 100) / 100;

        const summary = {
            totalSales,
            totalPaid,
            totalInvoices,
            pendingAmount
        };

        console.log('Final summary:', summary);
        setDailySummary(summary);
    };

    const handleDownloadInvoice = async (invoiceId) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/billing/invoices/${invoiceId}/download`, {
                responseType: 'blob',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoice-${invoiceId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            showAlert('Invoice downloaded successfully', 'success');
        } catch (error) {
            console.error('Error downloading invoice:', error);
            showAlert('Error downloading invoice', 'error');
        }
    };

    const handleInvoiceRowClick = async (invoice) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/billing/orders/${invoice.order_id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setSelectedInvoice({ ...invoice, orderDetails: response.data });
            setOpenInvoiceDetailsDialog(true);
        } catch (error) {
            console.error('Error fetching invoice details:', error);
            showAlert('Error fetching invoice details', 'error');
        }
    };

    const handleDeleteInvoice = async (invoiceId) => {
        if (!window.confirm('Are you sure you want to delete this invoice?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/billing/invoices/${invoiceId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            showAlert('Invoice deleted successfully', 'success');
            fetchInvoices();
        } catch (error) {
            showAlert('Error deleting invoice', 'error');
        }
    };

    const showAlert = (message, severity) => {
        setAlert({ show: true, message, severity });
        setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 3000);
    };

    const filteredInvoices = showUnpaidOnly 
        ? invoices.filter(invoice => invoice.status !== 'paid')
        : invoices;

    const handleExportOptionsChange = (field, value) => {
        if (field.startsWith('columns.')) {
            const column = field.split('.')[1];
            setExportOptions(prev => ({
                ...prev,
                columns: {
                    ...prev.columns,
                    [column]: value
                }
            }));
        } else {
            setExportOptions(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const exportToFile = () => {
        const selectedColumns = Object.entries(exportOptions.columns)
            .filter(([_, selected]) => selected)
            .map(([key]) => key);

        const headers = selectedColumns.map(column => {
            switch(column) {
                case 'invoiceId': return 'Invoice ID';
                case 'orderId': return 'Order ID';
                case 'customerId': return 'Customer ID';
                case 'totalAmount': return 'Total Amount';
                case 'paidAmount': return 'Paid Amount';
                case 'status': return 'Status';
                case 'date': return 'Date';
                case 'paymentMethod': return 'Payment Method';
                default: return column;
            }
        });

        const formatDate = (date) => {
            const d = new Date(date);
            switch(exportOptions.dateFormat) {
                case 'DD/MM/YYYY':
                    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                case 'MM/DD/YYYY':
                    return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;
                case 'YYYY-MM-DD':
                    return d.toISOString().split('T')[0];
                default:
                    return d.toLocaleDateString();
            }
        };

        const csvData = filteredInvoices.map(invoice => {
            const row = [];
            selectedColumns.forEach(column => {
                switch(column) {
                    case 'invoiceId': row.push(invoice.id); break;
                    case 'orderId': row.push(invoice.order_id); break;
                    case 'customerId': row.push(invoice.customer_id); break;
                    case 'totalAmount': row.push(invoice.total_amount); break;
                    case 'paidAmount': row.push(invoice.paid_amount); break;
                    case 'status': row.push(invoice.status); break;
                    case 'date': row.push(formatDate(invoice.created_at)); break;
                    case 'paymentMethod': row.push(invoice.payment_method || ''); break;
                    default: row.push('');
                }
            });
            return row;
        });

        const content = [
            ...(exportOptions.includeHeaders ? [headers] : []),
            ...csvData
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `invoices_${new Date().toISOString().split('T')[0]}.${exportOptions.fileFormat}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setOpenExportDialog(false);
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
                        <ReceiptIcon sx={{ color: (theme) => theme.palette.primary.main, fontSize: 32, mr: 2 }} />
                        <Typography variant="h5" gutterBottom fontWeight={600} sx={{ lineHeight: 1, display: 'flex', alignItems: 'center', mt: 1 }}>
                            Invoice Management
                        </Typography>
                    </Box>
                </Grid>

                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => setOpenExportDialog(true)}
                            startIcon={<FileDownloadIcon />}
                            sx={{ borderRadius: 2 }}
                        >
                            Export
                        </Button>
                        <Button
                            variant={showUnpaidOnly ? "contained" : "outlined"}
                            onClick={() => setShowUnpaidOnly(!showUnpaidOnly)}
                            startIcon={<MoneyIcon />}
                            sx={{ borderRadius: 2 }}
                        >
                            {showUnpaidOnly ? "Show All Invoices" : "Show Unpaid Only"}
                        </Button>
                    </Box>
                </Grid>

                {/* Daily Summary Cards */}
                <Grid item xs={12}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <Card sx={{ 
                                background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.1) 0%, rgba(41, 128, 185, 0.1) 100%)',
                                borderRadius: 2,
                                boxShadow: 2
                            }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <MoneyIcon sx={{ color: 'primary.main', mr: 1 }} />
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Today's Sales
                                        </Typography>
                                    </Box>
                                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                                        Rs. {dailySummary.totalSales.toFixed(2)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card sx={{ 
                                background: 'linear-gradient(135deg, rgba(231, 76, 60, 0.1) 0%, rgba(192, 57, 43, 0.1) 100%)',
                                borderRadius: 2,
                                boxShadow: 2
                            }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <MoneyIcon sx={{ color: 'error.main', mr: 1 }} />
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Pending Amount
                                        </Typography>
                                    </Box>
                                    <Typography variant="h6" fontWeight="bold" color="error.main">
                                        Rs. {dailySummary.pendingAmount.toFixed(2)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card sx={{ 
                                background: 'linear-gradient(135deg, rgba(155, 89, 182, 0.1) 0%, rgba(142, 68, 173, 0.1) 100%)',
                                borderRadius: 2,
                                boxShadow: 2
                            }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <ReceiptIcon sx={{ color: 'secondary.main', mr: 1 }} />
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Total Invoices
                                        </Typography>
                                    </Box>
                                    <Typography variant="h6" fontWeight="bold" color="secondary.main">
                                        {dailySummary.totalInvoices}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Grid>

                <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                </Grid>

                <Grid item xs={12}>
                    <Card sx={{ boxShadow: 3, borderRadius: 3, background: '#f5f8fd' }}>
                        <CardContent>
                            <TableContainer component={Paper} sx={{ boxShadow: 0, borderRadius: 3, overflowX: 'unset', background: '#f5f8fd' }}>
                                <Table size="small" sx={{ minWidth: 900, tableLayout: 'fixed' }}>
                                    <TableHead>
                                        <TableRow sx={{ background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.10) 0%, rgba(41, 128, 185, 0.10) 100%)' }}>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 15, px: 2 }}>Invoice ID</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 15, px: 2 }}>Order ID</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 15, px: 2 }}>Customer</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 15, px: 2 }}>Amount</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 15, px: 2 }}>Paid</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 15, px: 2 }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 15, px: 2 }}>Date</TableCell>
                                            {user?.role === 'admin' && (
                                                <TableCell sx={{ fontWeight: 700, fontSize: 15, px: 2 }}>Actions</TableCell>
                                            )}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredInvoices.map((invoice, index) => (
                                            <TableRow
                                                key={invoice.id}
                                                hover
                                                onClick={() => handleInvoiceRowClick(invoice)}
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
                                                <TableCell sx={{ px: 2, fontSize: 15 }}>{invoice.id}</TableCell>
                                                <TableCell sx={{ px: 2, fontSize: 15 }}>{invoice.order_id}</TableCell>
                                                <TableCell sx={{ px: 2, fontSize: 15 }}>{invoice.customer_id}</TableCell>
                                                <TableCell sx={{ px: 2, fontSize: 15 }}>Rs. {invoice.total_amount}</TableCell>
                                                <TableCell sx={{ px: 2, fontSize: 15 }}>Rs. {invoice.paid_amount}</TableCell>
                                                <TableCell sx={{ px: 2, fontSize: 15 }}>
                                                    <Chip
                                                        label={invoice.status}
                                                        color={invoice.status === 'paid' ? 'success' : invoice.status === 'cancelled' ? 'error' : 'warning'}
                                                        size="small"
                                                        sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ px: 2, fontSize: 15 }}>{new Date(invoice.created_at).toLocaleDateString()}</TableCell>
                                                {user?.role === 'admin' && (
                                                    <TableCell sx={{ px: 2, fontSize: 15 }}>
                                                        <Tooltip title="Delete Invoice">
                                                            <IconButton
                                                                size="small"
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    handleDeleteInvoice(invoice.id);
                                                                }}
                                                                color="error"
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Invoice Details Dialog */}
            <Dialog 
                open={openInvoiceDetailsDialog} 
                onClose={() => setOpenInvoiceDetailsDialog(false)}
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
                    Invoice Details
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {selectedInvoice && (
                        <Box sx={{ mt: 2 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'primary.main' }}>
                                        Invoice Information
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
                                                    Invoice ID
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {selectedInvoice.id}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Order ID
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {selectedInvoice.order_id}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Customer ID
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {selectedInvoice.customer_id}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Created At
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {new Date(selectedInvoice.created_at).toLocaleString()}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Total Amount
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    Rs. {Number(selectedInvoice.total_amount).toFixed(2)}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Paid Amount
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    Rs. {Number(selectedInvoice.paid_amount).toFixed(2)}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Status
                                                </Typography>
                                                <Chip
                                                    label={selectedInvoice.status}
                                                    color={selectedInvoice.status === 'paid' ? 'success' : selectedInvoice.status === 'cancelled' ? 'error' : 'warning'}
                                                    size="small"
                                                    sx={{ mt: 0.5, fontWeight: 600, textTransform: 'capitalize' }}
                                                />
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                </Grid>

                                {selectedInvoice.orderDetails && (
                                    <>
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
                                                        {selectedInvoice.orderDetails.items?.map((item, index) => (
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

                                        {selectedInvoice.orderDetails.payments && selectedInvoice.orderDetails.payments.length > 0 && (
                                            <Grid item xs={12}>
                                                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'primary.main' }}>
                                                    Payment History
                                                </Typography>
                                                <TableContainer component={Paper} sx={{ 
                                                    mt: 1,
                                                    background: 'linear-gradient(135deg, rgba(240, 249, 255, 0.9) 0%, rgba(203, 235, 255, 0.9) 100%)',
                                                    borderRadius: 2
                                                }}>
                                                    <Table size="small">
                                                        <TableHead>
                                                            <TableRow sx={{ background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.10) 0%, rgba(41, 128, 185, 0.10) 100%)' }}>
                                                                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 600 }}>Method</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {selectedInvoice.orderDetails.payments.map((payment, index) => (
                                                                <TableRow key={index} hover>
                                                                    <TableCell>{new Date(payment.created_at).toLocaleString()}</TableCell>
                                                                    <TableCell align="right">Rs. {Number(payment.amount).toFixed(2)}</TableCell>
                                                                    <TableCell align="right" sx={{ textTransform: 'capitalize' }}>{payment.method}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </Grid>
                                        )}
                                    </>
                                )}
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button 
                        onClick={() => setOpenInvoiceDetailsDialog(false)}
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

            {/* Export Options Dialog */}
            <Dialog 
                open={openExportDialog} 
                onClose={() => setOpenExportDialog(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <DialogTitle sx={{
                    background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.95) 0%, rgba(41, 128, 185, 0.95) 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 3,
                    py: 2
                }}>
                    <FileDownloadIcon />
                    Export Options
                </DialogTitle>
                <DialogContent sx={{ p: 3, pt: 5 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6} sx={{ mt: 3 }}>
                            <FormControl fullWidth>
                                <InputLabel>File Format</InputLabel>
                                <Select
                                    value={exportOptions.fileFormat}
                                    onChange={(e) => handleExportOptionsChange('fileFormat', e.target.value)}
                                    label="File Format"
                                >
                                    <MenuItem value="csv">CSV</MenuItem>
                                    <MenuItem value="txt">TXT</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6} sx={{ mt: 3 }}>
                            <FormControl fullWidth>
                                <InputLabel>Date Format</InputLabel>
                                <Select
                                    value={exportOptions.dateFormat}
                                    onChange={(e) => handleExportOptionsChange('dateFormat', e.target.value)}
                                    label="Date Format"
                                >
                                    <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                                    <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                                    <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={12} sx={{ textAlign: { md: 'right', xs: 'left' } }}>
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={exportOptions.includeHeaders}
                                            onChange={(e) => handleExportOptionsChange('includeHeaders', e.target.checked)}
                                        />
                                    }
                                    label="Include Headers"
                                />
                            </FormGroup>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                                Select Columns
                            </Typography>
                            <FormGroup>
                                {Object.entries(exportOptions.columns).map(([key, value]) => (
                                    <FormControlLabel
                                        key={key}
                                        control={
                                            <Checkbox
                                                checked={value}
                                                onChange={(e) => handleExportOptionsChange(`columns.${key}`, e.target.checked)}
                                            />
                                        }
                                        label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                                    />
                                ))}
                            </FormGroup>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button 
                        onClick={() => setOpenExportDialog(false)}
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
                        onClick={exportToFile}
                        variant="contained"
                        sx={{ 
                            borderRadius: 2,
                            textTransform: 'none',
                            px: 3
                        }}
                    >
                        Export
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Invoices; 