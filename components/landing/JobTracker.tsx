import {
	Bookmark,
	Send,
	ScanSearch,
	MessageSquare,
	Trophy,
	ArrowRight,
	Calendar,
	DollarSign,
	CheckCircle2,
} from "lucide-react";

/**
 * JobTracker — Server Component
 *
 * Rich kanban-style product preview. 5 columns: Saved → Applied → Screening → Interview → Offer.
 * Tagged "Coming soon". Mini-dashboard feel adapted to espresso-light theme.
 */

type JobCard = {
	initials: string;
	initialsBg: string;
	company: string;
	role: string;
	meta: string;
	date: string;
	action: string;
	actionColor: string;
	salary?: string;
	badge?: string;
	badgeIcon?: string;
};

type Column = {
	title: string;
	count: number;
	icon: typeof Bookmark;
	accentClass: string;
	headerBg: string;
	cards: JobCard[];
};

const columns: Column[] = [
	{
		title: "Saved",
		count: 4,
		icon: Bookmark,
		accentClass: "text-text-secondary",
		headerBg: "bg-surface-inset/60",
		cards: [
			{
				initials: "Nt",
				initialsBg: "bg-accent-muted",
				company: "Notion",
				role: "UX Researcher",
				meta: "Remote",
				date: "Saved Mar 8",
				action: "Apply →",
				actionColor: "text-accent",
			},
			{
				initials: "Cl",
				initialsBg: "bg-info-muted",
				company: "Cloudflare",
				role: "ML Engineer",
				meta: "Remote",
				date: "Saved Mar 10",
				action: "Apply →",
				actionColor: "text-accent",
			},
			{
				initials: "Pl",
				initialsBg: "bg-success-muted",
				company: "PlanetScale",
				role: "Dev Rel Engineer",
				meta: "Remote",
				date: "Saved Mar 11",
				action: "Apply →",
				actionColor: "text-accent",
			},
		],
	},
	{
		title: "Applied",
		count: 3,
		icon: Send,
		accentClass: "text-info",
		headerBg: "bg-info-muted/30",
		cards: [
			{
				initials: "Vr",
				initialsBg: "bg-accent-muted",
				company: "Vercel",
				role: "Product Designer",
				meta: "Hybrid",
				date: "Mar 7",
				action: "View",
				actionColor: "text-text-secondary",
			},
			{
				initials: "Sh",
				initialsBg: "bg-success-muted",
				company: "Shopify",
				role: "Growth Manager",
				meta: "Toronto",
				date: "Mar 5",
				action: "View",
				actionColor: "text-text-secondary",
			},
		],
	},
	{
		title: "Screening",
		count: 3,
		icon: ScanSearch,
		accentClass: "text-text-secondary",
		headerBg: "bg-surface-inset/40",
		cards: [
			{
				initials: "Lr",
				initialsBg: "bg-info-muted",
				company: "Linear",
				role: "Backend Engineer",
				meta: "Remote",
				date: "Mar 9",
				action: "View",
				actionColor: "text-text-secondary",
			},
			{
				initials: "Fg",
				initialsBg: "bg-accent-muted",
				company: "Figma",
				role: "UX Researcher",
				meta: "Remote",
				date: "Mar 8",
				action: "View",
				actionColor: "text-text-secondary",
			},
		],
	},
	{
		title: "Interview",
		count: 5,
		icon: MessageSquare,
		accentClass: "text-warning",
		headerBg: "bg-warning-muted/30",
		cards: [
			{
				initials: "St",
				initialsBg: "bg-warning-muted",
				company: "Stripe",
				role: "Sr. Frontend Eng.",
				meta: "Hybrid",
				date: "Mar 12",
				badge: "Tomorrow 10am",
				badgeIcon: "calendar",
				action: "Prep →",
				actionColor: "text-warning",
			},
			{
				initials: "Fg",
				initialsBg: "bg-accent-muted",
				company: "Figma",
				role: "UX Researcher",
				meta: "Remote",
				date: "Mar 14 · Rd. 2",
				action: "Prep →",
				actionColor: "text-warning",
			},
		],
	},
	{
		title: "Offer 🎉",
		count: 2,
		icon: Trophy,
		accentClass: "text-success",
		headerBg: "bg-success-muted/30",
		cards: [
			{
				initials: "Sh",
				initialsBg: "bg-success-muted",
				company: "Shopify",
				role: "Full Stack Developer",
				meta: "Remote",
				date: "Mar 3",
				salary: "$180K / yr",
				badge: "Offer received ✓",
				badgeIcon: "check",
				action: "Decide",
				actionColor: "text-success",
			},
		],
	},
];

