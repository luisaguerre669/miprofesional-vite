const dns = require("dns");
const logger = require("./logger");

async function resolveMongoSrv(uri) {
  if (!uri || !uri.startsWith("mongodb+srv://")) return uri;

  const url = new URL(uri);

  const hostname = url.hostname;
  const hosts = await new Promise((resolve) => {
    dns.resolveSrv(`_mongodb._tcp.${hostname}`, (err, addresses) => {
      if (err) {
        logger.warn(`SRV resolution failed for ${hostname}: ${err.message}`);
        resolve(null);
      } else {
        resolve(addresses.sort((a, b) => a.priority - b.priority || b.weight - a.weight));
      }
    });
  });

  if (!hosts || hosts.length === 0) {
    logger.warn("No SRV records found, returning original URI");
    return uri;
  }

  const hostList = hosts.map((h) => `${h.name}:${h.port}`).join(",");

  const params = new URLSearchParams(url.search.slice(1));
  if (!params.has("ssl")) params.set("ssl", "true");
  if (!params.has("authSource")) params.set("authSource", "admin");
  if (!params.has("retryWrites")) params.set("retryWrites", "true");

  const db = url.pathname || "/miprofesional";
  const newQuery = params.toString();

  const newUri = `mongodb://${url.username ? url.username + ":" + url.password + "@" : ""}${hostList}${db}?${newQuery}`;

  return newUri;
}

module.exports = { resolveMongoSrv };
