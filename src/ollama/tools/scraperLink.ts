import { ToolFunction } from "../toolsLoader";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

interface ScraperLinkArgs {
  url: string;
}

const scraperLink: ToolFunction[] = [
  {
    type: "function",
    function: {
      name: "scraperLink",
      description: "Process a URL with the skibidiscrap scraper tool",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The URL to process with the scraper",
          },
        },
        required: ["url"],
      },
    },
    execute: async ({ url }: ScraperLinkArgs) => {
      try {
        if (!url) {
          throw new Error("URL is required");
        }

        // Validate URL format
        try {
          new URL(url);
        } catch (e) {
          throw new Error("Invalid URL format");
        }

        // Path to the executable is relative to where the Node.js process is running
        const scraperPath = path.resolve(process.cwd(), "src/webscrap/skibidiscrap.exe");
        
        // Execute the scraper with the provided URL
        const { stdout, stderr } = await execAsync(`"${scraperPath}" "${url}"`);
        
        if (stderr) {
          console.error("Scraper error:", stderr);
          return { 
            success: false, 
            error: stderr,
            message: "The scraper encountered an error"
          };
        }
        
        return { 
          success: true, 
          output: stdout,
          message: "Link has been processed by the scraper"
        };
      } catch (error) {
        console.error("Error in scraperLink tool:", error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : "Unknown error",
          message: "Failed to process the link"
        };
      }
    },
  },
];

export default scraperLink; 