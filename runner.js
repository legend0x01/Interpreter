/**
 * INTERPRETER - MULTI-LANGUAGE LIVE EXECUTION ENGINE
 * Supports:
 * - Python: Pyodide WASM (Client-Side) + Wandbox CPython Fallback
 * - HTML/CSS/JS: Sandboxed iframe with live DOM & Console Interception
 * - C++: GCC Modern C++20 via Wandbox API
 * - C: GCC C11 Standard via Wandbox API
 * - Java: OpenJDK 21 via Wandbox API (with class normalization)
 * - JavaScript: Safe Browser V8 / Sandboxed eval + Node.js
 */

export class CodeRunner {
  constructor() {
    this.pyodide = null;
    this.isPyodideLoading = false;
    this.pyodideLoadPromise = null;
    this.wandboxApiUrl = 'https://wandbox.org/api/compile.json';

    // Supported compiler configurations for Wandbox
    this.compilers = {
      cpp: { compiler: 'gcc-head', options: 'c++20' },
      c: { compiler: 'gcc-head-c', options: 'c11' },
      java: { compiler: 'openjdk-jdk-21+35', options: '' },
      python: { compiler: 'cpython-head', options: '' },
      javascript: { compiler: 'nodejs-20.17.0', options: '' }
    };
  }

