import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthAlert } from "../components/auth/AuthAlert";
import { AuthShell } from "../components/auth/AuthShell";
import { FormField } from "../components/auth/FormField";
import { GoogleAuthButton } from "../components/auth/GoogleAuthButton";
import { useAuthStore } from "../store/authStore";

const initialForm = {
  email: "",
  password: "",
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  const successMessage = useAuthStore((state) => state.successMessage);
  const clearMessages = useAuthStore((state) => state.clearMessages);

  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});

  const isSubmitting = status === "loading";
  const redirectTo = location.state?.from?.pathname || "/dashboard";
  const registrationMessage = location.state?.message;
  const oauthError = new URLSearchParams(location.search).get("oauthError");

  const alertMessage = useMemo(
    () => registrationMessage || successMessage,
    [registrationMessage, successMessage],
  );

  useEffect(() => {
    clearMessages();
  }, [clearMessages]);

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!form.email.trim()) {
      errors.email = "Email is required";
    }

    if (!form.password) {
      errors.password = "Password is required";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    const result = await login({
      email: form.email.trim(),
      password: form.password,
    });

    if (result.success) {
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with your email and password to continue."
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <AuthAlert type="success" message={alertMessage} />
        <AuthAlert message={oauthError || error} />

        <FormField
          id="email"
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={updateField}
          placeholder="you@example.com"
          error={fieldErrors.email}
          disabled={isSubmitting}
        />

        <FormField
          id="password"
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={updateField}
          placeholder="Enter your password"
          error={fieldErrors.password}
          disabled={isSubmitting}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:bg-[#93aeea]"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#d9dee8]" />
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#66758c]">
          or
        </span>
        <div className="h-px flex-1 bg-[#d9dee8]" />
      </div>

      <GoogleAuthButton label="Sign in with Google" />

      <p className="mt-6 text-center text-sm text-[#5d6b82]">
        New here?{" "}
        <Link className="font-semibold text-[#2563eb] hover:text-[#1d4ed8]" to="/register">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
