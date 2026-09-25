import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function patchFile(relativePath, oldText, newText, description) {
  const file = resolve(relativePath);
  let source;
  try {
    source = readFileSync(file, "utf8");
  } catch (error) {
    throw new Error(`Cannot patch ${description} because ${file} is unavailable.`, {
      cause: error,
    });
  }

  const newline = source.includes("\r\n") ? "\r\n" : "\n";
  const normalized = source.replaceAll("\r\n", "\n");

  if (normalized.includes(newText)) {
    console.log(`${description} is already patched.`);
    return;
  }

  if (!normalized.includes(oldText)) {
    throw new Error(
      `${description} changed upstream; refusing to apply an unverified patch.`,
    );
  }

  const patched = normalized.replace(oldText, newText).replaceAll("\n", newline);
  writeFileSync(file, patched);
  console.log(`Patched ${description}.`);
}

patchFile(
  "node_modules/@capacitor-firebase/authentication/Package.swift",
  'swiftSettings: [\n                .define("RGCFA_INCLUDE_GOOGLE", .when(traits: ["Google"])),\n',
  'swiftSettings: [\n                // Firebase Auth still exposes deprecated compatibility APIs used by this plugin.\n                .unsafeFlags(["-suppress-warnings"]),\n                .define("RGCFA_INCLUDE_GOOGLE", .when(traits: ["Google"])),\n',
  "Firebase Authentication warning settings",
);

patchFile(
  "node_modules/@capacitor/app/ios/Sources/AppPlugin/AppPlugin.swift",
  '"value": Bundle.main.preferredLocalizations.first',
  '"value": Bundle.main.preferredLocalizations.first ?? ""',
  "Capacitor App language response",
);

patchFile(
  "node_modules/@capacitor-firebase/messaging/ios/Plugin/FirebaseMessaging.swift",
  'case "alert":\n                presentationOptions.insert(.alert)',
  'case "alert":\n                presentationOptions.formUnion([.banner, .list])',
  "Firebase Messaging presentation options",
);
