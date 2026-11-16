# Codespaces read-only inspection

The `Inspect Codespaces securely` Actions workflow runs only when manually dispatched. It needs the repository Actions secret `GH_CODESPACES_TOKEN`, restricted to this repository, with `Codespaces` and `Codespaces lifecycle admin` read/write permission. It uses GitHub's own runner so its credential is not replaced by the managed cloud environment's repository-authentication gateway.

The workflow only calls GET endpoints. It does not start, export, modify, stop or delete a Codespace. A successful inventory is not proof that code, ignored files or private configuration have been backed up. Those checks remain required before any deletion.

Codespace names, branch status and last-used dates are encrypted before artifact upload, because this is a public repository. The committed PEM file is only a public encryption key. The private key is retained outside the checkout in the owner's Codex workspace, not in Git or Actions. The inspection report uses a fresh AES-256-GCM key, wrapped with RSA-OAEP-SHA256, and artifacts expire after three days.

This encryption key is for maintenance reports, not a Windows publisher certificate. Do not commit the private key or a personal access token. Before replacing the public key, retain the private key needed to read previous reports. If the private key has been lost, perform a new inspection with a new key; do not delete Codespaces based on an unreadable report.
