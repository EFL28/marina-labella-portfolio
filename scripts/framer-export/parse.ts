import { parse as parseHtml, type HTMLElement } from 'node-html-parser';
import { classify } from './classify.ts';
import type { ImageRef, InlineLink, PageRecord, SiteChrome, TextBlock, VideoRef } from './types.ts';

/** Viewport used to decide which Framer breakpoint variant is "the" page. */
const DESKTOP_WIDTH = 1440;

const TEXT_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li']);

// ---------------------------------------------------------------------------
// Framer breakpoint de-duplication
// ---------------------------------------------------------------------------

/** Evaluates a simple `(min-width: Npx) and (max-width: Npx)` query for a width. */
function matchesWidth(mediaQuery: string, width: number): boolean {
	const min = /min-width:\s*([\d.]+)px/.exec(mediaQuery);
	const max = /max-width:\s*([\d.]+)px/.exec(mediaQuery);
	if (min && width < Number(min[1])) return false;
	if (max && width > Number(max[1])) return false;
	return true;
}

/** All breakpoint hashes declared by the page, and those active on desktop. */
function breakpointHashes(root: HTMLElement): { all: Set<string>; desktop: Set<string> } {
	const raw = root.querySelector('#main')?.getAttribute('data-framer-hydrate-v2');
	const all = new Set<string>();
	const desktop = new Set<string>();
	if (!raw) return { all, desktop };
	try {
		const data = JSON.parse(raw) as { breakpoints?: { hash: string; mediaQuery: string }[] };
		for (const bp of data.breakpoints ?? []) {
			all.add(bp.hash);
			if (matchesWidth(bp.mediaQuery, DESKTOP_WIDTH)) desktop.add(bp.hash);
		}
	} catch {
		// Malformed hydrate data: keep every variant rather than guessing.
	}
	return { all, desktop };
}

const hiddenHashes = (el: HTMLElement) =>
	el.classList.value.filter((c) => c.startsWith('hidden-')).map((c) => c.slice(7));

/**
 * Removes the breakpoint variants a desktop visitor never sees: any
 * `.ssr-variant` hidden on a desktop breakpoint. Variants that only use
 * hashes the page doesn't declare (rare, component-level) can't be resolved,
 * so we keep the first of each group of adjacent variants.
 */
