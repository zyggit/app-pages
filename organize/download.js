(function () {
    "use strict";
    var base = "https://github.com/zyggit/organize/releases";
    var assetName = "Organize-macos-arm64.dmg";
    var button = document.getElementById("app-download");
    var status = document.getElementById("download-status");
    if (!button || !status) return;

    function label(element, zh, en) {
        element.querySelector(".zh").textContent = zh;
        element.querySelector(".en").textContent = en;
    }
    function unavailable(unpublished) {
        button.removeAttribute("href");
        button.setAttribute("aria-disabled", "true");
        button.setAttribute("tabindex", "-1");
        button.setAttribute("data-state", "unavailable");
        label(button, unpublished ? "安装包尚未发布" : "安装包暂不可用", unpublished ? "Installer not released" : "Installer unavailable");
    }
    function enable(url, state) {
        button.href = url;
        button.removeAttribute("aria-disabled");
        button.removeAttribute("tabindex");
        button.setAttribute("data-state", state);
    }
    if (typeof fetch !== "function") {
        unavailable();
        label(status, "无法自动查询安装包，请通过发布记录确认 DMG 附件是否可用。", "Cannot check automatically. Visit Releases to check for a DMG attachment.");
        return;
    }
    label(button, "正在检查安装包…", "Checking installer…");
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
            unavailable(true);
            label(status, "尚未找到已发布的 DMG 安装包。只有源码压缩包的 Release 不能安装应用；自动构建并上传成功后，这里才会开放下载。", "No published DMG installer was found. Source archives are not app installers. Download will be enabled after CI builds and uploads the DMG.");
            return;
        }
        // Fixed latest URL follows future builds without another website deploy.
        enable(base + "/latest/download/" + assetName, "ready");
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
        enable(base, "lookup-failed");
        label(button, "查看 GitHub 发布页", "View GitHub Releases");
        label(status, "暂时无法查询安装包。请查看发布页中的 DMG 附件；源码压缩包不是安装包。", "Cannot check the installer right now. Look for a DMG attachment on Releases; source archives are not installers.");
    }).finally(function () {
        if (timer !== null) clearTimeout(timer);
    });
}());
