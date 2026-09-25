export function Highlight({
  children,
  variant = "yellow",
}: {
  children: React.ReactNode;
  variant?: "yellow" | "white";
}) {
  return (
    <span className={`${variant === "white" ? "highlight-white" : "highlight"} px-1`}>
      {children}
    </span>
  );
}
