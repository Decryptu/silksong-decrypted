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
python tools/export_yaml_schema.py --check
node --test tools/test_yaml_generator.mjs
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

## Windows release candidate

The `0.5.5-rc.1` plugin ZIP and `silksong.apworld` were packaged from revision `336c6bf` with SHA-256 checksums. An isolated Archipelago 0.6.8 install generated solo and two-player rooms from seed `12345` using the packaged world, and both room archives passed ZIP integrity checks.

The extracted plugin joined the two-player room on Silksong 1.0.30000 with BepInEx 5.4.23.3. A fresh save sent the opening Hunter Crest check and received Shaman Crest. A controlled Delver's Drill check from Lace delivered a Flea to Hornet, which was recorded in the native save alongside the opening check. A local virtual controller supplied the opening held input. After a process restart with only the release package installed, Hornet reconnected and loaded the same save into Moss Grotto. See [player setup](SETUP.md) for the manual install and room workflow.

## Map tracker smoke test

On Silksong 1.0.30000, the Release plugin connected to the two-player seed `12345` on Archipelago 0.6.8. A diagnostic probe exercised the live map marker filters in the dedicated test save. The Bone Bottom spool fragment moved from Reachable to Checked after the server recorded it. After Swift Step and Cling Grip arrived, the number of visible reachable checks increased from 12 to 13. Turning off F6 logic restored the full unchecked view with a reachability filter selected. Reconnecting through F3 preserved the three mapped checked locations and the filter results.

Universal Tracker v0.3.8 connected to the same local room as Hornet. After replaying the test checks that delivered Flea, Clawline, Swift Step, and Cling Grip, its `--nogui --list` output matched the live map’s Reachable filter by location name across all 13 results. The map also reported 219 blocked and one unknown unchecked location. The comparison covered the reachable lists at this progression snapshot.

## Experimental shuffle generation

On Archipelago 0.6.8, solo seed `12345` generated an Act 1 playthrough reaching `Goal: Victory` for each of these configurations:

- Coupled entrances with `interiors`, `within_areas`, or `full` scope. The room data contained 12, 226, and 247 reciprocal pairs respectively, with matching destinations in the exported entrance layout.
- Boss, enemy, and NPC Souls together. The room exported 13 boss, 72 enemy, and 47 NPC soul entries.
- Skills set to `anywhere`, with ledge grab and swimming randomized, split dash and sprint, and directional variants for Swift Step, Cling Grip, Clawline, and ledge grab.
- The soul and traversal configurations together with coupled interior entrances.

The soul, traversal, and combined tests used `anywhere` for both `rosary_cache_randomization` and `shell_shard_cache_randomization`. With default cache settings, generation rejected the boss and NPC soul pool and the directional traversal pool because each required more filler slots than were available. The traversal error now points to cache or resource checks as a way to add filler.

The combined configuration also generated a five-flea Flea Hunt playthrough reaching `Goal: Victory` on seed `54321`. The separate soul and traversal rooms retained the opening Crest check and identical slot data when the test client reconnected. The combined Act 1 room retained the same data after a server autosave and restart.

On Silksong 1.0.30000, the five-flea seed ran in a dedicated save folder. The game sent the opening Crest check. Controlled Archipelago checks delivered the Mossgrub soul, left Cling Grip, three Progressive Swift Steps, and four Fleas. A native save followed by a full process restart and offline load restored the four Fleas, Swift Step level 3, and the recorded checks. A diagnostic probe invoked the native transitions for the coupled Marrow and Greyroot doorway (`Bone_08/door1` ↔ `Room_Witch/left1`), and both directions were recorded. After the game reconnected, the fifth Flea triggered the goal report before the server released the remaining items. The final local save recorded the goal, both explored entrances, and the tested items. The test used controlled check submissions and scene access, so natural progression through the seed and the effects of soul gating still need playtesting.

### Next playtest

Generate solo seed `54321` on Archipelago 0.6.8 with `--spoiler 2` and the following player YAML. Use a fresh dedicated save.

```yaml
name: Hornet
game: 'Hollow Knight: Silksong'
'Hollow Knight: Silksong':
  goal: flea_hunt
  flea_hunt_count: 5
  boss_souls: true
  enemy_souls: true
  npc_souls: true
  skill_randomization: anywhere
  ledgegrab_ability_rando: true
  swim_ability_rando: true
  split_dash_and_sprint: true
  directional_swift_step: true
  directional_ledge_grab: true
  directional_cling_grip: true
  directional_clawline: true
  entrance_randomization: coupled
  entrance_randomization_scope: interiors
  rosary_cache_randomization: anywhere
  shell_shard_cache_randomization: anywhere
```

On Silksong 1.0.30000, a fresh randomizer save on seed `54321` reached Moss Grotto East from Bone Bottom. Mossgrub was absent along the approach before the soul check. A jumping upward strike broke Moss Grotto Shell Shard Cache #2 and Archipelago delivered Soul of Mossgrub. After leaving and re-entering the room, the enemy appeared. Defeating it sent the first-kill check and delivered left Cling Grip. The run used a local virtual gamepad for ordinary game input, with scripted checks and diagnostic warps disabled. Both checks persisted after saving and reloading at Bone Bottom.

