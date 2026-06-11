import {
  CATPPUCCIN_COLORS,
  type CatppuccinColor,
} from "@/lib/catppuccin-colors";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface UserAvatarProps {
  user: {
    name?: string | null;
    image?: string | null;
    customImage?: string | null;
    avatarColor?: string | null;
  };
  className?: string;
}

export default function UserAvatar({ user, className }: UserAvatarProps) {
  const imageSrc = user.customImage ?? user.image;
  const color = user.avatarColor as CatppuccinColor | undefined;
  const catppuccin = color ? CATPPUCCIN_COLORS[color] : undefined;

  return (
    <Avatar className={cn("h-8 w-8", className)}>
      {imageSrc && <AvatarImage src={imageSrc} alt={user.name ?? ""} />}
      <AvatarFallback
        delayMs={0}
        // No Catppuccin color picked → primary fill, like mobile's Avatar.
        className="bg-primary text-primary-foreground"
        style={
          catppuccin
            ? { backgroundColor: catppuccin.bg, color: catppuccin.fg }
            : undefined
        }
      >
        {user.name?.charAt(0)?.toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
