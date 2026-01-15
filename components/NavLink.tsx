"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavLinkProps
	extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
	href: string;
	/**
	 * If true, only match exact path. If false, treats href as a prefix match.
	 * Example: href="/dashboard" is active for "/dashboard/settings" when exact=false.
	 */
	exact?: boolean;

	className?: string;
	activeClassName?: string;
	pendingClassName?: string;
}

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
	(
		{
			href,
			exact = false,
			className,
			activeClassName,
			pendingClassName,
			onClick,
			...rest
		},
		ref
	) => {
		const pathname = usePathname();
		const router = useRouter();
		const [isPending, startTransition] = React.useTransition();

		const isActive = React.useMemo(() => {
			if (!pathname) return false;
			if (exact) return pathname === href;

			// Prefix match (but treat "/" specially so it doesn't match everything)
			if (href === "/") return pathname === "/";
			return pathname === href || pathname.startsWith(href + "/");
		}, [pathname, href, exact]);

		const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
			onClick?.(e);
			if (e.defaultPrevented) return;

			// Let normal behavior happen for new tab, downloads, modified clicks, etc.
			if (
				e.button !== 0 ||
				e.metaKey ||
				e.ctrlKey ||
				e.shiftKey ||
				e.altKey
			) {
				return;
			}

			// Emulate "pending" state by owning the navigation
			e.preventDefault();
			startTransition(() => router.push(href));
		};

		return (
			<Link
				ref={ref}
				href={href}
				onClick={handleClick}
				className={cn(
					className,
					isActive && activeClassName,
					isPending && pendingClassName
				)}
				{...rest}
			/>
		);
	}
);

NavLink.displayName = "NavLink";
