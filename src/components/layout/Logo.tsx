export function LogoMark({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <div className={size === "sm" ? "grid size-7 place-items-center rounded-lg bg-brand-gradient" : "grid size-10 place-items-center rounded-2xl bg-brand-gradient shadow-glow"}>
      <span className={`font-display font-bold text-primary-foreground ${size === "sm" ? "text-[12px]" : "text-lg"}`}>S</span>
    </div>
  );
}
