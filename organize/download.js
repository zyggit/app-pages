(function () {
    "use strict";
    var base = "https://github.com/zyggit/organize/releases";
    var assetName = "Organize-macos-arm64.dmg";
    var button = document.getElementById("app-download");
    var status = document.getElementById("download-status");
    if (!button || !status || typeof fetch !== "function") return;

    function label(element, zh, en) {
        element.querySelector(".zh").textContent = zh;
        element.querySelector(".en").textContent = en;
    }
    var controller = typeof AbortController === "function" ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 5000) : null;
    fetch("https://api.github.com/repos/zyggit/organize/releases/latest", {
        headers: { Accept: "application/vnd.github+json" },
        signal: controller ? controller.signal : undefined
    }).then(function (response) {
        if (response.status === 404) return null;
        if (!response.ok) throw new Error("Release lookup failed");
        return response.json();
    }).then(function (release) {
        var asset = release && !release.draft && !release.prerelease && Array.isArray(release.assets) && release.assets.find(function (item) {
            return item.name === assetName && item.state === "uploaded" && item.size > 0 &&
                typeof item.browser_download_url === "string" &&
                item.browser_download_url.indexOf(base + "/download/") === 0;
        });
        if (!asset) {
            label(status, "首个安装包发布后，这里将提供直接下载；目前可查看 GitHub 发布页。", "Direct download will appear after the first installer release. Visit GitHub Releases for now.");
            return;
        }
        // Fixed latest URL follows future builds without another website deploy.
        button.href = base + "/latest/download/" + assetName;
        label(button, "下载 Mac 安装包", "Download for Mac");
        label(status, "DMG · " + (asset.size / 1048576).toFixed(1) + " MB · ", "DMG · " + (asset.size / 1048576).toFixed(1) + " MB · ");
        var checksums = release.assets.some(function (item) {
            return item.name === "SHA256SUMS.txt" && item.state === "uploaded" && item.size > 0;
        });
        if (checksums) {
            var checksumLink = document.createElement("a");
            checksumLink.href = base + "/latest/download/SHA256SUMS.txt";
            var zh = document.createElement("span");
            zh.className = "zh";
            zh.textContent = "SHA-256 校验文件";
            var en = document.createElement("span");
            en.className = "en";
            en.textContent = "SHA-256 checksums";
            checksumLink.appendChild(zh);
            checksumLink.appendChild(en);
            status.appendChild(checksumLink);
        }
    }).catch(function () {
        label(status, "暂时无法查询最新版本，请通过 GitHub 发布页下载安装包和校验文件。", "Cannot check the latest version right now. Find installers and checksums on GitHub Releases.");
    }).finally(function () {
        if (timer !== null) clearTimeout(timer);
    });
}());
