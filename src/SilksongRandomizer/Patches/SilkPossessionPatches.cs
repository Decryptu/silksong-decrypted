using HarmonyLib;

namespace SilksongRandomizer.Patches
{
    [HarmonyPatch(typeof(SilkPossession), "Update")]
    internal static class SilkPossessionPatches
    {
        private static void Prefix(SilkPossession __instance, ref float ___timer)
        {
            if (__instance.possessedEnemy == null)
            {
                // Let Update recycle the effect without following a destroyed
                // target or leaving a pending yank on the pooled instance.
                ___timer = 0f;
            }
        }
    }
}
