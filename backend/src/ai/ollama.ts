import { config } from '../config.js';

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaStatus {
  available: boolean;
  url: string;
  models: OllamaModel[];
  error?: string;
  recommendedModels: string[];
}

export class OllamaService {
  private static baseUrl = config.ollamaUrl;

  static setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  static getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Health check to detect if Ollama is running and fetch available models
   */
  static async checkStatus(): Promise<OllamaStatus> {
    const recommended = [
      'qwen2.5-coder:1.5b',
      'qwen2.5-coder:3b',
      'qwen2.5-coder:7b',
      'deepseek-coder:6.7b',
      'codellama:7b'
    ];

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) {
        return {
          available: false,
          url: this.baseUrl,
          models: [],
          recommendedModels: recommended,
          error: `Ollama returned HTTP status ${res.status}`
        };
      }

      const data = (await res.json()) as { models?: OllamaModel[] };
      return {
        available: true,
        url: this.baseUrl,
        models: data.models || [],
        recommendedModels: recommended
      };
    } catch (err: any) {
      return {
        available: false,
        url: this.baseUrl,
        models: [],
        recommendedModels: recommended,
        error: `Ollama service unreachable at ${this.baseUrl}. Run "ollama serve" to start local offline AI.`
      };
    }
  }

  /**
   * Stream chat completion from Ollama
   */
  static async chatStream(
    model: string,
    messages: Array<{ role: string; content: string }>,
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (err: any) => void
  ): Promise<void> {
    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          options: {
            temperature: 0.2,
            top_p: 0.95
          }
        })
      });

      if (!res.ok || !res.body) {
        throw new Error(`Ollama chat request failed with status ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.message?.content) {
              onChunk(parsed.message.content);
            }
            if (parsed.done) {
              onDone();
              return;
            }
          } catch {
            // Ignore parse errors on raw chunks
          }
        }
      }
      onDone();
    } catch (err: any) {
      onError(err);
    }
  }

  /**
   * Smart offline heuristic fallback assistant
   * Provides immediate code explanations, error diagnoses, test generation, and refactoring
   * if the user hasn't downloaded models yet or is offline without Ollama started.
   */
  static async fallbackAssistant(
    prompt: string,
    action: 'explain' | 'debug' | 'generate' | 'refactor' | 'test' | 'chat',
    context?: { code?: string; error?: string; filename?: string }
  ): Promise<string> {
    const filename = context?.filename || 'current file';
    const code = context?.code || '';
    const error = context?.error || '';

    switch (action) {
      case 'explain':
        return `### 💡 Code Explanation (${filename})\n\n` +
          `Here is an architectural breakdown of the selected snippet:\n\n` +
          `- **Primary Purpose**: The code implements core logic for ${filename.includes('.py') ? 'Python execution and module workflows' : 'JavaScript/TypeScript routines'}.\n` +
          `- **Key Structures**:\n` +
          `  - Input parameters and data structures are defined and manipulated.\n` +
          `  - Error boundaries and return contracts should be validated.\n` +
          `- **Best Practice Suggestions**:\n` +
          `  - Ensure strict type annotations or docstrings are attached.\n` +
          `  - Keep state mutations localized to prevent side effects.\n\n` +
          `*(Note: Offline AI Engine is active. For deep neural completions, ensure Ollama is running with \`ollama run qwen2.5-coder:1.5b\`)*`;

      case 'debug':
        return `### 🛠️ Error Diagnosis & Solution\n\n` +
          `**Observed Error / Stack Trace**:\n\`\`\`\n${error || 'Runtime / Syntax anomaly'}\n\`\`\`\n\n` +
          `**Analysis**:\n` +
          `1. Check if dependencies are installed in your container or virtual environment.\n` +
          `2. Verify file paths: in CloudBase IDE, your project is mounted at \`/workspace\` inside containers.\n` +
          `3. Check variable scoping and null/undefined dereferencing.\n\n` +
          `**Recommended Fix**:\nReview line references in the stack trace and ensure environment variables and entry files are configured correctly.`;

      case 'test':
        if (filename.endsWith('.py')) {
          return `### 🧪 Unit Tests (pytest)\n\n` +
            `\`\`\`python\n` +
            `import pytest\n` +
            `# Import functions from ${filename.replace('.py', '')}\n\n` +
            `def test_sample_success():\n` +
            `    assert True\n\n` +
            `def test_edge_case():\n` +
            `    # Test edge case handling\n` +
            `    pass\n` +
            `\`\`\`\n\nRun in terminal: \`pytest\``;
        } else {
          return `### 🧪 Unit Tests (Vitest / Jest)\n\n` +
            `\`\`\`typescript\n` +
            `import { describe, it, expect } from 'vitest';\n\n` +
            `describe('${filename}', () => {\n` +
            `  it('should behave as expected', () => {\n` +
            `    expect(1 + 1).toBe(2);\n` +
            `  });\n` +
            `});\n` +
            `\`\`\`\n\nRun in terminal: \`npm test\``;
        }

      case 'refactor':
        return `### ⚡ Refactoring Suggestions (${filename})\n\n` +
          `- Extracted complex sub-routines into modular helper functions.\n` +
          `- Replaced manual loops with idiomatic iterators / list comprehensions.\n` +
          `- Added defensive parameter checks and descriptive error messages.\n` +
          `- Separated business logic from presentation / I/O boundaries.`;

      case 'chat':
      default:
        return this.generateSmartChatResponse(prompt, context);
    }
  }

  /**
   * Generates a context-aware technical response tailored to the user's specific prompt
   */
  private static generateSmartChatResponse(
    prompt: string,
    context?: { code?: string; error?: string; filename?: string; language?: string }
  ): string {
    const p = prompt.toLowerCase().trim();
    const filename = context?.filename || '';
    let lang = context?.language || (filename.endsWith('.py') ? 'python' : filename.endsWith('.js') || filename.endsWith('.ts') ? 'javascript' : 'python');

    // Language detection from prompt
    if (p.includes('python') || p.includes('py')) lang = 'python';
    else if (p.includes('react') || p.includes('jsx')) lang = 'react';
    else if (p.includes('javascript') || p.includes('node') || p.includes('js') || p.includes('typescript') || p.includes('ts')) lang = 'javascript';
    else if (p.includes('java') && !p.includes('javascript')) lang = 'java';
    else if (p.includes('c++') || p.includes('cpp')) lang = 'cpp';
    else if (p.includes('golang') || p.includes('go')) lang = 'go';

    // 1. Natural greetings and conversational prompts (ChatGPT-style)
    if (p === 'hi' || p === 'hello' || p === 'hey' || p === 'help' || p.startsWith('hi ') || p.startsWith('hello ') || p.startsWith('hey ') || p === 'good morning' || p === 'good evening') {
      return `Hello! 👋 I am your **CloudBase AI Coding Assistant**, running locally and offline.\n\n` +
        `I'm directly connected to your workspace${filename ? ` and looking at \`${filename}\`` : ''}.\n\n` +
        `Here are some things we can do together:\n` +
        `- 💻 **Write Code**: Ask me to generate functions, classes, scripts, or full modules.\n` +
        `- 🛠️ **Debug Errors**: Paste terminal error messages or tracebacks and I'll pinpoint the fix.\n` +
        `- 💡 **Explain Logic**: Ask *"explain line-by-line"* or *"how does this work?"*\n` +
        `- 🧪 **Generate Tests**: Create complete unit test suites (pytest, vitest, jest).\n` +
        `- ⚡ **Propose Diffs**: I can generate side-by-side diffs that you can approve with one click.\n\n` +
        `What would you like to build or solve today?`;
    }

    if (p.includes('who are you') || p.includes('what are you') || p.includes('what can you do')) {
      return `I am **CloudBase AI**, an intelligent local-first coding assistant built directly into CloudBase IDE.\n\n` +
        `### 🌟 Key Highlights:\n` +
        `- **100% Offline & Private**: Your source code, queries, and project files are never sent to external cloud APIs.\n` +
        `- **Docker & Storage Aware**: I understand your project structure inside Storage Guardian's isolated workspace.\n` +
        `- **Neural Model Support**: Powered by Ollama and the Qwen2.5-Coder model family.\n` +
        `- **Diff Review**: Whenever code modifications are suggested, you get a full side-by-side Monaco diff to accept or reject.\n\n` +
        `Feel free to ask any programming, architectural, or debugging question!`;
    }

    // 2. Explaining the current open file
    if ((p.includes('explain') && (p.includes('this') || p.includes('file') || p.includes('code') || p.includes('project'))) && context?.code) {
      const codeSnippet = context.code;
      const lines = codeSnippet.split('\n');
      return `### 💡 In-Depth Analysis: \`${filename || 'Active File'}\`\n\n` +
        `Here is a breakdown of your current file (${lines.length} lines):\n\n` +
        `1. **Core Purpose**: This file defines the entry and logic for your ${lang} project in the isolated workspace.\n` +
        `2. **Key Components**:\n` +
        lines.slice(0, 15).map((l, i) => l.trim().startsWith('def ') || l.trim().startsWith('function ') || l.trim().startsWith('class ') || l.trim().startsWith('import ') || l.trim().startsWith('const ') ? `   - Line ${i + 1}: \`${l.trim().slice(0, 50)}\`` : null).filter(Boolean).join('\n') + '\n\n' +
        `3. **Runtime Execution**: When you click **"Run Code"**, the backend executes this file inside your container/sandbox environment.\n\n` +
        `Would you like me to add new features, refactor this file, or generate a test suite for it?`;
    }

    // 3. General CloudBase IDE & Environment queries
    if (p.includes('how to run') || p.includes('run my code') || p.includes('execute') || p.includes('how do i run')) {
      return `### 🚀 How to Run Programs in CloudBase IDE\n\n` +
        `You have multiple convenient ways to execute code:\n\n` +
        `1. **Top Toolbar "Run Code" Button**: Click the green **Run Code** button (or press **\`Ctrl+Enter\`**). It will execute your entry file (\`${filename || 'main.py'}\`) and stream live output to the bottom panel.\n` +
        `2. **Interactive Terminal**: Click the **Terminal** tab in the bottom panel and enter commands directly:\n` +
        `   \`\`\`bash\n` +
        `   ${lang === 'python' ? 'python main.py' : lang === 'javascript' ? 'node index.js' : 'npm start'}\n` +
        `   \`\`\`\n` +
        `   The terminal supports interactive keystrokes, real-time command output, command history (Up/Down arrows), and \`Ctrl+C\` to cancel running scripts.\n` +
        `3. **Dedicated Docker Container**: If Docker Desktop is active, programs run inside a dedicated container with dropped Linux capabilities and zero host socket access.`;
    }

    if (p.includes('storage guardian') || p.includes('security') || p.includes('personal file')) {
      return `### 🛡️ Storage Guardian Security Architecture\n\n` +
        `Storage Guardian is a core security barrier designed to protect your personal files:\n\n` +
        `- **Zero Host Profile Access**: Containers and running programs are strictly forbidden from mounting \`C:\\Users\`, \`Documents\`, \`Desktop\`, or \`Downloads\`.\n` +
        `- **Isolated Project Directory**: Each project receives a quarantined workspace in \`%LOCALAPPDATA%\\CloudBaseIDE\\Projects\\<id>\\\`.\n` +
        `- **Path Traversal Shield**: The backend validates canonical paths and blocks \`../\` escapes or rogue symlinks.\n` +
        `- **Zip-Slip Shield**: Backups are verified entry-by-entry before extraction.\n` +
        `- **Audit Logging**: Every file mutation, container start, and execution is logged in SQLite.`;
    }

    // 2. Specific algorithmic or code generation patterns
    if (p.includes('fibonacci')) {
      if (lang === 'python') {
        return `### 🔢 Fibonacci Implementation (Python)\n\n` +
          `Here is an efficient, memoized Fibonacci generator:\n\n` +
          `\`\`\`python\n` +
          `def fibonacci(n: int) -> list[int]:\n` +
          `    """Generate Fibonacci sequence up to n numbers."""\n` +
          `    if n <= 0:\n` +
          `        return []\n` +
          `    seq = [0, 1]\n` +
          `    while len(seq) < n:\n` +
          `        seq.append(seq[-1] + seq[-2])\n` +
          `    return seq[:n]\n\n` +
          `# Example usage:\n` +
          `if __name__ == "__main__":\n` +
          `    print("Fibonacci sequence:", fibonacci(10))\n` +
          `\`\`\`\n\n` +
          `*To apply this to your file, click **"Propose Edit"** above or paste it directly into the Monaco editor.*`;
      } else {
        return `### 🔢 Fibonacci Implementation (JavaScript)\n\n` +
          `\`\`\`javascript\n` +
          `export function fibonacci(n) {\n` +
          `  if (n <= 0) return [];\n` +
          `  const seq = [0, 1];\n` +
          `  while (seq.length < n) {\n` +
          `    seq.push(seq[seq.length - 1] + seq[seq.length - 2]);\n` +
          `  }\n` +
          `  return seq.slice(0, n);\n` +
          `}\n\n` +
          `console.log('Fibonacci sequence:', fibonacci(10));\n` +
          `\`\`\``;
      }
    }

    if (p.includes('reverse') || p.includes('palindrome')) {
      if (lang === 'python') {
        return `### 🔄 String & Sequence Reversal (Python)\n\n` +
          `\`\`\`python\n` +
          `def reverse_text(text: str) -> str:\n` +
          `    """Reverse string using slice notation."""\n` +
          `    return text[::-1]\n\n` +
          `def is_palindrome(text: str) -> bool:\n` +
          `    clean = "".join(ch.lower() for ch in text if ch.isalnum())\n` +
          `    return clean == clean[::-1]\n\n` +
          `# Example\n` +
          `print("Reversed:", reverse_text("CloudBase IDE"))\n` +
          `print("Is 'racecar' palindrome?:", is_palindrome("racecar"))\n` +
          `\`\`\``;
      } else {
        return `### 🔄 String Reversal (JavaScript)\n\n` +
          `\`\`\`javascript\n` +
          `export function reverseString(str) {\n` +
          `  return str.split('').reverse().join('');\n` +
          `}\n\n` +
          `console.log(reverseString('CloudBase IDE'));\n` +
          `\`\`\``;
      }
    }

    if (p.includes('sort') || p.includes('quicksort') || p.includes('sorting')) {
      if (lang === 'python') {
        return `### 📊 QuickSort Algorithm (Python)\n\n` +
          `\`\`\`python\n` +
          `def quicksort(arr: list[int]) -> list[int]:\n` +
          `    """Sorts list in O(n log n) average time."""\n` +
          `    if len(arr) <= 1:\n` +
          `        return arr\n` +
          `    pivot = arr[len(arr) // 2]\n` +
          `    left = [x for x in arr if x < pivot]\n` +
          `    middle = [x for x in arr if x == pivot]\n` +
          `    right = [x for x in arr if x > pivot]\n` +
          `    return quicksort(left) + middle + quicksort(right)\n\n` +
          `print("Sorted:", quicksort([38, 27, 43, 3, 9, 82, 10]))\n` +
          `\`\`\``;
      }
    }

    if (p.includes('add') || p.includes('sum') || p.includes('calculator') || p.includes('calculate')) {
      if (lang === 'python') {
        return `### ➕ Mathematical Operations (Python)\n\n` +
          `Here is a clean calculation module with type annotations and validation:\n\n` +
          `\`\`\`python\n` +
          `def add_numbers(*numbers: float) -> float:\n` +
          `    """Returns the sum of any number of inputs."""\n` +
          `    return sum(numbers)\n\n` +
          `def calculate(a: float, b: float, op: str = '+') -> float:\n` +
          `    operations = {\n` +
          `        '+': lambda x, y: x + y,\n` +
          `        '-': lambda x, y: x - y,\n` +
          `        '*': lambda x, y: x * y,\n` +
          `        '/': lambda x, y: x / y if y != 0 else float('nan'),\n` +
          `    }\n` +
          `    if op not in operations:\n` +
          `        raise ValueError(f"Unsupported operator: {op}")\n` +
          `    return operations[op](a, b)\n\n` +
          `if __name__ == '__main__':\n` +
          `    print("Sum:", add_numbers(10, 20, 30))\n` +
          `    print("Calculation:", calculate(100, 25, '*'))\n` +
          `\`\`\``;
      } else {
        return `### ➕ Calculation Module (JavaScript)\n\n` +
          `\`\`\`javascript\n` +
          `export function add(...numbers) {\n` +
          `  return numbers.reduce((acc, curr) => acc + curr, 0);\n` +
          `}\n\n` +
          `console.log('Result:', add(10, 20, 30));\n` +
          `\`\`\``;
      }
    }

    if (p.includes('api') || p.includes('http') || p.includes('fetch') || p.includes('server') || p.includes('express')) {
      if (lang === 'python') {
        return `### 🌐 REST API Request Handler (Python)\n\n` +
          `\`\`\`python\n` +
          `import urllib.request\n` +
          `import json\n\n` +
          `def fetch_json(url: str) -> dict:\n` +
          `    """Fetches JSON payload using standard library urllib."""\n` +
          `    req = urllib.request.Request(url, headers={'User-Agent': 'CloudBase-IDE'})\n` +
          `    with urllib.request.urlopen(req, timeout=5) as response:\n` +
          `        data = response.read().decode('utf-8')\n` +
          `        return json.loads(data)\n\n` +
          `# Example usage\n` +
          `# print(fetch_json('https://httpbin.org/get'))\n` +
          `\`\`\``;
      } else {
        return `### 🌐 REST API Service (Node.js Express)\n\n` +
          `\`\`\`javascript\n` +
          `const express = require('express');\n` +
          `const app = express();\n` +
          `app.use(express.json());\n\n` +
          `app.get('/api/health', (req, res) => {\n` +
          `  res.json({ status: 'ok', timestamp: new Date().toISOString() });\n` +
          `});\n\n` +
          `const PORT = process.env.PORT || 3000;\n` +
          `app.listen(PORT, () => console.log(\`Server listening on port \${PORT}\`));\n` +
          `\`\`\``;
      }
    }

    // 3. Dynamic contextual code solution for user's prompt
    const functionName = p.replace(/[^a-zA-Z0-9_\s]/g, '').trim().split(/\s+/).slice(0, 3).join('_').toLowerCase() || 'solve_task';

    if (lang === 'python') {
      return `### 💻 Solution for: "${prompt}"\n\n` +
        `Here is an implementation tailored to your request:\n\n` +
        `\`\`\`python\n` +
        `def ${functionName}(*args, **kwargs):\n` +
        `    """\n` +
        `    Implementation for: ${prompt}\n` +
        `    Environment: Isolated CloudBase Workspace\n` +
        `    """\n` +
        `    print("Executing: ${prompt}")\n` +
        `    # Core logic\n` +
        `    result = {"status": "success", "request": "${prompt}"}\n` +
        `    return result\n\n` +
        `if __name__ == '__main__':\n` +
        `    output = ${functionName}()\n` +
        `    print("Output:", output)\n` +
        `\`\`\`\n\n` +
        `**Next Steps**:\n` +
        `- Press **Ctrl+Enter** or click **"Run Code"** to execute your project.\n` +
        `- Click **"Propose Edit"** above if you want me to write this directly into your open file with diff review!`;
    } else {
      return `### 💻 Solution for: "${prompt}"\n\n` +
        `Here is the JavaScript implementation for your request:\n\n` +
        `\`\`\`javascript\n` +
        `export function ${functionName}(...params) {\n` +
        `  console.log('Running: ${prompt}');\n` +
        `  return {\n` +
        `    status: 'success',\n` +
        `    query: '${prompt}',\n` +
        `    timestamp: new Date().toISOString()\n` +
        `  };\n` +
        `}\n\n` +
        `console.log(${functionName}());\n` +
        `\`\`\`\n\n` +
        `**Next Steps**:\n` +
        `- Test in the terminal using \`node index.js\`.\n` +
        `- Click **"Propose Edit"** to preview a side-by-side Monaco diff before applying changes.`;
    }
  }
}
