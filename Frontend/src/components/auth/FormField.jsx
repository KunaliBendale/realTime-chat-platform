import { Input } from "../ui/Input";

export function FormField({ id, label, error, icon, ...inputProps }) {
  return <Input id={id} label={label} error={error} icon={icon} {...inputProps} />;
}
