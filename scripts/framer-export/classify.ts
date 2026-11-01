import type { PageType } from './types.ts';

const SERVICE_LANDINGS = new Set(['branding-packaging', 'advertising', 'science-communication']);

/** Infers the page type from its path (e.g. `/illustration/cozy-cafe`). */
export function classify(path: string): PageType {
	const segments = path.split('/').filter(Boolean);
	const [first, second] = segments;

	if (segments.length === 0) return 'home';
	if (first === 'about-contact') return 'about';

	if (first === 'illustration') return second ? 'illustration-project' : 'illustration-index';
	if (first === 'animation') return second ? 'animation-project' : 'animation-index';
	if (first === 'services') return second ? 'case-study' : 'services-index';

	if (SERVICE_LANDINGS.has(first)) return 'service-landing';
	return 'other';
}
