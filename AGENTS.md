# Public website and support

## Product README updates

When a change affects how users install, start, pay for or use ViewLingo, compare
the affected claims in the English README and the translations in
`docs/README-*.md` with the released app and the published privacy policy.
Update the affected passages together. A layout or wording change in one
language only needs translation work if it changes what other readers need to know.

Take particular care with offline use and data sharing. Check default captures,
Live, the user's choice of a connected capture service, and optional comparisons
separately. Describe when consent is needed and what leaves the Mac.

Keep installation, support and the permanent version history easy to find.
Link downloads to the Mac App Store and release notes to the Pages version
history. Record individual releases in `CHANGELOG.md`. Keep the README useful
across versions without copying the latest release announcement into it.

Run `node --test tests/readme-links.test.cjs` after editing a README. The test
checks navigation. Review the changed product claims in each affected language
against the release and policy, and report any translation still pending.
