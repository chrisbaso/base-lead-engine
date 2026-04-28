import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Base Lead Engine Admin",
  description: "Tenant operations dashboard"
};

const clerkPublishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "pk_test_ZHVtbXktYnVpbGQta2V5";

async function AdminAuthGate({ children }: Readonly<{ children: React.ReactNode }>) {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const adminEmail = process.env.CLERK_ADMIN_EMAIL;
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  if (!adminEmail || email?.toLowerCase() !== adminEmail.toLowerCase()) {
    return (
      <main className="auth-denied">
        <h1>Access denied</h1>
        <p>This dashboard is restricted to the configured admin account.</p>
      </main>
    );
  }

  return children;
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <html lang="en">
        <body>
          <AdminAuthGate>{children}</AdminAuthGate>
        </body>
      </html>
    </ClerkProvider>
  );
}
