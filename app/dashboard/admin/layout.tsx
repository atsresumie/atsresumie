import { redirect } from "next/navigation";
import { getIsAdmin } from "@/lib/admin/guard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

/**
 * Admin layout — server component
 *
 * Checks is_admin server-side and redirects non-admins.
 * Renders admin sidebar + content area.
 */
export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const isAdmin = await getIsAdmin();

	if (!isAdmin) {
		redirect("/dashboard");
	}

	return (
		<div className="flex min-h-[calc(100vh-4rem)]">
			<AdminSidebar />
			<div className="flex-1 min-w-0">{children}</div>
		</div>
	);
}
