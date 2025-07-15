import { Outlet } from "react-router-dom";
import Header from "./Header";

export default function Layout() {
  return (
    <div className="px-4 md:px-8 py-4 flex flex-col min-h-screen w-full">
      <Header />
      {/* Outlet basically means here that header remains fixed at all pages , and the nested  parents of layout will appear as we need */}
      <Outlet />
    </div>
  );
}
