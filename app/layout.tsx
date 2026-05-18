import type React from "react";
import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";
// DISABLED: Firebase Cloud Messaging
// import FCMListener from "@/components/fcm-listener";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { MaintenanceSessionCleanup } from "@/app/maintenance/components/maintenance-session-cleanup";

const quicksand = Quicksand({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Clever School – Tối ưu hóa trải nghiệm học tập",
  description: "Clever School – Quản lý & phát triển hành trình học tập cá nhân",
  icons: {
    icon: "/logo-urp.png", // favicon hoặc icon chung
  },
  openGraph: {
    title: "Clever School – Tối ưu hóa trải nghiệm học tập",
    description: "Clever School – Quản lý & phát triển hành trình học tập cá nhân",
    images: [
      {
        url: "/logo-urp.png", // ảnh hiển thị khi chia sẻ
        width: 200,
        height: 200,
        alt: "Clever School Logo",
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();
  
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body
        className={quicksand.className + " relative min-h-screen notranslate"}
      >
        {/* Background layer fixed, không scale theo content */}
        <div
          aria-hidden="true"
          className="fixed inset-0 -z-10 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: 'url("/BG_Clever School.png")' }}
        />
        <NextIntlClientProvider messages={messages}>
          <Providers>
            {/* DISABLED: Firebase Cloud Messaging */}
            {/* <FCMListener /> */}
            <MaintenanceSessionCleanup />
            <div>{children}</div>
          </Providers>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
