import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const packageFile = resolve(
  "node_modules/@capacitor-firebase/authentication/Package.swift",
);

let source;
try {
  source = readFileSync(packageFile, "utf8");
} catch (error) {
  throw new Error(
    `Cannot prune the optional Facebook SDK because ${packageFile} is unavailable. Run npm install from frontend.`,
    { cause: error },
  );
}

const facebookEntries = [
  // Package.swift before plugin 8.5 used unconditional one-line products.
  /^\s*\.product\(name: "FacebookCore", package: "facebook-ios-sdk"\),?\r?\n/m,
  /^\s*\.product\(name: "FacebookLogin", package: "facebook-ios-sdk"\),?\r?\n/m,
  /^\s*\.define\("RGCFA_INCLUDE_FACEBOOK"\),?\r?\n/m,

  // Plugin 8.5+ uses Swift package traits and wraps conditional products.
  /^\s*\.trait\(\r?\n\s*name: "Facebook",\r?\n\s*description: "Includes the Facebook SDK\."\r?\n\s*\),?\r?\n/m,
  /^\s*\.product\(name: "FacebookCore", package: "facebook-ios-sdk",\r?\n\s*condition: \.when\(traits: \["Facebook"\]\)\),?\r?\n/m,
  /^\s*\.product\(name: "FacebookLogin", package: "facebook-ios-sdk",\r?\n\s*condition: \.when\(traits: \["Facebook"\]\)\),?\r?\n/m,
  /^\s*\.define\("RGCFA_INCLUDE_FACEBOOK", \.when\(traits: \["Facebook"\]\)\),?\r?\n/m,

  /^\s*\.package\(url: "https:\/\/github\.com\/facebook\/facebook-ios-sdk\.git".*\),?\r?\n/m,
];

let pruned = source.replace(
  /\.default\(enabledTraits:\s*\["Google",\s*"Facebook"\]\)/,
  '.default(enabledTraits: ["Google"])',
);
for (const entry of facebookEntries) {
  pruned = pruned.replace(entry, "");
}

if (
  pruned.includes("facebook-ios-sdk") ||
  pruned.includes('name: "Facebook"') ||
  pruned.includes('name: "FacebookCore"') ||
  pruned.includes('name: "FacebookLogin"') ||
  pruned.includes("RGCFA_INCLUDE_FACEBOOK") ||
  /enabledTraits:[^\n]*"Facebook"/.test(pruned)
) {
  throw new Error(
    "The Firebase Authentication Swift package changed upstream; refusing to leave the Facebook SDK partially enabled.",
  );
}

if (pruned !== source) {
  writeFileSync(packageFile, pruned);
  console.log("Removed the unused Facebook SDK from Firebase Authentication's iOS package.");
} else {
  console.log("Firebase Authentication's optional Facebook SDK is already removed.");
}
