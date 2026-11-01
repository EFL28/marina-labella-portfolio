// Shapes produced by the Framer inventory script (spec 001).

export type PageType =
	| 'home'
	| 'illustration-index'
	| 'illustration-project'
	| 'animation-index'
	| 'animation-project'
	| 'services-index'
	| 'service-landing'
	| 'case-study'
	| 'about'
	| 'other';

export type InlineLink = { text: string; href: string };

export type TextBlock = {
	tag: string;
	text: string;
	links: InlineLink[];
};

export type ImageRef = {
	src: string;
	width?: number;
	height?: number;
	alt: string;
	order: number;
};

export type VideoRef = { provider: 'vimeo' | 'youtube'; id: string };

export type PageRecord = {
	url: string;
	path: string;
	type: PageType;
	meta: { title: string; description?: string; ogImage?: string };
	headings: { level: number; text: string }[];
	blocks: TextBlock[];
	images: ImageRef[];
	videos: VideoRef[];
	links: { internal: string[]; external: string[] };
	nav: { previous?: string; next?: string; index?: string };
	fields: { client?: string; category?: string };
};

export type SiteChrome = {
	navLinks: InlineLink[];
	footerLinks: InlineLink[];
	email?: string;
	socials: string[];
};

export type Inventory = {
	source: string;
	generatedAt: string;
	pageCount: number;
	siteChrome: SiteChrome;
	pages: PageRecord[];
};
