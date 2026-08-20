import logo from "@/assets/jhb-logo-new.png.asset.json";

export function PageLoader({ label = "खबरें लोड हो रही हैं…" }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-center gap-6 bg-background">
      <img
        src={logo.url}
        alt="जय हिन्द भारत"
        width={320}
        height={214}
        className="w-56 animate-pulse sm:w-72"
      />
      <div className="h-1 w-40 overflow-hidden rounded-full bg-border">
        <div className="h-full w-1/3 animate-[loaderSlide_1.1s_ease-in-out_infinite] bg-primary" />
      </div>
      <p className="text-xs tracking-wide text-muted-foreground">{label}</p>
      <style>{`@keyframes loaderSlide{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
    </div>
  );
}
