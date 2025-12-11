import { App, Modal, Setting } from 'obsidian';
import { LUCIDE_ICONS, searchIcons, LucideIcon } from './icons';

export class IconPickerModal extends Modal {
	onSelect: (svg: string, name: string) => void;
	private selectedIcon: LucideIcon | null = null;

	constructor(app: App, onSelect: (svg: string, name: string) => void) {
		super(app);
		this.onSelect = onSelect;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl('h2', { text: 'Choose an Icon' });

		const grid = contentEl.createDiv('icon-grid');
		grid.style.display = 'grid';
		grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(80px, 1fr))';
		grid.style.gap = '10px';
		grid.style.padding = '20px';

		LUCIDE_ICONS.forEach(icon => {
			const item = grid.createDiv('icon-item');
			item.style.padding = '10px';
			item.style.border = '2px solid transparent';
			item.style.borderRadius = '8px';
			item.style.cursor = 'pointer';
			item.style.textAlign = 'center';

			const preview = item.createDiv();
			preview.innerHTML = icon.svg;
			const svg = preview.querySelector('svg');
			if (svg) {
				svg.style.stroke = 'var(--text-normal)';
			}

			item.createDiv().setText(icon.name);

			item.addEventListener('click', () => {
				this.selectedIcon = icon;
				this.onSelect(icon.svg, icon.name);
				this.close();
			});
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
