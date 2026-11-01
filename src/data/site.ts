import type { IconName } from '../components/Icon.astro';

export interface NavLink {
	url: string;
	label: string;
}

export interface SocialLink extends NavLink {
	icon: IconName;
}

export const EMAIL = 'marinaf.labella@gmail.com';

export const nav: NavLink[] = [
	{
		label: 'Home',
		url: '/',
	},
	{
		label: 'Services',
		url: '/services',
	},
	{
		label: 'Illustration',
		url: '/illustration',
	},
	{
		label: 'Animation',
		url: '/animation',
	},
	{
		label: 'About',
		url: '/about-contact',
	},
];

export const socials: SocialLink[] = [
	{
		label: 'Instagram',
		url: 'https://www.instagram.com/_marinalabella',
		icon: 'instagram',
	},
	{
		label: 'LinkedIn',
		url: 'https://www.linkedin.com/in/marinalabella/',
		icon: 'linkedin',
	},
	{
		label: 'Vimeo',
		url: 'https://vimeo.com/marinalabella',
		icon: 'vimeo',
	},
	{
		label: 'Behance',
		url: 'https://www.behance.net/marinalabella',
		icon: 'behance',
	},
];