  /**
   * Lazily initialize Pyodide WebAssembly runtime in browser
   */
  async initPyodide(onProgress) {
    if (this.pyodide) return this.pyodide;
    if (this.pyodideLoadPromise) return this.pyodideLoadPromise;

    this.isPyodideLoading = true;
    this.pyodideLoadPromise = new Promise(async (resolve) => {
      try {
        if (onProgress) onProgress('Initializing Python WebAssembly runtime (Pyodide)...');

        if (!window.loadPyodide) {
          await this.loadScript('https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js');
        }

        const pyodide = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/'
        });

        this.pyodide = pyodide;
        this.isPyodideLoading = false;
        if (onProgress) onProgress('Python WebAssembly environment ready.');
        resolve(pyodide);
      } catch (err) {
        console.warn('Pyodide WASM runtime could not be initialized, falling back to compiler API:', err);
        this.isPyodideLoading = false;
        resolve(null);
      }
    });

    return this.pyodideLoadPromise;
  }

  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Main Execution Entry
   */
  async run({ language, code, stdin = '', files = {}, onLog, onStatus }) {
    const startTime = performance.now();
    let result = { stdout: '', stderr: '', executionTime: 0, status: 'success' };

    try {
      if (onStatus) onStatus('running', 'Executing...');

      if (language === 'python') {
        result = await this.runPython(code, stdin, onLog, onStatus);
      } else if (language === 'html' || language === 'web') {
        result = await this.runWeb(code, files, onLog);
      } else if (language === 'javascript') {
        result = await this.runJavaScript(code, onLog, onStatus);
      } else if (['cpp', 'c', 'java'].includes(language)) {
        result = await this.runCompilerApi(language, code, stdin, onLog, onStatus);
      } else {
        throw new Error(`Unsupported environment: ${language}`);
      }

      const elapsed = Math.round(performance.now() - startTime);
      result.executionTime = elapsed;
      if (onStatus) onStatus(result.status === 'error' ? 'error' : 'success', `Finished in ${elapsed}ms`);
      return result;
    } catch (err) {
      const elapsed = Math.round(performance.now() - startTime);
      const errMsg = err.message || String(err);
      if (onLog) onLog('error', errMsg);
      if (onStatus) onStatus('error', 'Execution Error');
      return { stdout: '', stderr: errMsg, executionTime: elapsed, status: 'error' };
    }
  }

  /**
   * Python Execution Engine (Pyodide WASM with Wandbox fallback)
   */
  async runPython(code, stdin = '', onLog, onStatus) {
    let stdoutLines = [];
    let stderrLines = [];

    // Try Pyodide WASM first
    try {
      const pyodide = await this.initPyodide((msg) => {
        if (onLog) onLog('info', msg);
      });

      if (pyodide) {
        pyodide.setStdout({
          batched: (text) => {
            stdoutLines.push(text);
            if (onLog) onLog('stdout', text);
          }
        });

        pyodide.setStderr({
          batched: (text) => {
            stderrLines.push(text);
            if (onLog) onLog('stderr', text);
          }
        });

        if (stdin) {
          pyodide.setStdin({
            stdin: () => {
              const lines = stdin.split('\n');
              return lines.shift() || '';
            }
          });
        }

        await pyodide.runPythonAsync(code);

        return {
          stdout: stdoutLines.join('\n'),
          stderr: stderrLines.join('\n'),
          status: stderrLines.length > 0 ? 'warn' : 'success'
        };
      }
    } catch (wasmErr) {
      console.warn('Pyodide run exception, attempting server compilation...', wasmErr);
      if (onLog) onLog('warn', `WASM notice: ${wasmErr.message}. Routing to compiler service...`);
    }

    // Fallback to compiler API
    return await this.runCompilerApi('python', code, stdin, onLog, onStatus);
  }

  /**
   * HTML/CSS/JS Sandbox Generator
   */
  async runWeb(htmlCode, files = {}, onLog) {
    let fullHtml = htmlCode;
    let cssCode = files['style.css'] || files['styles.css'] || '';
    let jsCode = files['script.js'] || files['app.js'] || '';

    if (!fullHtml.toLowerCase().includes('<html') && !fullHtml.toLowerCase().includes('<!doctype')) {
      fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
${cssCode}
  </style>
</head>
<body>
  ${fullHtml}
  <script>
${jsCode}
  </script>
</body>
</html>`;
    } else {
      if (cssCode && !fullHtml.includes(cssCode)) {
        fullHtml = fullHtml.replace('</head>', `<style>\n${cssCode}\n</style></head>`);
      }
      if (jsCode && !fullHtml.includes(jsCode)) {
        fullHtml = fullHtml.replace('</body>', `<script>\n${jsCode}\n</script></body>`);
      }
    }

    // Injected Console Interceptor
    const consoleInterceptor = `
<script>
  (function() {
    function formatArg(arg) {
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      if (typeof arg === 'object') {
        try { return JSON.stringify(arg, null, 2); } catch (e) { return String(arg); }
      }
      return String(arg);
    }
    const _log = console.log;
    const _error = console.error;
    const _warn = console.warn;
    const _info = console.info;

    console.log = function(...args) {
      window.parent.postMessage({ type: 'PREVIEW_LOG', level: 'stdout', message: args.map(formatArg).join(' ') }, '*');
      _log.apply(console, args);
    };
    console.error = function(...args) {
      window.parent.postMessage({ type: 'PREVIEW_LOG', level: 'stderr', message: args.map(formatArg).join(' ') }, '*');
      _error.apply(console, args);
    };
    console.warn = function(...args) {
      window.parent.postMessage({ type: 'PREVIEW_LOG', level: 'warn', message: args.map(formatArg).join(' ') }, '*');
      _warn.apply(console, args);
    };
    console.info = function(...args) {
      window.parent.postMessage({ type: 'PREVIEW_LOG', level: 'info', message: args.map(formatArg).join(' ') }, '*');
      _info.apply(console, args);
    };
    window.onerror = function(message, source, lineno, colno, error) {
      window.parent.postMessage({ type: 'PREVIEW_LOG', level: 'error', message: 'Runtime Error: ' + message + ' (Line ' + lineno + ')' }, '*');
    };
  })();
</script>`;

    if (fullHtml.includes('<head>')) {
      fullHtml = fullHtml.replace('<head>', '<head>' + consoleInterceptor);
    } else {
      fullHtml = consoleInterceptor + fullHtml;
    }

    if (onLog) {
      onLog('info', 'Live Web preview updated.');
    }

    return {
      html: fullHtml,
      stdout: 'Web sandbox rendered successfully.',
      stderr: '',
      status: 'success'
    };
  }

  /**
   * Safe JavaScript in-browser execution
   */
  async runJavaScript(code, onLog) {
    const logs = [];
    const customConsole = {
      log: (...args) => {
        const text = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
        logs.push(text);
        if (onLog) onLog('stdout', text);
      },
      error: (...args) => {
        const text = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
        logs.push(text);
        if (onLog) onLog('stderr', text);
      },
      warn: (...args) => {
        const text = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
        logs.push(text);
        if (onLog) onLog('warn', text);
      },
      info: (...args) => {
        const text = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
        logs.push(text);
        if (onLog) onLog('info', text);
      }
    };

    try {
      const runnerFn = new Function('console', `"use strict";\n${code}`);
      const evalResult = runnerFn(customConsole);
      
      if (evalResult !== undefined && logs.length === 0) {
        const retStr = typeof evalResult === 'object' ? JSON.stringify(evalResult, null, 2) : String(evalResult);
        logs.push(retStr);
        if (onLog) onLog('stdout', retStr);
      }

      return {
        stdout: logs.join('\n'),
        stderr: '',
        status: 'success'
      };
    } catch (err) {
      const errMsg = err.stack || err.message || String(err);
      if (onLog) onLog('error', errMsg);
      return {
        stdout: logs.join('\n'),
        stderr: errMsg,
        status: 'error'
      };
    }
  }

  /**
   * Live Online Compiler API (C++, C, Java, etc.)
   */
  async runCompilerApi(langKey, code, stdin = '', onLog, onStatus) {
    const config = this.compilers[langKey];
    if (!config) {
      throw new Error(`Compiler configuration not found for: ${langKey}`);
    }

    if (onStatus) onStatus('running', `Compiling & running ${langKey.toUpperCase()}...`);

    // Normalize Java code: Wandbox requires no "public" before class name if not named "prog"
    let processedCode = code;
    if (langKey === 'java') {
      processedCode = processedCode.replace(/\bpublic\s+class\b/, 'class');
    }

    const payload = {
      code: processedCode,
      compiler: config.compiler,
      stdin: stdin || '',
      options: config.options || ''
    };

    try {
      const response = await fetch(this.wandboxApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Compiler service returned HTTP ${response.status}`);
      }

      const data = await response.json();
      let stdout = (data.program_output || '').trim();
      let stderr = (data.compiler_error || data.program_error || data.compiler_message || '').trim();

      // If program_output is empty and there's message output
      if (!stdout && data.program_message) {
        stdout = data.program_message.trim();
      }

      if (stdout && onLog) {
        onLog('stdout', stdout);
      }
      if (stderr && onLog) {
        onLog('stderr', stderr);
      }

      const hasError = data.status !== '0' && data.status !== 0 && !stdout;

      return {
        stdout,
        stderr,
        status: hasError ? 'error' : (stderr ? 'warn' : 'success')
      };
    } catch (err) {
      const errorMsg = `Compiler Error: ${err.message}\nPlease check your network connection or try again.`;
      if (onLog) onLog('error', errorMsg);
      return {
        stdout: '',
        stderr: errorMsg,
        status: 'error'
      };
    }
  }
}
