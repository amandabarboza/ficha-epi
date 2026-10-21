import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Casca } from "@/components/Casca";

export const metadata: Metadata = {
  title: "Ficha de EPI",
  description: "Controle de entrega de EPIs para a segurança do trabalho",
  applicationName: "Ficha de EPI",
  appleWebApp: { capable: true, title: "Ficha de EPI", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#ea580c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Casca>{children}</Casca>
      </body>
    </html>
  );
}
