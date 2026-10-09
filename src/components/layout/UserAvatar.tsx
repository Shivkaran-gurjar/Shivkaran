import { useAuth } from "@/hooks/use-auth";
import { User } from "lucide-react";

export function UserAvatar({ large = false }: { large?: boolean }) {
  const { user } = useAuth();
  const cls = large ? "size-12 text-[13px]" : "size-9 text-[13px]";
  const avatar = user?.user_metadata?.avatar_url as string | undefined;
  if (avatar) return <img src={avatar} alt="" className={`${cls} shrink-0 rounded-full object-cover`} referrerPolicy="no-referrer" />;
  const name = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";
  const initials = name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <div className={`${cls} grid shrink-0 place-items-center rounded-full bg-avatar-gradient font-display font-bold text-primary-foreground`}>
      {initials || <User className="size-4" />}
    </div>
  );
}
