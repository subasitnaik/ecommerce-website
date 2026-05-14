"use client";

import { Provider } from "react-redux";
import { SessionProvider } from "next-auth/react";
import { store } from "./store";
import { DarkModeInit } from "./DarkModeInit";

export function AdminDashboardProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <Provider store={store}>
        <DarkModeInit />
        {children}
      </Provider>
    </SessionProvider>
  );
}
