import AuthProvider from "@/components/auth/AuthProvider";

export const metadata = { title: "Mi Agenda ⚡", description: "Planificador de productividad personal" };

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin:0, padding:0, background:"#060a10" }}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
