"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Linkedin, ArrowRight } from "lucide-react";
import { useState } from "react";

const companyLinks = [
	{ label: "How It Works", href: "#how-it-works" },
	{ label: "Benefits", href: "#start" },
	{ label: "Pricing", href: "#pricing" },
	{ label: "FAQ", href: "#faq" },
];

export const Footer = () => {
	const [email, setEmail] = useState("");

	const scrollTo = (href: string) => {
		const el = document.querySelector(href);
		el?.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<footer className="bg-gradient-to-b from-[#a78668] to-[#413428] rounded-t-[20px] px-4 md:px-[116px] py-[60px]">
			<div className="max-w-[1208px] mx-auto flex flex-col gap-10">
				{/* Top section */}
				<div className="flex flex-col md:flex-row gap-10 justify-center">
					{/* Logo & description */}
					<div className="flex flex-col gap-6 w-full md:w-[272px] flex-shrink-0">
						<Image
							src="/landing/ats-logo.png"
							alt="ATSResumie"
							width={93}
							height={79}
							className="w-[93px] h-[79px] object-contain"
						/>
						<p className="text-white text-xs leading-normal">
							ATSResumie is an AI-powered resume optimization
							platform designed to help job seekers pass Applicant
							Tracking Systems (ATS) and land more interviews.
						</p>
					</div>

					{/* Company links */}
					<div className="flex flex-col gap-6 flex-1 overflow-hidden">
						<span className="font-semibold text-[22px] text-white">
							Company
						</span>
						<div className="flex flex-col gap-3">
							{companyLinks.map((link) => (
								<button
									key={link.label}
									onClick={() => scrollTo(link.href)}
									className="text-sm text-white text-left hover:opacity-80 transition-opacity cursor-pointer"
								>
									{link.label}
								</button>
							))}
						</div>
					</div>

					{/* Contact */}
					<div className="flex flex-col gap-6 flex-1 overflow-hidden">
						<span className="font-semibold text-[22px] text-white">
							Talk to Us
						</span>
						<div className="flex flex-col gap-3">
							<div className="flex items-center gap-1 text-sm text-white">
								<MapPin className="w-[18px] h-[18px] flex-shrink-0" />
								<span>Toronto, Ontario</span>
							</div>
							<div className="flex items-center gap-4 text-sm text-white">
								<Phone className="w-[18px] h-[18px] flex-shrink-0" />
								<span>(123) 456-7890</span>
							</div>
							<Link
								href="#"
								className="text-white hover:opacity-80 transition-opacity cursor-pointer"
							>
								<Linkedin className="w-[18px] h-[18px]" />
							</Link>
						</div>
					</div>

					{/* Subscribe */}
					<div className="bg-white/10 rounded-[5px] p-6 flex flex-col gap-[18px] flex-shrink-0">
						<span className="font-bold text-base text-white">
							Subscribe
						</span>
						<div className="relative">
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Email address"
								className="w-[248px] h-[50px] bg-white border-[1.5px] border-[#e7e8f2] rounded-[6px] px-4 text-sm text-[#7a7e92] placeholder:text-[#7a7e92]"
							/>
							<button className="absolute right-0 top-0 w-[50px] h-[50px] bg-accent rounded-r-[6px] flex items-center justify-center hover:bg-accent-hover transition-colors cursor-pointer">
								<ArrowRight className="w-4 h-4 text-white" />
							</button>
						</div>
						<p className="text-white text-xs opacity-60 max-w-[254px] leading-normal">
							Hello, we are ATSResumie. Our goal is to provide you
							a perfect fit resume for your job.
						</p>
					</div>
				</div>

				{/* Divider */}
				<div className="h-px bg-white opacity-20" />

				{/* Copyright */}
				<div className="text-center">
					<span className="text-sm text-white opacity-80">
						Copyright © 2026 • ATSResumie.
					</span>
				</div>
			</div>
		</footer>
	);
};
