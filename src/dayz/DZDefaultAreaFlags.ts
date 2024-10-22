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

function argbToComponentsText(color) {
    const a = (color >>> 24) & 0xff;
    const r = (color >>> 16) & 0xff;
    const g = (color >>> 8) & 0xff;
    const b = color & 0xff;

    return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`;
}

function rgbaToComponents(rgba: string) {
    let out = rgba.substring(5, rgba.length - 1).split(',').map(Number);
    out[3] = Math.round(out[3] * 255)
    return out
}
export const DZ_DEFAULT_USAGE_COLORS_DEF = [
    "rgba(197, 0, 0, 0.58)",
    "rgba(77, 77, 77, 0.47)",
    "rgba(83, 160, 168, 0.61)",
    "rgba(66, 203, 75, 0.55)",
    "rgba(207, 34, 152, 0.50)",
    "rgba(97, 75, 50, 0.76)",
    "rgba(28, 103, 168, 0.70)",
    "rgba(208, 208, 38, 0.77)",
    "rgba(190, 147, 62, 0.81)",
    "rgba(106,51,97,0.74)",
    "rgba(101, 197, 186, 0.80)",
    "rgba(33, 78, 83, 0.47)",
    "rgb(255,95,239)",
    "rgba(190, 80, 179, 0.61)",
    "rgba(224, 255, 69, 0.45)",
    "rgba(85, 0, 0, 0.47)"
]


export const DZ_DEFAULT_VALUE_COLORS_DEF = [
    "rgba(178, 235, 255, 0.47)",
    "rgba(36,106,111,0.67)",
    "rgba(83,49,255,0.56)",
    "rgba(229,165,1,0.68)",
    "rgba(243, 255, 0, 0.60)"
]

export const DZ_DEFAULT_USAGE_COLORS = DZ_DEFAULT_USAGE_COLORS_DEF.map((itm) => rgbaToComponents(itm))

export const DZ_DEFAULT_VALUE_COLORS = DZ_DEFAULT_VALUE_COLORS_DEF.map((itm) => rgbaToComponents(itm))


