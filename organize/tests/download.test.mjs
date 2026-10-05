import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../download.js', import.meta.url), 'utf8');
const base = 'https://github.com/zyggit/organize/releases';

function element() {
    const labels = { '.zh': { textContent: '' }, '.en': { textContent: '' } };
    return { labels, children: [], querySelector: key => labels[key],
        appendChild(child) { this.children.push(child); } };
}

async function render(response, options = {}) {
    const button = Object.assign(element(), { href: base });
    const status = element();
    vm.runInNewContext(source, {
        document: {
            getElementById: id => id === 'app-download' ? button : status,
            createElement: () => element(),
        },
        fetch: options.noFetch ? undefined : () => options.error ? Promise.reject(new Error('offline')) : Promise.resolve(response),
        setTimeout, clearTimeout, AbortController,
    });
    await new Promise(resolve => setImmediate(resolve));
    return { button, status };
}

const dmg = { name: 'Organize-macos-arm64.dmg', state: 'uploaded', size: 2 * 1048576,
    browser_download_url: base + '/download/desktop-v0.1.0-build.1/Organize-macos-arm64.dmg' };
const ok = release => ({ ok: true, status: 200, json: async () => release });

test('complete release enables stable DMG and checksum URLs', async () => {
    const { button, status } = await render(ok({ assets: [dmg, { name: 'SHA256SUMS.txt', state: 'uploaded', size: 120 }] }));
    assert.equal(button.href, base + '/latest/download/Organize-macos-arm64.dmg');
    assert.equal(button.labels['.zh'].textContent, '下载 Mac 安装包');
    assert.equal(button.labels['.en'].textContent, 'Download for Mac');
    assert.match(status.labels['.zh'].textContent, /2.0 MB/);
    assert.equal(status.children[0].href, base + '/latest/download/SHA256SUMS.txt');
});

test('no first release falls back to release page', async () => {
    const { button, status } = await render({ ok: false, status: 404 });
    assert.equal(button.href, base);
    assert.match(status.labels['.zh'].textContent, /首个安装包/);
});

test('network failure and rate limits retain usable fallback', async () => {
    for (const [response, options] of [[null, { error: true }], [{ ok: false, status: 403 }, {}]]) {
        const { button, status } = await render(response, options);
        assert.equal(button.href, base);
        assert.match(status.labels['.en'].textContent, /Cannot check/);
    }
});

test('draft, prerelease, incomplete, wrong architecture or unsafe host cannot enable download', async () => {
    for (const release of [
        { draft: true, assets: [dmg] }, { prerelease: true, assets: [dmg] },
        { assets: [{ ...dmg, state: 'new' }] }, { assets: [{ ...dmg, size: 0 }] },
        { assets: [{ ...dmg, name: 'Organize-macos-intel.dmg' }] },
        { assets: [{ ...dmg, browser_download_url: 'https://example.com/file.dmg' }] },
        { assets: null }, { assets: [] },
    ]) {
        assert.equal((await render(ok(release))).button.href, base);
    }
});

test('no JavaScript fetch support leaves original release-page link', async () => {
    assert.equal((await render(null, { noFetch: true })).button.href, base);
});
