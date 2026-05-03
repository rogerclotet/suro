import type { Project } from "@/app/_data/project";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/touch-tooltip";
import UserAvatar from "@/components/user-avatar";

export default function UsersList({ users }: { users: Project["users"] }) {
  return (
    <div className="flex flex-row -space-x-2">
      {users.slice(0, 3).map((user) => (
        <Tooltip key={user.user.id}>
          <TooltipTrigger>
            <UserAvatar
              className="avatar border-2 border-background"
              user={user.user}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>{user.user.name}</p>
          </TooltipContent>
        </Tooltip>
      ))}

      {users.length > 3 && (
        <Tooltip>
          <TooltipTrigger>
            <Avatar className="avatar h-8 w-8 border-2 border-background">
              <AvatarFallback>+{users.length - 3}</AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>
            <p>{users.map((u) => u.user.name).join(", ")}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
