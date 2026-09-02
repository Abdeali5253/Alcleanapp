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
  /^\s*\.package\(url: "https:\/\/github\.com\/facebook\/facebook-ios-sdk\.git".*\),?\r?\n/m,
  /^\s*\.product\(name: "FacebookCore", package: "facebook-ios-sdk"\),?\r?\n/m,
  /^\s*\.product\(name: "FacebookLogin", package: "facebook-ios-sdk"\),?\r?\n/m,
  /^\s*\.define\("RGCFA_INCLUDE_FACEBOOK"\),?\r?\n/m,
];

let pruned = source;
for (const entry of facebookEntries) {
  pruned = pruned.replace(entry, "");
}

if (
  pruned.includes("facebook-ios-sdk") ||
  pruned.includes('name: "FacebookCore"') ||
  pruned.includes('name: "FacebookLogin"') ||
  pruned.includes("RGCFA_INCLUDE_FACEBOOK")
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
