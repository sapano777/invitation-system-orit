// Plain <img>: GIFs must keep animating, so no Next.js image optimisation.
export function Media({ url, className = "" }: { url: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className={`block h-auto w-full object-cover ${className}`} fetchPriority="high" />;
}
