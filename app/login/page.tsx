import { LoginScreen } from "@/components/login-screen";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string; tab?: string }>;
}) {
  const params = await searchParams;
  return (
    <LoginScreen
      error={params.error ? decodeURIComponent(params.error) : ""}
      message={params.message ?? ""}
      defaultTab={(params.tab as "signin" | "signup" | "forgot") ?? "signin"}
    />
  );
}
