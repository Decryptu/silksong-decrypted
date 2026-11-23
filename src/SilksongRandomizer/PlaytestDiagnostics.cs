using BepInEx;
using BepInEx.Bootstrap;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using UnityEngine;

namespace SilksongRandomizer
{
    internal static class PlaytestDiagnostics
    {
        private const int MaxSessionLogFiles = 10;
        private const int MaxRecentEvents = 300;
        private const float ScenePollIntervalSeconds = 0.5f;

        private static readonly object Sync = new object();
        private static readonly Queue<string> RecentEvents = new Queue<string>();
        private static readonly StringBuilder SessionBuffer = new StringBuilder();

        private static bool initialized;
        private static string sessionLogPath = string.Empty;
        private static string reportsDirectory = string.Empty;
        private static string lastRecordedScene = string.Empty;
        private static float nextScenePollTime;
        private static RoomGeometry cachedGeometry;
        private static bool geometryLoadFailed;

        internal static string ReportsDirectory => reportsDirectory;
        internal static string SessionLogPath => sessionLogPath;

        internal static void Initialize()
        {
            lock (Sync)
            {
                if (initialized)
                {
                    return;
                }

                initialized = true;
                try
                {
                    string gameRoot = string.IsNullOrWhiteSpace(Paths.GameRootPath)
                        ? Environment.CurrentDirectory
                        : Paths.GameRootPath;
                    string bepRoot = string.IsNullOrWhiteSpace(Paths.BepInExRootPath)
                        ? Path.Combine(gameRoot, "BepInEx")
                        : Paths.BepInExRootPath;

                    reportsDirectory = Path.Combine(gameRoot, "SilksongDecryptedReports");
                    string logsDirectory = Path.Combine(bepRoot, "SilksongDecrypted", "logs");
                    Directory.CreateDirectory(logsDirectory);
                    PruneOldSessionLogs(logsDirectory);

                    string stamp = DateTime.UtcNow.ToString("yyyyMMdd-HHmmss", CultureInfo.InvariantCulture);
                    sessionLogPath = Path.Combine(logsDirectory, "session-" + stamp + ".log");
                }
                catch (Exception ex)
                {
                    RandomizerPlugin.Log?.LogWarning(
                        "[RANDOMIZER] Could not initialize playtest session log directory: " + ex.Message
                    );
                    sessionLogPath = string.Empty;
                }
            }

            RecordEvent(
                "START",
                $"{RandomizerPlugin.PluginName} {RandomizerPlugin.PluginVersion} ({RandomizerPlugin.ReleaseLabel}) | " +
                $"Game {Application.version} | Unity {Application.unityVersion} | Platform {Application.platform} | OS {Environment.OSVersion}"
            );
        }

        internal static void Update()
        {
            if (Time.unscaledTime < nextScenePollTime)
            {
                return;
            }

            nextScenePollTime = Time.unscaledTime + ScenePollIntervalSeconds;
            try
            {
                GameManager manager = GameManager.SilentInstance;
                if (manager == null)
                {
                    return;
                }

                string scene = manager.GetSceneNameString() ?? string.Empty;
                if (string.IsNullOrWhiteSpace(scene) || string.Equals(scene, lastRecordedScene, StringComparison.Ordinal))
                {
                    return;
                }

                lastRecordedScene = scene;
                bool actThree = MapLogicEvaluator.IsActThreeActive;
                RecordEvent("SCENE", actThree ? scene + " (Act 3)" : scene);
            }
            catch
            {
                // Diagnostics must never interfere with gameplay.
            }
        }

        internal static void RecordConnection(Archipelago archipelago, bool reconnected)
        {
            if (archipelago == null)
            {
                return;
            }

            try
            {
                string kind = reconnected ? "RECONNECT" : "CONNECT";
                string summary =
                    $"slot='{archipelago.SlotName}' team={archipelago.Team} slotId={archipelago.Slot} " +
                    $"seed={archipelago.RoomSeed} world={archipelago.WorldVersion} goal={archipelago.Goal} " +
                    $"scope={archipelago.ContentScope} start={archipelago.StartingLocation} " +
                    $"crest={archipelago.StartingCrest} mode={archipelago.GameMode}";
                RecordEvent(kind, summary);
            }
            catch
            {
            }
        }

