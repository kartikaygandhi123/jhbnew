# External hosting migration

- [x] Add optional editor-entered reporter details across article displays and newest-first automatic ताजा खबरें; external column verified, 13 tests passed, live ordering/navigation and sample metadata rendering checked. Staff save/delete UI verification still needs an external staff session as noted below.

- [x] Restore larger homepage image frames with portrait fitting, share place/time/reporter strips across news items, and remove duplicate presentation code.

- [x] Fix duplicate article URLs and zero-row write confirmation (six tests); verify long card headlines and public article navigation on desktop/mobile. External staff save/delete end-to-end remains blocked on the staff session below.

- [x] Connect preview and VPS application adapters to one external database; external reads and main-headline navigation verified.
- [x] Add selected homepage article, restore category picker, and editor-selected kicker colors; database exclusivity and three rule tests passed.
- [ ] Verify external staff create/edit/upload through the admin UI; blocked on an existing external staff session, unavailable to this sandbox.

- [ ] Verify historical media and staff migration completeness; user populated external tables, but full source/destination transfer inventory is unavailable.
- [x] Add shared external backend/auth configuration while retaining separate managed and VPS hosting targets.
- [x] Add cached twice-daily YouTube videos and automatic live detection; first provider refresh awaits valid destination.
- [x] Add repeatable GitHub-to-VPS deployment, TLS/proxy configuration, and operations guide.
- [ ] Verify deployed VPS release and migration outcomes; requires VPS access and external staff session.
- [ ] VPS installation, workflow activation and domain cutover; requires VPS access and GitHub secrets.