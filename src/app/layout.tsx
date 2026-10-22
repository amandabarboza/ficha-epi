import type { Metadata, Viewport } from "next";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "./globals.css";
import { Casca } from "@/components/Casca";

export const metadata: Metadata = {
  title: "Ficha de EPI",
  description: "Controle de entrega de EPIs para a segurança do trabalho",
  applicationName: "Ficha de EPI",
  appleWebApp: { capable: true, title: "Ficha de EPI", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#1a3a3a",
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