        internal static void RecordCheck(string locationName, bool goalCompleted)
        {
            if (string.IsNullOrWhiteSpace(locationName))
            {
                return;
            }

            string scene = SafeCurrentScene();
            string suffix = string.IsNullOrEmpty(scene) ? string.Empty : " @ " + scene;
            RecordEvent("CHECK", locationName + suffix);
            if (goalCompleted)
            {
                RecordEvent("GOAL", "Goal completed" + suffix);
            }
        }

        internal static void RecordReceivedItem(int index, string itemName)
        {
            if (string.IsNullOrWhiteSpace(itemName))
            {
                return;
            }

            RecordEvent("RECEIVE", "#" + index.ToString(CultureInfo.InvariantCulture) + " " + itemName);
        }

        internal static void RecordEvent(string category, string message)
        {
            if (string.IsNullOrWhiteSpace(category))
            {
                category = "INFO";
            }

            string clean = SanitizeSingleLine(message);
            string line = string.Format(
                CultureInfo.InvariantCulture,
                "[{0:yyyy-MM-dd HH:mm:ss}Z] [{1}] {2}",
                DateTime.UtcNow,
                category,
                clean
            );

            lock (Sync)
            {
                RecentEvents.Enqueue(line);
                while (RecentEvents.Count > MaxRecentEvents)
                {
                    RecentEvents.Dequeue();
                }

                SessionBuffer.AppendLine(line);
                if (!string.IsNullOrEmpty(sessionLogPath))
                {
                    try
                    {
                        File.AppendAllText(sessionLogPath, line + Environment.NewLine, Encoding.UTF8);
                    }
                    catch
                    {
                    }
                }
            }
        }

        internal static bool ExportReport(string userNote, out string reportPath, out string error)
        {
            reportPath = string.Empty;
            error = string.Empty;

            try
            {
                if (!string.IsNullOrWhiteSpace(userNote))
                {
                    RecordEvent("NOTE", userNote);
                }

                string targetDir = string.IsNullOrWhiteSpace(reportsDirectory)
                    ? Path.Combine(Environment.CurrentDirectory, "SilksongDecryptedReports")
                    : reportsDirectory;
                Directory.CreateDirectory(targetDir);

                string stamp = DateTime.UtcNow.ToString("yyyyMMdd-HHmmss", CultureInfo.InvariantCulture);
                string summaryText = BuildSummaryReport(userNote);
                string sessionText = GetSessionLogSnapshot();
                string bepLogPath = GetBepInExLogPath();

                string zipPath = Path.Combine(targetDir, "playtest-report-" + stamp + ".zip");
                try
                {
                    using (FileStream fs = new FileStream(zipPath, FileMode.Create, FileAccess.ReadWrite, FileShare.None))
                    using (ZipArchive zip = new ZipArchive(fs, ZipArchiveMode.Create, false, Encoding.UTF8))
                    {
                        WriteZipTextEntry(zip, "summary.txt", summaryText);
                        WriteZipTextEntry(zip, "session.log", sessionText);
                        if (!string.IsNullOrEmpty(bepLogPath) && File.Exists(bepLogPath))
                        {
                            string bepLog = ReadSharedTextFile(bepLogPath);
                            if (bepLog != null)
                            {
                                WriteZipTextEntry(zip, "LogOutput.log", bepLog);
                            }
                        }
                    }

                    reportPath = zipPath;
                }
                catch (Exception zipEx)
                {
                    RandomizerPlugin.Log?.LogWarning(
                        "[RANDOMIZER] Could not write ZIP playtest report; falling back to plain text: " + zipEx.Message
                    );
                    string txtPath = Path.Combine(targetDir, "playtest-report-" + stamp + ".txt");
                    File.WriteAllText(txtPath, summaryText, Encoding.UTF8);
                    reportPath = txtPath;
                }

                RecordEvent("REPORT", "Saved playtest report to " + Path.GetFileName(reportPath));
                RandomizerPlugin.Log?.LogInfo("[RANDOMIZER] Saved playtest report: " + reportPath);
                return true;
            }
            catch (Exception ex)
            {
                error = "Could not save report: " + ex.Message;
                RandomizerPlugin.Log?.LogWarning("[RANDOMIZER] " + error);
                return false;
            }
        }

