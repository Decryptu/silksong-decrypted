# Reference mods

Mods that Silksong Decrypted can learn from, integrate with, or reuse. Surveyed on 2026-11-23 after playtester feedback comparing us with the Hollow Knight randomizer and Archipelago mods. The [roadmap](ROADMAP.md#next-up) turns this into work items.

## Playtester feedback

The main playtester's favourite parts of the Hollow Knight randomizer and Archipelago setup:

- **Benchwarp.** Warp to any visited bench. Silksong already has a port (see below).
- **Map pins that show the check type.** In Hollow Knight, Geo checks show a Geo rock, bosses show their head, and so on. Our default pin is the Rosary AP icon, so every check looks the same.
- **Reachability on the map.** In Hollow Knight, pins you can reach with your current items are big and in colour, and the rest are small and grey. The playtester did not know we have this, because it is experimental and off by default.
- **Settings.** The Hollow Knight settings were good. Our options are worth comparing against them.
- **Merchant stock on the map.** After talking to a merchant for the first time, show what they sell in the tooltip of their map pin.

## What we already have

Most of the map work exists but is hidden behind defaults (`src/SilksongRandomizer/Plugin.cs`):

| Feature | Where | Current default |
| --- | --- | --- |
| Category pins (44 icons in `Assets/MapPins/`, picked by the location's original category) | `CategoryMapIcons.cs`, config `Map Markers / Marker Style` | `Rosary AP` (single icon for everything) |
| Reachability (Reachable / Blocked / Unknown, requirements in the pin tooltip) | `MapLogicEvaluator.cs`, `Patches/CheckMapMarkerPatches.cs`, config `Show Logic (Experimental)`, F6 | Off. Blocked pins only drop to 48% opacity |
| Check filters (Unchecked, Reachable, Blocked, Unknown, Checked) | config `Map Markers / Check Filter` | `Unchecked` |
| Hinted checks | white outline on the pin | On |
| Recovery warp to unlocked hubs | `FastTravelUtil.cs`, F4, destination picked in F3 | On |
| Compatibility shim for homothety's Benchwarp, if a player installs it themselves (soft dependency on `io.github.homothetyhk.benchwarp`) | `OptionalModCompatibility.cs`: start bench follows the randomized start, Slab safety check before warping | Untested in game, undocumented. Replace it with a built-in bench warp. The APWorld FAQ (`APWorld/silksong/docs/setup_en.md`) still has upstream's "no Benchwarp" answer |

Bosses use the generic `First Time Kill` pin. There is no per-boss art yet.

## Reuse policy

Silksong Decrypted ships as one self-contained plugin. Players should not have to install other mods to get a feature, so we take no runtime dependencies on the mods below, not even optional ones. When a mod does something players want, we read how it works and rewrite the feature in our own code and style.

Licences still decide how close the rewrite can be. Silksong Decrypted is MIT licensed:

- **MIT:** code can be adapted directly, keeping the original copyright notice next to the adapted code.
- **LGPL-2.1, GPL-3.0, EUPL-1.2, or no licence:** reimplement the behaviour from how the mod works. Do not translate its code line by line. Derive game data (scene names, respawn markers, transitions) from the game files ourselves rather than copying a mod's data tables.

## Hollow Knight mods

| Mod | Licence | What to take |
| --- | --- | --- |
| [RandoMapMod](https://github.com/syyePhenomenol/RandoMapMod) (on [RandoMapCore](https://github.com/syyePhenomenol/RandoMapCore), LGPL, and [MapChanger](https://github.com/syyePhenomenol/MapChanger), GPL) | GPL-3.0 | The reference design for our map. Reachable pins big and coloured, unreachable small and grey. Pin selection panel with room, status, logic requirements, previewed item, and costs with tick/cross for affordability. Map key / legend panel. Toggles for pools, pin shape, pin size, and map modes (full map, pins over area, pins over room). Progress hint key that pans the map to a check that unlocks progression. Item compass toward reachable checks. Benchwarp pins on the map, select a bench and warp. Transition mode with a pathfinder from your room to a selected room, including benchwarp steps, plus a route compass. Custom colours from a `colors.json`. Reimplement. |
| [Archipelago.APMapMod](https://github.com/ArchipelagoMW-HollowKnight/Archipelago.APMapMod) | GPL-3.0 | RandoMapMod fork for Archipelago. Its pin art set (`LegendAssets/Pins/`: Geo, Grub, Charm, Key, Lore, Bench…) is the "check type" look the playtester means. Use it as a style reference; draw our own art. |
| [Archipelago.HollowKnight](https://github.com/ArchipelagoMW-HollowKnight/Archipelago.HollowKnight) | MIT | `BenchSyncModule`: stores unlocked benches in Archipelago data storage and unlocks them in Benchwarp, so benches carry across saves and co-op slots. `GiftingModule`: Archipelago gifting via `Archipelago.Gifting.Net`. `HintTracker`: tracks hints through data storage and scouts hinted locations. Also `DupeHandlingModule`, `RepositionShadeModule`, `StartLocationSceneEditsModule`. Code can be adapted. |
| [RandomizerMod](https://github.com/homothetyhk/RandomizerMod) | LGPL-2.1 | Settings menu layout and presets, for comparing against our options. |
| [Benchwarp](https://github.com/homothetyhk/HollowKnight.BenchwarpMod) | LGPL-2.1 | Original design of the bench menu and hotkeys. See the Silksong port below. |
| [CustomKnight](https://github.com/PrashantMohta/HollowKnight.CustomKnight) | MIT | The skin changer: player, inventory and save-select skins, switchable at runtime. MIT, so its skin-loading approach can be adapted for a built-in skin picker. |

## Silksong mods

| Mod | Licence | What to take |
| --- | --- | --- |
| [Silksong.Benchwarp](https://github.com/homothetyhk/Silksong.Benchwarp) ([Thunderstore](https://thunderstore.io/c/hollow-knight-silksong/p/homothety/Benchwarp/)) | LGPL-2.1 | Benchwarp port by homothety, the reference for our built-in bench warp. Modes: visited benches only, warp to respawn, unlock all, door warp. Worth studying: how `ChangeScene.cs` warps to a respawn marker safely, how benches are grouped by area and tracked as visited, the two-letter hotkeys, the deployable bench, recovery mode for unloadable saves, and how `Doors/Obstacles` clears obstacles after a door warp. Reimplement; take bench scenes and respawn markers from the game files. It needs six shared libraries, which is the install burden we avoid by building our own. |
| [ItemChanger.Silksong](https://github.com/homothetyhk/ItemChanger.Silksong) on [ItemChanger.Core](https://github.com/BadMagic100/ItemChanger.Core) | LGPL-2.1 | Work-in-progress ItemChanger port. Reference only. Together with homothety's `Silksong-Randomizer-Organization-Stub` issue list (logic, settings menu, pools, quests, Steel Soul), it shows a first-party Silksong randomizer is being designed. Watch it for solved problems (item and location edge cases, quests, Steel Soul) whose logic we can reimplement. |
| [Patchwork](https://github.com/Ashiepaws/silksong-patchwork) and its fork [Stitchwork](https://thunderstore.io/c/hollow-knight-silksong/p/SilksongSkinCreators/Stitchwork/) | MIT (Patchwork) | The Silksong skin loaders (successors to Silksong Customizer). Sprite, Texture2D, audio, cutscene and text replacement with live reload. Skins such as Nightmare Hornet and Ghost of Pharloom use them. Patchwork is MIT, so its sprite and Texture2D replacement can be adapted for a built-in skin picker that reads existing skin packs. |
| [MapWarp](https://github.com/jakobhellermann/silksongmod-MapWarp) | None | Mouse zoom and pan on the map, right-click to warp. No licence: reimplement the behaviour only. |
| [Completionist Map](https://thunderstore.io/c/hollow-knight-silksong/p/Yoraiz0r/Completionist_Map/) | Unknown | The Silksong map mod the playtester mentioned. Pins for items, interactables and enemies, toggles and pings. No reachability. No source found. |
| [silksong-modding](https://github.com/silksong-modding) libraries (ModMenu, DataManager, I18N, FsmUtil, AssetHelper, Prepatcher) | EUPL-1.2 | Shared modding libraries that Benchwarp depends on. We do not depend on them; read them for solved problems (menus, localization, FSM edits, per-save data). |
| [Silksong.DebugMod](https://github.com/hk-speedrunning/Silksong.DebugMod) | MIT | Savestates, teleports and inspection. Useful as a separate tool while playtesting; MIT, so helpers can be adapted. |
| [SSMP](https://github.com/Extremelyd1/SSMP) | LGPL-2.1 | Silksong multiplayer. Reference only. |
| [Cogfly](https://github.com/Nix-main/Cogfly) | GPL-3.0 | The mod manager many players use. Silksong Decrypted is not on Thunderstore, so Cogfly cannot install it. |