function removeHiddenVariants(root: HTMLElement): void {
	const { all, desktop } = breakpointHashes(root);

	for (const el of root.querySelectorAll('.ssr-variant')) {
		if (hiddenHashes(el).some((h) => desktop.has(h))) el.remove();
	}

	for (const el of root.querySelectorAll('.ssr-variant')) {
		const hidden = hiddenHashes(el);
		if (hidden.length === 0 || hidden.some((h) => all.has(h))) continue;
		let prev = el.previousElementSibling;
		while (prev && !prev.classList.contains('ssr-variant')) prev = prev.previousElementSibling;
		if (prev && prev.classList.contains('ssr-variant')) el.remove();
	}
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

function resolveHref(href: string, pageUrl: string): string {
	try {
		return new URL(href, pageUrl).toString();
	} catch {
		return href;
	}
}

/** Internal URLs become paths (`/animation/x`); external ones stay absolute. */
function normaliseHref(href: string, pageUrl: string): string {
	const abs = resolveHref(href, pageUrl);
	const origin = new URL(pageUrl).origin;
	if (abs.startsWith(origin)) {
		const path = new URL(abs).pathname.replace(/\/$/, '');
		return path === '' ? '/' : path;
	}
	return abs;
}

const isInternal = (href: string) => href.startsWith('/');

function stripQuery(src: string): string {
	return src.split('?')[0] ?? src;
}

function meta(root: HTMLElement, selector: string): string | undefined {
	return root.querySelector(selector)?.getAttribute('content') || undefined;
}

// ---------------------------------------------------------------------------
// Site chrome (nav + footer), recorded once from the home page
// ---------------------------------------------------------------------------

function linksIn(el: HTMLElement | null | undefined, pageUrl: string): InlineLink[] {
	if (!el) return [];
	const seen = new Set<string>();
	const out: InlineLink[] = [];
	for (const a of el.querySelectorAll('a[href]')) {
		const href = normaliseHref(a.getAttribute('href') ?? '', pageUrl);
		const text = clean(a.text);
		const key = `${text}|${href}`;
		if (seen.has(key)) continue;
		seen.add(key);
		out.push({ text, href });
	}
	return out;
}

export function parseSiteChrome(html: string, pageUrl: string): SiteChrome {
	const root = parseHtml(html);
	removeHiddenVariants(root);
	const navLinks = linksIn(root.querySelector('nav'), pageUrl);
	const footer = root.querySelectorAll('footer').at(-1);
	const footerLinks = linksIn(footer, pageUrl);
	const all = [...navLinks, ...footerLinks];
	const email = all.find((l) => l.href.startsWith('mailto:'))?.href.replace('mailto:', '');
	const socials = [
		...new Set(
			all
				.map((l) => l.href)
				.filter((h) => /instagram|linkedin|behance|vimeo|youtube|tiktok/i.test(h)),
		),
	];
	return { navLinks, footerLinks, email, socials };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function extractVideos(content: HTMLElement, rawHtml: string): VideoRef[] {
	const found = new Map<string, VideoRef>();
	const add = (provider: VideoRef['provider'], id: string) =>
		found.set(`${provider}:${id}`, { provider, id });

	for (const iframe of content.querySelectorAll('iframe[src]')) {
		const src = iframe.getAttribute('src') ?? '';
		const yt = /youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/.exec(src);
		const vm = /player\.vimeo\.com\/video\/(\d+)/.exec(src);
		if (yt?.[1]) add('youtube', yt[1]);
		if (vm?.[1]) add('vimeo', vm[1]);
	}
	// Framer's Vimeo component may only expose the URL in its hydration props.
	for (const m of rawHtml.matchAll(/(?:player\.vimeo\.com\/video\/|vimeo\.com\/)(\d{6,})/g)) {
		if (m[1]) add('vimeo', m[1]);
	}
	return [...found.values()];
}

function extractBlocks(content: HTMLElement, pageUrl: string): TextBlock[] {
	const blocks: TextBlock[] = [];
	const walk = (el: HTMLElement) => {
		for (const child of el.childNodes) {
			if (child.nodeType !== 1) continue;
			const node = child as HTMLElement;
			const tag = node.tagName?.toLowerCase();
			if (tag && TEXT_TAGS.has(tag)) {
				const text = clean(node.text);
				if (text) {
					const links = node.querySelectorAll('a[href]').map((a) => ({
						text: clean(a.text),
						href: normaliseHref(a.getAttribute('href') ?? '', pageUrl),
					}));
					blocks.push({ tag, text, links });
				}
				continue; // don't descend into p/li/h* (avoids nested duplicates)
			}
			walk(node);
		}
	};
	walk(content);
	return blocks;
}

function extractImages(content: HTMLElement): ImageRef[] {
	const seen = new Set<string>();
	const images: ImageRef[] = [];
	for (const img of content.querySelectorAll('img[src]')) {
		const src = stripQuery(img.getAttribute('src') ?? '');
		// Skip video thumbnails (the video itself is recorded in `videos`).
		if (!src || seen.has(src) || /ytimg\.com|vimeocdn\.com/.test(src)) continue;
		seen.add(src);
		const width = Number(img.getAttribute('width')) || undefined;
		const height = Number(img.getAttribute('height')) || undefined;
		images.push({
			src,
			width,
			height,
			alt: clean(img.getAttribute('alt') ?? ''),
			order: images.length,
		});
	}
	return images;
}

/** Text of the first text node inside a `data-framer-name="<name>"` element. */
function namedField(content: HTMLElement, names: string[]): string | undefined {
	for (const name of names) {
		const el = content.querySelector(`[data-framer-name="${name}"]`);
		const text = el ? clean(el.text) : '';
		if (text) return text;
	}
	return undefined;
}

export function parsePage(html: string, pageUrl: string): PageRecord {
	const root = parseHtml(html);
	const path = normaliseHref(pageUrl, pageUrl);

	const pageMeta = {
		title: clean(root.querySelector('title')?.text ?? ''),
		description: meta(root, 'meta[name="description"]'),
		ogImage: meta(root, 'meta[property="og:image"]'),
	};

	removeHiddenVariants(root);
	const content = root.querySelector('#main') ?? root;
	for (const el of content.querySelectorAll('nav, footer')) el.remove();

	const blocks = extractBlocks(content, pageUrl);
	const headings = blocks
		.filter((b) => /^h[1-6]$/.test(b.tag))
		.map((b) => ({ level: Number(b.tag.slice(1)), text: b.text }));

	const anchors = content.querySelectorAll('a[href]').map((a) => ({
		text: clean(a.text),
		href: normaliseHref(a.getAttribute('href') ?? '', pageUrl),
	}));

	const internal = [...new Set(anchors.map((a) => a.href).filter(isInternal))];
	const external = [...new Set(anchors.map((a) => a.href).filter((h) => !isInternal(h)))];

	const findNav = (re: RegExp) => anchors.find((a) => re.test(a.text) && isInternal(a.href))?.href;

	return {
		url: pageUrl,
		path,
		type: classify(path),
		meta: pageMeta,
		headings,
		blocks,
		images: extractImages(content),
		videos: extractVideos(content, html),
		links: { internal, external },
		nav: {
			previous: findNav(/^prev(ious)?$/i),
			next: findNav(/^next$/i),
			index: findNav(/all projects|\+ projects/i),
		},
		fields: projectFields(namedField(content, ['Client'])),
	};
}

/**
 * Framer's "Client" slot holds either `Client: ARTE Studio` or a category
 * label such as `Personal Project`.
 */
function projectFields(raw: string | undefined): PageRecord['fields'] {
	if (!raw) return {};
	const m = /^client\s*:\s*(.+)$/i.exec(raw);
	return m?.[1] ? { client: m[1] } : { category: raw };
}
