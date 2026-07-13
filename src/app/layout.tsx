import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ทะเบียนคุมพัสดุ",
  description: "ระบบจดเลขพัสดุและการเบิกจ่าย",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="font-body min-h-screen bg-paper text-ink">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <header className="mb-10 flex items-baseline justify-between border-b border-line pb-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">
                ทะเบียนคุม
              </p>
              <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
                รายการเบิกจ่ายพัสดุ
              </h1>
            </div>
            <nav className="flex gap-6 font-mono text-sm">
              <a href="/" className="text-ink/70 hover:text-brand">
                รายการทั้งหมด
              </a>
              <a href="/new" className="text-brand hover:underline">
                + จดรายการใหม่
              </a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
