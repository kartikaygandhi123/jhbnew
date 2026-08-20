import logo from "@/assets/jhb-logo-new.png.asset.json";
import { bigNews, deshNews, feedNews, latestNews } from "@/data/news";

/** A print-style newspaper page rendered in CSS (no heavy scans to download). */
export function EpaperPage({
  city,
  date,
  page,
}: {
  city: string;
  date: string;
  page: number;
}) {
  const lead = feedNews[(page - 1) % feedNews.length]!;
  const columns = [...bigNews, ...deshNews, ...feedNews].slice((page - 1) % 3, ((page - 1) % 3) + 4);

  return (
    <div className="aspect-[3/4] w-full overflow-hidden bg-card p-5 text-headline shadow-sm sm:p-8">
      <div className="flex items-end justify-between border-b-2 border-headline pb-2">
        <div className="text-[10px] leading-tight">
          <p>{city} संस्करण</p>
          <p>{date}</p>
          <p>पृष्ठ {page}</p>
        </div>
        <img src={logo.url} alt="जय हिन्द भारत" width={220} height={146} className="h-12 w-auto sm:h-16" />
        <div className="hidden text-right text-[10px] leading-tight sm:block">
          <p>मूल्य ₹ 5.00</p>
          <p>निष्पक्ष • निर्भीक</p>
        </div>
      </div>

      <h2 className="headline mt-3 text-lg leading-snug font-bold sm:text-2xl">{lead.title}</h2>

      <div className="mt-3 columns-2 gap-4 text-[8px] leading-[1.6] sm:columns-3 sm:text-[10px]">
        <p className="mb-2">
          <span className="font-bold">{lead.place}, संवाददाता। </span>
          {lead.summary}
        </p>
        {columns.map((a) => (
          <div key={a.id + String(page)} className="mb-3 break-inside-avoid">
            <p className="headline text-[10px] font-bold sm:text-[13px]">{a.title}</p>
            <p className="mt-1">
              <span className="font-bold">{a.place}। </span>
              {a.summary || "विस्तृत रिपोर्ट पृष्ठ पर जारी।"}
            </p>
          </div>
        ))}
        {latestNews.map((a) => (
          <p key={a.id + String(page)} className="mb-2 break-inside-avoid">
            <span className="font-bold">{a.title} </span>— {a.place}, {a.time}
          </p>
        ))}
      </div>
    </div>
  );
}
