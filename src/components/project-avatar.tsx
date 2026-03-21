import {
  CATPPUCCIN_COLORS,
  type CatppuccinColor,
} from "@/lib/catppuccin-colors";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface ProjectAvatarProps {
  project: {
    name: string;
    image?: string | null;
    color: string;
  };
  className?: string;
}

export default function ProjectAvatar({
  project,
  className,
}: ProjectAvatarProps) {
  const catppuccin =
    CATPPUCCIN_COLORS[project.color as CatppuccinColor] ??
    CATPPUCCIN_COLORS.blue;

  return (
    <Avatar className={cn("h-8 w-8", className)}>
      {project.image && <AvatarImage src={project.image} alt={project.name} />}
      <AvatarFallback
        delayMs={0}
        style={{ backgroundColor: catppuccin.bg, color: catppuccin.fg }}
      >
        {project.name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
