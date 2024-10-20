export const DZ_DEFAULT_USAGE_FLAGS = [
    "Military",
    "Police",
    "Medic",
    "Firefighter",
    "Industrial",
    "Farm",
    "Coast",
    "Town",
    "Village",
    "Hunting",
    "Office",
    "School",
    "Prison",
    "Lunapark",
    "SeasonalEvent",
    "ContaminatedArea",
    "Historical"
]

export const DZ_DEFAULT_VALUE_FLAGS = [
    "Tier1",
    "Tier2",
    "Tier3",
    "Tier4",
    "Unique",
]
function argbToComponents(color) {
    const a = (color >>> 24) & 0xff;
    const r = (color >>> 16) & 0xff;
    const g = (color >>> 8) & 0xff;
    const b = color & 0xff;

    return [r, g, b, a];
}

export const DZ_DEFAULT_USAGE_COLORS = [1220870144, 2018331981, 2605949096, 2336410443, 2999919256, 3244378930, 4280051624, 2026950694, 2612958014, 2338992993, 3429221818, 2015448659, 4278190080, 2612940979, 1960902469, 2035613696].map((itm)=>argbToComponents(itm))

export const DZ_DEFAULT_VALUE_COLORS = [2041768959,3844369007,3226677759,3857032449,1727266560].map((itm)=>argbToComponents(itm))