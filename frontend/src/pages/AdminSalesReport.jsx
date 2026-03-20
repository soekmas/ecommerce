import React, { useState, useEffect } from 'react';
import { Receipt, MagnifyingGlass, Funnel, DownloadSimple, Calendar, ChartLineUp, CurrencyDollar, ShoppingCartSimple, ArrowsClockwise, FileCsv } from 'phosphor-react';
import api from '../utils/api';
import Button from '../components/Button';

const STATUS_CONFIG = {
  pending_payment: { label: 'Pending Payment', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  paid:            { label: 'Paid',            color: 'bg-blue-50 text-blue-700',   dot: 'bg-blue-500'   },
  processing:      { label: 'Processing',      color: 'bg-indigo-50 text-indigo-700', dot: 'bg-indigo-500' },
  shipped:         { label: 'Shipped',         color: 'bg-black text-white',      dot: 'bg-white'    },
  delivered:       { label: 'Delivered',       color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  cancelled:       { label: 'Cancelled',       color: 'bg-red-50 text-red-700',    dot: 'bg-red-500'   },
};

const AdminSalesReport = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    avgOrder: 0
  });

  useEffect(() => {
    fetchReport();
  }, [page, status, startDate, endDate]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        status,
        search,
        start_date: startDate ? new Date(startDate).toISOString() : undefined,
        end_date: endDate ? new Date(endDate).toISOString() : undefined
      };
      
      const res = await api.get('/admin/reports/sales', { params });
      const data = res.data.data || [];
      setOrders(data);
      setTotalCount(res.data.meta?.total || 0);

      // Simple internal stats calculation for current view or from a separate summary endpoint
      // For now, let's just use what we have in the visible data or assume a summary exists.
      // Ideally, we'd have a summary endpoint. 
      const totalRev = data.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.final_amount : 0), 0);
      setStats({
        totalSales: totalRev,
        totalOrders: data.filter(o => o.status !== 'cancelled').length,
        avgOrder: data.length > 0 ? totalRev / data.length : 0
      });

    } catch (err) {
      console.error('Failed to fetch sales report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReport();
  };

  const exportToExcel = () => {
    if (orders.length === 0) {
      alert("Tidak ada data untuk diekspor. Silakan sesuaikan filter atau silakan klik Refresh/Cari.");
      return;
    }
    
    if (!window.XLSX) {
      alert("Sistem sedang menyiapkan library ekspor, mohon tunggu sebentar...");
      return;
    }

    try {
      // Prepare data
      const data = orders.map(o => ({
        'Nomor Invoice': o.order_number,
        'Tanggal': new Date(o.created_at).toLocaleDateString('id-ID'),
        'Nama Pelanggan': o.user?.name || 'N/A',
        'Email': o.user?.email || 'N/A',
        'Status': o.status?.toUpperCase(),
        'Jumlah Produk': o.items?.length || 0,
        'Biaya Ongkir': o.shipping_cost,
        'Total Bayar': o.final_amount
      }));

      // Create worksheet
      const ws = window.XLSX.utils.json_to_sheet(data);
      
      // Create workbook
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, "Laporan Penjualan");

      // Download file
      const fileName = `Laporan_Penjualan_${new Date().toISOString().split('T')[0]}.xlsx`;
      window.XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Export failed:', err);
      alert("Gagal mengekspor data. Silakan coba lagi.");
    }
  };

  const formatRp = (v) => `Rp ${Number(v).toLocaleString('id-ID')}`;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <ChartLineUp size={32} className="text-blue-600" />
            Sales Report
          </h1>
          <p className="text-gray-500 font-medium mt-1">Monitor and analyze your transaction performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={exportToExcel}
            className="rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-bold uppercase tracking-widest text-[10px] h-11 px-6 shadow-sm"
          >
            <FileCsv size={20} className="mr-2 text-emerald-600" /> Export Excel
          </Button>
          <Button 
            variant="primary" 
            onClick={fetchReport}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-widest text-[10px] h-11 px-6 shadow-lg shadow-blue-200"
          >
            <ArrowsClockwise size={20} className="mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ReportStatCard 
          label="Estimated Revenue" 
          value={formatRp(stats.totalSales)} 
          sub="In current period" 
          icon={<CurrencyDollar size={24} weight="duotone" />} 
          color="bg-blue-50 text-blue-600" 
        />
        <ReportStatCard 
          label="Successful Orders" 
          value={stats.totalOrders} 
          sub="Non-cancelled" 
          icon={<ShoppingCartSimple size={24} weight="duotone" />} 
          color="bg-emerald-50 text-emerald-600" 
        />
        <ReportStatCard 
          label="Avg. Order Value" 
          value={formatRp(stats.avgOrder)} 
          sub="Revenue / Orders" 
          icon={<Receipt size={24} weight="duotone" />} 
          color="bg-indigo-50 text-indigo-600" 
        />
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-50/50 p-2 px-4 rounded-xl border border-gray-100">
            <Calendar size={18} className="text-gray-400" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Period:</span>
            <input 
              type="date" 
              className="bg-transparent text-sm font-bold text-gray-700 outline-none"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
            <span className="text-gray-300 mx-1">—</span>
            <input 
              type="date" 
              className="bg-transparent text-sm font-bold text-gray-700 outline-none"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex-1 relative group">
            <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
            <form onSubmit={handleSearch}>
              <input 
                type="text" 
                placeholder="Search by Invoice # or Customer..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-medium"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </form>
          </div>

          <div className="w-full md:w-48 relative">
            <Funnel size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <select 
              className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-bold text-gray-700 appearance-none"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
              <tr>
                <th className="px-8 py-5">Order Details</th>
                <th className="px-8 py-5">Customer</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Items</th>
                <th className="px-8 py-5 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.length === 0 && !loading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                        <Receipt size={32} />
                      </div>
                      <p className="font-bold text-gray-900">No transactions found</p>
                      <p className="text-sm text-gray-400">Try adjusting your date range or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map(order => {
                  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_payment;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono font-black text-gray-900 text-sm tracking-tighter uppercase">{order.order_number}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(order.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800 text-sm">{order.user?.name}</span>
                          <span className="text-[10px] text-gray-400 font-medium truncate max-w-[120px]">{order.user?.email}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs font-bold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                          {order.items?.length || 0} Products
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="font-black text-gray-900 text-sm tabular-nums">
                          {formatRp(order.final_amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-8 py-5 bg-gray-50/30 border-t border-gray-50">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            Showing <span className="text-gray-900">{orders.length}</span> of <span className="text-gray-900">{totalCount}</span> Transactions
          </p>
          <div className="flex gap-2">
            <Button 
              disabled={page === 1 || loading}
              onClick={() => setPage(page - 1)}
              className="h-9 px-4 rounded-lg border-gray-200 text-gray-500 hover:bg-white text-[10px] font-black uppercase"
            >
              Previous
            </Button>
            <Button 
              disabled={orders.length < limit || loading}
              onClick={() => setPage(page + 1)}
              className="h-9 px-4 rounded-lg border-gray-200 text-gray-500 hover:bg-white text-[10px] font-black uppercase"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReportStatCard = ({ label, value, sub, icon, color }) => (
  <div className="bg-white p-7 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
    <div className="space-y-1">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{label}</p>
      <div className="flex flex-col">
        <span className="text-2xl font-black text-gray-900">{value}</span>
        <span className="text-[11px] text-gray-400 font-medium">{sub}</span>
      </div>
    </div>
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${color}`}>
      {icon}
    </div>
  </div>
);

export default AdminSalesReport;
