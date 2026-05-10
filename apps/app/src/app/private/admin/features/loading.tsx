export default function Loading() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="h-9 w-48 bg-zinc-800 rounded-md animate-pulse"></div>
          <div className="h-5 w-64 bg-zinc-800 rounded-md animate-pulse mt-2"></div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="h-9 w-48 bg-zinc-800 rounded-md animate-pulse"></div>
          <div className="h-9 w-32 bg-zinc-800 rounded-md animate-pulse"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col p-5 bg-card border border-border rounded-lg h-[200px]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 pr-4 space-y-2">
                <div className="h-6 w-3/4 bg-zinc-800 rounded-md animate-pulse"></div>
                <div className="h-5 w-16 bg-zinc-800 rounded-full animate-pulse"></div>
              </div>
              <div className="w-[42px] h-[24px] bg-zinc-800 rounded-full animate-pulse"></div>
            </div>
            <div className="mt-auto space-y-4 pt-4 border-t border-border/50">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-24 bg-zinc-800 rounded-md animate-pulse"></div>
                  <div className="h-4 w-8 bg-zinc-800 rounded-md animate-pulse"></div>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full animate-pulse"></div>
              </div>
              <div className="space-y-1">
                <div className="h-4 w-1/2 bg-zinc-800 rounded-md animate-pulse"></div>
                <div className="h-4 w-1/3 bg-zinc-800 rounded-md animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
