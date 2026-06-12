import { GetServerSidePropsContext } from "next";
import { getCsrfToken, getProviders, signIn } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { useState } from "react";

interface Props {
  providers: Record<string, { id: string; name: string }>;
  csrfToken: string;
  callbackUrl: string;
}

export default function SignIn({ providers, csrfToken, callbackUrl }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn("credentials", { username, password, callbackUrl });
    setLoading(false);
  };

  const fillSuperAdmin = () => {
    setUsername("superadmin");
    setPassword("SuperAdmin123!");
  };

  const fillTestAttorney = () => {
    setUsername("testattorney");
    setPassword("TestAttorney123!");
  };

  const fillTestTenant = () => {
    setUsername("testtenant");
    setPassword("TestTenant123!");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ===== TEST CREDENTIALS BANNER ===== */}
        <div className="mb-6 rounded-lg border-2 border-yellow-400 bg-yellow-50 p-4 shadow-sm">
          <h2 className="text-lg font-bold text-yellow-800 mb-3 flex items-center gap-2">
            <span className="text-xl">🧪</span> Test Accounts
          </h2>
          <p className="text-xs text-yellow-700 mb-3">
            First time? Hit <code className="bg-yellow-100 px-1 rounded">/api/seed-test-users/</code> to create these accounts.
          </p>
          <div className="space-y-3">
            {/* Super Admin */}
            <div className="rounded bg-red-50 p-3 border-2 border-red-300">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-red-800">Super Admin</span>
                <div className="flex gap-1">
                  <a
                    href="/admin/"
                    className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded font-medium"
                  >
                    Django Admin
                  </a>
                  <button
                    onClick={fillSuperAdmin}
                    className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded font-medium"
                  >
                    Fill
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600 font-mono">
                <div>Username: <span className="font-bold text-gray-900">superadmin</span></div>
                <div>Password: <span className="font-bold text-gray-900">SuperAdmin123!</span></div>
              </div>
              <div className="mt-2 text-xs text-red-700">
                Full control: Users, Blog, AI Writer, Intake, Todos, Site Settings
              </div>
            </div>

            {/* Test Attorney */}
            <div className="rounded bg-white p-3 border border-yellow-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-800">Test Attorney</span>
                <button
                  onClick={fillTestAttorney}
                  className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded font-medium"
                >
                  Fill &amp; Login
                </button>
              </div>
              <div className="text-sm text-gray-600 font-mono">
                <div>Username: <span className="font-bold text-gray-900">testattorney</span></div>
                <div>Password: <span className="font-bold text-gray-900">TestAttorney123!</span></div>
              </div>
            </div>

            {/* Test Tenant */}
            <div className="rounded bg-white p-3 border border-yellow-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-800">Test Tenant</span>
                <button
                  onClick={fillTestTenant}
                  className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded font-medium"
                >
                  Fill &amp; Login
                </button>
              </div>
              <div className="text-sm text-gray-600 font-mono">
                <div>Username: <span className="font-bold text-gray-900">testtenant</span></div>
                <div>Password: <span className="font-bold text-gray-900">TestTenant123!</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== SIGN IN FORM ===== */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sign In</h1>

          {/* Credentials form */}
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-700 hover:bg-red-800 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in with Credentials"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* OAuth providers */}
          <div className="space-y-3">
            {providers &&
              Object.values(providers)
                .filter((p) => p.id !== "credentials")
                .map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => signIn(provider.id, { callbackUrl })}
                    className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-md py-2 px-4 hover:bg-gray-50 transition-colors font-medium text-gray-700"
                  >
                    {provider.id === "google" && (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    {provider.id === "github" && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    )}
                    Sign in with {provider.name}
                  </button>
                ))}
          </div>
        </div>

        {/* Back to home */}
        <p className="mt-4 text-center text-sm text-gray-500">
          <a href="/" className="hover:text-red-700 underline">← Back to TenantGuard</a>
        </p>
      </div>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  // If already signed in, redirect to dashboard
  if (session) {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }

  const providers = await getProviders();
  const csrfToken = await getCsrfToken(context);

  return {
    props: {
      providers: providers ?? {},
      csrfToken: csrfToken ?? "",
      callbackUrl: (context.query.callbackUrl as string) || "/dashboard",
    },
  };
}
