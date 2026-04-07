import { splitProps } from "solid-js";
import { cn } from "../../lib/utils";

export function Label(props) {
  const [local, others] = splitProps(props, ["class", "children"]);

  return (
    <label
      class={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        local.class
      )}
      {...others}
    >
      {local.children}
    </label>
  );
}
