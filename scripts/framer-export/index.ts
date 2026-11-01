// Framer inventory (spec 001): snapshot of the current site's text, structure,
// links and media references. Dev-only: never imported by the site.
//
//   pnpm inventory            # uses the HTML cache in migration/cache
//   pnpm inventory --refresh  # re-downloads every page

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { parsePage, parseSiteChrome } from './parse.ts';
import { buildSummary } from './summary.ts';
import type { Inventory, PageRecord } from './types.ts';

const SITE = 'https://www.marinalabella.com';
const OUT_DIR = 'migration';
const CACHE_DIR = join(OUT_DIR, 'cache');
const DELAY_MS = 750;
const USER_AGENT = 'marina-labella-portfolio-migration/1.0 (inventory of own site; contact: owner)';

const refresh = process.argv.includes('--refresh');

async function fetchText(url: string): Promise<{ text: string; fromCache: boolean }> {
	const key = createHash('sha1').update(url).digest('hex').slice(0, 16);
	const cachePath = join(CACHE_DIR, `${key}.html`);
	if (!refresh) {
		try {
			return { text: await readFile(cachePath, 'utf8'), fromCache: true };
		} catch {
			// not cached yet
		}
	}
	const res = await fetch(url, { headers: { 'user-agent': USER_AGENT } });
	if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
	const text = await res.text();
	await writeFile(cachePath, text);
	return { text, fromCache: false };
}

async function sitemapUrls(): Promise<string[]> {
	const { text } = await fetchText(`${SITE}/sitemap.xml`);
	return [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!.trim()).sort();
}

async function main() {
	await mkdir(CACHE_DIR, { recursive: true });

	const urls = await sitemapUrls();
	console.log(`Sitemap: ${urls.length} URLs`);

	const pages: PageRecord[] = [];
	const failures: string[] = [];
	let homeHtml = '';

	for (const [i, url] of urls.entries()) {
		try {
			const { text, fromCache } = await fetchText(url);
			if (new URL(url).pathname === '/') homeHtml = text;
			pages.push(parsePage(text, url));
			console.log(`[${i + 1}/${urls.length}] ${fromCache ? 'cache' : 'fetch'} ${url}`);
			if (!fromCache) await sleep(DELAY_MS);
		} catch (err) {
			failures.push(url);
			console.error(`[${i + 1}/${urls.length}] FAILED ${url}: ${(err as Error).message}`);
		}
	}

	const inventory: Inventory = {
		source: SITE,
		generatedAt: new Date().toISOString().slice(0, 10),
		pageCount: pages.length,
		siteChrome: parseSiteChrome(homeHtml, `${SITE}/`),
		pages,
	};

	await writeFile(join(OUT_DIR, 'inventory.json'), JSON.stringify(inventory, null, '\t') + '\n');
	await writeFile(join(OUT_DIR, 'summary.md'), buildSummary(inventory, urls));

	console.log(
		`\nWrote ${OUT_DIR}/inventory.json and ${OUT_DIR}/summary.md (${pages.length} pages)`,
	);
	if (failures.length) {
		console.error(`${failures.length} page(s) failed:\n  ${failures.join('\n  ')}`);
		process.exitCode = 1;
	}
}

await main();
