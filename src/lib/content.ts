import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];

export type Article = Tables["articles"]["Row"];
export type Category = Tables["categories"]["Row"];
export type Video = Tables["videos"]["Row"];
export type LiveChannel = Tables["live_channels"]["Row"];
export type TrendingTag = Tables["trending_tags"]["Row"];
export type EpaperEdition = Tables["epaper_editions"]["Row"];
export type EpaperPage = Tables["epaper_pages"]["Row"];
export type SiteSettings = Tables["site_settings"]["Row"];

const STALE = 60_000;

/** URL segment used for an article link. */
export function articleKey(a: Pick<Article, "id" | "slug">): string {
  return a.slug && a.slug.length > 0 ? a.slug : a.id;
}

/** Paragraphs for the article page — falls back to a generated body. */
export function articleParagraphs(a: Article): string[] {
  if (a.body && a.body.trim().length > 0) {
    return a.body.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  }
  if (a.summary) {
    return [
      `${a.place}, संवाददाता। ${a.summary}`,
      "विस्तृत जानकारी के अनुसार, इस घटनाक्रम से जुड़े तमाम पहलुओं पर चर्चा जारी है। प्रशासनिक सूत्रों का कहना है कि अगले कुछ दिनों में और अपडेट सामने आएंगे।",
      "हम इस मामले की गहन निगरानी कर रहे हैं। जैसे ही कोई नई जानकारी आएगी, हमारे पाठक सबसे पहले जान पाएंगे।",
    ];
  }
  return [`${a.place}, संवाददाता। ${a.title}`, "इस खबर पर विस्तृत रिपोर्ट जल्द ही अपडेट की जाएगी।"];
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site_settings"],
    staleTime: STALE,
    queryFn: async (): Promise<SiteSettings | null> => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("id", "main").maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    staleTime: STALE,
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTrendingTags() {
  return useQuery({
    queryKey: ["trending_tags"],
    staleTime: STALE,
    queryFn: async (): Promise<TrendingTag[]> => {
      const { data, error } = await supabase.from("trending_tags").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** All published articles, ordered by section position. */
export function useArticles() {
  return useQuery({
    queryKey: ["articles", "published"],
    staleTime: STALE,
    queryFn: async (): Promise<Article[]> => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("published", true)
        .order("sort_order")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useArticle(key: string) {
  return useQuery({
    queryKey: ["article", key],
    staleTime: STALE,
    queryFn: async (): Promise<Article | null> => {
      const bySlug = await supabase.from("articles").select("*").eq("slug", key).maybeSingle();
      if (bySlug.data) return bySlug.data;
      const isUuid = /^[0-9a-f-]{36}$/i.test(key);
      if (!isUuid) return null;
      const byId = await supabase.from("articles").select("*").eq("id", key).maybeSingle();
      if (byId.error) throw byId.error;
      return byId.data;
    },
  });
}

export function useVideos() {
  return useQuery({
    queryKey: ["videos"],
    staleTime: STALE,
    queryFn: async (): Promise<Video[]> => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("published", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useLiveChannels() {
  return useQuery({
    queryKey: ["live_channels"],
    staleTime: STALE,
    queryFn: async (): Promise<LiveChannel[]> => {
      const { data, error } = await supabase.from("live_channels").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useEditions() {
  return useQuery({
    queryKey: ["epaper_editions"],
    staleTime: STALE,
    queryFn: async (): Promise<EpaperEdition[]> => {
      const { data, error } = await supabase
        .from("epaper_editions")
        .select("*")
        .order("is_current", { ascending: false })
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useEditionPages(editionId: string | undefined) {
  return useQuery({
    queryKey: ["epaper_pages", editionId],
    enabled: Boolean(editionId),
    staleTime: STALE,
    queryFn: async (): Promise<EpaperPage[]> => {
      const { data, error } = await supabase
        .from("epaper_pages")
        .select("*")
        .eq("edition_id", editionId!)
        .order("page_no");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function bySection(list: Article[] | undefined, section: string): Article[] {
  return (list ?? []).filter((a) => a.section === section);
}
