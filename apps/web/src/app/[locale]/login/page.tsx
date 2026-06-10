import Login from "./_components/login";

export default function LoginPage() {
  // Already-signed-in users are redirected client-side by <Login> once Convex
  // reports an authenticated session.
  return <Login />;
}
