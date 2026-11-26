export default function LoadingThread() {
  return (
    <div className="flex h-[100dvh] flex-col bg-bg">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-separator px-4 md:h-[75px]">
        <span className="h-9 w-9 animate-pulse rounded-full bg-field" />
        <span className="h-4 w-40 animate-pulse rounded bg-field" />
      </div>
      <div className="flex flex-1 flex-col justify-end gap-3 p-4 md:p-8">
        <span className="h-12 w-48 animate-pulse rounded-2xl bg-field" />
        <span className="ml-auto h-12 w-64 animate-pulse rounded-2xl bg-field" />
        <span className="h-16 w-56 animate-pulse rounded-2xl bg-field" />
      </div>
      <div className="m-3 h-12 animate-pulse rounded-full bg-field md:mx-auto md:w-[calc(100%-2rem)] md:max-w-[880px]" />
    </div>
  );
}
