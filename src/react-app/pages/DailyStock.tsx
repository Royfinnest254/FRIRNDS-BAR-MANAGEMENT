import { useState, useEffect } from "react";
import { Plus, Trash2, Download } from "lucide-react";
import { supabase } from "@/react-app/lib/supabase";
import type { Database } from "@/react-app/types/supabase";

type DailyStockRecord = Database["public"]["Tables"]["daily_stock_records"]["Row"];
type InsertDailyStockRecord = Database["public"]["Tables"]["daily_stock_records"]["Insert"];

export default function DailyStockPage() {
  const [records, setRecords] = useState<DailyStockRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formData, setFormData] = useState({
    item_name: "",
    open_stock: 0,
    added_stock: 0,
    closing_stock: 0,
    price: 0,
    profit_margin: null as number | null,
    sales_person: "",
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("daily_stock_records")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Calculate daily sale amount
      const open = Number(formData.open_stock);
      const added = Number(formData.added_stock);
      const closing = Number(formData.closing_stock);
      const price = Number(formData.price);

      const dailySaleAmount = (open + added - closing) * price;

      const newRecord: InsertDailyStockRecord = {
        date: selectedDate,
        item_name: formData.item_name,
        open_stock: open,
        added_stock: added,
        closing_stock: closing,
        price: price,
        profit_margin: formData.profit_margin ? Number(formData.profit_margin) : null,
        daily_sale_amount: dailySaleAmount,
        sales_person: formData.sales_person || null,
      };

      const { error } = await supabase
        .from("daily_stock_records")
        .insert(newRecord as any);

      if (error) throw error;

      setFormData({
        item_name: "",
        open_stock: 0,
        added_stock: 0,
        closing_stock: 0,
        price: 0,
        profit_margin: null,
        sales_person: "",
      });
      setShowForm(false);
      fetchRecords();
    } catch (error: any) {
      console.error("Error saving record:", error);
      alert("Failed to save record: " + (error.message || JSON.stringify(error)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const { error } = await supabase
        .from("daily_stock_records")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchRecords();
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Failed to delete record");
    }
  };

  const exportCSV = () => {
    const headers = [
      "Date",
      "Item",
      "Open Stock",
      "Added Stock",
      "Total Stock",
      "Closing Stock",
      "Price (KSh)",
      "Daily Sale (KSh)",
      "Profit Margin",
      "Sales Person",
    ];

    const rows = records.map((record) => [
      record.date,
      record.item_name,
      record.open_stock.toString(),
      record.added_stock.toString(),
      (record.open_stock + record.added_stock).toString(),
      record.closing_stock.toString(),
      record.price.toFixed(2),
      record.daily_sale_amount.toFixed(2),
      record.profit_margin?.toFixed(2) || "N/A",
      record.sales_person || "N/A",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-stock-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalStock = formData.open_stock + formData.added_stock;
  const dailySale = (totalStock - formData.closing_stock) * formData.price;

  const groupedRecords = records.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = [];
    }
    acc[record.date].push(record);
    return acc;
  }, {} as Record<string, DailyStockRecord[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-header">Daily Stock Recording</h2>
          <p className="text-sm text-yellow-700 mt-1">
            Track daily stock movements and sales
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportCSV}
            className="flex items-center space-x-2 bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-100 transition-all shadow-sm text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-all shadow-sm text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            New Stock Entry
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.item_name}
                  onChange={(e) =>
                    setFormData({ ...formData, item_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-gray-900"
                  placeholder="e.g., Tusker Lager"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Open Stock
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.open_stock}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      open_stock: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Added Stock
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.added_stock}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      added_stock: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Closing Stock
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.closing_stock}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      closing_stock: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (KSh)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profit Margin (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.profit_margin || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      profit_margin: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sales Person
                </label>
                <input
                  type="text"
                  value={formData.sales_person}
                  onChange={(e) =>
                    setFormData({ ...formData, sales_person: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-gray-900"
                  placeholder="e.g., John Doe"
                />
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Total Stock:</span>
                  <span className="font-semibold text-gray-900 ml-2">
                    {totalStock} units
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Daily Sale Amount:</span>
                  <span className="font-semibold text-gray-900 ml-2">
                    KSh {dailySale.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all shadow-sm font-medium text-sm"
              >
                Save Entry
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(groupedRecords)
          .sort((a, b) => b[0].localeCompare(a[0]))
          .map(([date, dateRecords]) => {
            const totalDailySales = dateRecords.reduce(
              (sum, r) => sum + r.daily_sale_amount,
              0
            );

            return (
              <div
                key={date}
                className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden"
              >
                <div className="bg-orange-50/50 px-6 py-4 border-b border-orange-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-header">{date}</h3>
                    <span className="text-sm font-semibold text-primary">
                      Total: KSh {totalDailySales.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          Item
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          Open
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          Added
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          Total
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          Closing
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          Sale Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          Profit
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          Sales Person
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {dateRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                            {record.item_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {record.open_stock}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {record.added_stock}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                            {record.open_stock + record.added_stock}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {record.closing_stock}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {record.price.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-primary font-medium">
                            KSh {record.daily_sale_amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {record.profit_margin?.toFixed(2) || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {record.sales_person || "-"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="text-red-400 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

        {records.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No records yet
            </h3>
            <p className="text-gray-500 mb-6">
              Start by adding your first daily stock entry
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-all shadow-sm text-sm font-medium"
            >
              Add First Entry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
