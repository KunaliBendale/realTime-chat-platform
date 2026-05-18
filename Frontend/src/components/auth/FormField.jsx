export function FormField({ id, label, error, ...inputProps }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[#26324a]">
        {label}
      </label>
      <input
        id={id}
        className={`mt-2 w-full border bg-white px-3 py-3 text-sm text-[#172033] outline-none transition placeholder:text-[#8b97aa] ${
          error
            ? "border-[#dc2626] focus:border-[#dc2626]"
            : "border-[#cfd6e3] focus:border-[#2563eb]"
        }`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...inputProps}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-xs font-medium text-[#b91c1c]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
