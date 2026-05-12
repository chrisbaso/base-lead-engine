import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { ClerkProvider } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Fraunces, Inter_Tight } from "next/font/google";
import { getSupabaseClient } from "@ble/db";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Base Lead Engine Admin",
  description: "Tenant operations dashboard"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

const clerkPublishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "pk_test_ZHVtbXktYnVpbGQta2V5";
const adminAuthProvider = process.env.ADMIN_AUTH_PROVIDER ?? "supabase";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "optional",
  axes: ["opsz"]
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
  display: "optional"
});

function AdminAuthGate({ children }: Readonly<{ children: React.ReactNode }>) {
  if (adminAuthProvider === "supabase") {
    return <SupabaseAdminAuthGate>{children}</SupabaseAdminAuthGate>;
  }

  return <ClerkAdminAuthGate>{children}</ClerkAdminAuthGate>;
}

async function ClerkAdminAuthGate({ children }: Readonly<{ children: React.ReactNode }>) {
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

async function SupabaseAdminAuthGate({ children }: Readonly<{ children: React.ReactNode }>) {
  const token = await readSupabaseAccessToken();

  if (!token) {
    return (
      <main className="auth-denied">
        <h1>Sign in required</h1>
        <p>This dashboard is restricted to authenticated admin users.</p>
      </main>
    );
  }

  try {
    const { data, error } = await getSupabaseClient("anon").auth.getUser(token);
    const adminEmail = process.env.SUPABASE_ADMIN_EMAIL ?? process.env.CLERK_ADMIN_EMAIL;
    const email = data.user?.email;

    if (error || !email || (adminEmail && email.toLowerCase() !== adminEmail.toLowerCase())) {
      return (
        <main className="auth-denied">
          <h1>Access denied</h1>
          <p>This dashboard is restricted to the configured admin account.</p>
        </main>
      );
    }
  } catch (error) {
    return (
      <main className="auth-denied">
        <h1>Supabase auth unavailable</h1>
        <p>{error instanceof Error ? error.message : "Configure Supabase auth before opening the dashboard."}</p>
      </main>
    );
  }

  return children;
}

async function readSupabaseAccessToken(): Promise<string | undefined> {
  const headerList = await headers();
  const authHeader = headerList.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length);
  }

  const cookieStore = await cookies();
  return (
    cookieStore.get("sb-access-token")?.value ??
    cookieStore
      .getAll()
      .find((cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-access-token"))?.value
  );
}

function HtmlShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${interTight.variable}`}>
      <body>{children}</body>
    </html>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const gated = <AdminAuthGate>{children}</AdminAuthGate>;

  if (adminAuthProvider === "clerk") {
    return (
      <ClerkProvider publishableKey={clerkPublishableKey}>
        <HtmlShell>{gated}</HtmlShell>
      </ClerkProvider>
    );
  }

  return <HtmlShell>{gated}</HtmlShell>;
}
