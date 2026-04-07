import { Tabs as KobalteTabs } from "@kobalte/core/tabs";
import { splitProps, For } from "solid-js";
import { cn } from "../../lib/utils";

export function Tabs(props) {
  const [local, others] = splitProps(props, ["class", "children"]);

  return (
    <KobalteTabs class={cn("w-full", local.class)} {...others}>
      {local.children}
    </KobalteTabs>
  );
}

export function TabsList(props) {
  const [local, others] = splitProps(props, ["class", "children"]);

  return (
    <KobalteTabs.List
      class={cn(
        "inline-flex h-12 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground gap-1",
        local.class
      )}
      {...others}
    >
      {local.children}
    </KobalteTabs.List>
  );
}

export function TabsTrigger(props) {
  const [local, others] = splitProps(props, ["class", "children", "value"]);

  return (
    <KobalteTabs.Trigger
      value={local.value}
      class={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[selected]:bg-background data-[selected]:text-foreground data-[selected]:shadow-sm gap-2",
        local.class
      )}
      {...others}
    >
      {local.children}
    </KobalteTabs.Trigger>
  );
}

export function TabsContent(props) {
  const [local, others] = splitProps(props, ["class", "children", "value"]);

  return (
    <KobalteTabs.Content
      value={local.value}
      class={cn(
        "mt-6 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        local.class
      )}
      {...others}
    >
      {local.children}
    </KobalteTabs.Content>
  );
}
