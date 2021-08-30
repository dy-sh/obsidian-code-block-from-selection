import {
  App,
  Plugin,
  PluginSettingTab,
  Setting,
  MarkdownView,
  addIcon,
} from "obsidian";
import * as CodeMirror from "codemirror";

interface languageMap {
  [name: string]: string;
}
interface PluginSettings {
  languages: languageMap;
}

const DEFAULT_SETTINGS: PluginSettings = {
  languages: { "e3dea0f5-37f2-4d79-ae58-490af3228069": "js" },
};

interface SelectionRange {
  start: { line: number; ch: number };
  end: { line: number; ch: number };
}

export default class CodeBlockFromSelection extends Plugin {
  settings: PluginSettings;

  async onload() {
    await this.loadSettings();
    this.initCommands();
    this.addSettingTab(new SettingTab(this.app, this));
  }

  initCommands(): void {
    for (const [uuid, language] of Object.entries(this.settings.languages)) {
      this.addCommand({
        id: uuid,
        name: language,
        callback: () => this.insertCodeBlock(language),
      });
    }
  }

  _addCommand(id: string, language: string) {
    this.addCommand({
      id: id,
      name: language,
      callback: () => this.insertCodeBlock(language),
    });
  }

  uuid(): string {
    var d = Date.now();
    if (
      typeof performance !== "undefined" &&
      typeof performance.now === "function"
    ) {
      d += performance.now(); //use high-precision timer if available
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      }
    );
  }

  insertCodeBlock(language: string): void {
    let editor = this.getEditor();
    if (editor) {
      let selectedText = this.getSelectedText(editor);
      let line = this.getLineUnderCursor(editor).start.line;

      editor.replaceSelection(`\`\`\`${language}\n${selectedText}\n\`\`\`\n`);
      if (!selectedText) {
        editor.setSelection({ line: line + 1, ch: 0 });
      }
    }
  }

  getEditor(): CodeMirror.Editor {
    return this.app.workspace.getActiveViewOfType(MarkdownView)?.sourceMode
      .cmEditor;
  }

  getSelectedText(editor: CodeMirror.Editor): string {
    if (!editor.somethingSelected()) this.selectLineUnderCursor(editor);

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

    containerEl.createEl("h2", {
      text: "Code block from selection - Settings",
    });

    new Setting(containerEl).setName("Add new language").addButton(cb => {
      cb.setButtonText("Add");
      cb.setCta();
      cb.onClick(() => {
        this.addNewLanguage();
      });
    });

    // init settingtab
    for (const [uuid, language] of Object.entries(
      this.plugin.settings.languages
    )) {
      const setting = new Setting(containerEl);
      setting
        .setName("Language")
        .setDesc("")
        .addText(text =>
          text
            .setPlaceholder("add new language")
            .setValue(language)
            .onChange(async value => {
              this.plugin.settings.languages[uuid] = value;
              await this.plugin.saveSettings();

              this.plugin._addCommand(uuid, value);
            })
        );
      this.addExtraButton(setting, uuid);
    }
  }

  addNewLanguage() {
    let setting = new Setting(this.containerEl);
    let uuid = this.plugin.uuid();

    setting
      .setName("language")
      .setDesc("")
      .addText(text =>
        text.setPlaceholder("add new language").onChange(async value => {
          this.plugin.settings.languages[uuid] = value;
          await this.plugin.saveSettings();

          this.plugin._addCommand(uuid, value);
        })
      );

    this.addExtraButton(setting, uuid);
  }

  addExtraButton(setting: Setting, uuid: string) {
    setting.addExtraButton(cb => {
      cb.setIcon("cross");
      cb.setTooltip("Remove");
      cb.onClick(() => {
        delete this.plugin.settings.languages[uuid];
        this.plugin.saveSettings();
        (this.plugin.app as any).commands.removeCommand(
          `${this.plugin.manifest.id}:${uuid}`
        );
        setting.settingEl.hide();
      });
    });
  }
}
