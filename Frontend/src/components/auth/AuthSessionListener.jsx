import { useEffect } from "react";
import { useAuthStore } from "../../store/authStore";

export function AuthSessionListener() {
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [logout]);

  return null;
}
