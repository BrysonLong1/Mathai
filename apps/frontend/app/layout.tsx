// apps/frontend/app/layout.tsx
import "../styles/globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <div className="brand">MathArena AI</div>
        </header>

        {/* 👇 this "fill" class will stretch to full viewport height */}
        <main className="shell fill">
          {children}
        </main>
      </body>
    </html>
  );
}

