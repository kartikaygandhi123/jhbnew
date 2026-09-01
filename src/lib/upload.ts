import { supabase } from "@/integrations/supabase/client";

/** Uploads a file to the private media bucket and returns its public site URL. */
export async function uploadMedia(file: File, folder = "uploads"): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const safe = `${folder}/${String(Date.now())}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(safe, file, {
    cacheControl: "31536000",
    upsert: false,
    ...(file.type ? { contentType: file.type } : {}),
  });
  if (error) throw error;
  return `/api/public/media/${safe}`;
}
