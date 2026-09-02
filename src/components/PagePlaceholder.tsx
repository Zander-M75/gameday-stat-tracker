export function PagePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-bold text-text">{title}</h1>
      <p className="max-w-sm text-sm text-text-muted">{description}</p>
    </div>
  )
}
