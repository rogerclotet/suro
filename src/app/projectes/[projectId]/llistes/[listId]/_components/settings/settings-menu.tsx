import type { List } from "@/app/_data/list";
import { Settings } from "lucide-react";
import DeleteListButton from "./delete-list-button";

export default function SettingsMenu({ list }: { list: List }) {
  return (
    <details className="dropdown dropdown-end">
      <summary className="btn btn-square btn-ghost">
        <Settings />
      </summary>
      <ul className="menu dropdown-content z-[1] rounded-box bg-base-300 p-2 shadow-xl">
        <li>
          <DeleteListButton list={list} />
        </li>
      </ul>
    </details>
  );
}
