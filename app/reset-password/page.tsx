import { ResetPasswordForm } from "@/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Brewery Ops</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Reset password</h1>
        </div>
        <div className="panel p-6">
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
