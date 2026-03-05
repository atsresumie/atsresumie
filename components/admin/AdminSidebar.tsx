"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Zap, CreditCard, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const adminLinks = [
	{
		label: "Overview",
		href: "/dashboard/admin",
		icon: LayoutDashboard,
	},
	{ label: "Users", href: "/dashboard/admin/users", icon: Users },
	{
		label: "Generations",
		href: "/dashboard/admin/generations",
		icon: Zap,
	},
	{
		label: "Credits & Purchases",
		href: "/dashboard/admin/credits",
		icon: CreditCard,
	},
	{
		label: "Email Center",
		href: "/dashboard/admin/emails",
		icon: Mail,
	},
];

export function AdminSidebar() {
	const pathname = usePathname();

	return (
		<aside
			className={cn(
				"w-56 shrink-0",
				"border-r border-border-subtle",
				"bg-surface-base",
				"hidden md:block",
			)}
		>
			<div className="p-4 border-b border-border-subtle">
				<h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
					Admin Panel
				</h2>
			</div>
			<nav className="p-3">
				<ul className="flex flex-col gap-0.5">
					{adminLinks.map((link) => {
						const isActive =
							pathname === link.href ||
							(link.href !== "/dashboard/admin" &&
								pathname.startsWith(link.href));
						const Icon = link.icon;

						return (
							<li key={link.href}>
								<Link
									href={link.href}
									className={cn(
										"flex items-center gap-2.5",
										"px-3 py-2",
										"text-sm font-medium",
										"rounded-md",
										"transition-colors duration-150",
										isActive
											? "bg-surface-raised text-text-primary"
											: "text-text-secondary hover:text-text-primary hover:bg-surface-raised",
									)}
								>
									<Icon size={16} />
									{link.label}
								</Link>
							</li>
						);
					})}
				</ul>
			</nav>
		</aside>
	);
}
