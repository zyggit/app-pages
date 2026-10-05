# Organize product page

The download entry checks the public `zyggit/organize` latest GitHub release and
enables the stable `Organize-macos-arm64.dmg` download link only when the matching
uploaded asset is available. Missing releases or source-only releases disable the
download entry and explicitly say the installer has not been published. Network
failures and GitHub API rate limits offer a clearly labelled "View GitHub Releases"
link instead of claiming it downloads an app. The separate Releases link also
works without JavaScript. The page requires no token or private credentials.

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
and narrow screens. Before the first installer release it should show a disabled
download entry, not an empty release page presented as an installer download.

An empty Release is not a successful package build: GitHub's automatically
generated source ZIP/tar.gz files do not install the desktop app. The application
repository must contain the desktop workflow and its required scripts, and
GitHub Actions must be enabled there (check fork-repository settings). The
workflow builds on macOS, uploads an Actions artifact, and then explicitly
uploads the DMG to Release assets; an Actions artifact alone is not a public
Release download.
