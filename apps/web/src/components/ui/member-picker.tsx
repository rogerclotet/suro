"use client";

import { useTranslations } from "next-intl";
import type { ProjectMember } from "@/app/_data/project";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UserAvatar from "@/components/user-avatar";

// Radix Select forbids an empty-string value, so "unassigned" gets a sentinel
// that maps to/from `null` at the component boundary.
const UNASSIGNED = "__unassigned__";

/**
 * Picks the project member a task is assigned to, or "unassigned" (`null`).
 * Renders member avatars via the shared `UserAvatar`.
 */
export function MemberPicker({
  members,
  value,
  onChange,
  disabled,
  className,
}: {
  members: ProjectMember[];
  value: string | null;
  onChange: (assigneeId: string | null) => void;
  disabled?: boolean;
  className?: string;
}) {
  const t = useTranslations("lists");

  return (
    <Select
      value={value ?? UNASSIGNED}
      onValueChange={(next) => onChange(next === UNASSIGNED ? null : next)}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={t("unassigned")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={UNASSIGNED}>{t("unassigned")}</SelectItem>
        {members.map(({ user }) => (
          <SelectItem key={user.id} value={user.id}>
            <span className="flex items-center gap-2">
              <UserAvatar user={user} className="h-5 w-5" />
              {user.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
