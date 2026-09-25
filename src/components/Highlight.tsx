const VARIANT_CLASSES = {
  yellow: "highlight",
  white: "highlight-white",
  frost: "highlight-frost",
} as const;

export function Highlight({
  children,
  variant = "yellow",
}: {
  children: React.ReactNode;
  variant?: keyof typeof VARIANT_CLASSES;
}) {
  return <span className={`${VARIANT_CLASSES[variant]} px-1`}>{children}</span>;
}
