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
- Replace managed browser auth imports only in the VPS build using exact aliases; never edit generated integrations.
- Transfer asset pointer bytes to the private media bucket and resolve them through the existing media endpoint on VPS builds.
- Refresh YouTube through a standalone scheduled script into durable JSON; visitor requests must never call the YouTube API.
