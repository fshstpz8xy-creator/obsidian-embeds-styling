export interface LucideIcon {
	name: string;
	category: string;
	svg: string;
	keywords: string[];
}

export const LUCIDE_ICONS: LucideIcon[] = [
	{
		name: "Book",
		category: "Documents",
		svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',
		keywords: ["statute", "code", "law"]
	},
	{
		name: "Gavel",
		category: "Legal",
		svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg>',
		keywords: ["hammer", "law", "rule"]
	},
	{
		name: "Graduation Cap",
		category: "Education",
		svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
		keywords: ["education", "school", "class", "lecture"]
	}
];

export function searchIcons(query: string): LucideIcon[] {
	const lowerQuery = query.toLowerCase();
	return LUCIDE_ICONS.filter(icon =>
		icon.name.toLowerCase().includes(lowerQuery) ||
		icon.keywords.some(keyword => keyword.includes(lowerQuery))
	);
}

export function getAllCategories(): string[] {
	return Array.from(new Set(LUCIDE_ICONS.map(icon => icon.category))).sort();
}
