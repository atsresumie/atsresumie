"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export default function SignupGateModal({
	open,
	onClose,
	onAuthSuccess,
}: {
	open: boolean;
	onClose: () => void;
	onAuthSuccess: () => void;
}) {
	const reduceMotion = useReducedMotion();
	const router = useRouter();

	const handleContinue = () => {
		// Store intent so we can resume generation after auth
		sessionStorage.setItem("auth_redirect_intent", "generate");
		// Redirect to dedicated signup page, returning to /get-started after auth
		router.push("/auth/signup?next=/get-started");
	};

	return (
		<AnimatePresence>
			{open && (
				<>
					<motion.div
						className="fixed inset-0 z-40 bg-black/30"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						// No onClick={onClose} — login is required, no dismiss
					/>
					<motion.div
						className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border-visible bg-surface-raised p-5 text-text-primary shadow-card backdrop-blur"
						initial={
							reduceMotion
								? false
								: { opacity: 0, scale: 0.98, y: 8 }
						}
						animate={
							reduceMotion
								? undefined
								: { opacity: 1, scale: 1, y: 0 }
						}
						exit={
							reduceMotion
								? undefined
								: { opacity: 0, scale: 0.98, y: 8 }
						}
						transition={{
							type: "spring",
							stiffness: 160,
							damping: 18,
						}}
					>
						<div className="text-lg font-semibold">
							Create an account to continue
						</div>
						<p className="mt-2 text-sm text-text-secondary">
							Sign up to generate and download your
							tailored resume.
							<span className="ml-1 rounded-full border border-border-visible bg-surface-base px-2 py-0.5 text-xs">
								3 free credits
							</span>
						</p>

						<div className="mt-4">
							<button
								onClick={handleContinue}
								className="w-full rounded-xl bg-[#654844] px-4 py-3 text-sm font-medium text-white hover:-translate-y-px active:translate-y-0"
							>
								Sign up to continue
							</button>
						</div>

						<div
							className="mt-3 text-xs"
							style={{ color: "#FFA726" }}
						>
							1 credit per generation · Export free · LaTeX
							included
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
