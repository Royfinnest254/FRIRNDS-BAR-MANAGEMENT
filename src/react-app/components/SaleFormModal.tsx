import { useState } from "react";
import { X } from "lucide-react";
import { useItems } from "@/react-app/hooks/useItems";
import { useSales } from "@/react-app/hooks/useSales";

interface SaleFormModalProps {
  onClose: () => void;
}

export default function SaleFormModal({ onClose }: SaleFormModalProps) {
  const { items, refetch: refetchItems } = useItems();
  const { createSale } = useSales();
  const [formData, setFormData] = useState({
    item_id: "",
    quantity_sold: 1,
    payment_method: "Cash" as "Cash" | "M-Pesa",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedItem = items.find((item) => item.id === formData.item_id);
  const totalPrice = selectedItem
    ? selectedItem.price * formData.quantity_sold
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.item_id) {
      setError("Please select an item");
      setLoading(false);
      return;
    }

    try {
      await createSale(
        formData.item_id,
        Number(formData.quantity_sold),
        formData.payment_method
      );
      await refetchItems(); // Refresh inventory
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-heading font-bold text-header">Record Sale</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Item
            </label>
            <select
              required
              value={formData.item_id}
              onChange={(e) =>
                setFormData({ ...formData, item_id: e.target.value })
              }
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900"
            >
              <option value="">Choose an item...</option>
              {items
                .filter((item) => item.quantity > 0)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.item_name} - {item.quantity} available - KSh{" "}
                    {item.price.toLocaleString()}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              required
              min="1"
              max={selectedItem?.quantity || 1}
              value={formData.quantity_sold}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quantity_sold: parseInt(e.target.value) || 1,
                })
              }
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
              placeholder="1"
            />
            {selectedItem && (
              <p className="text-xs text-gray-500 mt-1">
                Available: {selectedItem.quantity} units
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, payment_method: "Cash" })
                }
                className={`px-3 py-2 rounded-lg border font-medium text-sm transition-all ${formData.payment_method === "Cash"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
              >
                Cash
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, payment_method: "M-Pesa" })
                }
                className={`px-3 py-2 rounded-lg border font-medium text-sm transition-all ${formData.payment_method === "M-Pesa"
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
              >
                M-Pesa
              </button>
            </div>
          </div>

          {selectedItem && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-500">Unit Price:</span>
                <span className="font-semibold text-gray-900">
                  KSh {selectedItem.price.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-500">Quantity:</span>
                <span className="font-semibold text-gray-900">
                  {formData.quantity_sold}
                </span>
              </div>
              <div className="border-t border-gray-200 my-2"></div>
              <div className="flex items-center justify-between">
                <span className="text-gray-900 font-bold">Total:</span>
                <span className="text-xl font-bold text-green-600">
                  KSh {totalPrice.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.item_id}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm disabled:opacity-50 font-medium text-sm"
            >
              {loading ? "Processing..." : "Complete Sale"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
