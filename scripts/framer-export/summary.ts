import type { Inventory, PageRecord, PageType } from './types.ts';

const slugOf = (p: PageRecord) => p.path.split('/').filter(Boolean).at(-1) ?? '';

/** Lowercase, alphanumeric-only version of a string, for loose comparisons. */
const loose = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** The project title on Framer project pages is the first h2 (h1 is the section label). */
const titleOf = (p: PageRecord) =>
	p.headings.find((h) => h.level === 2)?.text ?? p.headings[0]?.text ?? '';

const isProject = (p: PageRecord) =>
	p.type === 'illustration-project' || p.type === 'animation-project' || p.type === 'case-study';

function table(rows: string[][]): string {
	const [head, ...body] = rows;
	if (!head) return '';
	return [
		`| ${head.join(' | ')} |`,
		`| ${head.map(() => '---').join(' | ')} |`,
		...body.map((r) => `| ${r.join(' | ')} |`),
	].join('\n');
}

export function buildSummary(inv: Inventory, sitemapUrls: string[]): string {
	const { pages } = inv;
	const out: string[] = [];
	const paths = new Set(pages.map((p) => p.path));

	out.push(
		`# Framer inventory summary`,
		'',
		`Source: ${inv.source} · generated ${inv.generatedAt}`,
		'',
	);
	out.push(`Sitemap URLs: **${sitemapUrls.length}** · pages parsed: **${pages.length}**`, '');

	// --- Counts by type --------------------------------------------------------
	const byType = new Map<PageType, PageRecord[]>();
	for (const p of pages) byType.set(p.type, [...(byType.get(p.type) ?? []), p]);
	out.push('## Pages by type', '');
	out.push(
		table([
			['Type', 'Count', 'Paths'],
			...[...byType.entries()]
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([type, list]) => [
					type,
					String(list.length),
					list.map((p) => `\`${p.path}\``).join(', '),
				]),
		]),
		'',
	);

	// --- Projects overview ----------------------------------------------------
	const projects = pages.filter(isProject);
	out.push('## Projects', '');
	out.push(
		table([
			['Path', 'Title', 'Client / category', 'Images', 'Videos', 'External links', 'Prev / next'],
			...projects.map((p) => [
				`\`${p.path}\``,
				titleOf(p),
				p.fields.client ? `client: ${p.fields.client}` : (p.fields.category ?? ''),
				String(p.images.length),
				p.videos.map((v) => `${v.provider}:${v.id}`).join(' ') || '-',
				String(p.links.external.length),
				`${p.nav.previous ? '←' : '·'} ${p.nav.next ? '→' : '·'}`,
			]),
		]),
		'',
	);

	// --- Anomalies -------------------------------------------------------------
	const anomalies: string[] = [];

	for (const p of projects) {
		const title = titleOf(p);
		if (
			title &&
			!loose(title).includes(loose(slugOf(p)).slice(0, 6)) &&
			!loose(slugOf(p)).includes(loose(title).slice(0, 6))
		) {
			anomalies.push(`**Title/slug mismatch:** \`${p.path}\` is titled "${title}"`);
		}
		if (p.images.length === 0 && p.videos.length === 0) {
			anomalies.push(`**No media:** \`${p.path}\` has no images or videos`);
		}
		if (p.type === 'animation-project') {
			const ext = p.links.external.filter(
				(h) => !/instagram|linkedin|behance|vimeo\.com\/marinalabella/.test(h),
			);
			if (p.videos.length === 0) {
				const gifs = p.images.filter((i) => i.src.endsWith('.gif')).length;
				anomalies.push(
					`**Animation without embedded video:** \`${p.path}\`` +
						(gifs ? ` (shown as ${gifs} GIF${gifs > 1 ? 's' : ''})` : '') +
						(ext.length ? ` (links out to ${ext.join(', ')})` : ''),
				);
			} else if (ext.length) {
				anomalies.push(`**Animation also links out:** \`${p.path}\` → ${ext.join(', ')}`);
			}
		}
		if (!p.nav.previous && !p.nav.next) anomalies.push(`**No prev/next:** \`${p.path}\``);
	}

	const brokenByTarget = new Map<string, string[]>();
	for (const p of pages) {
		if (/[^a-z0-9\-/]/.test(p.path)) anomalies.push(`**Unusual characters in URL:** \`${p.path}\``);
		for (const link of p.links.internal) {
			if (!paths.has(link) && !link.startsWith('/#')) {
				brokenByTarget.set(link, [...(brokenByTarget.get(link) ?? []), p.path]);
			}
		}
	}
	for (const [target, from] of brokenByTarget) {
		const why = /\/:[\w]+/.test(target)
			? " (unresolved Framer CMS variable in the server HTML; Framer's JS fixes it in the browser)"
			: '';
		anomalies.push(
			`**Broken internal link** \`${target}\`${why}, found on ${from.length} page(s): ${from.map((x) => `\`${x}\``).join(', ')}`,
		);
	}

	const allImages = pages.flatMap((p) => p.images);
	const missingAlt = allImages.filter((i) => !i.alt).length;
	if (missingAlt) {
		const withAlt = pages.filter((p) => p.images.some((i) => i.alt)).map((p) => `\`${p.path}\``);
		anomalies.push(
			`**Missing alt text:** ${missingAlt} of ${allImages.length} image references have no alt` +
				(withAlt.length ? `. Only these pages have any: ${withAlt.join(', ')}` : ''),
		);
	}

	// Same project listed in several sections (same slug stem in different paths).
	const stems = new Map<string, string[]>();
	for (const p of projects) {
		const stem = loose(slugOf(p)).replace(/(branding|campaign|festival)$/, '');
		stems.set(stem, [...(stems.get(stem) ?? []), p.path]);
	}
	for (const [, list] of stems) {
		if (list.length > 1)
			anomalies.push(
				`**Same project in several sections:** ${list.map((x) => `\`${x}\``).join(', ')}`,
			);
	}

	const missing = sitemapUrls.filter(
		(u) => !paths.has(new URL(u).pathname.replace(/\/$/, '') || '/'),
	);
	for (const u of missing) anomalies.push(`**Not parsed:** ${u}`);

	out.push(`## Anomalies (${anomalies.length})`, '');
	out.push(...(anomalies.length ? anomalies.map((a) => `- ${a}`) : ['None found.']), '');

	// --- Site chrome -----------------------------------------------------------
	out.push('## Site chrome (nav / footer)', '');
	out.push(`- Email: ${inv.siteChrome.email ?? '(not found)'}`);
	out.push(`- Socials: ${inv.siteChrome.socials.join(', ') || '(none)'}`);
	out.push(
		`- Nav: ${inv.siteChrome.navLinks.map((l) => `${l.text || '(icon)'} → \`${l.href}\``).join(', ')}`,
		'',
	);

	return out.join('\n');
}
