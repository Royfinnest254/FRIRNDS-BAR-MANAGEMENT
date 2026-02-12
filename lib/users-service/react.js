import React from "react";
export const useAuth = () => ({ user: null, isPending: false, redirectToLogin: () => { }, exchangeCodeForSessionToken: async () => { }, logout: () => { } });
export const AuthProvider = ({ children }) => React.createElement(React.Fragment, null, children);
