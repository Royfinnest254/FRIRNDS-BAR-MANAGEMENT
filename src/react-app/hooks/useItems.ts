import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/react-app/lib/supabase";
import type { Database } from "@/react-app/types/supabase";

type Item = Database["public"]["Tables"]["inventory"]["Row"];
type InsertItem = Database["public"]["Tables"]["inventory"]["Insert"];
type UpdateItem = Database["public"]["Tables"]["inventory"]["Update"];

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .order("item_name");

      if (error) throw error;
      setItems(data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching items:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch items");
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = async (data: InsertItem) => {
    try {
      const { data: newItem, error } = await supabase
        .from("inventory")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      setItems((prev) => [...prev, newItem]);
      return newItem;
    } catch (err) {
      console.error("Error creating item:", err);
      throw err;
    }
  };

  const updateItem = async (id: string, data: UpdateItem) => {
    try {
      const { data: updatedItem, error } = await supabase
        .from("inventory")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      setItems((prev) => prev.map((item) => (item.id === id ? updatedItem : item)));
      return updatedItem;
    } catch (err) {
      console.error("Error updating item:", err);
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from("inventory").delete().eq("id", id);
      if (error) throw error;
      setItems((prev) => prev.filter((item) => item.id !== id));
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
