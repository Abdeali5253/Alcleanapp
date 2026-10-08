import { lstatSync, readFileSync, readlinkSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const frontend = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageFile = resolve(frontend, "ios/App/CapApp-SPM/Package.swift");
const source = readFileSync(packageFile, "utf8");
// Windows Capacitor sync emits backslashes in Swift string literals.
const normalized = source.replace(/path: "([^"\n]+)"/g,
  (_match, path) => `path: "${path.replaceAll("\\", "/")}"`);
if (normalized !== source) writeFileSync(packageFile, normalized);

// Keep the package alias, but make its link independent of the checkout folder.
const link = resolve(frontend, "ios/App/CapApp-SPM/symlinks/CapacitorFirebaseAuthentication");
const target = relative(dirname(link), resolve(frontend, "node_modules/@capacitor-firebase/authentication"))
  .replaceAll("\\", "/");
if (!lstatSync(link).isSymbolicLink()) {
  throw new Error("Expected Capacitor Firebase Authentication to be a generated package symlink.");
}
if (readlinkSync(link).replaceAll("\\", "/") !== target) {
  unlinkSync(link);
  symlinkSync(target, link, "dir");
}
console.log("iOS Swift package paths are relative and portable.");
