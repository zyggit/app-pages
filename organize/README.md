# Organize product page

The download entry checks the public `zyggit/organize` latest GitHub release and
enables the stable `Organize-macos-arm64.dmg` download link only when the matching
uploaded asset is available. Missing releases, network failures and GitHub API
rate limits keep a usable link to the releases page. Without JavaScript, that
fallback also works. The page does not require a token or private credentials.

The current desktop build supports macOS 14+ / Apple Silicon and is ad-hoc signed,
not Apple notarized. Keep this warning visible until the CI signing and
notarization checks are actually implemented and passing. Do not describe the
Windows/Linux CLI as a downloadable desktop app.

To activate, commit the product page changes and deploy through the existing
GitHub Pages configuration. Separately merge the desktop application's
`.github/workflows/desktop-release.yml` and all required app/engine/license
changes to `zyggit/organize` main (or master). After the first successful published
release the entry automatically switches to direct download. Subsequent app
releases need no website changes. The application workflow also supports a
manual first run on main/master.

Local checks:

```sh
node --test organize/tests/download.test.mjs
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/organize/`, check Chinese/English, light/dark themes
and narrow screens. Before the first release it should show the release-page
fallback, not a broken DMG link.
