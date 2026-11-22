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

## Seed generation baseline

Archipelago 0.6.8 generated both a solo world and a two-player Silksong multiworld from seed `12345` using default options. Both output archives passed ZIP integrity checks.

To reproduce, place this YAML in a dedicated player directory as `Hornet.yaml`. For the two-player run, add `Lace.yaml` in a separate player directory alongside a copy of `Hornet.yaml`, and change its `name` to `Lace`.

```yaml
name: Hornet
game: 'Hollow Knight: Silksong'
'Hollow Knight: Silksong': {}
```

With the packaged APWorld installed, run the generator from the Archipelago directory. The example paths assume `solo` and `multi` are the two player directories.

```powershell
.\ArchipelagoGenerate.exe --player_files_path solo --multi 1 --seed 12345 --outputpath solo-output --spoiler 1
.\ArchipelagoGenerate.exe --player_files_path multi --multi 2 --seed 12345 --outputpath multi-output --spoiler 1
```

The Release plugin built with .NET SDK 9.0.321 and BepInEx 5.4.23.3, and loaded in Silksong 1.0.30000. In the two-player room, the game sent the opening Crest check, applied a Flea from a simulated check on the second Archipelago slot, and reconnected through the F3 menu. Saving and quitting to the title screen, then reopening the test save from disk, resumed gameplay with the same Archipelago slot and seed.

## The Mist and Red Memory

- **The Mist.** The room graph connects the Sinner’s Road and Bilewater approaches to Exhaust Organ through abstract maze traversal rules. Both approaches require Needolin and one Progressive Silkheart, with separate movement requirements. The game’s maze controller in 1.0.30000 uses Needolin ownership when assigning the ordinary correct door. The two graph routes from Exhaust Organ back toward the approaches require Phantom’s defeat. Live traversal from both sides and the need for a Silkheart still need verification.
- **Red Memory.** The Act 3 logic requires escaping the Abyss, reaching the chapel ritual, and offering three of the four Old Hearts. The graph makes the Everbloom check available after the ritual and requires receipt of Everbloom for progression gated by the flower. In a slot 3 smoke test on seed `12345` with shuffled Everbloom, the chapel transition reached the final dialogue, Archipelago recorded the Everbloom check and awarded a Flea, and Red Memory completion persisted after restarting the game. The `HasWhiteFlower` story predicate was false before Everbloom arrived and true after a simulated Wispfire Lantern check delivered it. On reload it was briefly false again and returned to true after the next scene change. The test used a local probe to start the chapel transition, advance the dialogue, and return to the chapel. The Old Heart offerings, native return sequence, and physical passage through the flower gate still need a full playthrough.

For a generation check, use the solo YAML above with `goal: act_3`, `silk_heart_randomization: anywhere`, `old_heart_randomization: anywhere`, and `everbloom_randomization: anywhere`. Run seed `12345` with `--spoiler 2`. Archipelago 0.6.8 generated a playthrough ending in `Goal: Victory`. This verifies that the generator can fill that configuration. The spoiler’s winning route does not establish that either Mist entrance is traversable in game.

The first slot 3 reload tested an outstanding item. The server had awarded Everbloom, but the local save contained only the location check. In the follow-up, the item applied after a transition to normal gameplay. A local probe invoked the game's save routine and confirmed that both the received item list and receipt history contained Everbloom. After restarting Silksong and loading slot 3 offline, `CompletedRedMemory` and `HasWhiteFlower` were already true in the starting chapel, before traversing any room exits.

For Unity research, reuse an existing ILSpy command-line installation with `ilspycmd -t <Type> <path-to-Assembly-CSharp.dll>`. Inspect individual types as needed and keep all decompiled output outside the repository.

## Contributions

Use `feature/<task>` branches. Install the publication hooks with `git config core.hooksPath .githooks`. Preserve upstream credits and check outgoing metadata. Use small targeted checks and temporary outputs. Keep game assemblies, decompiled source, saves, and local configuration out of Git.

For future upstream updates use `tools/sync-upstream.ps1` and merge `clean/upstream-main` after checking the changes. Preserve protocol IDs and save compatibility unless a planned version migration requires a change.
