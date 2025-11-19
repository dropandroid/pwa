export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="animate-in fade-in-50 zoom-in-95 duration-1000 text-center">
        <h1 className="font-headline text-5xl font-bold tracking-tight text-foreground md:text-7xl">
          Hello, World!
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          A simple, elegant starting point for your new application.
        </p>
      </div>
    </main>
  );
}
