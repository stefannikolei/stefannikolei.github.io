using System.Reflection.Metadata;
using StaticLib;

[assembly: MetadataUpdateHandler(typeof(HotReloadManager))]

namespace StaticLib;

/// <summary>
///     Used for subscribing to the hotReload update event, which re-generates the outputed content.
/// </summary>
internal sealed class HotReloadManager
{
    internal static bool HotReloadEnabled { get; set; }

    public static void UpdateApplication(Type[]? updatedTypes)
    {
        if(HotReloadEnabled)
        {
            BlazorStaticExtensions.UseBlazorStaticGeneratorOnHotReload();
        }
    }
}