        internal static bool OpenReportsFolder(out string error)
        {
            error = string.Empty;
            try
            {
                string targetDir = string.IsNullOrWhiteSpace(reportsDirectory)
                    ? Path.Combine(Environment.CurrentDirectory, "SilksongDecryptedReports")
                    : reportsDirectory;
                Directory.CreateDirectory(targetDir);
                Process.Start(new ProcessStartInfo
                {
                    FileName = targetDir,
                    UseShellExecute = true,
                });
                return true;
            }
            catch (Exception ex)
            {
                error = "Could not open folder: " + ex.Message;
                return false;
            }
        }

        private static string BuildSummaryReport(string userNote)
        {
            StringBuilder sb = new StringBuilder(4096);
            sb.AppendLine("=== Silksong Decrypted Playtest Report ===");
            sb.AppendLine("Generated (UTC): " + DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss'Z'", CultureInfo.InvariantCulture));
            sb.AppendLine($"Plugin: {RandomizerPlugin.PluginName} {RandomizerPlugin.PluginVersion} ({RandomizerPlugin.ReleaseLabel})");
            sb.AppendLine($"Game: {Application.version} | Unity: {Application.unityVersion} | Platform: {Application.platform}");
            sb.AppendLine($"OS: {Environment.OSVersion}");
            if (!string.IsNullOrEmpty(sessionLogPath))
            {
                sb.AppendLine("Session Log: " + sessionLogPath);
            }

            if (!string.IsNullOrWhiteSpace(userNote))
            {
                sb.AppendLine();
                sb.AppendLine("--- Player Note ---");
                sb.AppendLine(userNote.Trim());
            }

            sb.AppendLine();
            sb.AppendLine("--- Loaded BepInEx Plugins ---");
            try
            {
                if (Chainloader.PluginInfos != null && Chainloader.PluginInfos.Count > 0)
                {
                    foreach (var pair in Chainloader.PluginInfos.OrderBy(p => p.Key, StringComparer.OrdinalIgnoreCase))
                    {
                        var meta = pair.Value?.Metadata;
                        if (meta != null)
                        {
                            sb.AppendLine($"- {meta.Name} ({meta.GUID}) v{meta.Version}");
                        }
                    }
                }
                else
                {
                    sb.AppendLine("(none reported)");
                }
            }
            catch (Exception ex)
            {
                sb.AppendLine("(could not enumerate plugins: " + ex.Message + ")");
            }

            Archipelago ap = Archipelago.Instance;
            SaveState state = SaveState.Instance;
            sb.AppendLine();
            sb.AppendLine("--- Archipelago & Room ---");
            sb.AppendLine("Connected: " + (ap != null && ap.Connected));
            if (ap != null && !string.IsNullOrEmpty(ap.LastError))
            {
                sb.AppendLine("Last Error: " + ap.LastError);
            }
            if (state != null)
            {
                sb.AppendLine($"Room Bound: {state.IsRoomBound} | Schema: {state.schemaVersion} | World Version: {state.worldVersion}");
                sb.AppendLine($"Seed: {state.roomSeed} | Slot: {state.slotName} (team {state.team}, slot {state.slot})");
                sb.AppendLine($"Goal: {state.goal} | Scope: {state.contentScope} | Goal Completed: {state.goalCompleted}");
                if (string.Equals(state.goal, Archipelago.FleaHuntGoal, StringComparison.OrdinalIgnoreCase))
                {
                    sb.AppendLine($"Flea Hunt Target: {state.fleaHuntGoalCount}");
                }
                else if (string.Equals(state.goal, Archipelago.SpellingBeeGoal, StringComparison.OrdinalIgnoreCase))
                {
                    sb.AppendLine($"Spelling Bee Phrase: {state.spellingBeePhrase}");
                }
                sb.AppendLine($"Starting Location: {state.startingLocation} | Starting Crest: {state.startingCrest} | Mode: {state.gameMode}");
                sb.AppendLine(
                    $"Traversal: splitDashSprint={state.splitDashAndSprint}, dirSwift={state.directionalSwiftStep}, " +
                    $"dirCling={state.directionalClingGrip}, dirClaw={state.directionalClawline}, " +
                    $"dirLedge={state.directionalLedgeGrab}, ledgeRando={state.ledgegrabAbilityRando}, swimRando={state.swimAbilityRando}"
                );
                sb.AppendLine(
                    $"Options: startWithMaps={state.startWithMaps}, startFullyMapped={state.startFullyMapped}, " +
                    $"autoCompass={state.automaticCompass}, alphabetMode={state.alphabetMode}, " +
                    $"bellwayAccess={state.bellwayAccess}, silkAndSoulPts={state.silkAndSoulPoints}"
                );
                sb.AppendLine(
                    $"Links: deathLink={RandomizerPlugin.Instance?.DeathLinkEnabled == true}, " +
                    $"silkLink={state.silkLink}, rosaryLink={state.rosaryLink}, shardLink={state.shellShardLink}, knockbackLink={state.knockbackLink}"
                );
                sb.AppendLine(
                    $"Experimental: entranceLayout={!string.IsNullOrEmpty(state.entranceLayoutJson) && state.entranceLayoutJson != "{}"}, " +
                    $"exploredEntrances={state.exploredEntrances?.Count ?? 0}, " +
                    $"bossSouls={state.bossSoulsJson != "[]"}, npcSouls={state.npcSoulsJson != "[]"}, enemySouls={state.enemySoulsJson != "[]"}"
                );
            }
            else
            {
                sb.AppendLine("No active randomizer save loaded.");
            }

            sb.AppendLine();
            sb.AppendLine("--- Live Game State ---");
            AppendLiveGameState(sb, state);

            if (state != null)
            {
                var checkedList = state.checkedLocations != null
                    ? state.checkedLocations.OrderBy(x => x, StringComparer.OrdinalIgnoreCase).ToList()
                    : new List<string>();
                sb.AppendLine();
                sb.AppendLine($"--- Checked Locations ({checkedList.Count}) ---");
                foreach (string loc in checkedList)
                {
                    sb.AppendLine("- " + loc);
                }

                var receivedList = state.receivedItemHistory ?? new List<string>();
                sb.AppendLine();
                sb.AppendLine($"--- Received Items ({receivedList.Count}, cursor={state.NextReceivedItemIndex}) ---");
                for (int i = 0; i < receivedList.Count; i++)
                {
                    sb.AppendLine($"{i + 1}. {receivedList[i]}");
                }

                var hints = state.BuildHintJournalEntries();
                if (hints != null && hints.Count > 0)
                {
                    sb.AppendLine();
                    sb.AppendLine($"--- Hints ({hints.Count}) ---");
                    for (int i = 0; i < hints.Count; i++)
                    {
                        sb.AppendLine($"{i + 1}. {hints[i]}");
                    }
                }

                if (state.exploredEntrances != null && state.exploredEntrances.Count > 0)
                {
                    sb.AppendLine();
                    sb.AppendLine($"--- Explored Entrances ({state.exploredEntrances.Count}) ---");
                    foreach (string entrance in state.exploredEntrances.OrderBy(x => x, StringComparer.OrdinalIgnoreCase))
                    {
                        sb.AppendLine("- " + entrance);
                    }
                }
            }

            sb.AppendLine();
            sb.AppendLine("--- Recent Session Events ---");
            lock (Sync)
            {
                foreach (string evt in RecentEvents)
                {
                    sb.AppendLine(evt);
                }
            }

            return sb.ToString();
        }

        private static void AppendLiveGameState(StringBuilder sb, SaveState state)
        {
            try
            {
                GameManager manager = GameManager.SilentInstance;
                HeroController hero = HeroController.instance;
                PlayerData pd = PlayerData.instance;

                string scene = manager != null ? (manager.GetSceneNameString() ?? string.Empty) : string.Empty;
                sb.AppendLine($"Scene: {(string.IsNullOrEmpty(scene) ? "(none)" : scene)}");
                if (manager != null)
                {
                    sb.AppendLine($"GameState: {manager.GameState} | GameplayScene: {manager.IsGameplayScene()} | Profile Slot: {manager.profileID}");
                }

                if (hero != null)
                {
                    Vector3 pos = hero.transform.position;
                    sb.AppendLine(string.Format(
                        CultureInfo.InvariantCulture,
                        "Position: x={0:0.00}, y={1:0.00} | controlRelinquished={2}",
                        pos.x,
                        pos.y,
                        hero.controlReqlinquished
                    ));

                    RoomGeometry.Reading reading = TryLocateRoom(scene, pos.x, pos.y);
                    if (reading != null)
                    {
                        sb.AppendLine($"Mapped Room: {reading.Heading} | {reading.Detail}");
                        if (!string.IsNullOrEmpty(reading.Tracker))
                        {
                            sb.AppendLine("Tracker ID: " + reading.Tracker);
                        }
                    }
                }

                if (pd != null)
                {
                    sb.AppendLine(
                        $"World Phase: act2Started={pd.act2Started}, blackThreadWorld={pd.blackThreadWorld}, " +
                        $"act3_wokeUp={pd.act3_wokeUp}, bellhomeToggleUnlocked={state?.bellhomePhaseToggleUnlocked == true}, " +
                        $"atBench={pd.atBench}"
                    );
                    sb.AppendLine(
                        $"Stats: maxHealthBase={pd.maxHealthBase} (+{pd.heartPieces} shards), " +
                        $"silkMax={pd.silkMax} (+{pd.silkSpoolParts} spool parts), silkRegenMax={pd.silkRegenMax}, " +
                        $"rosaries={pd.geo}, shards={pd.ShellShards}, nailUpgrades={pd.nailUpgrades}"
                    );
                    sb.AppendLine(
                        $"Abilities: dash={pd.hasDash}, walljump={pd.hasWalljump}, brolly={pd.hasBrolly}, " +
                        $"doubleJump={pd.hasDoubleJump}, harpoon={pd.hasHarpoonDash}, needolin={pd.hasNeedolin}, " +
                        $"superJump={pd.hasSuperJump}, chargeSlash={pd.hasChargeSlash}, quill={pd.hasQuill}"
                    );
                }
            }
            catch (Exception ex)
            {
                sb.AppendLine("(error reading live game state: " + ex.Message + ")");
            }
        }

        private static RoomGeometry.Reading TryLocateRoom(string scene, float x, float y)
        {
            if (string.IsNullOrWhiteSpace(scene) || geometryLoadFailed)
            {
                return null;
            }

            try
            {
                if (cachedGeometry == null)
                {
                    cachedGeometry = RoomGeometry.Load(BundledMapLogic.RoomGeometry);
                }

                return cachedGeometry?.Locate(scene, x, y);
            }
            catch
            {
                geometryLoadFailed = true;
                return null;
            }
        }

        private static string GetSessionLogSnapshot()
        {
            lock (Sync)
            {
                return SessionBuffer.ToString();
            }
        }

        private static string GetBepInExLogPath()
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(Paths.BepInExRootPath))
                {
                    return Path.Combine(Paths.BepInExRootPath, "LogOutput.log");
                }
            }
            catch
            {
            }

