import "../styles/globals.css";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

export const metadata = {
  title: "Quantum Finance Engine",
  description: "Alpha Ultimate Ltd - Quantum Finance Engine"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
