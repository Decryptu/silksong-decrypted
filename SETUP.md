# Set up Silksong Decrypted

Use the plugin ZIP and `silksong.apworld` from the same Silksong Decrypted build. The Windows release candidate was tested with Silksong 1.0.30000, BepInEx 5.4.23.3, and Archipelago 0.6.8. [Download v0.5.5-rc.2](https://github.com/Decryptu/silksong-decrypted/releases/tag/v0.5.5-rc.2)

## Install the plugin on Windows

1. With Silksong closed, install a Windows x64 BepInEx 5 build (5.4.23.x, not BepInEx 6) in the folder containing `Hollow Knight Silksong.exe`. Launch Silksong once and close it so BepInEx can initialize its folders.
2. Extract `SilksongDecrypted-0.5.5-rc.2.zip` into the game folder. Confirm that `BepInEx/plugins/SilksongDecrypted/` contains `SilksongRandomizer.dll`, `Archipelago.MultiClient.Net.dll`, `Newtonsoft.Json.dll`, and the `CheckIcons/` folder.
3. If you already use a Silksong randomizer, move its plugin folder out of `BepInEx/plugins` before launching. Use one randomizer plugin per profile.
4. Launch Silksong. The Archipelago connection panel should appear. Press **F3** to reopen it.

## Host a room

1. Open Archipelago Launcher, drop `silksong.apworld` onto it, and restart the Launcher. Keep one Silksong APWorld installed.
2. Export a player YAML from the [Silksong Decrypted YAML Generator](https://decryptu.github.io/silksong-decrypted/yaml.html), or open **Options Creator** in Archipelago Launcher, select **Hollow Knight: Silksong**, and export a YAML. For a default solo room, the following YAML is sufficient.

   ```yaml
   name: Hornet
   game: 'Hollow Knight: Silksong'
   'Hollow Knight: Silksong': {}
   ```

3. Put one YAML per player in the Archipelago `Players` folder, with a distinct `name` for each slot. Run **Generate** from the Launcher.
4. For a local test on the same computer, open the generated ZIP with **Archipelago Server** and connect to `127.0.0.1` using the port printed by the server. For a shared room, host the generated ZIP and give players the host, port, their exact YAML `name`, and the password if the room uses one.

## Join and resume

1. In the F3 panel, enter the host and port in their separate fields. Enter your assigned slot name and any room password, then select **Connect**.
2. Start a new randomizer save in an empty slot. Keep this save paired with the same room and slot. The opening Crest is an early check you can use to confirm that the server sees your progress.
3. To resume, use the game's **Save and Quit** menu, reconnect to the same room if needed, and select the same in-game save.

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
   - `summary.txt` (version, loaded plugins, room seed/options, current scene/coordinates, Act 3 phase, inventory/abilities, checked locations, received items, hints, and explored entrances — never your room password)
   - `session.log` (timeline of checks, items, scenes, warps, and errors from this launch)
   - `LogOutput.log` (your current BepInEx log)
4. Click **Open Reports Folder** and attach the ZIP file to your GitHub issue or send it to the organizer.

## Troubleshoot

- **F3 has no effect.** Check `BepInEx/LogOutput.log` for a Silksong Decrypted load entry. Confirm the ZIP's `BepInEx` folder was merged at the game root and check the log for missing dependencies or duplicate plugins.
- **The room rejects the connection.** Confirm the host, port, slot name and password. If it reports a compatibility mismatch, ask the host which APWorld generated the room and install the matching plugin.
- **An existing randomizer save is missing.** Check the save folder notice in F3. The game can use a different save folder when its account service is unavailable. Restore the usual account context before choosing a new slot.
- **You are stuck in an area.** When available, **F4** returns you to the selected recovery destination. Use the arrows in the F3 panel to choose among destinations the current save has unlocked.
