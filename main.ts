import { App, Plugin, PluginSettingTab, Setting, MarkdownView } from 'obsidian';
import * as CodeMirror from "codemirror";

interface PluginSettings {
	language1: string;
	language2: string;
	language3: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
	language1: '',
	language2: '',
	language3: '',
}

interface SelectionRange {
	start: { line: number; ch: number };
	end: { line: number; ch: number };
}

export default class CodeBlockFromSelection extends Plugin {
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();
		this.addCommands()
		this.addSettingTab(new SettingTab(this.app, this));
	}

	addCommands(): void {
		this.addCommand({
			id: 'code-block-from-selection',
			name: this.settings.language1 ? `language1 (${this.settings.language1})` : "language1",
			callback: () => this.insertCodeBlock("language1")
		});


		this.addCommand({
			id: 'code-block-from-selection-2',
			name: this.settings.language2 ? `language2 (${this.settings.language2})` : "language2",
			callback: () => this.insertCodeBlock("language2")
		});

		this.addCommand({
			id: 'code-block-from-selection-3',
			name: this.settings.language3 ? `language3 (${this.settings.language3})` : "language3",
			callback: () => this.insertCodeBlock("language3")
		});
	}

	insertCodeBlock(setting: String): void {
		let editor = this.getEditor();
		if (editor) {
			let selectedText = this.getSelectedText(editor);
			let line = this.getLineUnderCursor(editor).start.line

			let language = this.settings.language1;
			if (setting === "language2") {
				language = this.settings.language2;
			}
			if (setting === "language3") {
				language = this.settings.language3;
			}

			editor.replaceSelection(`\`\`\`${language}\n${selectedText}\n\`\`\`\n`);
			if (!selectedText) {
				editor.setSelection({ line: line + 1, ch: 0 });
			}
		}
	}

	getEditor(): CodeMirror.Editor {
		return this.app.workspace.getActiveViewOfType(MarkdownView)?.sourceMode.cmEditor;
	}

	getSelectedText(editor: CodeMirror.Editor): string {
		if (!editor.somethingSelected())
			this.selectLineUnderCursor(editor);

		return editor.getSelection();
	}

	selectLineUnderCursor(editor: CodeMirror.Editor) {
		let selection = this.getLineUnderCursor(editor);
		editor.getDoc().setSelection(selection.start, selection.end);
	}

	getLineUnderCursor(editor: CodeMirror.Editor): SelectionRange {
		let fromCh, toCh: number;
		let cursor = editor.getCursor();

		fromCh = 0;
		toCh = editor.getLine(cursor.line).length;

		return {
			start: { line: cursor.line, ch: fromCh },
			end: { line: cursor.line, ch: toCh },
		};
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}



class SettingTab extends PluginSettingTab {
	plugin: CodeBlockFromSelection;

	constructor(app: App, plugin: CodeBlockFromSelection) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Code block from selection - Settings' });

		new Setting(containerEl)
			.setName('Language1')
			.setDesc('')
			.addText(text => text
				.setPlaceholder('Example: c++')
				.setValue(this.plugin.settings.language1)
				.onChange(async (value) => {
					this.plugin.settings.language1 = value;
					await this.plugin.saveSettings();

					this.plugin.addCommands()
				}));

		new Setting(containerEl)
			.setName('Language2')
			.setDesc('')
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.language2)
				.onChange(async (value) => {
					this.plugin.settings.language2 = value;
					await this.plugin.saveSettings();

					this.plugin.addCommands()
				}));

		new Setting(containerEl)
			.setName('Language3')
			.setDesc('')
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.language3)
				.onChange(async (value) => {
					this.plugin.settings.language3 = value;
					await this.plugin.saveSettings();

					this.plugin.addCommands()
				}));
	}
}
