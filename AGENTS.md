# Project handoff

- The user keeps the GitHub Desktop repository at `D:\G\limbusbattle`.
- After completing and checking changes made in the working copy, synchronize the project there using `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/sync-repository.ps1`.
- The sync script preserves `.git`, unrelated files, local dependencies, and user edits that conflict with the last synchronized version. Inspect and resolve any reported conflict; never silently overwrite it.
- When already working in `D:\G\limbusbattle`, edit and check the repository directly; the script becomes a no-op.
- The user handles GitHub Desktop commits, pushes, and publication. Do not commit, push, or deploy without a new user instruction.
- `public/runtime` contains the committed mobile atlases needed by Node-only builds. Source art is retained in `public/characters`. When changing art, regenerate runtime atlases with `python scripts/build-pixel-atlases.py`.
