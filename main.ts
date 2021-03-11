import { App, Plugin, PluginSettingTab, Setting, MarkdownView } from 'obsidian';
import * as CodeMirror from "codemirror";

interface PluginSettings {
	language: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
	language: ''
}

interface SelectionRange {
	start: { line: number; ch: number };
	end: { line: number; ch: number };
}

export default class CodeBlockFromSelection extends Plugin {
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'code-block-from-selection',
			name: 'Code block from selection',
			callback: () => this.insertCodeBlock()
		});

		this.addSettingTab(new SettingTab(this.app, this));
	}

	insertCodeBlock(): void {
		let editor = this.getEditor();
		if (editor) {
			let selectedText = CodeBlockFromSelection.getSelectedText(editor);
			let language = this.settings.language;

			editor.replaceSelection(`\n\`\`\`${language}\n${selectedText}\n\`\`\`\n`);
		}
	}

	private getEditor(): CodeMirror.Editor {
		return this.app.workspace.getActiveViewOfType(MarkdownView)?.sourceMode.cmEditor;
	}

	private static getSelectedText(editor: CodeMirror.Editor): string {
		if (!editor.somethingSelected())
			CodeBlockFromSelection.selectLineUnderCursor(editor);

		return editor.getSelection();
	}

	private static selectLineUnderCursor(editor: CodeMirror.Editor) {
		let selection = CodeBlockFromSelection.getLineUnderCursor(editor);
		editor.getDoc().setSelection(selection.start, selection.end);
	}

	private static getLineUnderCursor(editor: CodeMirror.Editor): SelectionRange {
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
			.setName('Language')
			.setDesc('')
			.addText(text => text
				.setPlaceholder('Example: c++')
				.setValue(this.plugin.settings.language)
				.onChange(async (value) => {
					this.plugin.settings.language = value;
					await this.plugin.saveSettings();
				}));
	}
}
