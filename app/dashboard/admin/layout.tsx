import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getIsAdmin } from "@/lib/admin/guard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";

/**
 * Admin layout — server component
 *
 * Checks is_admin server-side. Shows access denied page for non-admins
 * instead of silently redirecting.
 */
export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const isAdmin = await getIsAdmin();

	if (!isAdmin) {
		// Get the user's email for the access denied page
		const supabase = await createSupabaseServerClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		return <AdminAccessDenied userEmail={user?.email || null} />;
	}

	return (
		<div className="flex min-h-[calc(100vh-4rem)]">
			<AdminSidebar />
			<div className="flex-1 min-w-0">{children}</div>
		</div>
	);
}
