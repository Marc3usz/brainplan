// Import tool implementations
import findCity from "./findCity";
import getWeather from "./getWeather";
import getSecret from "./getSecret";
import getIpInfo from "./getIpInfo";
import getCalendarInfo from "./getCalendar";
import scraperLink from "./scraperLink";
import notesIndex from "./notesIndex";
import notes from "./notes";
import summarizeText from "./summarizeText";

// For the BrainRot video generator, we'll create an empty array
// instead of dynamically importing it which causes issues with Next.js
const brainRotTools = [];

// Export all tools as a single array for toolsLoader compatibility
const ollamaTools = [
  ...findCity, 
  ...getWeather, 
  ...getSecret, 
  ...getIpInfo, 
  ...getCalendarInfo,
  ...scraperLink, 
  ...notesIndex, 
  ...notes,
  ...summarizeText,
  ...brainRotTools
];

export default ollamaTools;
