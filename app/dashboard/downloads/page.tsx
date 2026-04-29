import { redirect } from "next/navigation";

export default function DownloadsRedirect() {
	redirect("/dashboard/ats-checker");
}
