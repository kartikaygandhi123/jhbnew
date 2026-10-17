export const CHANNEL_HANDLE = '@JaiHindBharatNews';
export const REFRESH_HOURS = 12;
export function chooseBroadcast(videos, live) {
  return live?.id?.videoId ? { youtube_id: live.id.videoId, is_live: true, title: live.snippet.title }
    : videos[0] ? { youtube_id: videos[0].youtube_id, is_live: false, title: videos[0].title } : null;
}
export function mergeVideos(manual, automatic) {
  const ids = new Set(manual.map(v => v.youtube_id));
  return [...manual, ...automatic.filter(v => !ids.has(v.youtube_id))];
}