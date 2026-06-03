import type { AppProps } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { SessionProvider } from "next-auth/react";
import "../styles/globals.css";
import Chat from "@/components/Chat";
import StaffTodoWidget from "@/components/StaffTodoWidget";
import { GoogleAnalytics } from "@next/third-parties/google";
import { pageview } from "@/lib/analytics";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const router = useRouter();

  // Track client-side route changes (SPA navigation)
  useEffect(() => {
    const handleRouteChange = (url: string) => pageview(url);
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events]);

  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
      <Chat />
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      <StaffTodoWidget />
    </SessionProvider>
  );
}
