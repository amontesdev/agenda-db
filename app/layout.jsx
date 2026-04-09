import "./globals.css";
import AuthProvider from "@/components/auth/AuthProvider";

export const metadata = { title: "Mi Agenda ⚡", description: "Planificador de productividad personal" };

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
