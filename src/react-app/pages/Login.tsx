import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/react-app/lib/supabase";
import { Lock, ArrowRight, AlertCircle } from "lucide-react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [step, setStep] = useState<1 | 2>(1); // Step 1: Email, Step 2: Password
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleVerifyEmail = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError("Please enter your email address.");
            return;
        }
        // Basic email validation
        if (!email.includes("@")) {
            setError("Please enter a valid email address.");
            return;
        }

        // Proceed to password step
        setError(null);
        setStep(2);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            navigate("/");
        } catch (err: any) {
            console.error("Login failed:", err);
            // If failed, user might want to try email again or just password.
            // We keep them on step 2 usually, but let's show the specific design error.
            setError("System Error: Could not verify access. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4">

            {/* Main Card */}
            <div className="w-full max-w-[400px] bg-white rounded-3xl shadow-2xl overflow-hidden font-sans">

                {/* Header Section (Orange) */}
                <div className="bg-[#ea580c] p-8 flex flex-col items-center text-center relative">

                    {step === 2 && (
                        <button
                            onClick={() => { setStep(1); setError(null); }}
                            className="absolute top-4 left-4 text-white/80 hover:text-white transition-colors"
                            title="Back to Email"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                    )}

                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm">
                        <Lock className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-1">
                        Friends Bar Management
                    </h1>
                    <p className="text-orange-100 text-sm font-medium opacity-90">
                        Authorized Access Only
                    </p>
                </div>

                {/* Form Section */}
                <div className="p-8 pb-10">
                    <form onSubmit={step === 1 ? handleVerifyEmail : handleLogin} className="space-y-6">

                        {/* STEP 1: EMAIL */}
                        {step === 1 && (
                            <div className="space-y-2 animate-in slide-in-from-left-4 fade-in duration-300">
                                <label className="block text-sm font-semibold text-gray-700 ml-1">
                                    Enter your Email to Proceed
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#ea580c] focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-medium"
                                    placeholder="name@company.com"
                                    autoFocus
                                />
                            </div>
                        )}

                        {/* STEP 2: PASSWORD */}
                        {step === 2 && (
                            <div className="space-y-2 animate-in slide-in-from-right-4 fade-in duration-300">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-semibold text-gray-700 ml-1">
                                        Password
                                    </label>
                                    <span className="text-xs text-gray-500 mr-1">{email}</span>
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#ea580c] focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-medium"
                                    placeholder="••••••••"
                                    autoFocus
                                />
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                <span className="text-sm font-medium text-red-600 leading-tight">
                                    {error}
                                </span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] shadow-lg shadow-orange-500/20"
                        >
                            <span>{loading ? "Verifying..." : (step === 1 ? "Verify Access" : "Sign In")}</span>
                            {!loading && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-xs text-gray-400 font-medium">
                        System access is monitored and restricted to approved staff only.
                    </p>
                </div>
            </div>
        </div>
    );
}
