# Security

Project Phoenix is for authorized device servicing only. It must not bypass lock screens, FRP, Activation Lock, secure boot, manufacturer authorization, or other anti-theft controls. It must not extract credentials, tokens, private keys, personal data, or authentication material.

The current desktop build has a testable approval boundary: consent requests and license records persist in SQLite; administrator approval uses a local PIN; licenses are Ed25519-signed, bound to request/job/device/operation, expire after seven days, support revocation, and produce audit events. The local signing key is development/test infrastructure only and is not suitable for production key custody. Gmail/Outlook delivery is not automatic yet.

The build still has no device mutation path. Future native operations must use least privilege, strict argument construction, stable identity revalidation, structured privacy-conscious logs, OS credential storage for secrets, signed updates, integrity verification for downloaded images, explicit destructive-operation confirmation, disconnect handling, and physical-device safety testing. A valid test license therefore does not erase or flash a device.

Report security issues privately to the project maintainers before public disclosure. Include reproduction steps, affected component, impact, and a safe mitigation if known.
