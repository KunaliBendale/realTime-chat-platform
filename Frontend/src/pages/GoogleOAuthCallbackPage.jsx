import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "../components/auth/AuthShell";
import { Button } from "../components/ui/Button";
import { useAuthStore } from "../store/authStore";

const parseOAuthPayload = () => {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const queryParams = new URLSearchParams(window.location.search);
  const token = hashParams.get("token") || queryParams.get("token");
  const userPayload = hashParams.get("user") || queryParams.get("user");
  const error = queryParams.get("oauthError") || hashParams.get("oauthError");

  if (error) {
    return { error, token: null, user: null };
  }

  if (!token || !userPayload) {
    return {
      error: "Google sign-in could not be completed.",
      token: null,
      user: null,
    };
  }

  try {
    return { error: null, token, user: JSON.parse(userPayload) };
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
          ? "Finishing your Google sign-in securely."
          : "We could not complete Google sign-in. Please try again."
      }
    >
      <motion.div
        className="rounded-3xl border border-[var(--border-subtle)] glass-panel p-8 text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {isFinishing ? (
          <>
            <div className="mx-auto size-12 animate-spin rounded-full border-2 border-indigo-500/20 border-t-indigo-400" />
            <p className="mt-4 text-sm font-medium text-[var(--text-primary)]">
              Connecting your Google account…
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-red-400">{payload.error}</p>
            <Link to="/login" className="mt-6 inline-block">
              <Button>Back to sign in</Button>
            </Link>
          </>
        )}
      </motion.div>
    </AuthShell>
  );
}
