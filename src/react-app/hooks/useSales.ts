import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/react-app/lib/supabase";
import type { Database } from "@/react-app/types/supabase";

// type Sale = Database["public"]["Tables"]["sales"]["Row"];
// type InsertSale = Database["public"]["Tables"]["sales"]["Insert"];

export function useSales() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .order("sale_date", { ascending: false });

      if (error) throw error;
      setSales(data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching sales:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch sales");
    } finally {
      setLoading(false);
    }
  }, []);

  const createSale = async (
    inventory_id: string,
    quantity: number,
    payment_method: "Cash" | "M-Pesa"
  ) => {
    try {
      // 1. Get the inventory and product details
      const { data: inv, error: invError } = await supabase
        .from("inventory")
        .select(`
          *,
          products (*)
        `)
        .eq("id", inventory_id)
        .single();

      const item = inv as any;

      if (invError || !item) throw new Error("Item not found");
      if (item.quantity < quantity) throw new Error("Insufficient stock");

      // 2. Calculate total
      const total = item.products.selling_price * quantity;

      // 3. Update inventory
      const { error: updateError } = await supabase
        .from("inventory")
        .update({ quantity: item.quantity - quantity })
        .eq("id", inventory_id);

      if (updateError) throw new Error("Failed to update inventory");

      // 4. Record sale
      const saleData = {
        product_id: item.product_id,
        item_name: item.products.name,
        quantity: quantity,
        unit_price: item.products.selling_price,
        total: total,
        payment_method: payment_method,
        sale_date: new Date().toISOString(),
      };

      const { data: newSale, error: saleError } = await supabase
        .from("sales")
        .insert(saleData)
        .select()
        .single();

      if (saleError) {
        // Revert inventory on sale record failure
        await supabase.from('inventory').update({ quantity: item.quantity }).eq('id', inventory_id);
        throw saleError;
      }

      setSales((prev) => [newSale, ...prev]);
      return newSale;
    } catch (err) {
      console.error("Error creating sale:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  return {
    sales,
    loading,
    error,
    refetch: fetchSales,
    createSale,
  };
}
