import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4">
      <div className="alert alert-error">{"No s'ha trobat la pàgina."}</div>
      <Link href="/" className="btn btn-neutral">
        <ArrowLeft />
        Tornar a la pàgina principal
      </Link>
    </div>
  );
}
