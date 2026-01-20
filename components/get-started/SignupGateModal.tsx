"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export default function SignupGateModal({
	open,
	onClose,
	onContinue,
}: {
	open: boolean;
	onClose: () => void;
	onContinue: () => void;
}) {
	const reduceMotion = useReducedMotion();

	return (
		<AnimatePresence>
			{open && (
				<>
					<motion.div
						className="fixed inset-0 z-40 bg-black/50"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
					/>
					<motion.div
						className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[rgba(233,221,199,0.12)] bg-[rgba(20,14,11,0.92)] p-5 text-[#E9DDC7] shadow-[0_30px_100px_rgba(0,0,0,0.6)] backdrop-blur"
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
							Create an account to download
						</div>
						<p className="mt-2 text-sm text-[rgba(233,221,199,0.75)]">
							Your preview is ready. Sign up to download the PDF
							and save versions.
							<span className="ml-1 rounded-full border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)] px-2 py-0.5 text-xs">
								3 free credits
							</span>
						</p>

						<div className="mt-4 grid gap-2">
							<button
								onClick={onContinue}
								className="w-full rounded-xl bg-[#E9DDC7] px-4 py-3 text-sm font-medium text-[#2a1e18] hover:-translate-y-px active:translate-y-0"
							>
								Continue with Google / Email
							</button>
							<button
								onClick={onClose}
								className="w-full rounded-xl border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)] px-4 py-3 text-sm hover:bg-[rgba(233,221,199,0.10)]"
							>
								Not now
							</button>
						</div>

						<div className="mt-3 text-xs text-[rgba(233,221,199,0.55)]">
							Preview is free • Export uses credits • LaTeX
							included
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
