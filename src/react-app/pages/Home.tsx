import { useEffect, useState } from "react";
import { Package, ShoppingCart, TrendingUp, AlertTriangle } from "lucide-react";
import { useItems } from "@/react-app/hooks/useItems";
import { useSales } from "@/react-app/hooks/useSales";

export default function Home() {
  const { items, loading: itemsLoading } = useItems();
  const { sales, loading: salesLoading } = useSales();
  const [todayRevenue, setTodayRevenue] = useState(0);

  useEffect(() => {
    const today = new Date().toDateString();
    const todaySales = sales.filter(
      (sale) => new Date(sale.sale_date!).toDateString() === today
    );
    const revenue = todaySales.reduce((sum, sale) => sum + Number(sale.total), 0);
    setTodayRevenue(revenue);
  }, [sales]);

  const lowStockItems = items.filter(
    (item) => item.quantity <= item.low_stock_threshold
  );
  const totalInventoryValue = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  const todayOrders = sales.filter(
    (sale) => new Date(sale.sale_date!).toDateString() === new Date().toDateString()
  ).length;

  if (itemsLoading || salesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-heading text-header">Dashboard</h2>
        <p className="text-sm text-yellow-700 mt-1">
          Welcome to Friends Bar Management System
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders Today */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-border/50">
          <div className="flex items-start justify-between">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-400">Total Orders</span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{todayOrders}</p>
          </div>
        </div>

        {/* Today's Sales Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-border/50">
          <div className="flex items-start justify-between">
            <div className="p-2 bg-green-500 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-400">Today's Sales</span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">
              KSh {todayRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Total Value Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-border/50">
          <div className="flex items-start justify-between">
            <div className="p-2 bg-purple-500 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-400">Inventory Value</span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">
              KSh {totalInventoryValue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Low Stock Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-border/50">
          <div className="flex items-start justify-between">
            <div className="p-2 bg-red-500 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-400">Low Stock Items</span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{lowStockItems.length}</p>
          </div>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-bold text-red-900">Low Stock Alert</h3>
          </div>
          <div className="space-y-2">
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-100 shadow-sm"
              >
                <span className="text-sm font-medium text-gray-700">{item.item_name}</span>
                <span className="text-xs font-medium text-red-600">
                  {item.quantity} units remaining
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
