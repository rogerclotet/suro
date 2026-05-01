export const dynamic = "force-dynamic";

export function GET() {
  return new Response("OK", { status: 200 });
}

export function HEAD() {
  return new Response(null, { status: 200 });
}
