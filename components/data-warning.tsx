export function DataWarning({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <div className="border border-[rgba(168,103,17,0.18)] bg-[rgba(168,103,17,0.08)] p-4 text-sm leading-6 text-[var(--warning)]">
      {message}
    </div>
  );
}
