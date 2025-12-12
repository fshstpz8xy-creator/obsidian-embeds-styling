import { App, Plugin, PluginSettingTab, Setting, Notice } from 'obsidian';
import { IconPickerModal } from './icon-picker-modal';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface EmbedRule {
	id: string;
	name: string;
	pattern: string;
	enabled: boolean;
	// Style mode: custom or callout-pinned
	styleMode: 'custom' | 'callout';
	// Custom styling fields
	color: string;
	icon: string;
	iconType: 'svg' | 'emoji';
	// Callout-pinned styling fields
	calloutType?: string;
	customLabel?: string; // Optional custom label text for callout badge
	// Link highlighting
	highlightLinks?: boolean; // Enable badge-style highlighting for matching normal links
}

// ============================================================================
// CALLOUT DEFINITIONS
// Maps callout types to their color variables and labels
// ============================================================================

interface CalloutDefinition {
	color: string;           // CSS color variable or raw RGB
	label: string;           // Tag label text
	textColor?: string;      // Optional override for text color (e.g., dark text on yellow)
	displayName: string;     // User-friendly name for dropdown
	icon: string;            // SVG icon for the tag
}

// Lucide icons for callout types
const CALLOUT_ICONS = {
	scale: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>',
	bookOpen: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
	checkCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
	target: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
	scroll: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/></svg>',
	library: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg>',
	fileText: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>',
	landmark: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>',
	lightbulb: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
	messageSquare: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
	clipboardList: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>',
	listChecks: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>',
	shield: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
	gavel: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/></svg>',
	book: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',
	graduationCap: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>'
};

const CALLOUT_DEFINITIONS: Record<string, CalloutDefinition> = {
	rule: {
		color: 'var(--color-blue-rgb)',
		label: 'Rule',
		displayName: 'Rule (Blue)',
		icon: CALLOUT_ICONS.gavel
	},
	case: {
		color: 'var(--color-purple-rgb)',
		label: 'Case',
		displayName: 'Case / Precedent (Purple)',
		icon: CALLOUT_ICONS.bookOpen
	},
	apply: {
		color: 'var(--color-green-rgb)',
		label: 'Apply',
		displayName: 'Apply / Application (Green)',
		icon: CALLOUT_ICONS.checkCircle
	},
	holding: {
		color: 'var(--color-yellow-rgb)',
		label: 'Holding',
		textColor: '#1a1a1a',
		displayName: 'Holding (Yellow)',
		icon: CALLOUT_ICONS.target
	},
	constitution: {
		color: 'var(--color-red-rgb)',
		label: 'Const.',
		displayName: 'Constitution (Red)',
		icon: CALLOUT_ICONS.landmark
	},
	usc: {
		color: 'var(--color-red-rgb)',
		label: 'U.S.C.',
		displayName: 'U.S. Code (Red)',
		icon: CALLOUT_ICONS.scroll
	},
	restatement: {
		color: 'var(--color-purple-rgb)',
		label: 'Rst.',
		displayName: 'Restatement (Purple)',
		icon: CALLOUT_ICONS.library
	},
	frcp: {
		color: 'var(--color-cyan-rgb)',
		label: 'FRCP',
		displayName: 'FRCP (Cyan)',
		icon: CALLOUT_ICONS.fileText
	},
	fre: {
		color: 'var(--color-cyan-rgb)',
		label: 'FRE',
		displayName: 'FRE (Cyan)',
		icon: CALLOUT_ICONS.fileText
	},
	statute: {
		color: 'var(--color-pink-rgb)',
		label: 'Statute',
		displayName: 'Statute (Pink)',
		icon: CALLOUT_ICONS.scroll
	},
	hypo: {
		color: 'var(--color-orange-rgb)',
		label: 'Hypo',
		displayName: 'Hypo (Orange)',
		icon: CALLOUT_ICONS.lightbulb
	},
	dissent: {
		color: '100, 116, 139',  // Raw RGB for slate gray
		label: 'Dissent',
		displayName: 'Dissent (Gray)',
		icon: CALLOUT_ICONS.messageSquare
	},
	concurrence: {
		color: 'var(--color-purple-rgb)',
		label: 'Concur',
		displayName: 'Concurrence (Purple)',
		icon: CALLOUT_ICONS.messageSquare
	},
	test: {
		color: 'var(--color-pink-rgb)',
		label: 'Test',
		displayName: 'Test (Pink)',
		icon: CALLOUT_ICONS.clipboardList
	},
	elements: {
		color: 'var(--color-cyan-rgb)',
		label: 'Elements',
		displayName: 'Elements (Cyan)',
		icon: CALLOUT_ICONS.listChecks
	},
	defense: {
		color: 'var(--color-red-rgb)',
		label: 'Defense',
		displayName: 'Defense (Red)',
		icon: CALLOUT_ICONS.shield
	},
	'book-notes': {
		color: '0, 0, 0',  // Black
		label: 'Book',
		displayName: 'Book Notes (Black)',
		icon: CALLOUT_ICONS.book
	},
	'class-notes': {
		color: '0, 0, 0',  // Black
		label: 'Class',
		displayName: 'Class Notes (Black)',
		icon: CALLOUT_ICONS.graduationCap
	}
};

interface EmbedStyleSettings {
	rules: EmbedRule[];
	borderSettings: {
		outerWidth: number;
		outerColor: string;
		outerOpacity: number;
		leftWidth: number;
		showLeft: boolean;
		showRight: boolean;
		showTop: boolean;
		showBottom: boolean;
		radius: number;
	};
	paddingSettings: {
		top: number;
		side: number;
		bottom: number;
	};
}

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