export const JobTracker = () => {
	return (
		<section className="py-20 md:py-28 bg-surface-inset/30">
			<div className="container mx-auto px-4">
				{/* Section header */}
				<div className="text-center mb-4">
					<div className="flex items-center justify-center gap-3 mb-3">
						<h2 className="font-display text-3xl md:text-4xl font-bold">
							Track every application
						</h2>
						<span className="inline-flex items-center px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-accent-muted text-accent border border-accent/15">
							Coming soon
						</span>
					</div>
					<p className="text-sm text-text-secondary max-w-sm mx-auto">
						Manage your entire job search in one place.
					</p>
				</div>

				{/* Stats bar */}
				<div className="flex items-center justify-center gap-4 text-[11px] text-text-tertiary mb-10">
					<span>24 total</span>
					<span className="w-px h-3 bg-border-visible" />
					<span>5 active interviews</span>
					<span className="w-px h-3 bg-border-visible" />
					<span>2 offers pending</span>
				</div>

				{/* Kanban board preview */}
				<div className="max-w-6xl mx-auto overflow-x-auto pb-4 -mx-4 px-4">
					<div className="flex gap-3 min-w-[900px]">
						{columns.map((col) => {
							const Icon = col.icon;
							return (
								<div
									key={col.title}
									className="flex-1 min-w-[170px] rounded-xl bg-surface-raised border border-border-visible"
								>
									{/* Column header */}
									<div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl ${col.headerBg}`}>
										<Icon
											size={13}
											className={col.accentClass}
										/>
										<span className="text-xs font-semibold text-text-primary uppercase tracking-wide">
											{col.title}
										</span>
										<span className="ml-auto text-[10px] text-text-tertiary font-semibold bg-surface-base/60 px-1.5 py-0.5 rounded">
											{col.count}
										</span>
									</div>

									{/* Cards */}
									<div className="p-2 space-y-2">
										{col.cards.map((card) => (
											<div
												key={`${card.company}-${card.role}`}
												className="rounded-lg bg-surface-base border border-border-subtle/60 p-3 hover:border-accent/20 transition-colors"
											>
												{/* Initials + company */}
												<div className="flex items-center gap-2 mb-1.5">
													<span
														className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold text-text-secondary ${card.initialsBg}`}
													>
														{card.initials}
													</span>
													<div className="min-w-0 flex-1">
														<p className="text-xs font-semibold text-text-primary truncate">
															{card.role}
														</p>
														<p className="text-[10px] text-text-tertiary truncate">
															{card.company} · {card.meta}
														</p>
													</div>
												</div>

												{/* Salary */}
												{card.salary && (
													<div className="flex items-center gap-1 mb-1.5">
														<DollarSign
															size={10}
															className="text-success"
														/>
														<span className="text-xs font-bold text-success">
															{card.salary}
														</span>
													</div>
												)}

												{/* Badge */}
												{card.badge && (
													<div className="flex items-center gap-1 mb-1.5">
														{card.badgeIcon === "calendar" ? (
															<Calendar
																size={9}
																className="text-warning"
															/>
														) : (
															<CheckCircle2
																size={9}
																className="text-success"
															/>
														)}
														<span className="text-[10px] font-medium text-text-secondary">
															{card.badge}
														</span>
													</div>
												)}

												{/* Date + action */}
												<div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border-subtle/40">
													<span className="text-[10px] text-text-tertiary">
														{card.date}
													</span>
													<span
														className={`text-[10px] font-semibold ${card.actionColor} inline-flex items-center gap-0.5`}
													>
														{card.action}
													</span>
												</div>
											</div>
										))}

										{/* Add job placeholder */}
										<button className="w-full py-2 text-[10px] text-text-tertiary hover:text-accent transition-colors rounded-lg border border-dashed border-border-subtle/50 hover:border-accent/30">
											+ Add job
										</button>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</section>
	);
};
