/**
 * INTERPRETER - IDE ORCHESTRATOR & MONACO CONTROLLER
 */
import { CodeRunner } from './runner.js';

class EditorApp {
  constructor() {
    this.runner = new CodeRunner();
    this.monaco = null;
    this.editor = null;
    this.currentLanguage = 'python';
    this.activeFileName = 'main.py';
    this.activeOutputTab = 'console';
    this.isDragging = false;

    // File contents storage per language
    this.fileStorage = {
      python: {
        'main.py': `# Welcome to Interpreter Live Python Engine (Pyodide WASM)
import math
import sys

print("=== Python 3 Live Execution ===")
print(f"Python Runtime: {sys.version.split()[0]}")

def fibonacci(n):
    sequence = []
    a, b = 0, 1
    for _ in range(n):
        sequence.append(a)
        a, b = b, a + b
    return sequence

print(f"Fibonacci Sequence (10): {fibonacci(10)}")
print(f"Square root of 144: {math.isqrt(144)}")
print("Python execution finished successfully!")
`
      },
      html: {
        'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Live Web Preview</title>
</head>
<body>
  <div class="card">
    <div class="badge">Live Web Sandbox</div>
    <h1>Interactive Web App</h1>
    <p>Edit HTML, CSS, and JS simultaneously. Results update live on the right!</p>
    <button id="counterBtn" class="action-btn">Clicked 0 Times</button>
  </div>
</body>
</html>`,
        'style.css': `body {
  margin: 0;
  padding: 2rem;
  font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif;
  background: #0f172a;
  color: #f8fafc;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
}

.card {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2.5rem;
  text-align: center;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
  max-width: 440px;
}

.badge {
  display: inline-block;
  padding: 4px 14px;
  background: rgba(99, 102, 241, 0.2);
  color: #818cf8;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
}

h1 {
  margin: 0 0 0.75rem;
  font-size: 1.6rem;
  color: #ffffff;
}

p {
  color: #94a3b8;
  line-height: 1.5;
  font-size: 0.95rem;
}

.action-btn {
  background: linear-gradient(135deg, #6366f1, #06b6d4);
  color: white;
  border: none;
  padding: 0.85rem 1.75rem;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-top: 1.5rem;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
}`,
        'script.js': `let count = 0;
const btn = document.getElementById('counterBtn');

if (btn) {
  btn.addEventListener('click', () => {
    count++;
    btn.textContent = \`Clicked \${count} Times!\`;
    console.log(\`[UI Event] Button clicked. New count: \${count}\`);
  });
}

console.log("Live JavaScript initialized successfully!");`
      },
      cpp: {
        'main.cpp': `#include <iostream>
#include <vector>
#include <numeric>
#include <string>

int main() {
    std::cout << "=== Live C++20 Compiler (GCC) ===" << std::endl;
    
    std::vector<int> numbers = {10, 20, 30, 40, 50};
    int sum = std::accumulate(numbers.begin(), numbers.end(), 0);
    
    std::cout << "Vector items: ";
    for (int num : numbers) {
        std::cout << num << " ";
    }
    std::cout << std::endl;
    std::cout << "Total Sum: " << sum << std::endl;
    std::cout << "Average: " << static_cast<double>(sum) / numbers.size() << std::endl;
    std::cout << "C++ execution finished successfully!" << std::endl;
    
    return 0;
}`
      },
      c: {
        'main.c': `#include <stdio.h>
#include <stdlib.h>

int main() {
    printf("=== Live C Compiler (GCC C11) ===\\n");
    
    int a = 42;
    int b = 58;
    int sum = a + b;
    
    printf("Variable A = %d\\n", a);
    printf("Variable B = %d\\n", b);
    printf("Sum = %d\\n", sum);
    printf("Pointer Address of sum: %p\\n", (void*)&sum);
    printf("C program executed successfully!\\n");
    
    return 0;
}`
      },
      java: {
        'Main.java': `import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        System.out.println("=== Live Java (OpenJDK) Execution ===");
        
        List<String> environments = new ArrayList<>();
        environments.add("Python (Pyodide WASM)");
        environments.add("HTML / CSS / JS Sandbox");
        environments.add("C++ (Modern C++20)");
        environments.add("C (C11 Standard)");
        environments.add("Java (JVM)");
        
        System.out.println("Available Execution Engines:");
        for (int i = 0; i < environments.size(); i++) {
            System.out.printf("  [%d] %s%n", i + 1, environments.get(i));
        }
        
        System.out.println("Java application finished successfully.");
    }
}`
      },
      javascript: {
        'main.js': `// Live JavaScript Sandbox
console.log("=== JavaScript Live Execution ===");

const team = [
  { id: 1, name: "Alice", role: "Systems Engineer" },
  { id: 2, name: "Bob", role: "Fullstack Architect" },
  { id: 3, name: "Charlie", role: "DevOps Engineer" }
];

console.log("Loaded team records:");
team.forEach(member => {
  console.log(\` • \${member.name} - \${member.role}\`);
});

const names = team.map(m => m.name).join(", ");
console.log("Team Roster:", names);
`
      }
    };
  }

  /**
   * Application Entry Point
   */
  async init() {
    this.initTheme();
    this.initCursorGlow();
    this.parseUrlParams();
    this.initResizeHandle();
    this.initEventListeners();
    await this.initMonaco();
    this.switchLanguage(this.currentLanguage);
  }

  /* ==========================================================================
     THEME MANAGEMENT
     ========================================================================== */
  initTheme() {
    const savedTheme = localStorage.getItem('interpreter_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('interpreter_theme', next);
        
        if (this.monaco) {
          this.monaco.editor.setTheme(next === 'dark' ? 'vs-dark' : 'vs');
        }
      });
    }
  }

  initCursorGlow() {
    const glow = document.getElementById('cursorGlow');
    if (!glow) return;

    window.addEventListener('mousemove', (e) => {
      glow.style.left = `${e.clientX}px`;
      glow.style.top = `${e.clientY}px`;
    }, { passive: true });
  }

  parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get('lang');
    if (lang && this.fileStorage[lang]) {
      this.currentLanguage = lang;
    }
  }

  /* ==========================================================================
     MONACO EDITOR INITIALIZATION
     ========================================================================== */
  initMonaco() {
    return new Promise((resolve) => {
      window.require.config({
        paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }
      });

      window.require(['vs/editor/editor.main'], () => {
        this.monaco = window.monaco;
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';

        const container = document.getElementById('editorContainer');
        this.editor = this.monaco.editor.create(container, {
          value: '',
          language: 'python',
          theme: currentTheme === 'dark' ? 'vs-dark' : 'vs',
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          fontLigatures: true,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          insertSpaces: true,
          wordWrap: 'on',
          padding: { top: 12, bottom: 12 },
          lineNumbersMinChars: 3,
          renderLineHighlight: 'all',
          cursorBlinking: 'smooth',
          smoothScrolling: true
        });

        // Cursor position status bar update
        this.editor.onDidChangeCursorPosition((e) => {
          const pos = e.position;
          const posEl = document.getElementById('cursorPosition');
          if (posEl) {
            posEl.textContent = `Ln ${pos.lineNumber}, Col ${pos.column}`;
          }
        });

        // Save file content on change
        this.editor.onDidChangeModelContent(() => {
          if (this.fileStorage[this.currentLanguage] && this.fileStorage[this.currentLanguage][this.activeFileName] !== undefined) {
            this.fileStorage[this.currentLanguage][this.activeFileName] = this.editor.getValue();
          }
        });

        resolve();
      });
    });
  }

