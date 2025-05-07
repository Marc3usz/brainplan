// Import tool implementations
import findCity from "./findCity";
import getWeather from "./getWeather";
import getSecret from "./getSecret";
import getIpInfo from "./getIpInfo";
import getCalendarInfo from "./getCalendar";
import scraperLink from "./scraperLink";
import notesIndex from "./notesIndex";

// Export all tools as a single array for toolsLoader compatibility
const ollamaTools = [...findCity, ...getWeather, ...getSecret, ...getIpInfo, ...getCalendarInfo, ...scraperLink, ...notesIndex];

export default ollamaTools;
