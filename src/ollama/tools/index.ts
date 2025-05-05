// Import tool implementations
import findCity from "./findCity";
import getWeather from "./getWeather";
import getSecret from "./getSecret";
import getIpInfo from "./getIpInfo";

// Export all tools as a single array for toolsLoader compatibility
const ollamaTools = [...findCity, ...getWeather, ...getSecret, ...getIpInfo];

export default ollamaTools;
