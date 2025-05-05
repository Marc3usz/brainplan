# Setup Instructions

1.  Copy `.env.example` to `.env`
2.  Install dependencies:

    ```bash
    npm install
    ```
3.  Run the development server:

    ```bash
    npm run dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) in your browser.

# Creating New Tools

To create a new tool, follow these steps:

1. Create a new file in the `src/ollama/tools` directory (e.g., `myNewTool.ts`)
2. Define your tool using the following template:

```typescript
import { ToolFunction } from "../toolsLoader";

const functions: ToolFunction[] = [
  {
    type: "function",
    function: {
      name: "myNewTool",
      description: "Description of what your tool does",
    },
    execute: async (args: string): Promise<unknown> => {
      // Your tool implementation here
      return { result: "your result" };
    },
  },
];

export default functions;
```

3. Import and add your tool to `src/ollama/tools/index.ts`:

```typescript
import myNewTool from "./myNewTool";

const ollamaTools = [...findCity, ...getWeather, ...getSecret, ...getIpInfo, ...myNewTool];
```

The tool will be automatically available to the AI assistant. Make sure to:
- Provide a clear description of what your tool does
- Handle errors appropriately in the execute function
- Return a properly typed response
- Keep the implementation simple and focused