            return string.Empty;
        }

        private static string ReadSharedTextFile(string path)
        {
            try
            {
                using (FileStream fs = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete))
                using (StreamReader reader = new StreamReader(fs, Encoding.UTF8, true))
                {
                    return reader.ReadToEnd();
                }
            }
            catch (Exception ex)
            {
                return "(could not read " + Path.GetFileName(path) + ": " + ex.Message + ")";
            }
        }

        private static void WriteZipTextEntry(ZipArchive zip, string entryName, string content)
        {
            ZipArchiveEntry entry = zip.CreateEntry(entryName, System.IO.Compression.CompressionLevel.Optimal);
            using (StreamWriter writer = new StreamWriter(entry.Open(), new UTF8Encoding(false)))
            {
                writer.Write(content ?? string.Empty);
            }
        }

        private static void PruneOldSessionLogs(string logsDirectory)
        {
            try
            {
                FileInfo[] files = new DirectoryInfo(logsDirectory)
                    .GetFiles("session-*.log")
                    .OrderByDescending(f => f.LastWriteTimeUtc)
                    .ToArray();
                for (int i = MaxSessionLogFiles; i < files.Length; i++)
                {
                    try
                    {
                        files[i].Delete();
                    }
                    catch
                    {
                    }
                }
            }
            catch
            {
            }
        }

        private static string SafeCurrentScene()
        {
            try
            {
                return GameManager.SilentInstance?.GetSceneNameString() ?? string.Empty;
            }
            catch
            {
                return string.Empty;
            }
        }

        private static string SanitizeSingleLine(string text)
        {
            if (string.IsNullOrEmpty(text))
            {
                return string.Empty;
            }

            return text.Replace("\r", " ").Replace("\n", " ").Trim();
        }
    }
}
