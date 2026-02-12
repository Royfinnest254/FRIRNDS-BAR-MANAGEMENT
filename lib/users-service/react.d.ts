import { ReactNode } from "react";
export const useAuth: () => { user: any, isPending: boolean, redirectToLogin: () => void, exchangeCodeForSessionToken: () => Promise<void>, logout: () => void };
export const AuthProvider: ({ children }: { children: ReactNode }) => JSX.Element;
