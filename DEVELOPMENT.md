# Development

The BepInEx plugin is in `src/SilksongRandomizer`. The Python world, logic, options, location data, and tracker integration are in `APWorld/silksong`. The GitHub Pages site is in `site`.

## Local setup

- Install the .NET 9 SDK required by `global.json` and Python for Archipelago development.
- Use Archipelago 0.6.8 or later. On the development machine the launcher is under `C:\ProgramData\Archipelago`.
- Set `SILKSONG_GAME_DIR` to your Steam installation, or to a local build reference directory containing the game’s Managed directory and a BepInEx 5 core directory. Prefer a dedicated mod profile for playtesting.

```powershell
$env:SILKSONG_GAME_DIR = 'C:\Program Files (x86)\Steam\steamapps\common\Hollow Knight Silksong'
dotnet build src/SilksongRandomizer/SilksongRandomizer.csproj --configuration Release
python tools/build_apworld.py --output dist/silksong.apworld
python -m http.server 8000 --directory site
```

Install the resulting APWorld in the launcher’s custom worlds and generate a fresh room. Install the matching plugin build into the test profile, connect it to that room, and use a dedicated save. Verify generation, a local check, a received item, and reconnect with the same save. Keep the game files and save backups local.

For Unity research, reuse an existing ILSpy command-line installation with `ilspycmd -t <Type> <path-to-Assembly-CSharp.dll>`. Inspect individual types as needed and keep all decompiled output outside the repository.

## Contributions

Use `feature/<task>` branches. Install the publication hooks with `git config core.hooksPath .githooks`. Preserve upstream credits and check outgoing metadata. Use small targeted checks and temporary outputs. Keep game assemblies, decompiled source, saves, and local configuration out of Git.

For future upstream updates use `tools/sync-upstream.ps1` and merge `clean/upstream-main` after checking the changes. Preserve protocol IDs and save compatibility unless a planned version migration requires a change.
