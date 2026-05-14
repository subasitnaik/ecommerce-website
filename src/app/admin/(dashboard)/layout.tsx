import { Inter } from "next/font/google";
import { AdminDashboardProviders } from "@/admin-dashboard/AdminProviders";
import Header from "@/admin-dashboard/components/Header";
import { AdminSignOutBar } from "./admin-sign-out-bar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-admin-inter",
  display: "swap",
});

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminDashboardProviders>
      <div
        className={`${inter.className} ${inter.variable} min-h-screen bg-whiteSecondary dark:bg-blackPrimary`}
      >
        <AdminSignOutBar />
        <Header />
        {children}
      </div>
    </AdminDashboardProviders>
  );
}
