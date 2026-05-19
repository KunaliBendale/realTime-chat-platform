import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "../components/auth/AuthShell";
import { useAuthStore } from "../store/authStore";

const parseOAuthPayload = () => {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const queryParams = new URLSearchParams(window.location.search);
  const token = hashParams.get("token") || queryParams.get("token");
  const userPayload = hashParams.get("user") || queryParams.get("user");
  const error = queryParams.get("oauthError") || hashParams.get("oauthError");

  if (error) {
    return {
      error,
      token: null,
      user: null,
    };
  }

  if (!token || !userPayload) {
    return {
      error: "Google sign-in could not be completed.",
      token: null,
      user: null,
    };
  }

  try {
    return {
      error: null,
      token,
      user: JSON.parse(userPayload),
    };
  } catch {
    return {
      error: "Google sign-in returned invalid account data.",
      token: null,
      user: null,
    };
  }
};

export function GoogleOAuthCallbackPage() {
  const navigate = useNavigate();
  const completeOAuthLogin = useAuthStore((state) => state.completeOAuthLogin);
  const payload = useMemo(() => parseOAuthPayload(), []);
  const isFinishing = !payload.error;

  useEffect(() => {
    if (payload.error) {
      window.history.replaceState({}, document.title, "/auth/google/callback");
      return;
    }

    const result = completeOAuthLogin({
      token: payload.token,
      user: payload.user,
    });

    window.history.replaceState({}, document.title, "/auth/google/callback");

    if (result.success) {
      navigate("/dashboard", { replace: true });
      return;
    }

    navigate(
      `/login?oauthError=${encodeURIComponent(
        result.message || "Google sign-in could not be completed.",
      )}`,
      { replace: true },
    );
  }, [completeOAuthLogin, navigate, payload]);

  return (
    <AuthShell
      title={isFinishing ? "Signing you in" : "Sign-in needs attention"}
      subtitle={
        isFinishing
          ? "Finishing your Google sign-in securely. You will be redirected in a moment."
          : "We could not complete Google sign-in. Please try again."
      }
    >
      <div className="rounded-lg border border-[#d9dee8] bg-[#f8fafc] p-5 text-center">
        {isFinishing ? (
          <>
            <div className="mx-auto size-10 animate-spin rounded-full border-2 border-[#cfd6e3] border-t-[#2563eb]" />
            <p className="mt-4 text-sm font-medium text-[#172033]">
              Connecting your Google account...
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-[#991b1b]">{payload.error}</p>
            <Link
              to="/login"
              className="mt-4 inline-flex items-center justify-center bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
            >
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </AuthShell>
  );
}
