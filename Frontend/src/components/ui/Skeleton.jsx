export function Skeleton({ className = "" }) {
  return <div className={`skeleton-shimmer rounded-xl ${className}`} aria-hidden="true" />;
}

export function ChatListSkeleton({ count = 6 }) {
  return (
    <div className="space-y-2 p-3" aria-label="Loading chats">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-2xl p-3">
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          <Skeleton className="h-3 w-10 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function MessageListSkeleton() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6" aria-label="Loading messages">
      <Skeleton className="mx-auto h-7 w-24 rounded-full" />
      <div className="flex justify-start">
        <Skeleton className="h-16 w-[68%] rounded-3xl rounded-bl-md" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-12 w-[52%] rounded-3xl rounded-br-md" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="h-20 w-[72%] rounded-3xl rounded-bl-md" />
      </div>
    </div>
  );
}
