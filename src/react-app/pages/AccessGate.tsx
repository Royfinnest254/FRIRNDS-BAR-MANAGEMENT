import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/react-app/lib/supabase";
import { Lock, ArrowRight, AlertCircle } from "lucide-react";

export default function AccessGate() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleAccessCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Call the secure RPC function we defined in SQL
            const { data: isAllowed, error: rpcError } = await supabase.rpc("check_access", {
                email_input: email.trim().toLowerCase(),
            });

            if (rpcError) throw rpcError;

            if (isAllowed) {
                // Authorized! Send to login
                navigate(`/login?email=${encodeURIComponent(email)}`);
            } else {
                // Not authorized
                setError("Access Denied: This email is not authorized to access the system.");
            }
        } catch (err: any) {
            console.error("Access check failed:", err);
            setError("System Error: Could not verify access. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-primary p-6 text-center">
                    <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Friends Bar Management</h1>
                    <p className="text-primary-foreground/80 text-sm mt-1">Authorized Access Only</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleAccessCheck} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Enter your Email to Proceed
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                placeholder="name@friendbar.com"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Verifying..." : "Verify Access"}
                            {!loading && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-400">
                            System access is monitored and restricted to approved staff only.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
