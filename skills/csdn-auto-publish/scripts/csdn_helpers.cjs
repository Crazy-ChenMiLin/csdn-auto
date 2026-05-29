const fs = require("fs/promises");

/**
 * Parse cookies from various formats
 * Supports: JSON array, { cookies: [...] } object, Netscape format, raw Cookie: header
 */
async function parseCookiesFromFile(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  const trimmed = content.trim();

  // Try JSON array format
  if (trimmed.startsWith("[")) {
    const cookies = JSON.parse(trimmed);
    return cookies.map(normalizeCookie);
  }

  // Try { cookies: [...] } format
  if (trimmed.startsWith("{")) {
    const obj = JSON.parse(trimmed);
    if (Array.isArray(obj.cookies)) {
      return obj.cookies.map(normalizeCookie);
    }
  }

  // Try Netscape format (cookie.txt)
  if (trimmed.includes("\t")) {
    const lines = trimmed.split("\n");
    const cookies = [];
    for (const line of lines) {
      if (line.startsWith("#") || !line.trim()) continue;
      const parts = line.split("\t");
      if (parts.length >= 7) {
        cookies.push({
          domain: parts[0],
          path: parts[2],
          secure: parts[3] === "TRUE",
          expires: parseInt(parts[4]),
          name: parts[5],
          value: parts[6],
        });
      }
    }
    return cookies.map(normalizeCookie);
  }

  // Try raw Cookie: header format
  if (trimmed.includes("=") && !trimmed.includes("{")) {
    const cookies = trimmed.split(";").map((pair) => {
      const [name, ...valueParts] = pair.trim().split("=");
      return {
        name: name.trim(),
        value: valueParts.join("=").trim(),
        domain: ".csdn.net",
        path: "/",
      };
    });
    return cookies.map(normalizeCookie);
  }

  throw new Error(`Unknown cookie format in ${filePath}`);
}

function normalizeCookie(cookie) {
  const normalized = {
    name: cookie.name,
    value: cookie.value || "",
    domain: cookie.domain,
    path: cookie.path || "/",
  };

  if (cookie.httpOnly !== undefined) {
    normalized.httpOnly = Boolean(cookie.httpOnly);
  }
  if (cookie.secure !== undefined) {
    normalized.secure = Boolean(cookie.secure);
  }

  // Handle expiration
  if (typeof cookie.expires === "number" && cookie.expires > 0) {
    normalized.expires = cookie.expires;
  } else if (typeof cookie.expirationDate === "number" && cookie.expirationDate > 0) {
    normalized.expires = Math.floor(cookie.expirationDate);
  }

  // Normalize sameSite
  if (cookie.sameSite) {
    const sameSite = String(cookie.sameSite).toLowerCase();
    if (sameSite === "no_restriction" || sameSite === "none") {
      normalized.sameSite = "None";
    } else if (sameSite === "lax") {
      normalized.sameSite = "Lax";
    } else if (sameSite === "strict") {
      normalized.sameSite = "Strict";
    }
  }

  return normalized;
}

module.exports = { parseCookiesFromFile };
