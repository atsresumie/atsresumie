import { cookies } from "next/headers";

const COOKIE_NAME = "ats_onboarding_session";

export async function getOnboardingSessionId() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export async function setOnboardingSessionId(sessionId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearOnboardingSessionId() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
