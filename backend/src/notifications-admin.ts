import dotenv from "dotenv";

dotenv.config();

const usage = `
Notification administration (run on the backend server only)

  npm run notifications:devices
  npm run notifications:send -- --title "Title" --body "Message"
  npm run notifications:send -- --title "Title" --body "Message" --user-id "gid://shopify/Customer/..."
`;

function readOption(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  return value && !value.startsWith("--") ? value : undefined;
}

function validateText(
  value: string | undefined,
  name: string,
  maxLength: number,
): string {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.length > maxLength) {
    throw new Error(`${name} is required and must be at most ${maxLength} characters`);
  }
  return trimmed;
}

async function main() {
  const command = process.argv[2];
  const notifications = await import("./routes/notifications.js");

  if (command === "devices") {
    const devices = notifications.listRegisteredDevices();
    console.table(devices);
    console.log(`Registered devices: ${devices.length}`);
    return;
  }

  if (command === "send") {
    const title = validateText(readOption("--title"), "--title", 100);
    const body = validateText(readOption("--body"), "--body", 500);
    const userId = readOption("--user-id")?.trim();
    const result = userId
      ? await notifications.sendNotificationToUser({ userId, title, body })
      : await notifications.sendNotificationToAll({ title, body });
    console.log(JSON.stringify(result, null, 2));
    if (result.failure > 0) process.exitCode = 1;
    return;
  }

  console.error(usage.trim());
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(`[Notifications] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
