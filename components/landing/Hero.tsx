import { useRef, useEffect, useState } from "react";
import {
	motion,
	useScroll,
	useTransform,
	useSpring,
	useReducedMotion,
} from "framer-motion";
import { Sparkles, Download, TrendingUp, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const Hero = () => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
	const prefersReducedMotion = useReducedMotion();

	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ["start start", "end start"],
	});

	const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
	const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

	const springConfig = { damping: 25, stiffness: 100 };
	const mouseX = useSpring(mousePosition.x, springConfig);
	const mouseY = useSpring(mousePosition.y, springConfig);

	useEffect(() => {
		if (prefersReducedMotion) return;

		const handleMouseMove = (e: MouseEvent) => {
			if (!containerRef.current) return;
			const rect = containerRef.current.getBoundingClientRect();
			setMousePosition({
				x: (e.clientX - rect.left) / rect.width,
				y: (e.clientY - rect.top) / rect.height,
			});
		};

		window.addEventListener("mousemove", handleMouseMove);
		return () => window.removeEventListener("mousemove", handleMouseMove);
	}, [prefersReducedMotion]);

	const scrollToSection = (href: string) => {
		const element = document.querySelector(href);
		element?.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<section
			ref={containerRef}
			id="start"
			className="relative min-h-screen flex items-center justify-center overflow-hidden noise-overlay"
		>
			{/* Animated Background */}
			<div className="absolute inset-0 bg-hero-gradient" />

			{/* Cursor-reactive light bloom */}
			{!prefersReducedMotion && (
				<motion.div
					className="absolute inset-0 pointer-events-none"
					style={{
						background: `radial-gradient(circle at calc(${mousePosition.x} * 100%) calc(${mousePosition.y} * 100%), hsla(36, 30%, 85%, 0.12) 0%, transparent 40%)`,
					}}
				/>
			)}

			{/* Animated gradient orbs */}
			<motion.div
				className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20"
				style={{
					background:
						"radial-gradient(circle, hsl(36, 30%, 70%) 0%, transparent 70%)",
					filter: "blur(80px)",
					y: prefersReducedMotion ? 0 : y,
				}}
				animate={
					prefersReducedMotion
						? {}
						: { scale: [1, 1.1, 1], rotate: [0, 180, 360] }
				}
				transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
			/>
			<motion.div
				className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15"
				style={{
					background:
						"radial-gradient(circle, hsl(32, 28%, 66%) 0%, transparent 70%)",
					filter: "blur(60px)",
				}}
				animate={
					prefersReducedMotion
						? {}
						: { scale: [1.1, 1, 1.1], rotate: [360, 180, 0] }
				}
				transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
			/>

			{/* Content */}
			<motion.div
				style={{ opacity, y: prefersReducedMotion ? 0 : y }}
				className="relative z-10 container mx-auto px-4 py-20 md:py-32"
			>
				<div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center justify-center">
					{/* Left: Text Content */}
					<div className="text-center pt-8 lg:pt-16 max-w-xl">
						{/* Badge */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{
								delay: 0.1,
								type: "spring",
								damping: 20,
							}}
							className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-muted/50 border border-border/50 text-sm text-muted-foreground"
						>
							<Sparkles size={14} className="text-sand" />
							<span>3 free credits included</span>
						</motion.div>

						{/* Headline */}
						<motion.h1
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{
								delay: 0.2,
								type: "spring",
								damping: 20,
							}}
							className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight mb-6"
						>
							ATS-optimized resumes,{" "}
							<span className="text-gradient">
								generated as LaTeX.
							</span>
						</motion.h1>

						{/* Subheadline */}
						<motion.p
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{
								delay: 0.3,
								type: "spring",
								damping: 20,
							}}
							className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8"
						>
							Paste a job description + your resume. Get an
							ATS-friendly PDF and LaTeX source in minutes.
						</motion.p>

						{/* CTAs */}
						<motion.div
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{
								delay: 0.4,
								type: "spring",
								damping: 20,
							}}
							className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
						>
							<Link href="/get-started" className="w-full sm:w-auto">
								<motion.button
	
								className="w-full sm:w-auto px-8 py-4 bg-secondary text-secondary-foreground font-semibold rounded-xl shadow-soft hover:shadow-glow transition-all"
								whileHover={{ scale: 1.02, y: -2 }}
								whileTap={{ scale: 0.98 }}
							>
								Get Started
								</motion.button>
							</Link>
							<motion.button
								onClick={() => scrollToSection("#how-it-works")}
								className="w-full sm:w-auto px-8 py-4 text-foreground font-medium rounded-xl border border-border hover:bg-muted/50 transition-all"
								whileHover={{ scale: 1.02, y: -1 }}
								whileTap={{ scale: 0.98 }}
							>
								See how it works
							</motion.button>
						</motion.div>
					</div>

					{/* Right: Preview Card */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 40 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						transition={{ delay: 0.5, type: "spring", damping: 20 }}
						className="relative w-[80vw] max-w-4xl mt-12 lg:mt-16"
					>
						<div className="bg-card-gradient rounded-2xl border border-border/50 p-6 shadow-card">
							{/* ATS Score Ring */}
							<div className="flex items-center gap-6 mb-6">
								<div className="relative w-20 h-20">
									<svg
										className="w-20 h-20 -rotate-90"
										viewBox="0 0 80 80"
									>
										<circle
											cx="40"
											cy="40"
											r="35"
											fill="none"
											stroke="hsl(var(--muted))"
											strokeWidth="6"
										/>
										<motion.circle
											cx="40"
											cy="40"
											r="35"
											fill="none"
											stroke="hsl(var(--sand))"
											strokeWidth="6"
											strokeLinecap="round"
											strokeDasharray="220"
											initial={{ strokeDashoffset: 220 }}
											animate={{ strokeDashoffset: 44 }}
											transition={{
												delay: 0.8,
												duration: 1.5,
												ease: "easeOut",
											}}
										/>
									</svg>
									<div className="absolute inset-0 flex items-center justify-center">
										<motion.span
											className="font-display text-2xl font-semibold text-foreground"
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											transition={{ delay: 1.2 }}
										>
											80%
										</motion.span>
									</div>
								</div>
								<div>
									<h3 className="font-display text-lg font-medium text-foreground mb-1">
										ATS Score
									</h3>
									<p className="text-sm text-muted-foreground">
										Optimized for tracking systems
									</p>
								</div>
							</div>

							{/* Keyword Match Bars */}
							<div className="space-y-3 mb-6">
								{[
									{ label: "Keyword Match", value: 85 },
									{ label: "Format Score", value: 92 },
									{ label: "Section Structure", value: 78 },
								].map((item, i) => (
									<div key={item.label}>
										<div className="flex justify-between text-sm mb-1">
											<span className="text-muted-foreground">
												{item.label}
											</span>
											<span className="text-foreground font-medium">
												{item.value}%
											</span>
										</div>
										<div className="h-2 bg-muted rounded-full overflow-hidden">
											<motion.div
												className="h-full rounded-full"
												style={{
													background:
														"linear-gradient(90deg, hsl(var(--sand)), hsl(var(--beige)))",
												}}
												initial={{ width: 0 }}
												animate={{
													width: `${item.value}%`,
												}}
												transition={{
													delay: 0.9 + i * 0.15,
													duration: 0.8,
													ease: "easeOut",
												}}
											/>
										</div>
									</div>
								))}
							</div>

							{/* Improvements */}
							<div className="border-t border-border/50 pt-4 mb-6">
								<h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
									<TrendingUp
										size={14}
										className="text-sand"
									/>
									Improvements Applied
								</h4>
								<div className="space-y-2">
									{[
										"Action verbs optimized",
										"Skills section enhanced",
										"ATS-safe formatting",
									].map((item, i) => (
										<motion.div
											key={item}
											initial={{ opacity: 0, x: -10 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{
												delay: 1.3 + i * 0.1,
											}}
											className="flex items-center gap-2 text-sm text-muted-foreground"
										>
											<CheckCircle2
												size={14}
												className="text-sand"
											/>
											{item}
										</motion.div>
									))}
								</div>
							</div>

							{/* Download Button (Demo) */}
							<button
								disabled
								className="w-full py-3 px-4 bg-muted/50 text-muted-foreground font-medium rounded-xl flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
							>
								<Download size={18} />
								Download PDF (1 credit)
							</button>
						</div>

						{/* Floating decoration */}
						<motion.div
							className="absolute -top-4 -right-4 w-24 h-24 rounded-2xl bg-card-gradient border border-border/30 shadow-soft hidden lg:flex items-center justify-center"
							animate={
								prefersReducedMotion ? {} : { y: [0, -8, 0] }
							}
							transition={{
								duration: 4,
								repeat: Infinity,
								ease: "easeInOut",
							}}
						>
							<span className="font-display text-3xl">📄</span>
						</motion.div>
					</motion.div>
				</div>
			</motion.div>

			{/* Scroll indicator */}
			<motion.div
				className="absolute bottom-8 left-1/2 -translate-x-1/2"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 1.5 }}
			>
				<motion.div
					className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2"
					animate={prefersReducedMotion ? {} : { y: [0, 5, 0] }}
					transition={{ duration: 2, repeat: Infinity }}
				>
					<motion.div
						className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
						animate={
							prefersReducedMotion
								? {}
								: { y: [0, 8, 0], opacity: [1, 0.3, 1] }
						}
						transition={{ duration: 2, repeat: Infinity }}
					/>
				</motion.div>
			</motion.div>
		</section>
	);
};