  /* ==========================================================================
     LANGUAGE & FILE SWITCHING
     ========================================================================== */
  switchLanguage(langKey) {
    if (!this.fileStorage[langKey]) return;
    this.currentLanguage = langKey;

    // Update active pill button
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === langKey);
    });

    // Update available file tabs
    const files = Object.keys(this.fileStorage[langKey]);
    this.activeFileName = files[0];
    this.renderFileTabs(files);

    // Update Monaco editor mode and code
    this.loadFileIntoEditor(this.activeFileName);

    // Update UI status bars and engine tags
    const langNames = {
      python: { mode: 'Python 3', engine: 'Pyodide WASM / Piston' },
      html: { mode: 'HTML/CSS/JS', engine: 'Live Web Sandbox' },
      cpp: { mode: 'C++20', engine: 'GCC 10.2 (Piston)' },
      c: { mode: 'C (C11)', engine: 'GCC 10.2 (Piston)' },
      java: { mode: 'Java', engine: 'OpenJDK 15 (Piston)' },
      javascript: { mode: 'JavaScript', engine: 'V8 Sandbox' }
    };

    const info = langNames[langKey] || { mode: langKey, engine: 'Piston Engine' };
    const langModeEl = document.getElementById('languageMode');
    const engineEl = document.getElementById('engineName');
    if (langModeEl) langModeEl.textContent = info.mode;
    if (engineEl) engineEl.textContent = info.engine;

    // If HTML mode, switch output tab to Live Web Preview automatically
    if (langKey === 'html') {
      this.switchOutputTab('preview');
      this.runCode(); // Auto-render preview
    } else {
      this.switchOutputTab('console');
    }
  }

  renderFileTabs(fileNames) {
    const tabsContainer = document.getElementById('fileTabs');
    if (!tabsContainer) return;

    tabsContainer.innerHTML = fileNames.map(name => `
      <button class="file-tab ${name === this.activeFileName ? 'active' : ''}" data-filename="${name}" type="button">
        <span class="tab-name">${name}</span>
      </button>
    `).join('');

    tabsContainer.querySelectorAll('.file-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const fname = tab.getAttribute('data-filename');
        this.switchFile(fname);
      });
    });
  }

  switchFile(fileName) {
    if (!this.fileStorage[this.currentLanguage][fileName]) return;
    this.activeFileName = fileName;

    document.querySelectorAll('.file-tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-filename') === fileName);
    });

    this.loadFileIntoEditor(fileName);
  }

  loadFileIntoEditor(fileName) {
    if (!this.editor || !this.monaco) return;

    const content = this.fileStorage[this.currentLanguage][fileName] || '';
    const ext = fileName.split('.').pop();
    const monacoLangMap = {
      py: 'python',
      html: 'html',
      css: 'css',
      js: 'javascript',
      cpp: 'cpp',
      c: 'c',
      java: 'java'
    };

    const language = monacoLangMap[ext] || 'plaintext';
    const oldModel = this.editor.getModel();
    if (oldModel) oldModel.dispose();

    const newModel = this.monaco.editor.createModel(content, language);
    this.editor.setModel(newModel);

    const titleEl = document.getElementById('currentFileName');
    if (titleEl) titleEl.textContent = fileName;
  }

  /* ==========================================================================
     OUTPUT VIEWPORT & EXECUTION HANDLER
     ========================================================================== */
  switchOutputTab(tab) {
    this.activeOutputTab = tab;

    const consoleBtn = document.getElementById('tabConsoleBtn');
    const previewBtn = document.getElementById('tabPreviewBtn');
    const terminal = document.getElementById('outputTerminal');
    const preview = document.getElementById('previewContainer');
    const placeholder = document.getElementById('outputPlaceholder');

    if (tab === 'console') {
      consoleBtn?.classList.add('active');
      previewBtn?.classList.remove('active');
      preview?.classList.remove('active');
      terminal?.removeAttribute('hidden');
    } else {
      previewBtn?.classList.add('active');
      consoleBtn?.classList.remove('active');
      preview?.classList.add('active');
      terminal?.setAttribute('hidden', '');
      placeholder?.setAttribute('hidden', '');
    }
  }

  clearConsole() {
    const terminal = document.getElementById('outputTerminal');
    const placeholder = document.getElementById('outputPlaceholder');
    if (terminal) {
      terminal.innerHTML = '';
      terminal.setAttribute('hidden', '');
    }
    if (placeholder) {
      placeholder.removeAttribute('hidden');
    }
    const timeEl = document.getElementById('executionTime');
    if (timeEl) timeEl.textContent = '—';
    this.updateStatus('ready', 'Ready');
  }

  logToConsole(type, message) {
    const terminal = document.getElementById('outputTerminal');
    const placeholder = document.getElementById('outputPlaceholder');

    if (placeholder) placeholder.setAttribute('hidden', '');
    if (terminal) {
      terminal.removeAttribute('hidden');
      const line = document.createElement('div');
      line.className = `log-line log-${type}`;
      line.textContent = message;
      terminal.appendChild(line);
      terminal.scrollTop = terminal.scrollHeight;
    }
  }

  updateStatus(state, text) {
    const indicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const runBtn = document.getElementById('runBtn');

    if (indicator) {
      indicator.className = `status-indicator ${state}`;
    }
    if (statusText) {
      statusText.textContent = text;
    }
    if (runBtn) {
      if (state === 'running') {
        runBtn.classList.add('running');
        runBtn.querySelector('span').textContent = 'Running...';
      } else {
        runBtn.classList.remove('running');
        runBtn.querySelector('span').textContent = 'Run';
      }
    }
  }

  async runCode() {
    if (!this.editor) return;

    const code = this.editor.getValue();
    const stdinInput = document.getElementById('stdinInput');
    const stdin = stdinInput ? stdinInput.value : '';

    if (this.currentLanguage !== 'html') {
      this.switchOutputTab('console');
      this.clearConsole();
    }

    this.logToConsole('info', `[Interpreter] Running ${this.currentLanguage.toUpperCase()}...`);
    this.updateStatus('running', 'Compiling / Running...');

    const files = this.fileStorage[this.currentLanguage] || {};

    const result = await this.runner.run({
      language: this.currentLanguage,
      code,
      stdin,
      files,
      onLog: (type, msg) => this.logToConsole(type, msg),
      onStatus: (state, text) => this.updateStatus(state, text)
    });

    const timeEl = document.getElementById('executionTime');
    if (timeEl) {
      timeEl.textContent = `${result.executionTime}ms`;
    }

    // If HTML preview mode, update iframe
    if (this.currentLanguage === 'html' && result.html) {
      const iframe = document.getElementById('previewIframe');
      if (iframe) {
        iframe.srcdoc = result.html;
      }
    }
  }

  /* ==========================================================================
     RESIZABLE SPLIT-PANE LOGIC
     ========================================================================== */
  initResizeHandle() {
    const handle = document.getElementById('resizeHandle');
    const editorPane = document.getElementById('editorPane');
    const outputPane = document.getElementById('outputPane');
    const main = document.getElementById('editorMain');

    if (!handle || !editorPane || !outputPane || !main) return;

    const onMouseDown = (e) => {
      this.isDragging = true;
      handle.classList.add('active');
      document.body.style.userSelect = 'none';
      document.body.style.cursor = window.innerWidth <= 900 ? 'row-resize' : 'col-resize';
    };

    const onMouseMove = (e) => {
      if (!this.isDragging) return;

      const mainRect = main.getBoundingClientRect();
      const isMobile = window.innerWidth <= 900;

      if (!isMobile) {
        // Horizontal split calculation
        const offsetLeft = e.clientX - mainRect.left;
        const totalWidth = mainRect.width;
        const leftPercent = Math.max(15, Math.min(85, (offsetLeft / totalWidth) * 100));
        editorPane.style.flex = `0 0 ${leftPercent}%`;
        outputPane.style.flex = `0 0 ${100 - leftPercent}%`;
      } else {
        // Vertical stacked split calculation
        const offsetTop = e.clientY - mainRect.top;
        const totalHeight = mainRect.height;
        const topPercent = Math.max(15, Math.min(85, (offsetTop / totalHeight) * 100));
        editorPane.style.flex = `0 0 ${topPercent}%`;
        outputPane.style.flex = `0 0 ${100 - topPercent}%`;
      }

      if (this.editor) {
        this.editor.layout();
      }
    };

    const onMouseUp = () => {
      if (this.isDragging) {
        this.isDragging = false;
        handle.classList.remove('active');
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }
    };

    handle.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  /* ==========================================================================
     EVENT LISTENERS & SHORTCUTS
     ========================================================================== */
  initEventListeners() {
    // Language Buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        this.switchLanguage(lang);
      });
    });

    // Run Button
    const runBtn = document.getElementById('runBtn');
    if (runBtn) {
      runBtn.addEventListener('click', () => this.runCode());
    }

    // Output Tabs
    document.getElementById('tabConsoleBtn')?.addEventListener('click', () => this.switchOutputTab('console'));
    document.getElementById('tabPreviewBtn')?.addEventListener('click', () => this.switchOutputTab('preview'));

    // Clear Output
    document.getElementById('clearOutputBtn')?.addEventListener('click', () => this.clearConsole());

    // Copy Output
    document.getElementById('copyOutputBtn')?.addEventListener('click', () => {
      const terminal = document.getElementById('outputTerminal');
      if (terminal && terminal.textContent) {
        navigator.clipboard.writeText(terminal.textContent).then(() => {
          this.showToast('Output copied to clipboard!', 'success');
        });
      }
    });

    // Refresh Preview
    document.getElementById('refreshPreviewBtn')?.addEventListener('click', () => {
      this.runCode();
      this.showToast('Preview sandbox refreshed', 'info');
    });

    // Stdin Send Button
    document.getElementById('stdinSendBtn')?.addEventListener('click', () => {
      this.runCode();
    });

    // Font Size Select
    document.getElementById('fontSizeSelect')?.addEventListener('change', (e) => {
      const size = parseInt(e.target.value, 10);
      if (this.editor) {
        this.editor.updateOptions({ fontSize: size });
      }
    });

    // Format Code Button
    document.getElementById('formatBtn')?.addEventListener('click', () => {
      if (this.editor) {
        this.editor.getAction('editor.action.formatDocument')?.run().then(() => {
          this.showToast('Document formatted', 'info');
        });
      }
    });

    // Copy Code Button
    document.getElementById('copyCodeBtn')?.addEventListener('click', () => {
      if (this.editor) {
        const code = this.editor.getValue();
        navigator.clipboard.writeText(code).then(() => {
          this.showToast('Code copied to clipboard!', 'success');
        });
      }
    });

    // Reset Template Button
    document.getElementById('resetBtn')?.addEventListener('click', () => {
      if (confirm(`Reset ${this.activeFileName} to default template?`)) {
        const defaults = new EditorApp().fileStorage[this.currentLanguage];
        if (defaults && defaults[this.activeFileName]) {
          this.fileStorage[this.currentLanguage][this.activeFileName] = defaults[this.activeFileName];
          this.loadFileIntoEditor(this.activeFileName);
          this.showToast('Template restored', 'info');
        }
      }
    });

    // Keyboard Shortcuts (Ctrl + Enter to Run, Ctrl + K to Clear)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.runCode();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.clearConsole();
      }
    });

    // Listen to iframe postMessage for web sandbox console logs
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'PREVIEW_LOG') {
        this.logToConsole(e.data.level || 'stdout', `[Web Console] ${e.data.message}`);
      }
    });
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  const app = new EditorApp();
  app.init();
});
