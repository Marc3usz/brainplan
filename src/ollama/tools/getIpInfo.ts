import { ToolFunction } from "../toolsLoader";

const functions: ToolFunction[] = [
  {
    type: "function",
    function: {
      name: "getIpInfo",
      description:
        "Fetches the current IP address and location information (IP, Country, City, Region, Lat, Lon, Timezone)",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    execute: async () => {
      try {
        const response = await fetch("http://www.geoplugin.net/json.gp");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to fetch IP info: ${error.message}`);
        }
        throw new Error("Failed to fetch IP info");
      }
    },
  },
];

export default functions;
