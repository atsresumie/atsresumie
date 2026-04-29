import Image from "next/image";
import Link from "next/link";

const resumeImages = [
	"/landing/resume-1.png",
	"/landing/resume-2.png",
	"/landing/resume-3.png",
	"/landing/resume-4.png",
	"/landing/resume-5.png",
];

export const Hero = () => {
	return (
		<section
			id="start"
			className="relative flex items-center justify-center min-h-[calc(100vh-80px)] overflow-hidden"
		>
			<div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-[792px] mx-auto px-4 py-20">
				<h1 className="font-display text-[36px] md:text-[52px] font-bold leading-tight text-center text-text-primary">
					Tailor Your Resume to{" "}
					<span className="text-accent">Any</span>
					<br />
					<span className="text-accent">Job</span> in Seconds.
				</h1>

				{/* Resume fan */}
				<div className="flex isolate items-start pr-2.5 w-full max-w-[1000px]">
					{resumeImages.map((src, i) => (
						<div
							key={i}
							className="flex flex-[1_0_0] h-[200px] md:h-[314px] items-center justify-center min-h-0 min-w-0 -mr-2.5 relative"
							style={{ zIndex: resumeImages.length - i }}
						>
							<div className="-rotate-6 flex-none w-full">
								<div className="aspect-[1414/2000] relative shadow-[0_0_4px_0_rgba(0,0,0,0.12)] w-full overflow-hidden rounded-sm">
									<Image
										src={src}
										alt={`Resume template ${i + 1}`}
										fill
										className="object-cover pointer-events-none"
										sizes="(max-width: 768px) 40vw, 240px"
									/>
								</div>
							</div>
						</div>
					))}
				</div>

				<p className="text-center text-text-secondary text-base max-w-[792px]">
					Stop getting filtered out by ATS. Our AI analyzes job
					descriptions and transforms your resume with the right
					keywords, format, and structure to pass any Applicant
					Tracking System.
				</p>

				<div className="flex items-center gap-2.5">
					<Link
						href="/get-started"
						className="px-4 py-3 bg-accent text-white text-base font-normal rounded-[5px] hover:bg-accent-hover transition-colors cursor-pointer"
					>
						Get Started Free
					</Link>
					<button
						onClick={() =>
							document
								.getElementById("how-it-works")
								?.scrollIntoView({ behavior: "smooth" })
						}
						className="px-4 py-3 bg-white text-[var(--primary-brown)] text-base font-normal rounded-[5px] border border-[var(--primary-brown)] hover:bg-gray-50 transition-colors cursor-pointer"
					>
						See How It Works
					</button>
				</div>
			</div>
		</section>
	);
};
