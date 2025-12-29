import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@getmocha/users-service/react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Download,
  Activity
} from "lucide-react";
import { supabase } from "@/react-app/lib/supabase";
import type { Database } from "@/react-app/types/supabase";

type Sale = Database["public"]["Tables"]["sales"]["Row"];
type Item = Database["public"]["Tables"]["inventory"]["Row"];
type DailyStock = Database["public"]["Tables"]["daily_stock_records"]["Row"];

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [dailyStocks, setDailyStocks] = useState<DailyStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7" | "30">("7");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch data
      const [salesRes, itemsRes, dailyStockRes] = await Promise.all([
        supabase.from("sales").select("*").order("sale_date", { ascending: true }),
        supabase.from("inventory").select("*").order("quantity", { ascending: true }),
        supabase.from("daily_stock_records").select("*").order("date", { ascending: true }),
      ]);

      if (salesRes.error) throw salesRes.error;
      if (itemsRes.error) throw itemsRes.error;
      if (dailyStockRes.error) throw dailyStockRes.error;

      setSales(salesRes.data || []);
      setItems(itemsRes.data || []);
      setDailyStocks(dailyStockRes.data || []);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- ANALYTICS CALCULATIONS ---

  // 1. Key Metrics
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0);
  const totalSalesCount = sales.length;
  const lowStockCount = items.filter(i => i.quantity <= i.low_stock_threshold).length;

  // 2. Daily Sales Trend
  const dailySalesData = useMemo(() => {
    const days = parseInt(timeRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const grouped = sales.reduce((acc, sale) => {
      const date = new Date(sale.sale_date!).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      if (new Date(sale.sale_date!) >= cutoffDate) {
        acc[date] = (acc[date] || 0) + Number(sale.total);
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([date, total]) => ({
      date,
      total
    }));
  }, [sales, timeRange]);

  // 3. Top Beverages Sold (by Quantity)
  const topProductsData = useMemo(() => {
    const grouped = sales.reduce((acc, sale) => {
      acc[sale.item_name] = (acc[sale.item_name] || 0) + sale.quantity;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5); // Top 5
  }, [sales]);

  // 4. Payment Method Distribution
  const paymentData = useMemo(() => {
    const mpesa = sales.filter(s => s.payment === 'M-Pesa').reduce((sum, s) => sum + Number(s.total), 0);
    const cash = sales.filter(s => s.payment === 'Cash').reduce((sum, s) => sum + Number(s.total), 0);
    return [
      { name: 'M-Pesa', value: mpesa },
      { name: 'Cash', value: cash },
    ];
  }, [sales]);

  // 5. Insights: Fast vs Slow Moving
  const stockVelocity = useMemo(() => {
    // Simple velocity: items sold / total items types (could be better but this works for now)
    const soldCounts = sales.reduce((acc, sale) => {
      acc[sale.item_name] = (acc[sale.item_name] || 0) + sale.quantity;
      return acc;
    }, {} as Record<string, number>);

    return items.map(item => ({
      ...item,
      sold: soldCounts[item.item_name] || 0,
      status: (soldCounts[item.item_name] || 0) > 10 ? 'Fast' : 'Slow' // Arbitrary threshold for demo
    })).sort((a, b) => b.sold - a.sold);
  }, [sales, items]);

  // 6. Stock Levels Over Time
  const stockHistoryData = useMemo(() => {
    const days = parseInt(timeRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const grouped = dailyStocks.reduce((acc, record) => {
      const date = new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      if (new Date(record.date) >= cutoffDate) {
        acc[date] = (acc[date] || 0) + record.closing_stock;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([date, total]) => ({ date, total }));
  }, [dailyStocks, timeRange]);

  // 7. Profit Margin Analysis
  const profitData = useMemo(() => {
    // Assuming profit_margin is stored as a specific value per record, or we average it
    const itemProfits = dailyStocks.reduce((acc, record) => {
      if (record.profit_margin) {
        if (!acc[record.item_name]) acc[record.item_name] = { total: 0, count: 0 };
        acc[record.item_name].total += record.profit_margin;
        acc[record.item_name].count += 1;
      }
      return acc;
    }, {} as Record<string, { total: number, count: number }>);

    return Object.entries(itemProfits)
      .map(([name, data]) => ({
        name,
        avgProfit: data.total / data.count
      }))
      .sort((a, b) => b.avgProfit - a.avgProfit)
      .slice(0, 7); // Top 7 profitable items
  }, [dailyStocks]);

  const COLORS = ['#8b5cf6', '#22c55e', '#ef4444', '#f59e0b'];

  const exportReport = () => {
    // Reuse existing CSV logic if needed, or simple alert for now
    alert("Export feature coming soon! (Use the specific CSV buttons below)");
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-header">Business Analytics</h2>
          <p className="text-sm text-yellow-700 mt-1">Real-time insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as "7" | "30")}
            className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 outline-none"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
          </select>
          <button
            onClick={exportReport}
            className="flex items-center space-x-2 bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all shadow-sm text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">KSh {totalRevenue.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Sales</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalSalesCount}</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{lowStockCount}</h3>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Avg Transaction</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              KSh {totalSalesCount > 0 ? (totalRevenue / totalSalesCount).toFixed(0) : 0}
            </h3>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <Activity className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Sales Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Sales Trend (Revenue)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySalesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(value: number) => `KSh ${value}`} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`KSh ${value.toLocaleString()} `, 'Revenue']}
                />
                <Line type="monotone" dataKey="total" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Top 5 Best Sellers</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 13, fontWeight: 500 }} />
                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="quantity" fill="#10B981" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tertiary Row: Stock History & Profit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Levels Over Time */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Stock Levels Over Time</h3>
          <p className="text-xs text-gray-500 mb-4">Total closing stock across all items</p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stockHistoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value} units`, 'Total Stock']}
                />
                <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit Margin Analysis */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Profit Margin Analysis</h3>
          <p className="text-xs text-gray-500 mb-4">Average profit margin per item</p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 13, fontWeight: 500 }} />
                <Tooltip
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Avg Margin']}
                />
                <Bar dataKey="avgProfit" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Row: Payments & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Payment Methods */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Payment Methods</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `KSh ${value.toLocaleString()} `} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {paymentData.map((p, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">{p.name}</span>
                <span className="font-bold text-gray-900">KSh {p.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Low Stock Alerts</h3>
            <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-1 rounded">Action Needed</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Item</th>
                  <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Current</th>
                  <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Threshold</th>
                  <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.filter(i => i.quantity <= i.low_stock_threshold).slice(0, 5).map(item => (
                  <tr key={item.id} className="group hover:bg-red-50/30 transition-colors">
                    <td className="py-3 text-sm font-medium text-gray-900">{item.item_name}</td>
                    <td className="py-3 text-sm text-red-600 font-bold">{item.quantity}</td>
                    <td className="py-3 text-sm text-gray-500">{item.low_stock_threshold}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center space-x-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Critical</span>
                      </span>
                    </td>
                  </tr>
                ))}
                {items.filter(i => i.quantity <= i.low_stock_threshold).length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500 text-sm">
                      All stock levels are healthy!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Fast Movers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Product Performance (Fast Movers)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Units Sold</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Velocity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stockVelocity.slice(0, 5).map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.item_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.sold}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.quantity}</td>
                  <td className="px-6 py-4">
                    <span className={`inline - flex px - 2 py - 1 text - xs font - semibold rounded - full ${item.status === 'Fast'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                      } `}>
                      {item.status} Moving
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
