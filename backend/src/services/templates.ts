import fs from 'node:fs';
import path from 'node:path';

export class TemplateService {
  static populateStarterFiles(workspacePath: string, language: string, projectName: string) {
    if (!fs.existsSync(workspacePath)) {
      fs.mkdirSync(workspacePath, { recursive: true });
    }

    switch (language.toLowerCase()) {
      case 'python':
        fs.writeFileSync(
          path.join(workspacePath, 'main.py'),
          `# ${projectName} - CloudBase IDE
import sys
import time

def greet(name: str) -> str:
    return f"Hello, {name}! Welcome to CloudBase IDE."

def main():
    print("=" * 45)
    print(f"CloudBase IDE Python Runtime - Python {sys.version.split()[0]}")
    print("=" * 45)
    print(greet("${projectName}"))
    print("Environment: Isolated Container")
    print("AI Agent: Ready")
    print("-" * 45)

if __name__ == "__main__":
    main()
`
        );
        fs.writeFileSync(
          path.join(workspacePath, 'requirements.txt'),
          `# Add your Python dependencies here
pytest>=8.0.0
`
        );
        fs.writeFileSync(
          path.join(workspacePath, 'README.md'),
          `# ${projectName}

Created in **CloudBase IDE**.

### Run project:
\`\`\`bash
python main.py
\`\`\`
`
        );
        break;

      case 'node':
      case 'javascript':
        fs.writeFileSync(
          path.join(workspacePath, 'index.js'),
          `// ${projectName} - CloudBase IDE
const os = require('os');

console.log("=".repeat(45));
console.log(\`CloudBase IDE Node.js Runtime - Node \${process.version}\`);
console.log("=".repeat(45));
console.log(\`Hello from ${projectName}!\`);
console.log(\`Architecture: \${os.arch()} | Platform: \${os.platform()}\`);
console.log("-".repeat(45));
`
        );
        fs.writeFileSync(
          path.join(workspacePath, 'package.json'),
          JSON.stringify(
            {
              name: projectName.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
              version: '1.0.0',
              description: `${projectName} created with CloudBase IDE`,
              main: 'index.js',
              scripts: {
                start: 'node index.js',
                test: 'node -e "console.log(\'Tests passed\')"'
              }
            },
            null,
            2
          )
        );
        fs.writeFileSync(
          path.join(workspacePath, 'README.md'),
          `# ${projectName}

Created in **CloudBase IDE**.

### Run project:
\`\`\`bash
node index.js
\`\`\`
`
        );
        break;

      case 'react':
        fs.writeFileSync(
          path.join(workspacePath, 'index.html'),
          `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${projectName} — CloudBase IDE</title>
    <style>
      body { margin: 0; font-family: system-ui, sans-serif; background: #0B0F19; color: white; display: grid; place-content: center; height: 100vh; }
      .card { background: #111827; padding: 2.5rem; border-radius: 1rem; border: 1px solid #2A364F; text-align: center; }
      h1 { margin-top: 0; color: #38BDF8; }
      .badge { display: inline-block; padding: 0.25rem 0.75rem; background: #1E3A8A; color: #93C5FD; border-radius: 9999px; font-size: 0.875rem; }
    </style>
  </head>
  <body>
    <div class="card">
      <span class="badge">Isolated React Environment</span>
      <h1>${projectName}</h1>
      <p>Running live inside CloudBase IDE container sandbox.</p>
    </div>
  </body>
</html>
`
        );
        fs.writeFileSync(
          path.join(workspacePath, 'package.json'),
          JSON.stringify(
            {
              name: projectName.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
              version: '1.0.0',
              scripts: {
                dev: 'npx serve . -p 5173'
              }
            },
            null,
            2
          )
        );
        break;

      case 'java':
        fs.writeFileSync(
          path.join(workspacePath, 'Main.java'),
          `// ${projectName} - CloudBase IDE
public class Main {
    public static void main(String[] args) {
        System.out.println("=============================================");
        System.out.println("CloudBase IDE Java 21 Environment");
        System.out.println("=============================================");
        System.out.println("Hello from ${projectName}!");
    }
}
`
        );
        break;

      case 'cpp':
        fs.writeFileSync(
          path.join(workspacePath, 'main.cpp'),
          `// ${projectName} - CloudBase IDE
#include <iostream>

int main() {
    std::cout << "=============================================" << std::endl;
    std::cout << "CloudBase IDE C++ GCC Environment" << std::endl;
    std::cout << "=============================================" << std::endl;
    std::cout << "Hello from ${projectName}!" << std::endl;
    return 0;
}
`
        );
        break;

      case 'go':
        fs.writeFileSync(
          path.join(workspacePath, 'main.go'),
          `// ${projectName} - CloudBase IDE
package main

import "fmt"

func main() {
    fmt.Println("=============================================")
    fmt.Println("CloudBase IDE Go 1.22 Environment")
    fmt.Println("=============================================")
    fmt.Printf("Hello from %s!\\n", "${projectName}")
}
`
        );
        fs.writeFileSync(
          path.join(workspacePath, 'go.mod'),
          `module ${projectName.toLowerCase()}

go 1.22
`
        );
        break;

      default:
        fs.writeFileSync(
          path.join(workspacePath, 'main.txt'),
          `Welcome to ${projectName} in CloudBase IDE.`
        );
    }
  }
}