In the same live room, four controlled location checks delivered four Fleas. A separate fifth check at The Marrow Rosary Cache #12 delivered the fifth Flea. Archipelago recorded Hornet's goal completion immediately afterward, before releasing the remaining items. The check driver submitted location checks only. This verifies live goal reporting. A full playthrough of the shuffled route remains untested.

## The Mist and Red Memory

- **The Mist.** The room graph connects the Sinner’s Road (`Dust_05`) and Bilewater (`Shadow_04`) approaches to Exhaust Organ (`Dust_09`) through abstract maze traversal rules requiring Needolin, one Progressive Silkheart, and approach movement. In 1.0.30000, both approaches enter the same cap scene (`Dust_Maze_09_entrance/right1`) with `neededCorrectDoors = 7` and `restScenePoint = 3` (five Silkfly rooms plus the entrance and `Dust_Maze_crossing` rest room). `MazeController` checks Needolin ownership when assigning the ordinary correct door. Inspecting `Hero_Hornet(Clone)`’s `Silk Specials` → `Needolin Sub` FSM and live Mist rooms confirms why the one-Silkheart rule should stay: `Try Needolin` cancels whenever `Silk < 1` (`CheckIsSilkDrainDisabled` is cheat-only), each Needolin activation drains at least `1` Silk (measured `9 -> 8` on a single tap), and `Dust_Maze_09_entrance` (which has a bench), the first interior room (`correctLeft = 7`), and `Dust_Maze_crossing` contain zero enemies. Later interior rooms (`correctLeft <= 6`) spawn `Wraith(Clone)` enemies (`type=Regular`, `DoNotGiveSilk=False`), so zero-Silkheart traversal cannot start Needolin after benching or running out of Silk without backtracking outside the Mist (`Dust_05`/`Shadow_04`) or farming Wraiths. The earlier Sinner’s Road probe exit failure was caused by `TransitionPoint.TryDoTransition` rejecting triggers when Hornet is not facing or moving into the gate direction (`left`/`right`/`top`).
- **Red Memory.** The Act 3 logic requires escaping the Abyss, reaching the chapel ritual, and offering three of the four Old Hearts. The graph makes the Everbloom check available after the ritual and requires receipt of Everbloom for progression gated by the flower. Auditing `Memory_Red`’s `door_wakeInRedMemory Root` `Wake Up` FSM exposed two client issues when Everbloom is randomized:
  1. `RedMemorySkip.RewardSequence` rewrote `Start Wait`’s transition `ToState` to `Set State` without updating `ToFsmState`, so PlayMaker still followed its cached transition into `Low Graphics?` → `Play Timeline` → `Dlg`. Updating `ToFsmState = reward` skips the final timeline and dialogue as intended.
  2. `Get Item Msg` spawns the vanilla full-screen Everbloom popup via `CreateUIMsgGetItem`. Whitelisting `EverbloomSource` in `VanillaPickupPopupPatches.RandomizedItemGetMessagePatch` suppresses the false vanilla popup when Everbloom is an active AP location and dispatches `GET ITEM MSG END` into `Award Achievement` → `End Scene` (`Tut_04/door_ritualEnd`).

With both fixes built in Release and loaded in Silksong 1.0.30000 on slot 4, entering `Memory_Red` (`door_wakeInRedMemory Root`) from `Tut_04` with local Everbloom cleared skipped the timeline/dialogue, set `CompletedRedMemory = true` while keeping `HasWhiteFlower = false` (`White Flower` amount `0`), suppressed the vanilla Everbloom popup, and automatically returned Hornet to `Tut_04` at `door_ritualEnd`.

- **Abyss flower gate (`Abyss_05`).** Live checks in `Abyss_05` verified both prerequisites of the physical dive gate (`Abyss Dive Cutscene` → `Last_Dive`):
  - `CompletedRedMemory = true`, `White Flower = 0` (before AP delivery): `HasWhiteFlower = false`, `Abyss Dive Cutscene` inactive.
  - `CompletedRedMemory = false`, `White Flower = 1` (flower owned before ritual): `HasWhiteFlower = false` via `EverbloomStoryGate`, `Abyss Dive Cutscene` inactive.
  - `CompletedRedMemory = true`, `White Flower = 1` (after AP delivery): `HasWhiteFlower = true`, `Abyss Dive Cutscene` active, and interacting dives cleanly into `Last_Dive`.

For a generation check, use the solo YAML above with `goal: act_3`, `silk_heart_randomization: anywhere`, `old_heart_randomization: anywhere`, and `everbloom_randomization: anywhere`. Run seed `12345` with `--spoiler 2`. Archipelago 0.6.8 generated a playthrough ending in `Goal: Victory`. This verifies that the generator can fill that configuration.

For Unity research, reuse an existing ILSpy command-line installation with `ilspycmd -t <Type> <path-to-Assembly-CSharp.dll>`. Inspect individual types as needed and keep all decompiled output outside the repository.

## Bellhome Act 3 phase toggle

