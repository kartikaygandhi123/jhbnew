<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep VPS deployment opt-in through vite.vps.config.ts; the managed preview must remain usable before cutover.
- Application-owned browser and server adapters use the same external backend in preview and VPS; never edit generated integrations or fall back on failed writes, to prevent split content and identities.
- Add external schema changes as checked-in SQL under deploy/migrations and apply before dependent releases, because managed schema tools target a different database.
- Keep homepage-selection and kicker-validation rules in a shared news-rules module with tests, so editor and public behavior stay consistent.
- Keep article URL collision handling and mutation confirmation in the tested article-write module; never overwrite another article or report a zero-row write as success.
- Share photo fitting and metadata rendering across news cards; keep stable photo frames and avoid duplicating homepage credit markup.
- Derive latest-news rails from the shared published article query using tested news-rules; refresh visible article queries periodically so edits from either host converge.
- Transfer asset pointer bytes to the private media bucket and resolve them through the existing media endpoint on VPS builds.
- Refresh YouTube through a standalone scheduled script into durable JSON; visitor requests must never call the YouTube API.
