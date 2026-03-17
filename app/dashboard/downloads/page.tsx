export default function ATSCheckerPage() {
	return (
		<div className="relative min-h-screen flex items-center justify-center overflow-hidden"
			style={{ backgroundColor: "#805F4E" }}
		>
			{/* Decorative blurred circles */}
			<div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-30"
				style={{ background: "radial-gradient(circle, #e8693a 0%, transparent 70%)", filter: "blur(80px)" }}
			/>
			<div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-25"
				style={{ background: "radial-gradient(circle, #d4a574 0%, transparent 70%)", filter: "blur(60px)" }}
			/>
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-15"
				style={{ background: "radial-gradient(circle, #fff 0%, transparent 60%)", filter: "blur(100px)" }}
			/>

			{/* Glassmorphism card */}
			<div className="relative z-10 text-center px-12 py-16 rounded-3xl border border-white/20"
				style={{
					background: "rgba(255,255,255,0.08)",
					backdropFilter: "blur(24px)",
					WebkitBackdropFilter: "blur(24px)",
					boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
				}}
			>
				{/* Icon */}
				<div className="mb-6 mx-auto w-20 h-20 rounded-2xl flex items-center justify-center"
					style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)" }}
				>
					<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
						<polyline points="14 2 14 8 20 8" />
						<line x1="16" y1="13" x2="8" y2="13" />
						<line x1="16" y1="17" x2="8" y2="17" />
						<polyline points="10 9 9 9 8 9" />
					</svg>
				</div>

				{/* Title */}
				<h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-4"
					style={{ textShadow: "0 2px 20px rgba(0,0,0,0.15)" }}
				>
					Under Development
				</h1>

				{/* Subtitle */}
				<p className="text-lg md:text-xl text-white/70 max-w-md mx-auto mb-8">
					ATS Checker is coming soon. We&apos;re building something great.
				</p>

				{/* Decorative line */}
				<div className="w-24 h-1 rounded-full mx-auto" style={{ background: "linear-gradient(90deg, #e8693a, #d4a574)" }} />
			</div>
		</div>
	);
}
