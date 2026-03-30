import "../styles/globals.css";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";

export const metadata = {
  title: "StudyFlow",
  description: "AI-powered study assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900 antialiased">
        <div className="flex min-h-screen">
          {/* Desktop Sidebar */}
          <div className="hidden md:block">
            <Sidebar />
          </div>

          {/* Main Content */}
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8 pb-20 md:pb-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden">
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
