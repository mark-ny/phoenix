# OS Manager preflight test

The OS Manager feature in this build is a non-destructive preflight checklist. It checks the native runtime, ADB, Fastboot, visible devices, image-integrity readiness, and deployment guardrails. It does not flash, erase, unlock, bypass, or otherwise modify a device.

## Windows test

1. Install Android Platform-Tools and confirm `adb version` and `fastboot --version` work.
2. Launch Phoenix.
3. Open **OS Manager**.
4. Click **Open preflight checklist**.
5. Confirm the checklist reports the local platform, ADB/Fastboot availability, and device count.
6. Connect an authorized test device and run the checklist again.
7. Confirm the device count changes and that no command window appears.
8. Confirm **Deployment guardrail** remains blocked.

A clean test must not involve flashing, erasure, bootloader unlocking, bypass, or customer data.
