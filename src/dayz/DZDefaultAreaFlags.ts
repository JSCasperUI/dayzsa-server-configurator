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

function rgbaCToInt(c) {
    return (c[3] & 0xFF) << 24 | (c[2] & 0xFF) << 16 | (c[1] & 0xFF) << 8 | (c[0] & 0xFF);
}

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
    "rgba(197, 0, 0, 0.38)",
    "rgba(77, 77, 77, 0.47)",
    "rgba(83, 160, 168, 0.31)",
    "rgba(66, 203, 75, 0.55)",
    "rgba(207, 34, 152, 0.50)",
    "rgba(97, 75, 50, 0.76)",
    "rgba(28, 103, 168, 0.70)",
    "rgba(208, 208, 38, 0.77)",
    "rgba(190, 147, 62, 0.81)",
    "rgba(106,51,97,0.74)",
    "rgba(101, 197, 186, 0.40)",
    "rgba(33, 78, 83, 0.47)",
    "rgb(255,95,239)",
    "rgba(190, 80, 179, 0.31)",
    "rgba(224, 255, 69, 0.45)",
    "rgba(85, 1, 1, 0.27)"
]


export const DZ_DEFAULT_VALUE_COLORS_DEF = [
    "rgba(178, 235, 255, 0.35)",
    "rgba(36,106,111,0.35)",
    "rgba(83,49,255,0.35)",
    "rgba(229,165,1,0.35)",
    "rgba(243, 255, 0, 0.35)"
]

export const DZ_DEFAULT_USAGE_COLORS = DZ_DEFAULT_USAGE_COLORS_DEF.map((itm) => rgbaToComponents(itm))

export const DZ_DEFAULT_VALUE_COLORS = DZ_DEFAULT_VALUE_COLORS_DEF.map((itm) => rgbaToComponents(itm))

export const DZ_DEFAULT_USAGE_COLORS_INT = DZ_DEFAULT_USAGE_COLORS.map((itm) => rgbaCToInt(itm))

export const DZ_DEFAULT_VALUE_COLORS_INT = DZ_DEFAULT_VALUE_COLORS.map((itm) => rgbaCToInt(itm))