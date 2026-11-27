import type { Metadata } from "next";
import AdminConsole from "@/components/admin/AdminConsole";

export const metadata: Metadata = {
  title: "Console admin - The Box",
  description: "Administration de la plateforme The Box.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminConsole />;
}
