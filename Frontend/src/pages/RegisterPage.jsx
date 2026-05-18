import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthAlert } from "../components/auth/AuthAlert";
import { AuthShell } from "../components/auth/AuthShell";
import { FormField } from "../components/auth/FormField";
import { GoogleAuthButton } from "../components/auth/GoogleAuthButton";
import { useAuthStore } from "../store/authStore";

const initialForm = {
  name: "",
  email: "",
  mobile: "",
  password: "",
  confirmPassword: "",
};

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  const clearMessages = useAuthStore((state) => state.clearMessages);

  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});

  const isSubmitting = status === "loading";

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
    const mobilePattern = /^\d{10}$/;

    if (!form.name.trim()) {
      errors.name = "Name is required";
    }

    if (!form.email.trim()) {
      errors.email = "Email is required";
    }

    if (!mobilePattern.test(form.mobile.trim())) {
      errors.mobile = "Enter a valid 10 digit mobile number";
    }

    if (form.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Passwords must match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    const result = await register({
      name: form.name.trim(),
      email: form.email.trim(),
      mobile: form.mobile.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
    });

    if (result.success) {
      navigate("/login", {
        replace: true,
        state: {
          message: result.message || "Account created. Please sign in.",
        },
      });
    }
  };

  return (
    <AuthShell
      title="Create account"
      subtitle="Register with the details required by the backend auth API."
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <AuthAlert message={error} />

        <FormField
          id="name"
          label="Full name"
          name="name"
          type="text"
          autoComplete="name"
          value={form.name}
          onChange={updateField}
          placeholder="Kunal Sharma"
          error={fieldErrors.name}
          disabled={isSubmitting}
        />

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
          id="mobile"
          label="Mobile"
          name="mobile"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={form.mobile}
          onChange={updateField}
          placeholder="9876543210"
          error={fieldErrors.mobile}
          disabled={isSubmitting}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            id="password"
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={updateField}
            placeholder="Minimum 8 characters"
            error={fieldErrors.password}
            disabled={isSubmitting}
          />

          <FormField
            id="confirmPassword"
            label="Confirm"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={updateField}
            placeholder="Repeat password"
            error={fieldErrors.confirmPassword}
            disabled={isSubmitting}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:bg-[#93aeea]"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#d9dee8]" />
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#66758c]">
          or
        </span>
        <div className="h-px flex-1 bg-[#d9dee8]" />
      </div>

      <GoogleAuthButton label="Sign up with Google" />

      <p className="mt-6 text-center text-sm text-[#5d6b82]">
        Already registered?{" "}
        <Link className="font-semibold text-[#2563eb] hover:text-[#1d4ed8]" to="/login">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
