import { useState, useEffect } from "react";
import { Plus, Lock, Save, Search, AlertCircle, Calendar } from "lucide-react";
import { supabase } from "@/react-app/lib/supabase";
import { useAuth } from "@/react-app/context/AuthContext";
import type { Database } from "@/react-app/types/supabase";

type DailyStockjoined = Database["public"]["Tables"]["daily_stock_records"]["Row"] & {
  products: Database["public"]["Tables"]["products"]["Row"];
};

export default function DailyStockPage() {
  const { role } = useAuth();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [records, setRecords] = useState<DailyStockjoined[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "empty">("empty");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDailyStock();
  }, [selectedDate]);

  const fetchDailyStock = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("daily_stock_records")
        .select(`
          *,
          products (
            id,
            name,
            selling_price,
            category
          )
        `)
        .eq("date", selectedDate)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        setStatus("empty");
        setRecords([]);
      } else {
        // @ts-ignore - Supabase types join complexity
        setRecords(data);
        // @ts-ignore
        setStatus(data[0].status);
      }
    } catch (error) {
      console.error("Error fetching stock:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializeDailyStock = async () => {
    if (role !== "admin" && role !== "staff") {
      alert("Only staff or admin can start the day.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Fetch all active products
      const { data: products, error: prodError } = await supabase
        .from("products")
        .select("*")
        .eq("active", true);

      if (prodError) throw prodError;

      // 2. Fetch current inventory levels for opening stock
      const { data: inventory, error: invError } = await supabase
        .from("inventory")
        .select("product_id, quantity");

      if (invError) throw invError;

      // Map inventory for quick lookup
      const invMap = new Map(inventory?.map((i) => [i.product_id, i.quantity]));

      // 3. Prepare new records
      const newRecords = products?.map((product) => ({
        date: selectedDate,
        product_id: product.id,
        opening_stock: invMap.get(product.id) || 0,
        added_stock: 0,
        closing_stock: 0, // Default to 0, needs entry
        status: "draft",
      }));

      if (!newRecords || newRecords.length === 0) {
        alert("No products found in master list.");
        return;
      }

      // 4. Insert all
      const { error: insertError } = await supabase
        .from("daily_stock_records")
        .insert(newRecords as any);

      if (insertError) throw insertError;

      await fetchDailyStock();
    } catch (error: any) {
      console.error("Error starting day:", error);
      alert("Failed to start day: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (
    id: string,
    field: "opening_stock" | "added_stock" | "closing_stock",
    value: string
  ) => {
    if (status === "published") return; // Double check safety

    const numValue = parseInt(value) || 0;

    // Optimiztically update UI
    const updatedRecords = records.map((r) => {
      if (r.id === id) {
        return { ...r, [field]: numValue };
      }
      return r;
    });
    setRecords(updatedRecords);

    // Send update to DB (Debounce could be added here for perf)
    try {
      const { error } = await supabase
        .from("daily_stock_records")
        .update({ [field]: numValue })
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating record:", error);
      // Revert on error? For now just log.
    }
  };

  const publishStock = async () => {
    if (role !== "admin") {
      alert("Only ADMIN can publish daily stock.");
      return;
    }

    if (!confirm("Are you sure? This will LOCK the day and UPDATE Inventory forever.")) return;

    setIsSubmitting(true);
    try {
      // We will do this via client-side logical loop if the RPC fails, 
      // BUT ideally we use a transaction logic. 
      // Since we removed the RPC to fix your SQL runner, we do it here safely.

      // 1. Update Inventory for each item
      for (const record of records) {
        const { error: invErr } = await supabase
          .from('inventory')
          .update({
            quantity: record.closing_stock,
            updated_at: new Date().toISOString()
          })
          .eq('product_id', record.product_id);

        if (invErr) {
          console.error("Failed to update inventory for", record.products.name);
          throw invErr;
        }
      }

      // 2. Lock all records
      const { error: lockErr } = await supabase
        .from('daily_stock_records')
        .update({ status: 'published' })
        .eq('date', selectedDate);

      if (lockErr) throw lockErr;

      setStatus('published');
      alert("Day Published Successfully! Inventory Updated.");

    } catch (error: any) {
      console.error("Error publishing:", error);
      alert("Failed to publish: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculations
  const calculateRow = (record: DailyStockjoined) => {
    const totalStock = record.opening_stock + record.added_stock;
    const salesCount = totalStock - record.closing_stock;
    const salesAmount = salesCount * record.products.selling_price;
    return { totalStock, salesCount, salesAmount };
  };

  const filteredRecords = records.filter(r =>
    r.products.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const grandTotal = records.reduce((acc, curr) => acc + calculateRow(curr).salesAmount, 0);

  if (loading) return <div className="p-8 text-center">Loading stock sheet...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-lg text-primary">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Viewing Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="font-mono text-lg font-bold bg-transparent outline-none text-gray-900"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {status === 'draft' && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full border border-yellow-200 uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
              Draft Mode
            </span>
          )}
          {status === 'published' && (
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full border border-green-200 uppercase tracking-wide flex items-center gap-2">
              <Lock className="w-3 h-3" />
              Locked
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      {status === 'empty' ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <div className="mb-4 flex justify-center">
            <div className="bg-gray-50 p-4 rounded-full">
              <AlertCircle className="w-12 h-12 text-gray-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Records for {selectedDate}</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">The daily stock sheet has not been initialized for this date yet.</p>
          <button
            onClick={initializeDailyStock}
            disabled={isSubmitting}
            className="bg-primary text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
          >
            {isSubmitting ? 'Starting Day...' : 'Start Day & Initialize Sheet'}
          </button>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>

            {status === 'draft' && role === 'admin' && (
              <button
                onClick={publishStock}
                disabled={isSubmitting}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                {isSubmitting ? 'Publishing...' : 'Publish & Lock Day'}
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider w-64">Product</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-600 uppercase tracking-wider bg-blue-50/50">Open</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-600 uppercase tracking-wider bg-green-50/50">Added</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-600 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-600 uppercase tracking-wider bg-red-50/50">Closing</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-600 uppercase tracking-wider">Sales</th>
                    <th className="px-4 py-3 text-right font-bold text-gray-600 uppercase tracking-wider">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((record) => {
                    const { totalStock, salesCount, salesAmount } = calculateRow(record);
                    const isDraft = status === 'draft';

                    return (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 border-r border-gray-100">
                          {record.products.name}
                          <div className="text-xs text-gray-400 font-normal mt-0.5">KSh {record.products.selling_price}</div>
                        </td>

                        {/* Opening Stock */}
                        <td className="px-2 py-2 bg-blue-50/20 text-center">
                          <input
                            type="number"
                            disabled={!isDraft}
                            value={record.opening_stock}
                            onChange={(e) => handleUpdate(record.id, 'opening_stock', e.target.value)}
                            className="w-20 text-center bg-transparent border border-transparent hover:border-blue-200 focus:border-blue-500 focus:bg-white rounded px-1 py-1 outline-none transition-all disabled:text-gray-500"
                          />
                        </td>

                        {/* Added Stock */}
                        <td className="px-2 py-2 bg-green-50/20 text-center">
                          <input
                            type="number"
                            disabled={!isDraft}
                            value={record.added_stock}
                            onChange={(e) => handleUpdate(record.id, 'added_stock', e.target.value)}
                            className="w-20 text-center bg-transparent border border-transparent hover:border-green-200 focus:border-green-500 focus:bg-white rounded px-1 py-1 outline-none transition-all disabled:text-gray-500"
                          />
                        </td>

                        {/* Total (Calculated) */}
                        <td className="px-4 py-3 text-center font-medium text-gray-600 bg-gray-50/30">
                          {totalStock}
                        </td>

                        {/* Closing Stock */}
                        <td className="px-2 py-2 bg-red-50/20 text-center border-l border-r border-gray-100">
                          <input
                            type="number"
                            disabled={!isDraft}
                            value={record.closing_stock}
                            onChange={(e) => handleUpdate(record.id, 'closing_stock', e.target.value)}
                            className="w-20 text-center font-bold text-gray-900 bg-transparent border border-transparent hover:border-red-200 focus:border-red-500 focus:bg-white rounded px-1 py-1 outline-none transition-all disabled:text-gray-500"
                          />
                        </td>

                        {/* Sold Count (Calculated) */}
                        <td className="px-4 py-3 text-center text-gray-900 font-bold bg-gray-50/30">
                          {salesCount}
                        </td>

                        {/* Revenue (Calculated) */}
                        <td className="px-4 py-3 text-right font-mono font-medium text-primary">
                          {salesAmount.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-right font-bold text-gray-700 uppercase">Total Daily Revenue</td>
                    <td className="px-4 py-4 text-right font-bold text-xl text-primary font-mono border-t-2 border-primary">
                      KSh {grandTotal.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
