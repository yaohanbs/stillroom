# Stillroom accounts

1. In Supabase SQL Editor, paste and run `supabase-setup.sql`. It creates one RLS-protected JSON workspace per authenticated user, explicit authenticated grants, and a compare-and-save function. No anonymous data access is granted.
2. Authentication → URL Configuration: set Site URL and an allowed redirect URL to `https://yaohanbs.github.io/stillroom/`.
3. Authentication → Sign In / Providers → Email: keep email sign-up and Confirm email enabled. Configure custom SMTP before opening registration broadly; Supabase's built-in email sender has restrictions and rate limits.
4. For Google: create a Web application OAuth client in Google Cloud. Add `https://yaohanbs.github.io` as an authorized JavaScript origin. In authorized redirect URIs, add the exact callback URL shown in Supabase's Google provider screen (`https://bslznpfuexoblxnkjgel.supabase.co/auth/v1/callback`). Enter the client ID and client secret directly in Supabase's Google provider settings and enable it. Configure the Google consent screen/audience for intended users; testing mode limits access to listed test users. Do not put the Google client secret into frontend files or chat.
5. `static/cloud-config.js` contains only the public project URL, publishable key and return URL. Secret/service-role keys must never be used here. Revoke any previously disclosed secret key in Supabase.
6. Publish the updated static files. Create a real account yourself, confirm its email, then sign in. Account → Copy guest progress explicitly replaces the account workspace with this browser's guest study records; it never imports guest data automatically. Export backups before replacing either copy.

## Verification before inviting users

- Confirm an email signup cannot sign in until its email is verified.
- Add a note, finish a focus session and verify “Saved to your account”. Sign in on a second device and verify the records and streak.
- Sign out and sign in to another account. Verify notes and progress are isolated, including file caches.
- With two accounts, verify account A cannot select/update/insert B's workspace through the Data API. Anonymous access must fail. These live checks require real authenticated test accounts; local mocks alone do not prove database policies are installed.
- Edit on two devices. A stale revision must pause sync rather than overwrite newer data. Resolve explicitly in Account, after exporting a backup.

## Current boundaries

Notes, tasks, calendar, completed sessions, themes and progression sync. File contents, file metadata, audio tracks and active timers remain device-local, in account-specific caches. Signing out returns to the original separate guest workspace. Signed-in workspace caches and sessions persist on this browser; use trusted devices. Cloud storage is limited to 2 MB per workspace. “Clear workspace” clears study data and this account's local attachments but does not delete the Supabase account. User/account deletion needs a separate authenticated server flow or administrator action. Google login grants basic sign-in only, not Gmail or Calendar permissions.

Pending local edits retry while the page is open and online. Closing a tab immediately after editing can leave changes only in that device's cache; wait for “Saved to your account”. Reopen the same account on the same device to retry. Open the app again to load the latest cloud copy, or choose Sync now when there are no local edits. This is version-protected snapshot sync, not live collaborative editing.

Run `node test_cloud.cjs`, `node test_growth.cjs`, and `node test_themes.cjs`. Cloud tests cover account cache separation, excluded device-only fields, revision writes, conflicts, offline retention and edits during an in-flight save. Real email/Google sign-in and RLS isolation must also be checked against the configured project.
