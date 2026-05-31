import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, Phone, User } from "lucide-react";
import { AuthAlert } from "../components/auth/AuthAlert";
import { AuthShell } from "../components/auth/AuthShell";
import { FormField } from "../components/auth/FormField";
import { GoogleAuthButton } from "../components/auth/GoogleAuthButton";
import { Button } from "../components/ui/Button";
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
      subtitle="Create your account and start messaging in seconds."
      contentWidth="lg"
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <AuthAlert message={error} />

        <FormField
          id="name"
          label="Full name"
          name="name"
          type="text"
          autoComplete="name"
          icon={User}
          value={form.name}
          onChange={updateField}
          placeholder="Kunal Sharma"
          error={fieldErrors.name}
          disabled={isSubmitting}
          size="compact"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="email"
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            icon={Mail}
            value={form.email}
            onChange={updateField}
            placeholder="you@example.com"
            error={fieldErrors.email}
            disabled={isSubmitting}
            size="compact"
          />

          <FormField
            id="mobile"
            label="Mobile"
            name="mobile"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            icon={Phone}
            value={form.mobile}
            onChange={updateField}
            placeholder="9876543210"
            error={fieldErrors.mobile}
            disabled={isSubmitting}
            size="compact"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="password"
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            icon={Lock}
            value={form.password}
            onChange={updateField}
            placeholder="Minimum 8 characters"
            error={fieldErrors.password}
            disabled={isSubmitting}
            size="compact"
          />

          <FormField
            id="confirmPassword"
            label="Confirm"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            icon={Lock}
            value={form.confirmPassword}
            onChange={updateField}
            placeholder="Repeat password"
            error={fieldErrors.confirmPassword}
            disabled={isSubmitting}
            size="compact"
          />
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#d9dee8]" />
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#66758c]">
          or
        </span>
        <div className="h-px flex-1 bg-[#d9dee8]" />
      </div>

      <GoogleAuthButton label="Sign up with Google" />

      <p className="mt-4 text-center text-sm text-[#5d6b82]">
        Already registered?{" "}
        <Link className="font-semibold text-[#2563eb] hover:text-[#1d4ed8]" to="/login">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
