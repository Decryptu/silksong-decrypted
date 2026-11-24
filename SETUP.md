# Set up Silksong Decrypted

Use the plugin ZIP and `silksong.apworld` from the same Silksong Decrypted build. The Windows prerelease targets Silksong 1.0.30000, BepInEx 5.4.23.3, and Archipelago 0.6.8. [Download v0.5.5-rc.6](https://github.com/Decryptu/silksong-decrypted/releases/tag/v0.5.5-rc.6)

## Install the plugin on Windows

1. With Silksong closed, install a Windows x64 BepInEx 5 build (5.4.23.x, not BepInEx 6) in the folder containing `Hollow Knight Silksong.exe`. Launch Silksong once and close it so BepInEx can initialize its folders.
2. Extract `SilksongDecrypted-0.5.5-rc.6.zip` into the game folder. Confirm that `BepInEx/plugins/SilksongDecrypted/` contains `SilksongRandomizer.dll`, `Archipelago.MultiClient.Net.dll`, `Newtonsoft.Json.dll`, and the `CheckIcons/` folder.
3. If you already use a Silksong randomizer, move its plugin folder out of `BepInEx/plugins` before launching. Use one randomizer plugin per profile.
4. Launch Silksong. The Archipelago connection panel should appear. Press **F3** to reopen it.

## Generate the seed and host a room

Only the host generates the seed. Players who join someone else's room only send their YAML to the host and skip to [Join and resume](#join-and-resume). If you play solo, you are the host: follow these steps with just your own YAML.

1. Install [Archipelago](https://github.com/ArchipelagoMW/Archipelago/releases/latest) 0.6.8 or newer (older versions cannot load this world) and open **Archipelago Launcher**.
2. Drag `silksong.apworld` onto the Launcher window, then close and reopen the Launcher. Keep one Silksong APWorld installed.
3. Make a player YAML with the [Silksong Decrypted YAML Generator](https://decryptu.github.io/silksong-decrypted/yaml.html), or with **Options Creator** in the Launcher (select **Hollow Knight: Silksong**). For a default solo game, this YAML is enough:

   ```yaml
   name: Hornet
   game: 'Hollow Knight: Silksong'
   'Hollow Knight: Silksong': {}
   ```

4. In the Launcher, click **Browse Files** to open the Archipelago folder (usually `C:\ProgramData\Archipelago`) and open its `Players` folder. Put your YAML and every other player's YAML there. Each YAML needs a different `name`. Every `.yaml` in `Players` becomes a slot, so move out old YAMLs you do not want in this game.
5. Back in the Launcher, click **Generate**. A console window runs and closes when it is done. The seed is a file named like `AP_12345678901234567890.zip` in the `output` folder next to `Players`. Do not unzip it. If generation fails, run `ArchipelagoGenerate.exe` from the Archipelago folder to keep the error visible, and check that `silksong.apworld` is installed and that each YAML is valid.
6. Open a room with that ZIP:
   - **Online (friends, or solo on archipelago.gg):** upload the ZIP at [archipelago.gg/uploads](https://archipelago.gg/uploads) and click **Create New Room**. The room page shows an address such as `archipelago.gg:38281`. Give each player the host (`archipelago.gg`), the port (`38281`), and their exact YAML `name`.
   - **Same computer only:** click **Host** in the Launcher and select the ZIP. Connect to `127.0.0.1` with the port printed in the server window (default `38281`). Keep that window open while you play.
   - **Self-hosted for others:** host the ZIP with **Archipelago Server**, forward its port, and give players your public address, port, slot names, and password if you set one.

## Join and resume

1. In the F3 panel, enter the host and port in their separate fields. Enter your assigned slot name and any room password, then select **Connect**.
2. Start a new randomizer save in an empty slot. Keep this save paired with the same room and slot. The opening Crest is an early check you can use to confirm that the server sees your progress.
3. To resume, use the game's **Save and Quit** menu, reconnect to the same room if needed, and select the same in-game save.

## Read the map

Unchecked locations appear as pins on your map, drawn with the icon of the location's original category (Fleas, Mask Shards, merchants, and so on). On the full map from the inventory:

- **Full-size pins** are reachable with the items you have. **Small grey pins** are blocked for now. Press **F6** to turn this off and show every pin at full size.
- Move the map so a pin sits under the centre crosshair to see its location name, whether you can reach it, and what it still requires.
- A **white outline** means you know the item there. After you talk to a merchant, or receive a hint, the pin lists each item and who it is for, coloured purple for progression, blue for useful, and cyan for filler.
- A short key at the bottom of the full map explains these. Turn it off with **Map Legend** in the mod options.

## Return to Act 2 from Act 3

If you entered Act 3 and still need checks that are only available in Act 2, you can toggle Pharloom between its late Act 2 and Act 3 world phases from your Bellhome in upper Bellhart:

1. Unlock your Bellhome in Bellhart and complete the Act 3 wake-up sequence on that randomizer save.
2. Enter your Bellhome and rest on the bed.
3. While resting on the bed, **hold Dash** (Swift Step) and **press Needolin**. The trigger follows your current Dash and Needolin bindings, works without Silk, and does not require cancelling the bench first.
4. Confirm **Yes** on the prompt (`Return Pharloom to its late Act 2 state? Your Act 3 progress will be preserved.`). The game saves automatically and reloads the Bellhome in the late Act 2 world phase while keeping your Act 3 progress. Selecting **No** leaves you resting on the bed without changing the world phase.
5. To return to Act 3 later, rest on the Bellhome bed again, **hold Dash** and **press Needolin**, and confirm **Yes** (`Restore the Black Thread world and return to Act 3? Your Act 3 progress will be preserved.`).

## Share playtest logs and reports

Silksong Decrypted automatically writes a per-launch session log under `BepInEx/SilksongDecrypted/logs/` (keeping the 10 most recent sessions) so logs are preserved even after restarting the game.

To share your playtest session or report a bug:

1. Press **F3** in game and switch to the **Playtest** tab.
2. Optionally type a short note describing what happened (bug, softlock, out-of-logic check, or playtest summary).
3. Click **Save Playtest Report**. This writes a timestamped ZIP archive under `SilksongDecryptedReports/` in your Silksong game folder containing:
   - `summary.txt` (version, loaded plugins, room seed/options, current scene/coordinates, Act 3 phase, inventory, native ability flags and randomizer skill ownership, checked locations, received items, hints, and explored entrances — never your room password)
   - `session.log` (timeline of checks, item receipts, traversal gate results, observed movement actions, room coordinates, boss flags, and warps from this launch)
   - `LogOutput.log` (your current BepInEx log)
4. Click **Open Reports Folder** and attach the ZIP file to your GitHub issue or send it to the organizer.

## Troubleshoot

- **Generate says `File Hornet.yaml is invalid. Please fix your yaml.`** The YAML is usually fine; Archipelago cannot find the Silksong world. Scroll up in the console: `No world found to handle game Hollow Knight: Silksong` confirms it. Update Archipelago to 0.6.8 or newer (older versions refuse this APWorld), drag `silksong.apworld` onto the Launcher again, then fully close and reopen the Launcher before generating. Keep only one Silksong APWorld in `custom_worlds`.
- **F3 has no effect.** Check `BepInEx/LogOutput.log` for a Silksong Decrypted load entry. Confirm the ZIP's `BepInEx` folder was merged at the game root and check the log for missing dependencies or duplicate plugins.
- **F3 says the room was generated with a different Silksong APWorld** (older builds said `Map logic does not match this mod`). The host generated the room with another Silksong APWorld, most often the original BatAtVideoGames `silksong.apworld`, which also reports version 0.5.5. Reinstalling the plugin does not help. The host must delete the Silksong APWorld from Archipelago's `custom_worlds` folder, install `silksong.apworld` from the same [Silksong Decrypted release](https://github.com/Decryptu/silksong-decrypted/releases) as the plugin, restart the Launcher, generate again, and open a new room.
- **The room rejects the connection.** Confirm the host, port, slot name and password. If it reports a compatibility mismatch, ask the host which APWorld generated the room and install the matching plugin.
- **An existing randomizer save is missing.** Check the save folder notice in F3. The game can use a different save folder when its account service is unavailable. Restore the usual account context before choosing a new slot.
- **You are stuck in an area.** When available, **F4** returns you to the selected recovery destination. Use the arrows in the F3 panel to choose among destinations the current save has unlocked.
