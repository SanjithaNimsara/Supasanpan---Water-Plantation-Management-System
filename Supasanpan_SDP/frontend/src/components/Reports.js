import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Select as MuiSelect,
  InputLabel as MuiInputLabel,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import axios from 'axios';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { MonetizationOn, TrendingUp, ShoppingCart, Category } from '@mui/icons-material';
import { isSameDay, isSameWeek, isSameMonth, isSameYear, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Reports = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [billingData, setBillingData] = useState({
    salesData: [],
    paymentMethods: [],
    productSales: [],
    revenueData: []
  });
  const [topProducts, setTopProducts] = useState([]);
  const [salesByProduct, setSalesByProduct] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalSales: 0, totalOrders: 0, topProduct: '' });
  const [invoices, setInvoices] = useState([]);
  const [openExportDialog, setOpenExportDialog] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeHeaders: true,
    dateFormat: 'DD/MM/YYYY',
    fileFormat: 'csv',
    columns: {
      orderId: true,
      createdAt: true,
      product: true,
      quantity: true,
      price: true,
      total: true,
      invoiceId: true,
      totalAmount: true
    }
  });
  const dashboardRef = React.useRef();

  useEffect(() => {
    fetchReportData();
    fetchTopProducts();
    fetchSalesByProduct();
    fetchInvoicesData();
  }, [timeRange]);

  useEffect(() => {
    updateSummary();
  }, [billingData, topProducts]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/reports/billing?timeRange=${timeRange}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setBillingData(response.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    }
    setLoading(false);
  };

  const fetchTopProducts = async () => {
    try {
      const response = await axios.get(`/api/reports/billing/top-products?timeRange=${timeRange}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTopProducts(response.data.topProducts || []);
    } catch (error) {
      setTopProducts([]);
    }
  };

  const fetchSalesByProduct = async () => {
    try {
      const response = await axios.get(`/api/reports/billing/sales-by-category?timeRange=${timeRange}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSalesByProduct(response.data.salesByProduct || []);
    } catch (error) {
      setSalesByProduct([]);
    }
  };

  const fetchInvoicesData = async () => {
    try {
      const response = await axios.get('/api/billing/invoices', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setInvoices(response.data);
    } catch (error) {
      setInvoices([]);
    }
  };

  // Helper to filter invoices by timeRange
  const filterInvoicesByTimeRange = (invoices, timeRange) => {
    const now = new Date();
    return invoices.filter(inv => {
      const date = parseISO(inv.created_at);
      if (timeRange === 'day') return isSameDay(date, now);
      if (timeRange === 'week') return isSameWeek(date, now, { weekStartsOn: 1 });
      if (timeRange === 'month') return isSameMonth(date, now);
      if (timeRange === 'year') return isSameYear(date, now);
      return true;
    });
  };

  // Calculate summary from filtered invoices
  const filteredInvoices = filterInvoicesByTimeRange(invoices, timeRange);
  const invoiceSummary = React.useMemo(() => {
    let totalSales = 0, totalPaid = 0, totalInvoices = 0, pendingAmount = 0;
    totalInvoices = filteredInvoices.length;
    filteredInvoices.forEach(inv => {
      const total = Number(inv.total_amount) || 0;
      let paid = Number(inv.paid_amount) || 0;
      totalSales += total;
      totalPaid += paid;
      if (paid > total) paid = total;
      pendingAmount += (total - paid);
    });
    return {
      totalSales,
      totalPaid,
      totalInvoices,
      pendingAmount
    };
  }, [filteredInvoices]);

  const updateSummary = () => {
    const totalRevenue = billingData.revenueData.reduce((sum, d) => sum + (d.revenue || 0), 0);
    const totalSales = billingData.salesData.reduce((sum, d) => sum + (d.sales || 0), 0);
    const totalOrders = billingData.salesData.reduce((sum, d) => sum + (d.orders || 0), 0);
    const topProduct = (topProducts[0] && topProducts[0].name) || '';
    setSummary({ totalRevenue, totalSales, totalOrders, topProduct });
  };

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

  const exportToFile = async () => {
    try {
      const response = await axios.get(`/api/reports/billing/export?timeRange=${timeRange}`, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          responseType: 'blob'
        }
      });
      
      // Create a blob from the response data
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.setAttribute('href', URL.createObjectURL(blob));
      link.setAttribute('download', `billing_report_${new Date().toISOString().split('T')[0]}.${exportOptions.fileFormat}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setOpenExportDialog(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export report. Please try again.');
    }
  };

  const exportDashboardAsPDF = async () => {
    const dashboard = dashboardRef.current;
    if (!dashboard) return;
    const canvas = await html2canvas(dashboard, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    // Calculate image size to fit A4
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('analytics_report.pdf');
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Calculate paid and not paid counts from filtered invoices (time range sensitive)
  const paidCount = filteredInvoices.filter(inv => Number(inv.paid_amount) >= Number(inv.total_amount)).length;
  const notPaidCount = filteredInvoices.length - paidCount;
  const customerPaymentData = [
    { name: 'Paid', value: paidCount },
    { name: 'Not Paid', value: notPaidCount }
  ];
  const customerPaymentColors = ['#00C49F', '#FF8042'];

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<FileDownloadIcon />}
          onClick={exportDashboardAsPDF}
          sx={{ borderRadius: 2, mr: 2 }}
        >
          Export Analytics as PDF
        </Button>
      </Box>
      <div ref={dashboardRef} id="dashboard-container">
        <Paper sx={{ width: '100%', mb: 3, borderRadius: 3, boxShadow: 3, background: 'linear-gradient(135deg, #e3f2fd 0%, #f5fafd 100%)', p: { xs: 1, md: 2 } }}>
          <Grid container alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
            <Grid item>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2', letterSpacing: 1 }}>
                Billing Reports & Analytics
              </Typography>
            </Grid>
            <Grid item>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControl size="medium" sx={{ minWidth: 140 }}>
                  <InputLabel>Time Range</InputLabel>
                  <Select
                    value={timeRange}
                    label="Time Range"
                    onChange={(e) => setTimeRange(e.target.value)}
                  >
                    <MenuItem value="day">Today</MenuItem>
                    <MenuItem value="week">This Week</MenuItem>
                    <MenuItem value="month">This Month</MenuItem>
                    <MenuItem value="year">This Year</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<FileDownloadIcon />}
                  onClick={() => setOpenExportDialog(true)}
                  sx={{ boxShadow: 2, borderRadius: 2, minWidth: 130 }}
                >
                  Export
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, #e3f2fd 0%, #f5fafd 100%)',
              borderRadius: 2,
              boxShadow: 2
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MonetizationOn sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Sales
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  Rs. {invoiceSummary.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%)',
              borderRadius: 2,
              boxShadow: 2
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ShoppingCart sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Orders
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  {invoiceSummary.totalInvoices}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, #e3f0ff 0%, #e0f7fa 100%)',
              borderRadius: 2,
              boxShadow: 2
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Category sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Top Product
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  {summary.topProduct || '-'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, #e0e7ff 0%, #e3f2fd 100%)',
              borderRadius: 2,
              boxShadow: 2
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUp sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Debt (Yet to Pay)
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  Rs. {invoiceSummary.pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Key Financial Overview Row - Two charts always side by side, forced */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, mt: 2, color: '#1976d2' }}>Key Financial Overview</Typography>
        <Grid container spacing={2} sx={{ width: '100%', m: 0, flexWrap: 'nowrap' }} alignItems="stretch">
          {/* Revenue Overview - Left Half */}
          <Grid item xs={6} sx={{ p: 0, m: 0, height: 400, minWidth: 0, flexBasis: '50%', maxWidth: '50%' }}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, height: '100%', width: '100%' }}>
              <CardContent sx={{ height: '100%', width: '100%', p: 2 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
                  Revenue Overview
                </Typography>
                <Box sx={{ width: '100%', height: 300, p: 0, m: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={billingData.revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#8884d8"
                        name="Revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          {/* Sales Trend - Right Half */}
          <Grid item xs={6} sx={{ p: 0, m: 0, height: 400, minWidth: 0, flexBasis: '50%', maxWidth: '50%' }}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, height: '100%', width: '100%' }}>
              <CardContent sx={{ height: '100%', width: '100%', p: 2 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
                  Sales Trend
                </Typography>
                <Box sx={{ width: '100%', height: 300, p: 0, m: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={billingData.salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        stroke="#8884d8"
                        name="Sales"
                      />
                      <Line
                        type="monotone"
                        dataKey="orders"
                        stroke="#82ca9d"
                        name="Orders"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Product & Category Insights - Two charts always side by side, forced */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, mt: 2, color: '#1976d2' }}>
          Product & Category Insights
        </Typography>
        <Box sx={{ width: '100%', maxWidth: '1200px', mx: 'auto', p: 0, m: 0 }}>
          <Card sx={{ borderRadius: 3, boxShadow: 2, width: '100%', p: 0, m: 0 }}>
            <CardContent sx={{ width: '100%', p: 2, m: 0 }}>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ fontWeight: 600, color: '#1976d2', mb: 2, ml: 0, mr: 0, p: 0 }}
              >
                Product Sales Analysis
              </Typography>
              <Box sx={{ width: '100%', height: 370 }}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={billingData.productSales} barCategoryGap={32}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend layout="horizontal" align="center" verticalAlign="top" wrapperStyle={{ marginBottom: -20 }} />
                    <Bar dataKey="sales" fill="#82ca9d" name="Sales" />
                    <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Customer & Payment Insights - Two charts always side by side, forced */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, mt: 2, color: '#1976d2' }}>Customer & Payment Insights</Typography>
        <Grid container spacing={2} sx={{ width: '100%', m: 0, flexWrap: 'nowrap' }}>
          {/* Top Products */}
          <Grid item xs={6} sx={{ p: 0, m: 0, height: 400, minWidth: 0, flexBasis: '50%', maxWidth: '50%' }}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, height: '100%', width: '100%' }}>
              <CardContent sx={{ height: '100%', width: '100%', p: 2 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
                  Top Products
                </Typography>
                <Box sx={{ width: '100%', height: 300, p: 0, m: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" dataKey="sales" />
                      <YAxis type="category" dataKey="name" width={120} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="sales" fill="#82ca9d" name="Sales" />
                      <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          {/* Payment Methods Distribution (replaced with Customer Payment Pie Chart) */}
          <Grid item xs={6} sx={{ p: 0, m: 0, height: 400, minWidth: 0, flexBasis: '50%', maxWidth: '50%' }}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, height: '100%', width: '100%' }}>
              <CardContent sx={{ height: '100%', width: '100%', p: 2 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
                  Customer Payment Status
                </Typography>
                <Box sx={{ width: '100%', height: 350, p: 0, m: 0 }}>
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={customerPaymentData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label
                      >
                        {customerPaymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={customerPaymentColors[index % customerPaymentColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </div>

      {/* Export Options Dialog */}
      <Dialog open={openExportDialog} onClose={() => setOpenExportDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.95) 0%, rgba(41, 128, 185, 0.95) 100%)', color: 'white', display: 'flex', alignItems: 'center', gap: 1, px: 3, py: 2 }}>
          <FileDownloadIcon /> Export Options
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 5 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6} sx={{ mt: 3 }}>
              <FormControl fullWidth>
                <MuiInputLabel>File Format</MuiInputLabel>
                <MuiSelect
                  value={exportOptions.fileFormat}
                  onChange={e => handleExportOptionsChange('fileFormat', e.target.value)}
                  label="File Format"
                >
                  <MenuItem value="csv">CSV</MenuItem>
                  <MenuItem value="txt">TXT</MenuItem>
                </MuiSelect>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6} sx={{ mt: 3 }}>
              <FormControl fullWidth>
                <MuiInputLabel>Date Format</MuiInputLabel>
                <MuiSelect
                  value={exportOptions.dateFormat}
                  onChange={e => handleExportOptionsChange('dateFormat', e.target.value)}
                  label="Date Format"
                >
                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                  <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                </MuiSelect>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={12} sx={{ textAlign: { md: 'right', xs: 'left' } }}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exportOptions.includeHeaders}
                      onChange={e => handleExportOptionsChange('includeHeaders', e.target.checked)}
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
                        onChange={e => handleExportOptionsChange(`columns.${key}`, e.target.checked)}
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
          <Button onClick={() => setOpenExportDialog(false)} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}>
            Cancel
          </Button>
          <Button onClick={exportToFile} variant="contained" sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}>
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reports; 