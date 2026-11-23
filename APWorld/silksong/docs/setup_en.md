# Silksong Archipelago Randomizer

An Archipelago randomizer for *Hollow Knight: Silksong*.

It randomizes Silksong checks and items into an Archipelago multiworld, allowing several players to share item progression across supported games. The randomizer includes progression items, useful items, filler, and traps, with in-game map and item feedback to help track the run.

This project is currently being tested and improved. Expect occasional bugs or logic changes between releases.

You can look at more features of the randomizer on the [features page](APWorld/silksong/docs/features.md).

## Table of Contents

- [Table of Contents](#table-of-contents)
- [What is randomized?](#what-is-randomized)
- [Requirements and Installation](#requirements-and-installation)
- [Archipelago Setup](#archipelago-setup)
- [Frequently Asked Questions (FAQ)](#frequently-asked-questions-faq)
- [Support and Additional Information](#support-and-additional-information)
- [Credits](#credits)
  - [Logic Mapping](#logic-mapping)
  - [Contributors](#contributors)

## What is randomized?

The world can randomize Silksong checks and progression items, including movement abilities, tools, crests, maps, mask shards, silk skills, fleas, and other useful or filler items. Traps may also be enabled depending on the generation settings.

The exact checks and options available can change as the randomizer develops. Use the generated YAML template and the release notes for the current version.


## Requirements and Installation

- *Hollow Knight: Silksong* on PC
- BepInEx configured for Silksong
- Archipelago (v0.6.8+)
- The Archipelago client included with the release or your Archipelago installation

Silksong Decrypted is not published on Thunderstore, so Cogfly and r2modman profile codes cannot install it. Codes shared for those managers install the original upstream randomizer instead, which is not compatible with Silksong Decrypted seeds. Install it manually:

1.) Find your Hollow Knight: Silksong installation folder (the folder containing `Hollow Knight Silksong.exe`).

2.) Download Windows x64 [BepInEx 5](https://github.com/BepInEx/BepInEx/releases) (5.4.23.x, not BepInEx 6) and extract it into the game folder.

3.) Launch Silksong once so BepInEx can initialize, then close the game.

4.) Download `SilksongDecrypted-<version>.zip` from the [Silksong Decrypted releases](https://github.com/Decryptu/silksong-decrypted/releases/latest) and extract it into the game folder. Remove any other Silksong randomizer plugin (including one installed by Cogfly or r2modman) first.

5.) Confirm `BepInEx/plugins/SilksongDecrypted/SilksongRandomizer.dll` exists.

If you previously used Cogfly or r2modman, launch the game directly from Steam without their launch arguments.

## Archipelago Setup

1.) Download the [Archipelago Launcher](https://github.com/ArchipelagoMW/Archipelago/releases/latest) for your preferred operating system.

2.) Download the Silksong Decrypted [latest release](https://github.com/Decryptu/silksong-decrypted/releases/latest) `silksong.apworld` file. Keep only one Silksong APWorld installed.

3.) Launch the Archipelago Launcher and drag the .apworld file into the client. Restart the Archipelago Launcher after installing the apworld.

4.) You can then generate a options configuration for yourself using one of the following two methods:

  - Press the "Options Creator" on the Launcher. Select Hollow Knight: Silksong on the left hand side of the screen that pops up and select all your preferred options. Finally, press export options and save it.

  - Press the "Generate Template Options" on the Launcher which will create .yaml's for all your installed .apworlds. Look for the 'Hollow Knight Silksong.yaml' file, this will be the file you edit for your options.

5.) Take the file that you generated in step 4 and place it in your Archipelago 'Players' folder alongside any other yaml that you will be using for your multiworld.

6.) Go back to the Archipelago Launcher and press generate. A script will run that will generate your multiworld seed and place a .zip file into your Archipelago 'output' folder.

7.) You can then upload the zip to host the game as you wish. Archipelago's upload hosting page can be found [here](https://archipelago.gg/uploads).

## Frequently Asked Questions (FAQ)

### I Got to Act 3 and Missed Some Checks in Act 2?
Some items become unavailable once you enter Act 3. Go to your Bellhome in Bellhart. 
Once you reach act 3 once, sit on the bed, press dash + needolin to get a pop-up asking to revert the world back to Act 2 and vice versa.

### What Are the Map Markers Showing?
When enabled in the yaml "location_map_markers", the map can show randomized locations at their physical locations.

Key for these markers are as follows:
- **Fully opaque (with AP style rosary icon)**: Reachable / in logic.
- **Half transparent (with AP style rosary icon)**: Not reachable / not in logic.
- **? / inverted icons**: Missing logic so far / guaranteed junk.

### I’m Stuck Somewhere, What Do I Do?
**Press F4.**

Seriously. It allows warping to homepoints like Bone Bottom, Bellhart, and Songclave as you reach them, skips the widow cutscene to stop softlocks and can save you from the slab. 
Also you can press F3 and it'll allow changing of warp locations as of v0.4.3.

### Do You Have a Feature like Benchwarp?
Short answer, no. Please refer to I’m stuck somewhere, what do I do?

Long answer, it can cause softlocks and other issues, it can be used but at your own risk of issues and potential woodchipper related incidents.

### I Got An Error Saying My APWorld Version is Incompatible
This occurs when you've changed your Randomizer Mod to a new version for an update while having your world generated on an old one.

Install the Silksong Decrypted plugin and `silksong.apworld` from the same [release](https://github.com/Decryptu/silksong-decrypted/releases). To switch versions, download the matching `SilksongDecrypted-<version>.zip`, extract it over your game folder so it replaces `BepInEx/plugins/SilksongDecrypted/SilksongRandomizer.dll`, then reconnect.

### Additional common issues or troubleshooting steps to take

- If Silksong does not connect, confirm that BepInEx is installed correctly and that the plugin is in the `BepInEx/plugins` folder.
- If the Silksong world does not appear in Archipelago, confirm that the `.apworld` is in `custom_worlds` and restart the Archipelago launcher.
- If items or checks appear out of sync, reconnect the client or use the client's resynchronization command if available.
- If reporting a bug, include the randomizer version, Archipelago version, relevant YAML settings, and the BepInEx log.

## Feedback and Bug Reports

Please report bugs and logic issues through the repository's [issues](https://github.com/Batatvideogames/silksong-archipelago-randomizer/issues) page. Include enough information to reproduce the problem, but do not upload save files containing personal information.

A second place to give this feedback can be this [Google Form](https://forms.gle/bAsQ2o453eccpL2i7).

A [Trello board](https://trello.com/b/as8YLuLA/skonging) is also available to post known bugs, what's been fixed, and what's upcoming.

## Support and Additional Information

The best place to get any further support would be [Archipelago's Discord](https://discord.gg/archipelago) where you can access the [Hollow Knight: Silksong (Batsong Implementation)](https://discord.com/channels/731205301247803413/1540758118361727056) channel. 

This is a reminder that this is a passion project and people will try to help to the best of their ability but as always, please be respectful.

## Credits

A huge thanks goes out to all that support the channel and thread, the logic mapping team, playtesters, mod developers, and others who have helped contribute to this project:

### Logic Mapping

Some of these regions are still incomplete and still being mapped out. They've been placed in UNMAPPED.

| Contributor | Regions |
| :--- | :--- |
| **Cryo** | [Far Fields](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/far-fields), [Wormways](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/wormways) |
| **Gallos** | [Choral Chambers](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/choral-chambers), [High Halls](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/high-halls), [Whiteward](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/whiteward) |
| **Herchey** | [Bilewater](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/bilewater), [Sinner's Road](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/sinner-s-road) |
| **Heric** | [Memorium](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/memorium) |
| **Hero** | [Bone Bottom](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/bone-bottom), [Deep Docks](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/deep-docks), [Far Fields](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/far-fields), [Hunter's March](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/hunter-s-march), [Moss Grotto](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/moss-grotto), [The Marrow](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/the-marrow), [Weavenest Atla](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/weavenest-atla), [Wormways](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/wormways) |
| **Isssma** | [Greymoor](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/greymoor) |
| **Maya** | [Blasted Steps](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/blasted-steps), [The Slab](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/the-slab) |
| **Pyxl** | [Bellhart](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/bellhart), [Grand Gate](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/grand-gate), [Mount Fay](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/mount-fay), [Putrified Ducts](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/putrified-ducts), [Sands of Karak](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/sands-of-karak), [Shellwood](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/shellwood), [The Abyss](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/the-abyss), [The Cradle](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/the-cradle), [Verdania](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/verdania) |
| **Rebel** | [Cogwork Core](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/cogwork-core), [Underworks (East)](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/underworks), [Whispering Vaults](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/whispering-vaults) |
| **Sergio** | [Choral Chambers](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/choral-chambers), [Grand Gate](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/grand-gate), [High Halls](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/high-halls), [The Slab](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/the-slab), [Underworks (West)](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/underworks), [Wisp Thicket](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/whisp-thicket) |
| **Skai** | [Blasted Steps](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/blasted-steps), [Grand Gate](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/grand-gate), [Whiteward](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/whiteward) |
| **SuperEpicGuy** | [Moss Grotto](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/moss-grotto) |
| **UNMAPPED** | [The Mist](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/the-mist), [Red Memory](https://github.com/zerounit-dev/silksong-rando-ap-logic/tree/main/red-memory) |

### Contributors
A huge thanks to all the people who have contributed to this project including ones that aren't displayed on the contributors list.

<a href="https://github.com/Batatvideogames/silksong-archipelago-randomizer/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Batatvideogames/silksong-archipelago-randomizer" />
</a>

- [HeroUnit](https://github.com/zerounit-dev) for his great work on standardizing logic for this project and largely handling all logical coordination.
- [TheMathGeek314](https://github.com/TheMathGeek314) for the original [HK Alphabet Rando](https://github.com/TheMathGeek314/AlphabetRando) and for giving permission to extend their idea to Silksong.
- [Nix](https://github.com/Nix-main) for [SilksongArchiDisplay](https://github.com/Nix-main/SilksongArchiDisplay) and all the additional help with [Cogfly](https://github.com/Nix-main/Cogfly) support.
- [FarisTheAncient](https://github.com/FarisTheAncient) for a ton of help with archipelago compliance and consistent help with making things work with [Universal Tracker](https://github.com/FarisTheAncient/Archipelago/releases?q=Tracker).
- RainingChain and IdoManti for their incredible work on documenting Silksong's map and providing us the image files to be used for UT and our logic tool. The map can be found on [Scripter's War](https://scripterswar.com/silksong/map).