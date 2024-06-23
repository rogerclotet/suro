import { CookingPot, ListTodo, Users } from "lucide-react";

export default function BottomNav() {
  return (
    <div className="btm-nav text-xs lg:hidden">
      <button className="text-primary">
        Grups
        <Users />
      </button>
      <button className="active text-primary">
        Llistes
        <ListTodo />
      </button>
      <button className="text-primary">
        Receptes
        <CookingPot />
      </button>
    </div>
  );
}
