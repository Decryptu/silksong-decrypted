# Reference mods

Mods that Silksong Decrypted can learn from, integrate with, or reuse. Surveyed on 2026-11-23 after playtester feedback comparing us with the Hollow Knight randomizer and Archipelago mods. The [roadmap](ROADMAP.md#next-up) turns this into work items.

## Playtester feedback

The main playtester's favourite parts of the Hollow Knight randomizer and Archipelago setup:

- **Benchwarp.** Warp to any visited bench. Silksong already has a port (see below).
- **Map pins that show the check type.** In Hollow Knight, Geo checks show a Geo rock, bosses show their head, and so on. Our default pin is the Rosary AP icon, so every check looks the same.
- **Reachability on the map.** In Hollow Knight, pins you can reach with your current items are big and in colour, and the rest are small and grey. The playtester did not know we have this, because it is experimental and off by default.
- **Settings.** The Hollow Knight settings were good. Our options are worth comparing against them.

## What we already have

Most of the map work exists but is hidden behind defaults (`src/SilksongRandomizer/Plugin.cs`):

| Feature | Where | Current default |
| --- | --- | --- |
| Category pins (44 icons in `Assets/MapPins/`, picked by the location's original category) | `CategoryMapIcons.cs`, config `Map Markers / Marker Style` | `Rosary AP` (single icon for everything) |
| Reachability (Reachable / Blocked / Unknown, requirements in the pin tooltip) | `MapLogicEvaluator.cs`, `Patches/CheckMapMarkerPatches.cs`, config `Show Logic (Experimental)`, F6 | Off. Blocked pins only drop to 48% opacity |
| Check filters (Unchecked, Reachable, Blocked, Unknown, Checked) | config `Map Markers / Check Filter` | `Unchecked` |
| Hinted checks | white outline on the pin | On |
| Recovery warp to unlocked hubs | `FastTravelUtil.cs`, F4, destination picked in F3 | On |
| Benchwarp compatibility (soft dependency on `io.github.homothetyhk.benchwarp`) | `OptionalModCompatibility.cs`: start bench follows the randomized start, Slab safety check before warping | Untested in game, undocumented. The APWorld FAQ (`APWorld/silksong/docs/setup_en.md`) still has upstream's "no Benchwarp" answer |

Bosses use the generic `First Time Kill` pin. There is no per-boss art yet.

## Licences and reuse

Silksong Decrypted is MIT licensed. That decides how each mod below can be used:

- **MIT:** code can be copied or adapted, keeping the copyright notice.
- **LGPL-2.1:** call it as a separate DLL (soft dependency, reflection, or its public API). Copying its code into our DLL would put that code under the LGPL, so avoid it.
- **GPL-3.0:** ideas and behaviour only. Do not copy code.
- **EUPL-1.2:** use as a dependency only.
- **No licence:** ideas only.

## Hollow Knight mods

| Mod | Licence | What to take |
| --- | --- | --- |
| [RandoMapMod](https://github.com/syyePhenomenol/RandoMapMod) (on [RandoMapCore](https://github.com/syyePhenomenol/RandoMapCore), LGPL, and [MapChanger](https://github.com/syyePhenomenol/MapChanger), GPL) | GPL-3.0 | The reference design for our map. Reachable pins big and coloured, unreachable small and grey. Pin selection panel with room, status, logic requirements, previewed item, and costs with tick/cross for affordability. Map key / legend panel. Toggles for pools, pin shape, pin size, and map modes (full map, pins over area, pins over room). Progress hint key that pans the map to a check that unlocks progression. Item compass toward reachable checks. Benchwarp pins on the map, select a bench and warp. Transition mode with a pathfinder from your room to a selected room, including benchwarp steps, plus a route compass. Custom colours from a `colors.json`. Ideas only. |
| [Archipelago.APMapMod](https://github.com/ArchipelagoMW-HollowKnight/Archipelago.APMapMod) | GPL-3.0 | RandoMapMod fork for Archipelago. Its pin art set (`LegendAssets/Pins/`: Geo, Grub, Charm, Key, Lore, Bench…) is the "check type" look the playtester means. Ideas only. |
| [Archipelago.HollowKnight](https://github.com/ArchipelagoMW-HollowKnight/Archipelago.HollowKnight) | MIT | `BenchSyncModule`: stores unlocked benches in Archipelago data storage and unlocks them in Benchwarp, so benches carry across saves and co-op slots. `GiftingModule`: Archipelago gifting via `Archipelago.Gifting.Net`. `HintTracker`: tracks hints through data storage and scouts hinted locations. Also `DupeHandlingModule`, `RepositionShadeModule`, `StartLocationSceneEditsModule`. Code can be adapted. |
| [RandomizerMod](https://github.com/homothetyhk/RandomizerMod) | LGPL-2.1 | Settings menu layout and presets, for comparing against our options. |
| [Benchwarp](https://github.com/homothetyhk/HollowKnight.BenchwarpMod) | LGPL-2.1 | Ported to Silksong (below). |
| [CustomKnight](https://github.com/PrashantMohta/HollowKnight.CustomKnight) | MIT | The skin changer: player, inventory and save-select skins, switchable at runtime. Silksong has its own equivalents (below), so we only need compatibility. |

## Silksong mods

| Mod | Licence | What to take |
| --- | --- | --- |
| [Silksong.Benchwarp](https://github.com/homothetyhk/Silksong.Benchwarp) ([Thunderstore](https://thunderstore.io/c/hollow-knight-silksong/p/homothety/Benchwarp/)) | LGPL-2.1 | Benchwarp port by homothety. Modes: visited benches only, warp to respawn, unlock all, door warp. Public API in `Benchwarp/Events`: `BenchListModifiers.OnGetStartDef` (we already hook it), `BenchSuppressors`, `BenchInjectors`, `BenchComparisons`, `ModEvents.OnBenchwarp` / `OnDoorwarp`, and `HotkeyRequests` for two-letter hotkeys. `Benchwarp/Data/BaseBenchList.cs` has bench scenes and respawn markers for map pins, and `Doors/` has cleaned transition and obstacle data. Needs DataManager, I18N, ModMenu, Prepatcher, FsmUtil and AssetHelper, so a manual install is painful without a Thunderstore manager. |
| [ItemChanger.Silksong](https://github.com/homothetyhk/ItemChanger.Silksong) on [ItemChanger.Core](https://github.com/BadMagic100/ItemChanger.Core) | LGPL-2.1 | Work-in-progress ItemChanger port. Together with homothety's `Silksong-Randomizer-Organization-Stub` issue list (logic, settings menu, pools, quests, Steel Soul), it shows a first-party Silksong randomizer is being designed. Watch it: shared item and location definitions could save work later. |
| [Patchwork](https://github.com/Ashiepaws/silksong-patchwork) and its fork [Stitchwork](https://thunderstore.io/c/hollow-knight-silksong/p/SilksongSkinCreators/Stitchwork/) | MIT (Patchwork) | The Silksong skin loaders (successors to Silksong Customizer). Sprite, Texture2D, audio, cutscene and text replacement with live reload. Skins such as Nightmare Hornet and Ghost of Pharloom use them. Our answer to CustomKnight is to test and document compatibility, not to build a skin system. |
| [MapWarp](https://github.com/jakobhellermann/silksongmod-MapWarp) | None | Mouse zoom and pan on the map, right-click to warp. Ideas only (no licence). |
| [Completionist Map](https://thunderstore.io/c/hollow-knight-silksong/p/Yoraiz0r/Completionist_Map/) | Unknown | The Silksong map mod the playtester mentioned. Pins for items, interactables and enemies, toggles and pings. No reachability. No source found. |
| [silksong-modding](https://github.com/silksong-modding) libraries (ModMenu, DataManager, I18N, FsmUtil, AssetHelper, Prepatcher) | EUPL-1.2 | Shared modding libraries that Benchwarp depends on. Use as dependencies if we adopt them. |
| [Silksong.DebugMod](https://github.com/hk-speedrunning/Silksong.DebugMod) | MIT | Savestates, teleports and inspection. Useful for playtesting. |
| [SSMP](https://github.com/Extremelyd1/SSMP) | LGPL-2.1 | Silksong multiplayer. Possible future compatibility target. |
| [Cogfly](https://github.com/Nix-main/Cogfly) | GPL-3.0 | The mod manager many players use. Silksong Decrypted is not on Thunderstore, so Cogfly cannot install it or its optional dependencies. |
