# Set up Silksong Decrypted

Use the plugin ZIP and `silksong.apworld` from the same Silksong Decrypted build. The Windows release candidate was tested with Silksong 1.0.30000, BepInEx 5.4.23.3, and Archipelago 0.6.8. [Download the Windows prerelease](https://github.com/Decryptu/silksong-decrypted/releases/tag/v0.5.5-rc.1)

## Install the plugin on Windows

1. With Silksong closed, install a Windows x64 BepInEx 5 build in the folder containing `Hollow Knight Silksong.exe`. Launch Silksong once and close it so BepInEx can initialize its folders.
2. Extract the candidate ZIP into the game folder. Confirm that `BepInEx/plugins/SilksongDecrypted/` contains `SilksongRandomizer.dll`, `Archipelago.MultiClient.Net.dll`, and `Newtonsoft.Json.dll`.
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

## Troubleshoot

- **F3 has no effect.** Check `BepInEx/LogOutput.log` for a Silksong Decrypted load entry. Confirm the ZIP's `BepInEx` folder was merged at the game root and check the log for missing dependencies or duplicate plugins.
- **The room rejects the connection.** Confirm the host, port, slot name and password. If it reports a compatibility mismatch, ask the host which APWorld generated the room and install the matching plugin.
- **An existing randomizer save is missing.** Check the save folder notice in F3. The game can use a different save folder when its account service is unavailable. Restore the usual account context before choosing a new slot.
- **You are stuck in an area.** When available, **F4** returns you to the selected recovery destination. Use the arrows in the F3 panel to choose among destinations the current save has unlocked.
