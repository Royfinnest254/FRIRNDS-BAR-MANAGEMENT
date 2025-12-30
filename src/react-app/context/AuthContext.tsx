import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/react-app/lib/supabase";
import { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
    session: Session | null;
    user: User | null;
    role: "admin" | "staff" | "viewer" | null;
    loading: boolean;
    error: string | null;  // NEW: Expose error
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    role: null,
    loading: true,
    error: null,
    signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<"admin" | "staff" | "viewer" | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) fetchUserRole(session.user.id);
            else setLoading(false);
        });

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserRole(session.user.id);
            } else {
                setRole(null);
                setError(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserRole = async (userId: string) => {
        setError(null);
        try {
            console.log("🔍 Fetching role from PROFILES for:", userId);

            // EMERGENCY BYPASS FOR SPECIFIC USER
            // If the database fails, this ensures you are admin
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email === 'roychumba16@gmail.com') {
                console.log("⚡ GOD MODE ACTIVATED: Forced Admin for roychumba16@gmail.com");
                setRole('admin');
                setLoading(false);
                return;
            }

            // STANDARD MODEL: Single query to profiles
            const { data, error: fetchError } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", userId)
                .single();

            if (fetchError) {
                console.warn("⚠️ Profile fetch error:", fetchError);
                // Even on error, if we are the user, we are admin (redundant safety)
                if (user?.email === 'roychumba16@gmail.com') {
                    setRole('admin');
                } else {
                    setError(fetchError.message + " (" + fetchError.code + ")");
                    setRole(null);
                }
                return;
            }

            if (data?.role) {
                console.log("✅ Role verified:", data.role);
                setRole(data.role as "admin" | "staff" | "viewer");
            } else {
                console.warn("⚠️ Profile exists but has no role?");
                setError("Profile missing role");
                setRole(null);
            }
        } catch (err: any) {
            console.error("Critical Auth Error:", err);
            // Emergency fallback on crash
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email === 'roychumba16@gmail.com') setRole('admin');
            else {
                setError(err.message || "Unknown Error");
                setRole(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setRole(null);
        setError(null);
    };

    return (
        <AuthContext.Provider value={{ session, user, role, loading, error, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
