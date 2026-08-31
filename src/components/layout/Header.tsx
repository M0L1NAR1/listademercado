type HeaderProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function Header({ title, subtitle, action }: HeaderProps) {
  return (
    <header className="safe-top sticky top-0 z-30 bg-surface-2/95 px-5 pb-4 pt-4 backdrop-blur-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}
