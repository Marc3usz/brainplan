import { ToolFunction } from "../toolsLoader";

const functions: ToolFunction[] = [
  {
    type: "function",
    function: {
      name: "getCurrentWeather",
      description:
        "Get current weather conditions (temperature and wind speed)",
      parameters: {
        type: "object",
        properties: {
          latitude: {
            type: "number",
            description: "Latitude of the location (e.g., 52.2297 for Warsaw)",
          },
          longitude: {
            type: "number",
            description: "Longitude of the location (e.g., 21.0122 for Warsaw)",
          },
        },
        required: ["latitude", "longitude"],
      },
    },
    execute: async ({
      latitude,
      longitude,
    }: {
      latitude: number;
      longitude: number;
    }) => {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m`
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return {
        ...data,
        location: { latitude, longitude },
      };
    },
  },
  {
    type: "function",
    function: {
      name: "getForecast",
      description: "Get 3-day hourly weather forecast",
      parameters: {
        type: "object",
        properties: {
          latitude: {
            type: "number",
            description: "Latitude of the location (e.g., 52.2297 for Warsaw)",
          },
          longitude: {
            type: "number",
            description: "Longitude of the location (e.g., 21.0122 for Warsaw)",
          },
        },
        required: ["latitude", "longitude"],
      },
    },
    execute: async ({
      latitude,
      longitude,
    }: {
      latitude: number;
      longitude: number;
    }) => {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,wind_speed_10m&forecast_days=3`
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return {
        ...data,
        location: { latitude, longitude },
      };
    },
  },
];

export default functions;
