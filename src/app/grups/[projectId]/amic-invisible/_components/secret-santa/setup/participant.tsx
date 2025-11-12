import { cva } from "class-variance-authority";
import type { User } from "@/app/_data/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function Participant({
  user,
  nameSize = "sm",
  className,
}: {
  user: User;
  nameSize?: "sm" | "xs";
  className?: string;
}) {
  const avatarFallbackVariants = cva(
    "bg-secondary text-2xl text-secondary-foreground",
    {
      variants: {
        nameSize: {
          sm: "text-2xl",
          xs: "text-xl",
        },
      },
      defaultVariants: {
        nameSize: "sm",
      },
    },
  );

  const nameLabelVariants = cva(
    "wrap-anywhere line-clamp-2 text-ellipsis text-center text-card-foreground",
    {
      variants: {
        nameSize: {
          sm: "text-sm leading-tight",
          xs: "text-xs leading-tight",
        },
      },
      defaultVariants: {
        nameSize: "sm",
      },
    },
  );

  const nameContainerVariants = cva("flex items-center justify-center", {
    variants: {
      nameSize: {
        sm: "h-[35px]",
        xs: "h-[30px]",
      },
    },
    defaultVariants: {
      nameSize: "sm",
    },
  });

  return (
    <Card
      className={cn(
        "flex aspect-3/4 flex-col items-center justify-evenly gap-0 p-1.5",
        className,
      )}
    >
      <Avatar className="aspect-square h-auto w-[60%]">
        <AvatarFallback className={cn(avatarFallbackVariants({ nameSize }))}>
          {user.name?.charAt(0)?.toUpperCase()}
        </AvatarFallback>
        <AvatarImage src={user.image ?? undefined} />
      </Avatar>

      <div className={cn(nameContainerVariants({ nameSize }))}>
        <p className={cn(nameLabelVariants({ nameSize }))}>{user.name}</p>
      </div>
    </Card>
  );
}
