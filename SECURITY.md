# Security

Project Phoenix is for authorized device servicing only. It must not bypass lock screens, FRP, Activation Lock, secure boot, manufacturer authorization, or other anti-theft controls. It must not extract credentials, tokens, private keys, personal data, or authentication material.

The MVP has no device mutation path. Future native operations must use least privilege, strict argument construction, structured privacy-conscious logs, OS credential storage for secrets, signed updates, integrity verification for downloaded images, and explicit destructive-operation confirmation.

Report security issues privately to the project maintainers before public disclosure. Include reproduction steps, affected component, impact, and a safe mitigation if known.
