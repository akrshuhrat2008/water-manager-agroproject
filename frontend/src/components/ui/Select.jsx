import { splitProps } from "solid-js";
import { cn } from "../../lib/utils";

export function Select(props) {
  const [local, others] = splitProps(props, ["options", "placeholder", "class", "value", "onChange", "itemComponent"]);

  return (
    <select
      value={local.value}
      onChange={(e) => local.onChange?.(e.target.value)}
      class={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        local.class
      )}
      {...others}
    >
      {local.placeholder && <option value="">{local.placeholder}</option>}
      {local.options?.map((option) => (
        <option value={option}>{option}</option>
      ))}
    </select>
  );
}