const DEFAULT_SETTINGS: EmbedStyleSettings = {
	rules: [
		{
			id: 'usc',
			name: 'U.S. Code',
			pattern: 'U\\.S\\.\\s*Code|U\\.S\\.C\\.',
			enabled: true,
			styleMode: 'callout',
			calloutType: 'usc',
			color: '#b91c1c',
			icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M15 8h-5"/><path d="M15 12h-5"/></svg>',
			iconType: 'svg'
		},
		{
			id: 'rule',
			name: 'Rule',
			pattern: 'Rule',
			enabled: true,
			styleMode: 'callout',
			calloutType: 'rule',
			color: '#2563eb',
			icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg>',
			iconType: 'svg'
		},
		{
			id: 'constitution',
			name: 'Constitution',
			pattern: 'Article|Amendment|Constitution',
			enabled: true,
			styleMode: 'callout',
			calloutType: 'constitution',
			color: '#dc2626',
			icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.67 19a2 2 0 0 0 1.416-.588l6.154-6.172a6 6 0 0 0-8.49-8.49L5.586 9.914A2 2 0 0 0 5 11.328V18a1 1 0 0 0 1 1z"/><path d="M16 8 2 22"/><path d="M17.5 15H9"/></svg>',
			iconType: 'svg'
		},
		{
			id: 'book-notes',
			name: 'Book Notes',
			pattern: 'book-notes',
			enabled: true,
			styleMode: 'callout',
			calloutType: 'book-notes',
			color: '#000000',
			icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',
			iconType: 'svg'
		},
		{
			id: 'class-notes',
			name: 'Class Notes',
			pattern: 'class-notes',
			enabled: true,
			styleMode: 'callout',
			calloutType: 'class-notes',
			color: '#000000',
			icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
			iconType: 'svg'
		}
	],
	borderSettings: {
		outerWidth: 1,
		outerColor: '#000000',
		outerOpacity: 0.5,
		leftWidth: 4,
		showLeft: true,
		showRight: false,
		showTop: false,
		showBottom: false,
		radius: 0
	},
	paddingSettings: {
		top: 0.25,
		side: 0.5,
		bottom: 1
	}
};

// ============================================================================
// MAIN PLUGIN CLASS
// ============================================================================

export default class RegexEmbedStylingPlugin extends Plugin {
	settings: EmbedStyleSettings;
	observer: MutationObserver;

	async onload() {
		await this.loadSettings();

		// Write CSS to snippets folder
		await this.updateStyles();

		// Set up mutation observer to watch for embeds
		this.setupObserver();

		// Process existing embeds
		this.processExistingEmbeds();

		// Add settings tab
		this.addSettingTab(new RegexEmbedSettingTab(this.app, this));

		// Add command to regenerate CSS
		this.addCommand({
			id: 'regenerate-css',
			name: 'Regenerate CSS',
			callback: async () => {
				await this.updateStyles();
				new Notice('Regex Embed Styling: CSS regenerated!');
			}
		});
	}

	onunload() {
		// Clean up observer
		if (this.observer) {
			this.observer.disconnect();
		}

		// Remove classes from embeds
		document.querySelectorAll('.markdown-embed[data-embed-rule]').forEach(el => {
			el.removeAttribute('data-embed-rule');
			el.classList.remove('regex-embed-styled');
		});

		// Note: CSS snippet file remains in .obsidian/snippets/ for user to manage
	}

	async loadSettings() {
		const savedData = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, savedData);

		// Migrate existing rules without styleMode to 'custom' for backwards compatibility
		if (savedData?.rules) {
			this.settings.rules = savedData.rules.map((rule: Partial<EmbedRule>) => ({
				...rule,
				styleMode: rule.styleMode || 'custom',
				calloutType: rule.calloutType || undefined
			})) as EmbedRule[];
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.updateStyles();
		this.processExistingEmbeds();
	}

	// ========================================================================
	// EMBED PROCESSING
	// ========================================================================

