import { ToolFunction } from "../toolsLoader";

interface LocationInfo {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  importance: number;
}

const functions: ToolFunction[] = [
  {
    type: "function",
    function: {
      name: "findCity",
      description: "Get coordinates (latitude and longitude) for a city",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "Name of the city (e.g., 'Warsaw', 'New York')",
          },
        },
        required: ["city"],
      },
    },
    execute: async ({ city }: { city: string }) => {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search.php?city=${encodeURIComponent(
          city
        )}&format=jsonv2`
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data: LocationInfo[] = await response.json();

      if (!data.length) {
        throw new Error(`No location found for city: ${city}`);
      }

      // Sort by importance and get the most relevant result
      const bestMatch = data.sort((a, b) => b.importance - a.importance)[0];

      return {
        city,
        latitude: parseFloat(bestMatch.lat),
        longitude: parseFloat(bestMatch.lon),
        display_name: bestMatch.display_name,
      };
    },
  },
];

export default functions;
