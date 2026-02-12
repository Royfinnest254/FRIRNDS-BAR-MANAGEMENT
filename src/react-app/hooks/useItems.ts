import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/react-app/lib/supabase";
import type { Database } from "@/react-app/types/supabase";

// type Item = Database["public"]["Tables"]["inventory"]["Row"];
// type InsertItem = Database["public"]["Tables"]["inventory"]["Insert"];
// type UpdateItem = Database["public"]["Tables"]["inventory"]["Update"];

export function useItems() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      // Join inventory with products
      const { data, error } = await supabase
        .from("inventory")
        .select(`
          *,
          products (*)
        `)
        .order("created_at", { referencedTable: 'products' as any, ascending: false });

      if (error) throw error;

      // Flatten data for the UI
      const flattenedItems = (data || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        item_name: item.products.name,
        quantity: item.quantity,
        price: item.products.selling_price,
        low_stock_threshold: item.low_stock_threshold,
        category: item.products.category,
        updated_at: item.updated_at
      }));

      setItems(flattenedItems);
      setError(null);
    } catch (err) {
      console.error("Error fetching items:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch items");
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = async (data: { item_name: string, quantity: number, price: number, low_stock_threshold: number }) => {
    try {
      // 1. Create Product
      const { data: product, error: pError } = await supabase
        .from("products")
        .insert({
          name: data.item_name.toUpperCase(),
          selling_price: data.price,
          category: "General" // Default category
        })
        .select()
        .single();

      if (pError) throw pError;

      // 2. Create Inventory Record
      const { data: inventory, error: iError } = await supabase
        .from("inventory")
        .insert({
          product_id: product.id,
          quantity: data.quantity,
          low_stock_threshold: data.low_stock_threshold
        })
        .select()
        .single();

      if (iError) throw iError;

      const newItem = {
        id: inventory.id,
        product_id: product.id,
        item_name: product.name,
        quantity: inventory.quantity,
        price: product.selling_price,
        low_stock_threshold: inventory.low_stock_threshold,
        category: product.category
      };

      setItems((prev: any[]) => [newItem, ...prev]);
      return newItem;
    } catch (err) {
      console.error("Error creating item:", err);
      throw err;
    }
  };

  const updateItem = async (id: string, data: { item_name?: string, quantity?: number, price?: number, low_stock_threshold?: number }) => {
    try {
      // Find the existing item to get product_id
      const existingItem = items.find((i: any) => i.id === id);
      if (!existingItem) throw new Error("Item not found locally");

      // 1. Update Product if name or price changed
      if (data.item_name || data.price !== undefined) {
        const { error: pError } = await supabase
          .from("products")
          .update({
            ...(data.item_name && { name: data.item_name.toUpperCase() }),
            ...(data.price !== undefined && { selling_price: data.price })
          })
          .eq("id", existingItem.product_id);

        if (pError) throw pError;
      }

      // 2. Update Inventory
      const { data: updatedInventory, error: iError } = await supabase
        .from("inventory")
        .update({
          ...(data.quantity !== undefined && { quantity: data.quantity }),
          ...(data.low_stock_threshold !== undefined && { low_stock_threshold: data.low_stock_threshold })
        })
        .eq("id", id)
        .select()
        .single();

      if (iError) throw iError;

      const updatedItem = {
        ...existingItem,
        ...(data.item_name && { item_name: data.item_name.toUpperCase() }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.quantity !== undefined && { quantity: updatedInventory.quantity }),
        ...(data.low_stock_threshold !== undefined && { low_stock_threshold: updatedInventory.low_stock_threshold })
      };

      setItems((prev: any[]) => prev.map((item: any) => (item.id === id ? updatedItem : item)));
      return updatedItem;
    } catch (err) {
      console.error("Error updating item:", err);
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      // Find the item to get product_id
      const item = items.find((i: any) => i.id === id);
      if (!item) throw new Error("Item not found");

      // Delete the product - inventory will cascade delete
      const { error } = await supabase.from("products").delete().eq("id", item.product_id);
      if (error) throw error;

      setItems((prev: any[]) => prev.filter((item: any) => item.id !== id));
    } catch (err) {
      console.error("Error deleting item:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    items,
    loading,
    error,
    refetch: fetchItems,
    createItem,
    updateItem,
    deleteItem,
  };
}
