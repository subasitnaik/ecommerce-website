import { Suspense } from "react";
import { AdminLoginForm } from "./login-form";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Suspense
        fallback={
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center text-sm text-zinc-500">
            Loading…
          </div>
        }
      >
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
