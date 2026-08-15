# Security release checklist

The code-level remediation is complete, but the following account-owned steps
must be completed before store submission.

## Credentials and Git history

- Rotate every Firebase service-account/private key and Shopify Admin or
  Storefront token that has ever existed in this repository.
- Update the production secret manager and revoke the old credentials before
  deploying this release.
- A history scan found historical commits containing private-key and Shopify
  token patterns. After rotation, use `git filter-repo` to remove the exact
  affected secret files/values from every ref.
- Do not rewrite or force-push shared refs without explicit repository-owner
  approval. Coordinate a freeze, preserve a recovery bundle, force-push all
  rewritten refs, invalidate old forks/caches where possible, and require fresh
  clones from every contributor and deployment worker.

## App and universal links

- Replace the placeholder in
  `deployment/associations/assetlinks.json.template` with the Play Console
  **App signing key certificate SHA-256** (not an upload/debug key), publish it
  as `https://alclean.pk/.well-known/assetlinks.json`, and verify the live
  response.
- Replace the placeholder in
  `deployment/associations/apple-app-site-association.template` with the Apple
  Team ID, publish it as
  `https://alclean.pk/.well-known/apple-app-site-association` without a file
  extension, and verify the live response and content type.
- Verify the live records contain exactly package/bundle
  `com.alclean.app` and only the intended `/account` path before submission.

## Store privacy declarations

Play Data Safety and App Store Privacy must disclose app-functionality
collection of:

- name, email address, phone number, and physical address;
- purchase/order history;
- the device notification identifier used by Firebase Cloud Messaging.

Declare that the data is linked to the customer where applicable, is used for
account, checkout, fulfillment, support, and notifications, and is not used for
tracking or advertising. Firebase Analytics has been removed. Answers about
retention and deletion must match the production backend policy.

## Signed-release verification

- Android: inspect the merged release manifest and signed AAB/APK. Require
  `allowBackup=false`, `usesCleartextTraffic=false`, no debuggable flag, no
  AD ID/AdServices/install-referrer permission, and explicit `exported` on
  every component with an intent filter.
- iOS: create a distribution archive on macOS, then inspect the signed archive
  with `codesign -d --entitlements :- <App.app>`. Require production
  `aps-environment`, the packaged `PrivacyInfo.xcprivacy`, no arbitrary ATS
  loads, and no inspectable/debug WebView entitlement.
- Re-run `npm test`, `npm run typecheck`, `npm run build`, and
  `npm audit` in both projects from a clean checkout.
