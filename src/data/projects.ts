export type ProjectSection = 'illustration' | 'animation';

export type Project = {
	slug: string;
	section: ProjectSection;
	title: string;
	summary: string;
	client?: string;
	year?: string;
	category: string;
	featured?: boolean;
	order: number;
	mediaPlaceholders: Array<{
		tone: string;
		aspectRatio: string;
		label: string;
	}>;
};

const titleFromSlug = (slug: string) =>
	slug
		.split('-')
		.map((word) => {
			if (word === 'lt') return 'LT';
			if (word === 'esiwace') return 'ESiWACE';
			if (word === 'cliccs') return 'CLICCS';
			if (word === '90') return "90's";
			return word.charAt(0).toUpperCase() + word.slice(1);
		})
		.join(' ')
		.replace('Vs.', 'vs.')
		.replace('D En', "d'en");

const tones = [
	'coral',
	'ink',
	'mint',
	'rose',
	'sky',
	'lemon',
	'violet',
	'clay',
	'olive',
	'powder',
] as const;

const aspectRatios = ['4 / 5', '1 / 1', '5 / 4', '3 / 4', '16 / 11'] as const;

const makeProject = (
	section: ProjectSection,
	slug: string,
	order: number,
	options: Partial<Project> = {},
): Project => {
	const title = options.title ?? titleFromSlug(slug);

	return {
		slug,
		section,
		title,
		summary:
			options.summary ??
			`A placeholder case study for ${title}, ready to be replaced with the final artwork, captions and project notes.`,
		client: options.client,
		year: options.year,
		category: options.category ?? (section === 'illustration' ? 'Illustration' : 'Animation'),
		featured: options.featured,
		order,
		mediaPlaceholders:
			options.mediaPlaceholders ??
			Array.from({ length: section === 'illustration' ? 5 : 4 }, (_, index) => ({
				tone: tones[(order + index) % tones.length],
				aspectRatio: aspectRatios[(order + index) % aspectRatios.length],
				label: `${title} ${index + 1}`,
			})),
	};
};

export const projects: Project[] = [
	makeProject('illustration', 'cicle-festiu-de-sant-antoni', 1, {
		title: 'Cicle Festiu de Sant Antoni',
		featured: true,
		category: 'Editorial illustration',
	}),
	makeProject('illustration', 'illustrated-affirmations', 2, {
		featured: true,
		category: 'Illustrated series',
	}),
	makeProject('illustration', 'creativity', 3, { featured: true }),
	makeProject('illustration', 'maduixes-nabius-i-gerds', 4, {
		title: 'Maduixes, Nabius i Gerds',
		featured: true,
		category: 'Book illustration',
	}),
	makeProject('illustration', 'arbeitswelt-der-zukunft', 5),
	makeProject('illustration', 'fly-again', 6),
	makeProject('illustration', '2023-calendar', 7, { title: '2023 Calendar' }),
	makeProject('illustration', 'my-fair-money-podcast', 8),
	makeProject('illustration', 'organic-cosmetics', 9),
	makeProject('illustration', 'the-power-of-feminism', 10),
	makeProject('illustration', 'depression', 11),
	makeProject('illustration', 'every-day-joy-in-motion', 12, { featured: true }),
	makeProject('illustration', 'passport-to-value', 13, { featured: true }),
	makeProject('illustration', 'homeoffice', 14, { title: 'Homeoffice' }),
	makeProject('illustration', 'cozy-cafe', 15, { featured: true }),
	makeProject('illustration', 'seasons', 16),
	makeProject('illustration', 'beauty-privilege', 17),
	makeProject('illustration', 'digitalized-travelling', 18),
	makeProject('illustration', 'escola-inclusiva', 19),
	makeProject('illustration', 'juice-shop', 20),
	makeProject('illustration', 'the-animal-in-me', 21),
	makeProject('illustration', 'decoding-brain-signals', 22),
	makeProject('illustration', '90-s-childhood', 23, {
		title: "90's Childhood",
		featured: true,
	}),
	makeProject('illustration', 'flamenco-series', 24, { featured: true }),
	makeProject('illustration', 'les-aventures-d-en-plomet', 25, {
		title: "Les Aventures d'en Plomet",
		category: 'Children book',
	}),
	makeProject('illustration', 'christmas-time', 26),
	makeProject('illustration', 'inclusion-europe', 27),
	makeProject('illustration', 'the-feminism-mirror', 28),
	makeProject('illustration', 'time-for-me', 29),
	makeProject('illustration', 'urban-fashion', 30),
	makeProject('illustration', 'vaccine-fuelled-by-money', 31),
	makeProject('illustration', 'love-vs.-time', 32, { title: 'Love vs. Time' }),
	makeProject('animation', 'las-doce-uvas', 1, {
		title: 'Las Doce Uvas',
		featured: true,
		category: 'Animation',
	}),
	makeProject('animation', 'machine-learning', 2, { featured: true }),
	makeProject('animation', 'esiwace', 3, { title: 'ESiWACE', featured: true }),
	makeProject('animation', 'portals', 4, { featured: true }),
	makeProject('animation', 'daily-dogs', 5),
	makeProject('animation', 'warm-world', 6),
	makeProject('animation', 'lt-climate', 7, { title: 'LT Climate' }),
	makeProject('animation', 'las-croquetas', 8, { title: 'Las Croquetas', featured: true }),
	makeProject('animation', 'weather-generator', 9, { featured: true }),
	makeProject('animation', 'roadtrip', 10),
	makeProject('animation', 'eve-project', 11, { title: 'EVE Project' }),
	makeProject('animation', 'cliccs', 12, { title: 'CLICCS' }),
	makeProject('animation', 'lt-app-by-latest-thinking', 13, {
		title: 'LT App by Latest Thinking',
	}),
	makeProject('animation', 'lt-publication', 14, { title: 'LT Publication' }),
];

export const getProjectsBySection = (section: ProjectSection) =>
	projects.filter((project) => project.section === section).sort((a, b) => a.order - b.order);

export const getFeaturedProjects = () =>
	projects.filter((project) => project.featured).sort((a, b) => a.order - b.order).slice(0, 14);

export const getProjectBySlug = (section: ProjectSection, slug: string) =>
	projects.find((project) => project.section === section && project.slug === slug);