	setupObserver() {
		this.observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				mutation.addedNodes.forEach((node) => {
					if (node instanceof HTMLElement) {
						// Process embeds
						if (node.classList.contains('markdown-embed')) {
							this.processEmbed(node);
						}
						node.querySelectorAll('.markdown-embed').forEach((embed) => {
							this.processEmbed(embed as HTMLElement);
						});

						// Process links
						if (node.classList.contains('internal-link')) {
							this.processLink(node);
						}
						node.querySelectorAll('.internal-link').forEach((link) => {
							this.processLink(link as HTMLElement);
						});
					}
				});
			});
		});

		this.observer.observe(document.body, {
			childList: true,
			subtree: true
		});
	}

	processExistingEmbeds() {
		document.querySelectorAll('.markdown-embed').forEach((embed) => {
			this.processEmbed(embed as HTMLElement);
		});
	}

	processExistingLinks() {
		document.querySelectorAll('.internal-link').forEach((link) => {
			this.processLink(link as HTMLElement);
		});
	}

	/**
	 * Check if embed should be excluded from styling based on metadata flag.
	 * Supports ![[link|plain]] syntax (case-insensitive).
	 */
	shouldExcludeEmbed(embed: HTMLElement): boolean {
		// Primary check: Look for data-plain attribute that we set ourselves
		if (embed.hasAttribute('data-plain')) {
			return true;
		}

		// Check src attribute for |plain suffix
		const src = embed.getAttribute('src');
		if (src && src.toLowerCase().includes('|plain')) {
			// Mark this embed for future quick checks
			embed.setAttribute('data-plain', 'true');
			return true;
		}

		// Check alt attribute (Obsidian may store display text here)
		const alt = embed.getAttribute('alt');
		if (alt && alt.toLowerCase().trim() === 'plain') {
			embed.setAttribute('data-plain', 'true');
			return true;
		}

		// Check for markdown-embed-link element with display text
		const embedLink = embed.querySelector('.markdown-embed-link');
		if (embedLink) {
			const linkText = embedLink.textContent?.toLowerCase().trim();
			if (linkText === 'plain') {
				embed.setAttribute('data-plain', 'true');
				return true;
			}
		}

		// Check for internal-embed link with aria-label
		const internalLink = embed.querySelector('.internal-embed');
		if (internalLink) {
			const ariaLabel = internalLink.getAttribute('aria-label');
			if (ariaLabel && ariaLabel.toLowerCase().includes('|plain')) {
				embed.setAttribute('data-plain', 'true');
				return true;
			}
		}

		return false;
	}

	/**
	 * Ensure embed has a title element for badge display.
	 * Creates one if missing (for block/heading embeds).
	 */
	ensureEmbedTitle(embed: HTMLElement): HTMLElement | null {
		let title = embed.querySelector('.markdown-embed-title') as HTMLElement;

		if (!title) {
			// Check if this embed has content (block/heading embeds do)
			const content = embed.querySelector('.markdown-embed-content');
			if (!content) return null;

			// Create title element
			title = document.createElement('div');
			title.className = 'markdown-embed-title';

			// Insert before content
			content.parentElement?.insertBefore(title, content);
		}

		return title;
	}

	processEmbed(embed: HTMLElement) {
		const src = embed.getAttribute('src');
		if (!src) return;

		// Check if embed should be excluded from styling
		if (this.shouldExcludeEmbed(embed)) {
			embed.removeAttribute('data-embed-rule');
			embed.classList.remove('regex-embed-styled');
			// Remove any injected title if present
			const injectedTitle = embed.querySelector('.markdown-embed-title:empty');
			if (injectedTitle && !injectedTitle.hasChildNodes()) {
				injectedTitle.remove();
			}
			return;
		}

		embed.removeAttribute('data-embed-rule');
		embed.classList.remove('regex-embed-styled');

		for (const rule of this.settings.rules) {
			if (!rule.enabled) continue;

			try {
				const regex = new RegExp(rule.pattern, 'i');
				if (regex.test(src)) {
					embed.setAttribute('data-embed-rule', rule.id);
					embed.classList.add('regex-embed-styled');

					// Ensure title element exists for badge display
					this.ensureEmbedTitle(embed);
					break;
				}
			} catch (e) {
				console.error(`Invalid regex pattern for rule "${rule.name}":`, e);
			}
		}
	}

	processLink(link: HTMLElement) {
		// Skip if this is a transclusion link (embed)
		const href = link.getAttribute('href') || link.getAttribute('data-href') || '';
		if (!href || href.startsWith('!')) return;

		// Remove any previous styling
		link.removeAttribute('data-link-rule');
		link.classList.remove('regex-link-styled');

		// Check against enabled rules with link highlighting enabled
		for (const rule of this.settings.rules) {
			if (!rule.enabled || !rule.highlightLinks) continue;

			try {
				const regex = new RegExp(rule.pattern, 'i');
				if (regex.test(href)) {
					link.setAttribute('data-link-rule', rule.id);
					link.classList.add('regex-link-styled');
					break;
				}
			} catch (e) {
				console.error(`Invalid regex pattern for rule "${rule.name}":`, e);
			}
		}
	}

	// ========================================================================
	// CSS SNIPPET FILE MANAGEMENT
	// ========================================================================

	async updateStyles() {
		const css = await this.generateCSS();
		const snippetPath = '.obsidian/snippets/regex-embed-styling.css';

		// Ensure snippets directory exists
		const snippetsDir = '.obsidian/snippets';
		const adapter = this.app.vault.adapter;

		try {
			// Check if snippets directory exists, create if not
			const dirExists = await adapter.exists(snippetsDir);
			console.log('Regex Embed Styling: Snippets directory exists:', dirExists);

			if (!dirExists) {
				console.log('Regex Embed Styling: Creating snippets directory...');
				await adapter.mkdir(snippetsDir);
			}

			// Write CSS to snippet file
			console.log('Regex Embed Styling: Writing CSS to', snippetPath);
			console.log('Regex Embed Styling: CSS length:', css.length, 'characters');
			await adapter.write(snippetPath, css);

			console.log('Regex Embed Styling: CSS snippet updated successfully at', new Date().toISOString());
			new Notice('Regex Embed Styling: CSS snippet updated! Please enable it in Settings > Appearance > CSS Snippets');
		} catch (error) {
			console.error('Regex Embed Styling: Failed to write CSS snippet', error);
			new Notice('Regex Embed Styling: Failed to write CSS snippet - check console for details');
		}
	}

	async generateCSS(): Promise<string> {
		const adapter = this.app.vault.adapter;
		const baseStylesPath = '.obsidian/plugins/obsidian-embed-styling-plugin/base-styles.css';

		// Read base styles from static file
		let css = '';
		try {
			css = await adapter.read(baseStylesPath);
			console.log('Regex Embed Styling: Loaded base styles from', baseStylesPath);
		} catch (error) {
			console.error('Regex Embed Styling: Failed to read base-styles.css', error);
			css = '/* ERROR: Could not load base-styles.css */\n';
		}

		css += '\n';

		// Generate global border styles
		const borderStyles: string[] = [];
		if (this.settings.borderSettings.showLeft) {
			borderStyles.push(`border-left: ${this.settings.borderSettings.leftWidth}px solid var(--embed-sidebar-color)`);
		}
		if (this.settings.borderSettings.showRight) {
			borderStyles.push(`border-right: ${this.settings.borderSettings.leftWidth}px solid var(--embed-sidebar-color)`);
		}
		if (this.settings.borderSettings.showTop) {
			borderStyles.push(`border-top: ${this.settings.borderSettings.leftWidth}px solid var(--embed-sidebar-color)`);
		}
		if (this.settings.borderSettings.showBottom) {
			borderStyles.push(`border-bottom: ${this.settings.borderSettings.leftWidth}px solid var(--embed-sidebar-color)`);
		}

		if (borderStyles.length > 0 || this.settings.borderSettings.radius > 0) {
			css += `
/* Global border settings */
.markdown-embed.regex-embed-styled::before {
`;
			if (borderStyles.length > 0) {
				css += '\t' + borderStyles.join(';\n\t') + ';\n';
			}
			if (this.settings.borderSettings.radius > 0) {
				css += `\tborder-radius: ${this.settings.borderSettings.radius}px;\n`;
			}
			css += `}
`;
		}

		// Generate CSS for each rule
		for (const rule of this.settings.rules) {
			if (!rule.enabled) continue;

			// Handle callout-pinned mode
			if (rule.styleMode === 'callout' && rule.calloutType && CALLOUT_DEFINITIONS[rule.calloutType]) {
				const callout = CALLOUT_DEFINITIONS[rule.calloutType];
				const colorValue = callout.color.startsWith('var(')
					? `rgb(${callout.color})`
					: `rgb(${callout.color})`;
				const colorValueRgba = callout.color.startsWith('var(')
					? `rgba(${callout.color}, var(--callout-border-opacity, 0.3))`
					: `rgba(${callout.color}, var(--callout-border-opacity, 0.3))`;
				const textColor = callout.textColor || '#fff';

				// Use custom label if set, otherwise use callout's default label
				const badgeLabel = rule.customLabel || callout.label;

				// Background with subtle tint of the callout color
				const bgColorValue = callout.color.startsWith('var(')
					? `rgba(${callout.color}, 0.05)`
					: `rgba(${callout.color}, 0.05)`;

				css += `
/* Rule: ${rule.name} (pinned to callout: ${rule.calloutType}) */
/* Container styling - inherits from callout variables */
.markdown-embed.regex-embed-styled[data-embed-rule="${rule.id}"] {
	--embed-sidebar-color: ${colorValue};
	--callout-color: ${callout.color};
	position: relative;
	border-width: var(--callout-border-width, 1px);
	border-style: solid;
	border-color: ${colorValueRgba};
	border-radius: var(--callout-border-radius, 6px);
	padding: var(--callout-padding, 12px) !important;
	padding-left: calc(var(--callout-padding, 12px) + 8px) !important;
	background-color: ${bgColorValue};
}

/* Left sidebar bar for callout-pinned embed */
.markdown-embed.regex-embed-styled[data-embed-rule="${rule.id}"]::before {
	content: '';
	position: absolute;
	left: 0;
	top: 0;
	bottom: 0;
	width: 4px;
	background-color: ${colorValue};
	border-radius: var(--callout-border-radius, 6px) 0 0 var(--callout-border-radius, 6px);
	z-index: 10;
}

/* Title row container - flexbox layout with positioning context */
.markdown-embed.regex-embed-styled[data-embed-rule="${rule.id}"] .markdown-embed-title {
	display: flex !important;
	flex-direction: row !important;
	flex-wrap: nowrap !important;
	align-items: center !important;
	gap: 10px;
	padding: var(--callout-title-padding, 8px) 0;
	margin: 0;
	background: transparent;
	font-size: var(--callout-title-size, 0.95em);
	font-weight: var(--callout-title-weight, 600);
	font-style: italic;
	color: inherit;
	position: relative !important;
}

/* Tag box with label text and icon as background */
.markdown-embed.regex-embed-styled[data-embed-rule="${rule.id}"] .markdown-embed-title::before {
	content: "${badgeLabel}" !important;
	display: inline-flex !important;
	align-items: center !important;
	flex-shrink: 0 !important;
	order: -1 !important;
	/* Override base-styles.css fixed dimensions */
	width: auto !important;
	height: auto !important;
	min-height: 22px !important;
	line-height: 1.4 !important;
	vertical-align: baseline !important;
	background-color: ${colorValue};
	background-image: url('data:image/svg+xml;utf8,${encodeURIComponent(callout.icon.replace('currentColor', textColor)).replace(/'/g, '%27')}');
	background-repeat: no-repeat !important;
	background-position: calc(100% - 6px) center !important;
	background-size: 12px 12px !important;
	color: ${textColor};
	padding: 4px 28px 4px 10px;
	border-radius: var(--callout-tag-border-radius, 4px);
	border: var(--callout-tag-border-width, 0px) solid currentColor;
	font-size: var(--callout-tag-font-size, 0.7rem) !important;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	font-style: normal;
	white-space: nowrap !important;
	margin-right: 10px;
	box-sizing: border-box;
	/* Reset mask from base styles */
	mask: none !important;
	-webkit-mask: none !important;
}

/* Content padding for embeds without title (block/heading embeds) */
.markdown-embed.regex-embed-styled[data-embed-rule="${rule.id}"]:not(:has(.markdown-embed-title)) .markdown-embed-content {
	padding-top: var(--callout-padding, 8px);
}
`;
			} else {
				// Handle custom mode (original behavior)
				css += `
/* Rule: ${rule.name} */
.markdown-embed.regex-embed-styled[data-embed-rule="${rule.id}"] {
	--embed-sidebar-color: ${rule.color};
}

.markdown-embed.regex-embed-styled[data-embed-rule="${rule.id}"] .markdown-embed-title::before {
`;

				if (rule.iconType === 'svg') {
					const encodedSvg = encodeURIComponent(rule.icon).replace(/'/g, '%27');
					css += `	background-color: currentColor;
	mask-image: url('data:image/svg+xml;utf8,${encodedSvg}');
	mask-size: contain;
	mask-repeat: no-repeat;
	mask-position: center;
`;
				} else {
					css += `	content: '${rule.icon}';
	background: none;
	mask: none;
`;
				}

				css += `}
`;
			}

			// Generate link highlighting CSS if enabled for this rule
			if (rule.highlightLinks) {
				// Handle callout-pinned mode for links
				if (rule.styleMode === 'callout' && rule.calloutType && CALLOUT_DEFINITIONS[rule.calloutType]) {
					const callout = CALLOUT_DEFINITIONS[rule.calloutType];
					const colorValue = callout.color.startsWith('var(')
						? `rgb(${callout.color})`
						: `rgb(${callout.color})`;
					const textColor = callout.textColor || '#fff';

					css += `
/* Link highlighting: ${rule.name} */
.internal-link.regex-link-styled[data-link-rule="${rule.id}"] {
	background-color: ${colorValue};
	color: ${textColor};
	padding: 2px 8px;
	padding-left: 24px;
	border-radius: 4px;
	text-decoration: none;
	font-weight: 600;
	white-space: nowrap;
	display: inline-block;
	position: relative;
}

.internal-link.regex-link-styled[data-link-rule="${rule.id}"]::before {
	content: '';
	position: absolute;
	left: 6px;
	top: 50%;
	transform: translateY(-50%);
	width: 14px;
	height: 14px;
	background-image: url('data:image/svg+xml;utf8,${encodeURIComponent(callout.icon.replace('currentColor', textColor)).replace(/'/g, '%27')}');
	background-repeat: no-repeat;
	background-position: center;
	background-size: contain;
}

.internal-link.regex-link-styled[data-link-rule="${rule.id}"]:hover {
	opacity: 0.9;
	filter: brightness(1.1);
}
`;
				} else {
					// Custom mode link highlighting
					css += `
/* Link highlighting: ${rule.name} */
.internal-link.regex-link-styled[data-link-rule="${rule.id}"] {
	background-color: ${rule.color};
	color: #fff;
	padding: 2px 8px;
	padding-left: ${rule.iconType === 'svg' ? '24px' : '26px'};
	border-radius: 4px;
	text-decoration: none;
	font-weight: 600;
	white-space: nowrap;
	display: inline-block;
	position: relative;
}

.internal-link.regex-link-styled[data-link-rule="${rule.id}"]::before {
`;

					if (rule.iconType === 'svg') {
						css += `	content: '';
	position: absolute;
	left: 6px;
	top: 50%;
	transform: translateY(-50%);
	width: 14px;
	height: 14px;
	background-color: #fff;
	mask-image: url('data:image/svg+xml;utf8,${encodeURIComponent(rule.icon).replace(/'/g, '%27')}');
	mask-size: contain;
	mask-repeat: no-repeat;
	mask-position: center;
`;
					} else {
						css += `	content: '${rule.icon}';
	position: absolute;
	left: 6px;
	top: 50%;
	transform: translateY(-50%);
	font-size: 14px;
	line-height: 1;
`;
					}

					css += `}

.internal-link.regex-link-styled[data-link-rule="${rule.id}"]:hover {
	opacity: 0.9;
	filter: brightness(1.1);
}
`;
				}
			}
		}

		// Generate print styles for all styled embeds
		const enabledRules = this.settings.rules.filter(r => r.enabled);
		const calloutPinnedRules = enabledRules.filter(
			r => r.styleMode === 'callout' && r.calloutType && CALLOUT_DEFINITIONS[r.calloutType]
		);
		const customRules = enabledRules.filter(r => r.styleMode !== 'callout');

		if (enabledRules.length > 0) {
			css += `
/* ============================================================================
   PRINT STYLES - B&W for all styled embeds
   ============================================================================ */
@media print {
	/* Base print styles for all regex-styled embeds */
	.markdown-embed.regex-embed-styled {
		border: 1px solid #000 !important;
		background-color: #fff !important;
	}

	.markdown-embed.regex-embed-styled::before {
		background-color: #000 !important;
	}

	.markdown-embed.regex-embed-styled .markdown-embed-title {
		color: #000 !important;
	}

	.markdown-embed.regex-embed-styled .markdown-embed-title::before {
		background-color: #000 !important;
		color: #fff !important;
	}
`;

			// Print styles for custom-mode rules
			for (const rule of customRules) {
				css += `
	/* Print: ${rule.name} (custom) */
	.markdown-embed.regex-embed-styled[data-embed-rule="${rule.id}"] {
		border: 1px solid #000 !important;
		background-color: #fff !important;
	}

	.markdown-embed.regex-embed-styled[data-embed-rule="${rule.id}"]::before {
		background-color: #000 !important;
	}

	.markdown-embed.regex-embed-styled[data-embed-rule="${rule.id}"] .markdown-embed-title::before {
		background-color: #000 !important;
	}
`;
			}

			// Print styles for callout-pinned rules
			for (const rule of calloutPinnedRules) {
				if (!rule.calloutType || !CALLOUT_DEFINITIONS[rule.calloutType]) continue;
				const callout = CALLOUT_DEFINITIONS[rule.calloutType];

				// Determine print style based on callout type (matching style-b-outline.css patterns)
				// Use background-color (not background) to preserve background-image icons
				let tagPrintStyle = '';
				let iconColor = '#000'; // Default: black icon for light backgrounds

				switch (rule.calloutType) {
					case 'case':
					case 'precedent':
						// Case - outlined (white bg, black border) - needs black icon
						tagPrintStyle = `
		background-color: #fff !important;
		color: #000 !important;
		border: 2px solid #000 !important;`;
						iconColor = '#000';
						break;
					case 'apply':
					case 'application':
						// Apply - dashed border (white bg) - needs black icon
						tagPrintStyle = `
		background-color: #fff !important;
		color: #000 !important;
		border: 2px dashed #000 !important;`;
						iconColor = '#000';
						break;
					case 'holding':
						// Holding - gray background - needs black icon
						tagPrintStyle = `
		background-color: #ccc !important;
		color: #000 !important;
		border: 2px solid #000 !important;`;
						iconColor = '#000';
						break;
					case 'hypo':
					case 'hypothetical':
						// Hypo - dotted border (white bg) - needs black icon
						tagPrintStyle = `
		background-color: #fff !important;
		color: #000 !important;
		border: 2px dotted #000 !important;`;
						iconColor = '#000';
						break;
					case 'dissent':
					case 'concurrence':
					case 'concur':
						// Dissent/Concur - light gray - needs black icon
						tagPrintStyle = `
		background-color: #e5e5e5 !important;
		color: #000 !important;
		border: 2px solid #000 !important;`;
						iconColor = '#000';
						break;
					default:
						// Default: solid black tag (rule, constitution, usc, frcp, fre, statute, test, elements, defense)
						// BLACK background needs WHITE icon
						tagPrintStyle = `
		background-color: #000 !important;
		color: #fff !important;
		border: 2px solid #000 !important;`;
						iconColor = '#fff';
				}

				// Generate print icon with correct stroke color
				const printIcon = encodeURIComponent(callout.icon.replace('currentColor', iconColor)).replace(/'/g, '%27');

				css += `
	/* Print: ${rule.name} (${rule.calloutType}) */
	.markdown-embed.regex-embed-styled[data-embed-rule="${rule.id}"] {
		border: 2px solid #000 !important;
		border-radius: 0 !important;
		background-color: #fff !important;
	}

	.markdown-embed.regex-embed-styled[data-embed-rule="${rule.id}"]::before {
		background-color: #fff !important;
		border-right: 2px solid #000 !important;
		border-radius: 0 !important;
	}

	.markdown-embed.regex-embed-styled[data-embed-rule="${rule.id}"] .markdown-embed-title {
		color: #000 !important;
	}

	.markdown-embed.regex-embed-styled[data-embed-rule="${rule.id}"] .markdown-embed-title::before {${tagPrintStyle}
		border-radius: 0 !important;
		background-image: url('data:image/svg+xml;utf8,${printIcon}') !important;
	}
`;
			}

			css += `}
`;
		}

		return css;
	}
}

// ============================================================================
// SETTINGS TAB
// ============================================================================

class RegexEmbedSettingTab extends PluginSettingTab {
	plugin: RegexEmbedStylingPlugin;

	constructor(app: App, plugin: RegexEmbedStylingPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Border Settings' });

		new Setting(containerEl)
			.setName('Outer border width')
			.setDesc('Width of the outer border in pixels')
			.addSlider(slider => slider
				.setLimits(0, 5, 0.5)
				.setValue(this.plugin.settings.borderSettings.outerWidth)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.borderSettings.outerWidth = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Outer border color')
			.setDesc('Color of the outer border')
			.addText(text => text
				.setValue(this.plugin.settings.borderSettings.outerColor)
				.onChange(async (value) => {
					this.plugin.settings.borderSettings.outerColor = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Outer border opacity')
			.setDesc('Opacity of the outer border')
			.addSlider(slider => slider
				.setLimits(0, 1, 0.1)
				.setValue(this.plugin.settings.borderSettings.outerOpacity)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.borderSettings.outerOpacity = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show left border')
			.setDesc('Display border on the left side')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.borderSettings.showLeft)
				.onChange(async (value) => {
					this.plugin.settings.borderSettings.showLeft = value;
					await this.plugin.saveSettings();
					await this.plugin.updateStyles();
				}));

		new Setting(containerEl)
			.setName('Show right border')
			.setDesc('Display border on the right side')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.borderSettings.showRight)
				.onChange(async (value) => {
					this.plugin.settings.borderSettings.showRight = value;
					await this.plugin.saveSettings();
					await this.plugin.updateStyles();
				}));

		new Setting(containerEl)
			.setName('Show top border')
			.setDesc('Display border on the top side')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.borderSettings.showTop)
				.onChange(async (value) => {
					this.plugin.settings.borderSettings.showTop = value;
					await this.plugin.saveSettings();
					await this.plugin.updateStyles();
				}));

		new Setting(containerEl)
			.setName('Show bottom border')
			.setDesc('Display border on the bottom side')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.borderSettings.showBottom)
				.onChange(async (value) => {
					this.plugin.settings.borderSettings.showBottom = value;
					await this.plugin.saveSettings();
					await this.plugin.updateStyles();
				}));

		new Setting(containerEl)
			.setName('Border radius')
			.setDesc('Border radius in pixels')
			.addSlider(slider => slider
				.setLimits(0, 20, 1)
				.setValue(this.plugin.settings.borderSettings.radius)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.borderSettings.radius = value;
					await this.plugin.saveSettings();
					await this.plugin.updateStyles();
				}));

		containerEl.createEl('h2', { text: 'Embed Rules' });

		new Setting(containerEl)
			.setName('Add new rule')
			.setDesc('Create a new embed styling rule')
			.addButton(button => button
				.setButtonText('Add rule')
				.setCta()
				.onClick(async () => {
					const newRule: EmbedRule = {
						id: Date.now().toString(),
						name: 'New Rule',
						pattern: '',
						enabled: true,
						styleMode: 'custom',
						color: '#6366f1',
						icon: '📄',
						iconType: 'emoji'
					};
					this.plugin.settings.rules.push(newRule);
					await this.plugin.saveSettings();
					this.display();
				}));

		for (let i = 0; i < this.plugin.settings.rules.length; i++) {
			const rule = this.plugin.settings.rules[i];

			const ruleContainer = containerEl.createDiv('embed-rule-container');
			ruleContainer.style.border = '1px solid var(--background-modifier-border)';
			ruleContainer.style.borderRadius = '0px';
			ruleContainer.style.padding = '1em';
			ruleContainer.style.marginBottom = '1em';
			ruleContainer.style.backgroundColor = 'var(--background-secondary)';

			const headerDiv = ruleContainer.createDiv();
			headerDiv.style.display = 'flex';
			headerDiv.style.justifyContent = 'space-between';
			headerDiv.style.alignItems = 'center';
			headerDiv.style.marginBottom = '1em';

			const titleEl = headerDiv.createEl('h3', { text: rule.name });
			titleEl.style.margin = '0';

			new Setting(ruleContainer)
				.setName('Enabled')
				.setDesc('Enable or disable this rule')
				.addToggle(toggle => toggle
					.setValue(rule.enabled)
					.onChange(async (value) => {
						rule.enabled = value;
						await this.plugin.saveSettings();
					}));

			new Setting(ruleContainer)
				.setName('Name')
				.setDesc('Display name for this rule')
				.addText(text => text
					.setPlaceholder('Rule name')
					.setValue(rule.name)
					.onChange(async (value) => {
						rule.name = value;
						await this.plugin.saveSettings();
						this.display();
					}));

			new Setting(ruleContainer)
				.setName('Pattern (regex)')
				.setDesc('Regular expression to match embed sources')
				.addText(text => {
					text
						.setPlaceholder('e.g., U\\.S\\.\\s*Code|U\\.S\\.C\\.')
						.setValue(rule.pattern)
						.onChange(async (value) => {
							rule.pattern = value;
							await this.plugin.saveSettings();
						});
					text.inputEl.style.width = '100%';
					text.inputEl.style.fontFamily = 'monospace';
					return text;
				});

			// Style Mode selector
			new Setting(ruleContainer)
				.setName('Style mode')
				.setDesc('Use custom styling or inherit from a callout type')
				.addDropdown(dropdown => dropdown
					.addOption('custom', 'Custom')
					.addOption('callout', 'Pin to Callout')
					.setValue(rule.styleMode || 'custom')
					.onChange(async (value: 'custom' | 'callout') => {
						rule.styleMode = value;
						// Set default callout type if switching to callout mode
						if (value === 'callout' && !rule.calloutType) {
							rule.calloutType = 'rule';
						}
						await this.plugin.saveSettings();
						this.display();
					}));

			// Conditional rendering based on style mode
			if (rule.styleMode === 'callout') {
				// Callout type selector
				new Setting(ruleContainer)
					.setName('Callout type')
					.setDesc('Select which callout style to inherit')
					.addDropdown(dropdown => {
						// Add all callout types from CALLOUT_DEFINITIONS
						for (const [key, def] of Object.entries(CALLOUT_DEFINITIONS)) {
							dropdown.addOption(key, def.displayName);
						}
						dropdown.setValue(rule.calloutType || 'rule');
						dropdown.onChange(async (value) => {
							rule.calloutType = value;
							await this.plugin.saveSettings();
							this.display();
						});
						return dropdown;
					});

				// Custom label input (optional override)
				const calloutForLabel = CALLOUT_DEFINITIONS[rule.calloutType || 'rule'];
				new Setting(ruleContainer)
					.setName('Custom label (optional)')
					.setDesc('Override the default callout label text')
					.addText(text => text
						.setPlaceholder(calloutForLabel?.label || 'Label')
						.setValue(rule.customLabel || '')
						.onChange(async (value) => {
							rule.customLabel = value.trim() || undefined;
							await this.plugin.saveSettings();
							this.display();
						}));

				// Preview of selected callout style
				if (rule.calloutType && CALLOUT_DEFINITIONS[rule.calloutType]) {
					const callout = CALLOUT_DEFINITIONS[rule.calloutType];
					const displayLabel = rule.customLabel || callout.label;
					const previewDiv = ruleContainer.createDiv('callout-preview-container');
					previewDiv.style.display = 'flex';
					previewDiv.style.alignItems = 'center';
					previewDiv.style.gap = '10px';
					previewDiv.style.padding = '10px';
					previewDiv.style.marginBottom = '10px';
					previewDiv.style.border = '1px solid var(--background-modifier-border)';
					previewDiv.style.borderRadius = '4px';
					previewDiv.style.backgroundColor = 'var(--background-secondary)';

					const previewLabel = previewDiv.createEl('span', { text: 'Preview:' });
					previewLabel.style.fontWeight = '600';

					const tagPreview = previewDiv.createEl('span', { text: displayLabel });
					tagPreview.style.display = 'inline-flex';
					tagPreview.style.padding = '4px 10px';
					tagPreview.style.borderRadius = '4px';
					tagPreview.style.fontSize = '0.7rem';
					tagPreview.style.fontWeight = '700';
					tagPreview.style.textTransform = 'uppercase';
					tagPreview.style.letterSpacing = '0.5px';
					tagPreview.style.backgroundColor = `rgb(${callout.color.replace('var(', '').replace(')', '')})`;
					tagPreview.style.color = callout.textColor || '#fff';
				}
			} else {
				// Custom styling fields (original behavior)
				new Setting(ruleContainer)
					.setName('Color')
					.setDesc('Accent color for this rule (hex format)')
					.addText(text => text
						.setPlaceholder('#6366f1')
						.setValue(rule.color)
						.onChange(async (value) => {
							rule.color = value;
							await this.plugin.saveSettings();
						}));

				new Setting(ruleContainer)
					.setName('Icon type')
					.setDesc('Choose between emoji or SVG icon')
					.addDropdown(dropdown => dropdown
						.addOption('emoji', 'Emoji')
						.addOption('svg', 'SVG')
						.setValue(rule.iconType)
						.onChange(async (value: 'emoji' | 'svg') => {
							rule.iconType = value;
							await this.plugin.saveSettings();
							this.display();
						}));

				const previewDiv = ruleContainer.createDiv('icon-preview-container');
				previewDiv.style.display = 'flex';
				previewDiv.style.alignItems = 'center';
				previewDiv.style.gap = '10px';
				previewDiv.style.padding = '10px';
				previewDiv.style.marginBottom = '10px';
				previewDiv.style.border = '1px solid var(--background-modifier-border)';
				previewDiv.style.borderRadius = '0px';
				previewDiv.style.backgroundColor = 'var(--background-secondary)';

				const previewLabel = previewDiv.createEl('span', { text: 'Current Icon:' });
				previewLabel.style.fontWeight = '600';

				const iconPreview = previewDiv.createDiv();
				iconPreview.style.width = '24px';
				iconPreview.style.height = '24px';
				iconPreview.style.display = 'flex';
				iconPreview.style.alignItems = 'center';
				iconPreview.style.justifyContent = 'center';

				if (rule.iconType === 'svg') {
					iconPreview.innerHTML = rule.icon;
					const svg = iconPreview.querySelector('svg');
					if (svg) {
						svg.style.stroke = 'var(--text-normal)';
					}
				} else {
					iconPreview.textContent = rule.icon;
					iconPreview.style.fontSize = '20px';
				}

				const iconSetting = new Setting(ruleContainer)
					.setName('Icon')
					.setDesc(rule.iconType === 'emoji' ? 'Emoji character' : 'SVG code');

				if (rule.iconType === 'svg') {
					iconSetting.addButton(button => button
						.setButtonText('Browse Icons')
						.onClick(() => {
							const modal = new IconPickerModal(this.app, (svg, name) => {
								rule.icon = svg;
								this.plugin.saveSettings();
								this.display();
							});
							modal.open();
						}));
				}

				iconSetting.addTextArea(text => {
					text
						.setPlaceholder(rule.iconType === 'emoji' ? '📄' : '<svg>...</svg>')
						.setValue(rule.icon)
						.onChange(async (value) => {
							rule.icon = value;
							await this.plugin.saveSettings();
						});
					text.inputEl.rows = rule.iconType === 'svg' ? 4 : 1;
					text.inputEl.style.width = '100%';
					text.inputEl.style.fontFamily = 'monospace';
					return text;
				});
			}

			// Link highlighting toggle (available for all rules)
			new Setting(ruleContainer)
				.setName('Highlight matching links')
				.setDesc('Apply badge/pill styling to normal links (not embeds) that match this pattern')
				.addToggle(toggle => toggle
					.setValue(rule.highlightLinks || false)
					.onChange(async (value) => {
						rule.highlightLinks = value;
						await this.plugin.saveSettings();
						await this.plugin.updateStyles();
						this.plugin.processExistingLinks();
					}));

			new Setting(ruleContainer)
				.addButton(button => button
					.setButtonText('Delete rule')
					.setWarning()
					.onClick(async () => {
						this.plugin.settings.rules.splice(i, 1);
						await this.plugin.saveSettings();
						this.display();
					}));
		}
	}
}
