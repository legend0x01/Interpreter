/**
 * INTERPRETER - LANDING PAGE INTERACTIVE CONTROLLER
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initCursorGlow();
  initTypewriter();
  renderLanguageCards();
});

/* ==========================================================================
   THEME MANAGEMENT (DARK / LIGHT MODE)
   ========================================================================== */
function initTheme() {
  const savedTheme = localStorage.getItem('interpreter_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('interpreter_theme', newTheme);
    });
  }
}

/* ==========================================================================
   INTERACTIVE CURSOR GLOW
   ========================================================================== */
function initCursorGlow() {
  const glow = document.getElementById('cursorGlow');
  if (!glow) return;

  window.addEventListener('mousemove', (e) => {
    glow.style.left = `${e.clientX}px`;
    glow.style.top = `${e.clientY}px`;
  }, { passive: true });
}

/* ==========================================================================
   DYNAMIC TYPEWRITER ANIMATION ("Interpreter...")
   ========================================================================== */
function initTypewriter() {
  const typingElement = document.getElementById('typingText');
  if (!typingElement) return;

  const phrases = [
    "... Python, C++, Java & C",
    "... HTML, CSS & JavaScript",
    "... Live in your browser",
    "... Zero Setup, Instant Run",
    "... Powerful Multi-Language IDE"
  ];

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typeSpeed = 90;

  function type() {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      typingElement.textContent = currentPhrase.substring(0, charIndex - 1);
      charIndex--;
      typeSpeed = 40;
    } else {
      typingElement.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;
      typeSpeed = 80;
    }

    if (!isDeleting && charIndex === currentPhrase.length) {
      typeSpeed = 1800; // Pause at full phrase
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      typeSpeed = 400; // Pause before typing new phrase
    }

    setTimeout(type, typeSpeed);
  }

  type();
}

/* ==========================================================================
   LANGUAGE CARDS RENDER & 3D INTERACTION
   ========================================================================== */
const LANGUAGES = [
  {
    id: 'python',
    name: 'Python 3',
    badge: 'Pyodide WASM',
    icon: 'assets/python.svg',
    desc: 'Instant in-browser execution powered by WebAssembly CPython. Includes standard library and math modules.',
    tech: 'Client WASM & Python 3.10',
    snippet: `def fib(n):\n    a, b = 0, 1\n    for _ in range(n):\n        yield a\n        a, b = b, a + b\n\nprint("Fibonacci:", list(fib(8)))`
  },
  {
    id: 'html',
    name: 'HTML / CSS / JS',
    badge: 'Live DOM Sandbox',
    icon: 'assets/html.svg',
    desc: 'Build web layouts and interactive apps with instantaneous live reload, DOM inspection and console logger.',
    tech: 'Real-time Live Preview',
    snippet: `<div style="color: #6366f1; font-family: sans-serif;">\n  <h2>Live Web Preview</h2>\n  <button onclick="alert('Live Code!')">Click Me</button>\n</div>`
  },
  {
    id: 'cpp',
    name: 'C++ (C++20)',
    badge: 'GCC / Clang',
    icon: 'assets/cpp.svg',
    desc: 'High-performance modern C++ compilation with full STL support, vector algorithms, and execution statistics.',
    tech: 'GCC 10.2 / C++20',
    snippet: `#include <iostream>\n#include <vector>\n\nint main() {\n    std::vector<int> v = {1, 2, 3, 4, 5};\n    std::cout << "C++20 Running Live!" << std::endl;\n    return 0;\n}`
  },
  {
    id: 'c',
    name: 'C Language',
    badge: 'C11 Standard',
    icon: 'assets/c.svg',
    desc: 'System-level C programming with pointers, memory structures, standard I/O, and instant compiler diagnostics.',
    tech: 'GCC 10.2 / C11',
    snippet: `#include <stdio.h>\n\nint main() {\n    printf("Live C compiler active!\\n");\n    return 0;\n}`
  },
  {
    id: 'java',
    name: 'Java (OpenJDK)',
    badge: 'JVM Engine',
    icon: 'assets/java.svg',
    desc: 'Object-oriented programming with classes, collections, stream APIs, and structured exception handling.',
    tech: 'OpenJDK 15.0.2',
    snippet: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java JVM!");\n    }\n}`
  },
  {
    id: 'javascript',
    name: 'JavaScript (Node/ES)',
    badge: 'V8 Sandboxed',
    icon: 'assets/javascript.svg',
    desc: 'Modern ES6+ JavaScript execution with async/await, array transforms, and live interactive console.',
    tech: 'Node / V8 Engine',
    snippet: `const data = [1, 2, 3, 4, 5];\nconst squared = data.map(x => x ** 2);\nconsole.log("Squared numbers:", squared);`
  }
];

function renderLanguageCards() {
  const grid = document.getElementById('languagesGrid');
  if (!grid) return;

  grid.innerHTML = LANGUAGES.map(lang => `
    <a href="editor.html?lang=${lang.id}" class="lang-card" data-lang="${lang.id}" aria-label="Open ${lang.name} in Editor">
      <div class="lang-card-header">
        <div class="lang-card-identity">
          <div class="lang-icon-wrapper">
            <img src="${lang.icon}" alt="${lang.name} logo" class="lang-icon-img" loading="lazy">
          </div>
          <div class="lang-name-group">
            <h3 class="lang-card-title">${lang.name}</h3>
            <span class="lang-tech-pill">${lang.tech}</span>
          </div>
        </div>
        <span class="lang-type-badge">${lang.badge}</span>
      </div>

      <p class="lang-card-desc">${lang.desc}</p>

      <div class="lang-code-preview" aria-hidden="true">
        <code>${escapeHtml(lang.snippet)}</code>
      </div>

      <div class="lang-card-footer">
        <span class="lang-tech-pill">Click to Open Editor</span>
        <span class="lang-action-link">
          <span>Run Now</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </span>
      </div>
    </a>
  `).join('');

  // Add 3D Tilt Effect on mouse movement
  document.querySelectorAll('.lang-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}
