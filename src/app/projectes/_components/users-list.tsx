import type { Project } from "@/app/_data/project";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function UsersList({ users }: { users: Project["users"] }) {
  return (
    <div className="flex flex-row -space-x-3">
      {users.slice(0, 3).map((user) => (
        <Tooltip key={user.user.id}>
          <TooltipTrigger>
            <UserAvatar user={user.user} />
          </TooltipTrigger>
          <TooltipContent>
            <p>{user.user.name}</p>
          </TooltipContent>
        </Tooltip>
      ))}

      {users.length > 3 && (
        <Tooltip>
          <TooltipTrigger>
            <Avatar>
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

function UserAvatar({ user }: { user: Project["users"][number]["user"] }) {
  return (
    <div key={user.id}>
      <div className="w-8">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.image ?? undefined} />
          <AvatarFallback>{user.name!.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
