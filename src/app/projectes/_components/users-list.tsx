import type { Project } from "@/app/_data/project";

export default function UsersList({ users }: { users: Project["users"] }) {
  return (
    <div className="avatar-group -space-x-6 overflow-visible">
      {users.slice(0, 3).map((user) => (
        <div key={user.user.id} className="tooltip" data-tip={user.user.name}>
          <UserAvatar user={user.user} />
        </div>
      ))}

      {users.length > 3 && (
        <div className="avatar placeholder">
          <div className="w-12 bg-neutral text-neutral-content">
            <span>+{users.length - 3}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function UserAvatar({ user }: { user: Project["users"][number]["user"] }) {
  if (!user.image) {
    <div key={user.id} className="avatar placeholder border-2">
      <div className="w-8 bg-neutral-700 text-neutral-content">
        <span>{user.name!.charAt(0).toUpperCase()}</span>
      </div>
    </div>;
  }

  return (
    <div key={user.id} className="avatar border-2">
      <div className="w-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={user.image!} alt={user.name!} />
      </div>
    </div>
  );
}
