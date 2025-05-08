# BrainPlan

BrainPlan is a modern web application built with Next.js, allowing interaction with large language models (LLM) through integration with an Ollama server. The project functions as an AI assistant with additional tools, user management, and an extensive settings panel.

---

## Features

### Chat Assistant
- Direct interaction with LLM models (e.g., qwen3:14b) through a friendly chat interface
- Quick actions from the dashboard

### BrainRot Video Generator
- Transform text content into engaging videos with Minecraft gameplay
- Automatic voice narration and subtitles
- Educational content optimized for social media

### User Panel
- Profile overview and editing
- Password, email, and name changes
- Account deletion with confirmation

### Secure Authorization
- User registration and login via Firebase Authentication
- Data storage in MongoDB

### Responsive and Modern Interface
- React 19, TailwindCSS, icons, hover effects, grids

### Easy Expansion
- Structure allowing addition of more tools to the assistant

---

## Technologies

- **Next.js** (with Turbopack)
- **TypeScript**
- **React 19**
- **TailwindCSS**
- **Ollama** (local LLM server)
- **Firebase Authentication**
- **MongoDB**
- **FFmpeg** (for video generation)

---

## Prerequisites

- Node.js (recommended version 18+)
- npm
- Installed and configured [Ollama](https://ollama.com/) server (e.g., `ollama serve`)
- LLM model available on the Ollama server (e.g., `qwen3:14b`)
- Access to MongoDB database and Firebase keys (see `.env`)

---

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository_address>
   cd brainplan
   ```

2. Copy `.env.example` to `.env` and populate required environment variables

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser for the chat interface
   or [http://localhost:3000/brainrot](http://localhost:3000/brainrot) for the BrainRot Video Generator

---

## Project Structure

- `/src/app/` — Next.js app directory
- `/src/app/components/` — React components (chat, header, dashboard, etc.)
- `/src/app/brainrot/` — BrainRot Video Generator page
- `/src/services/ollama.ts` — Integration with Ollama server
- `/src/ollama/tools/` — AI assistant tools and functions

---

## Creating New Tools

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

---

## Additional Information

- **License:** MIT
- **Author:** Marc3usz

---

### Notes
- Before running, make sure the Ollama server is working and the selected model is available
- If a 505 (internal error) appears, check if the model is correctly set in the `src/services/ollama.ts` file and if the Ollama server is active
- The project is easy to extend with your own tools and AI assistant functions
