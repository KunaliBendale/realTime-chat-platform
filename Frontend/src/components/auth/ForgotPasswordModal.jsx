import { CheckCircle2, KeyRound, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { authService } from "../../services/authService";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { AuthAlert } from "./AuthAlert";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getFriendlyError = (message) => {
  const normalized = message?.toLowerCase() || "";

  if (normalized.includes("user not found")) return "No account found for this email";
  if (normalized.includes("invalid otp")) return "Invalid OTP";
  if (normalized.includes("expired")) return "OTP expired";
  if (normalized.includes("verification required")) return "Please verify OTP first";
  if (normalized.includes("email service authentication")) {
    return "Email service is not configured correctly";
  }
  if (normalized.includes("send otp") || normalized.includes("failed to send")) {
    return "Unable to send OTP right now";
  }
  if (normalized.includes("network")) return "Network error. Please try again";

  return "Unable to reset password right now";
};

export function ForgotPasswordModal({ isOpen, initialEmail = "", onClose, onCompleted }) {
  const lockedEmail = initialEmail.trim();
  const isEmailLocked = Boolean(lockedEmail);
  const closeTimerRef = useRef(null);

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState(lockedEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingAction, setLoadingAction] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (!resendSeconds) return undefined;

    const timer = window.setInterval(() => {
      setResendSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  const trimmedEmail = email.trim().toLowerCase();
  const isLoading = Boolean(loadingAction);

  const handleClose = () => {
    if (isLoading) return;
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    onClose();
  };

  const validateEmail = () => {
    if (!trimmedEmail) return "Email is required";
    if (!emailPattern.test(trimmedEmail)) return "Enter a valid email";
    return "";
  };

  const handleSendOtp = async (event, isResend = false) => {
    event?.preventDefault();

    const validationError = validateEmail();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setMessage("");
    setLoadingAction(isResend ? "resend" : "send");

    try {
      await authService.sendOtp(trimmedEmail);
      setStep("otp");
      setMessage("OTP sent successfully!");
      setResendSeconds(30);
    } catch (requestError) {
      setError(getFriendlyError(requestError.message));
    } finally {
      setLoadingAction("");
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    if (!otp.trim()) {
      setError("OTP is required");
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6 digit OTP");
      return;
    }

    setError("");
    setMessage("");
    setLoadingAction("verify");

    try {
      await authService.verifyOtp(trimmedEmail, otp.trim());
      setStep("reset");
      setMessage("OTP verified successfully");
    } catch (requestError) {
      setError(getFriendlyError(requestError.message));
    } finally {
      setLoadingAction("");
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (!newPassword || !confirmPassword) {
      setError("New password and confirm password are required");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords must match");
      return;
    }

    setError("");
    setMessage("");
    setLoadingAction("reset");

    try {
      await authService.resetPassword({
        email: trimmedEmail,
        newPassword,
        confirmPassword,
      });

      setStep("success");
      setMessage("Password reset successfully");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");

      closeTimerRef.current = window.setTimeout(() => {
        onCompleted(trimmedEmail);
      }, 900);
    } catch (requestError) {
      setError(getFriendlyError(requestError.message));
    } finally {
      setLoadingAction("");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Forgot password"
      description="Verify your email to set a new password."
      icon={KeyRound}
      size="sm"
      scrollable={false}
    >
      <div className="space-y-5">
        <StepIndicator step={step} />

        <AuthAlert type="success" message={message} />
        <AuthAlert message={error} />

        {step === "email" ? (
          <form className="space-y-4" onSubmit={handleSendOtp} noValidate>
            <Input
              id="forgot-email"
              label="Registered email"
              type="email"
              autoComplete="email"
              icon={Mail}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              placeholder="you@example.com"
              readOnly={isEmailLocked}
              disabled={isLoading}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {loadingAction === "send" ? <Loader2 size={17} className="animate-spin" /> : null}
              {loadingAction === "send" ? "Sending OTP..." : "Send OTP"}
            </Button>
          </form>
        ) : null}

        {step === "otp" ? (
          <form className="space-y-4" onSubmit={handleVerifyOtp} noValidate>
            <Input
              id="forgot-otp"
              label="Verification code"
              inputMode="numeric"
              autoComplete="one-time-code"
              icon={ShieldCheck}
              value={otp}
              onChange={(event) => {
                setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
                setError("");
              }}
              placeholder="6 digit OTP"
              disabled={isLoading}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {loadingAction === "verify" ? <Loader2 size={17} className="animate-spin" /> : null}
              {loadingAction === "verify" ? "Verifying..." : "Verify OTP"}
            </Button>

            <div className="flex items-center justify-between gap-3 text-sm">
              <button
                type="button"
                className="font-semibold text-indigo-300 transition hover:text-indigo-200"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setError("");
                  setMessage("");
                }}
                disabled={isLoading}
              >
                Change email
              </button>
              <button
                type="button"
                className="font-semibold text-indigo-300 transition hover:text-indigo-200 disabled:text-[var(--text-muted)]"
                onClick={(event) => handleSendOtp(event, true)}
                disabled={isLoading || resendSeconds > 0}
              >
                {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : "Resend OTP"}
              </button>
            </div>
          </form>
        ) : null}

        {step === "reset" ? (
          <form className="space-y-4" onSubmit={handleResetPassword} noValidate>
            <Input
              id="forgot-new-password"
              label="New password"
              type="password"
              autoComplete="new-password"
              icon={Lock}
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value);
                setError("");
              }}
              placeholder="At least 8 characters"
              disabled={isLoading}
            />

            <Input
              id="forgot-confirm-password"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              icon={Lock}
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setError("");
              }}
              placeholder="Repeat new password"
              disabled={isLoading}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {loadingAction === "reset" ? <Loader2 size={17} className="animate-spin" /> : null}
              {loadingAction === "reset" ? "Resetting..." : "Reset password"}
            </Button>
          </form>
        ) : null}

        {step === "success" ? (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
              <CheckCircle2 size={28} />
            </span>
            <h3 className="mt-4 text-lg font-bold text-[var(--text-primary)]">
              Password reset
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              You can now sign in with your new password.
            </p>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function StepIndicator({ step }) {
  const steps = [
    { id: "email", label: "Email" },
    { id: "otp", label: "OTP" },
    { id: "reset", label: "Reset" },
  ];

  const currentIndex =
    step === "success" ? steps.length : steps.findIndex((item) => item.id === step);

  return (
    <div className="grid grid-cols-3 gap-2">
      {steps.map((item, index) => {
        const isActive = index <= currentIndex;

        return (
          <div
            key={item.id}
            className={`rounded-full px-3 py-1.5 text-center text-xs font-semibold transition ${isActive
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700"
              }`}
          >
            {item.label}
          </div>
        );
      })}
    </div>
  );
}