Verified the Act 3 ↔ late Act 2 world-phase toggle (`BellhomePhasePatches.cs`) live on Silksong 1.0.30000 using the Release plugin on dedicated test slot 4 and virtual gamepad inputs (`RightTrigger` for Dash, `Action4` for Needolin, `Action1` for Submit, `Action2` for Cancel):

- **Scene and bench bindings.** `Belltown_Room_Spare` exposes `RestBench` (`Bench Control` FSM, `Resting` state with `ListenForDreamNail`) and exit gate `left1` → `Belltown/door5`, matching `BellhomePhaseManager`.
- **Unlock gating and input order.** Before Act 3 wake-up (`blackThreadWorld = false`, `act3_wokeUp = false`, `bellhomePhaseToggleUnlocked = false`), holding Dash and pressing Needolin on the Bellhome bed did not open a prompt. Once Act 3 wake-up was complete (`blackThreadWorld = true`, `act3_wokeUp = true`), `BellhomePhaseManager.Update()` unlocked `bellhomePhaseToggleUnlocked = true`. Because the hook checks `Dash.IsPressed` alongside `DreamNail.WasPressed`, players must hold Dash and then press Needolin while resting; verified this triggers even with `hasDash = false`, `hasNeedolin = false`, and `silk = 0`.
- **Cancel and Act 3 → Act 2 revert.** Pressing Cancel (`Action2`) closed `DialogueYesNoBox` cleanly and kept Hornet resting on `RestBench` with `blackThreadWorld = true`. Confirming Yes (`Action1`) on `"Return Pharloom to its late Act 2 state? Your Act 3 progress will be preserved."` saved automatically, logged `Bellhome shifted Pharloom to the late Act 2 world phase.`, reloaded `Belltown_Room_Spare/left1` cleanly (`controlReqlinquished = false`), flipped `blackThreadWorld = false` and `MapLogicEvaluator.IsActThreeActive = false`, and preserved `act3_wokeUp`, `bellhomePhaseToggleUnlocked`, `visitedAbyss`, `completedAbyssAscent`, and `CompletedRedMemory`. Exiting through `left1` into `Belltown` loaded Bellhart in its Act 2 state (`Black Thread World` and `Song Region Act3` inactive).
- **Persistence and Act 2 → Act 3 restore.** Closing and relaunching Silksong and reloading slot 4 from disk restored `Belltown_Room_Spare` with `blackThreadWorld = false` and `<bellhomePhaseToggleUnlocked>true</bellhomePhaseToggleUnlocked>` intact. Holding Dash + pressing Needolin on the bed opened `"Restore the Black Thread world and return to Act 3? Your Act 3 progress will be preserved."`, and confirming Yes saved, reloaded `Belltown_Room_Spare/left1` with `blackThreadWorld = true` and `MapLogicEvaluator.IsActThreeActive = true`, preserved Act 3 flags, and restored Bellhart's Act 3 Black Thread state upon exiting to `Belltown`. See [player setup](SETUP.md#return-to-act-2-from-act-3).

## First-party YAML generator

The web YAML generator lives in `site/yaml.html`, backed by `site/yaml-core.js`, `site/yaml-ui.js`, and the generated schema in `site/yaml-schema.json`.

- Run `python tools/export_yaml_schema.py` whenever `APWorld/silksong/options.py` or `APWorld/silksong/version.py` changes. Pass `--check` to verify the committed schema is up to date, and optionally `--archipelago-lib <path-to-library.zip>` to cross-check against Archipelago's `Options` module.
- Run `node --test tools/test_yaml_generator.mjs` to test schema integrity, all seven presets (compact and full-defaults round-trips), YAML alias/weighted-choice import, incompatibility validation with quick fixes, and DOM/asset references.
- Run `python tools/verify_yaml_exports.py --rebuild-apworld` to verify exported YAMLs against `ArchipelagoGenerate.exe` (Archipelago 0.6.8). All seven solo presets (including full-defaults `standard` on seed `12345` and `experimental_chaos` on seed `54321`) and a three-player mixed multiworld (`Hornet`, `Lace`, `Shakra`) generated valid room ZIP archives.
- Clean-profile browser verification against a local static server covered both `site/index.html` (all Join/Host × manual/Cogfly/r2modman checklist branches, progress persistence, reset, and checklist link into `yaml.html`) and `site/yaml.html` (all presets, search/changed-only/Beta filters, incompatibility validation with quick fixes, `.yaml` file import, clipboard copy, `.yaml` download verified with `ArchipelagoGenerate.exe`, reset defaults persistence, and zero horizontal overflow across `1280x900`, `995x850`, and `390x844` viewports with zero console or HTTP errors).

## Contributions

Use `feature/<task>` branches. Install the publication hooks with `git config core.hooksPath .githooks`. Preserve upstream credits and check outgoing metadata. Use small targeted checks and temporary outputs. Keep game assemblies, decompiled source, saves, and local configuration out of Git.

For future upstream updates use `tools/sync-upstream.ps1` and merge `clean/upstream-main` after checking the changes. Preserve protocol IDs and save compatibility unless a planned version migration requires a change.
