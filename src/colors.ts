// Shared item/class coloring lookups used across chart pages.

export const getRgbBarColor = (value: number) => {
    const normalizedValue = Math.max(0, Math.min(1, Number(value) || 0));
    const red = Math.round(255 * (1 - normalizedValue));
    const green = Math.round(180 * normalizedValue);

    return `rgb(${red}, ${green}, 0)`;
};

export const ITEM_CATEGORY_COLORS: Record<string, string> = {
    poison: "#4CAF50",
    aoe: "#FF9800",
};

export const ITEM_CATEGORIES: Record<string, string[]> = {
    poison: [
        "Virulent Darts",
        "Malignant Staff",
        "Toxic Trident",
        "Noxious Scales",
        "Dragon Kris"
    ],
    aoe: [
        "Reaver Halberd", "Cleaving Halberd",
        "Void Scythe",
        "Tidal Band",
        "Arcane Bolt"
    ],
};

export const CLASS_COLORS: Record<string, string> = {
    attack: "#FC6238",
    tank: "#00A5E3",
    support: "#00CDAC",
    spell: "#0065A2",
    utility: "#FF60A8"
}

export const CLASS_CATEGORIES: Record<string, string[]> = {
    attack: [
        "Berserker's Gauntlet",
        "Crescendo Blades",
        "Hydra Lance",
        "Reaver Halberd", "Cleaving Halberd",
        "Titan's Axe",
        "Toxic Trident",
        "Umbra’s Piercer",
        "Void Scythe"
    ],
    tank: [
        "Aegis Plate",
        "Basher Shield",
        "Mirror Cloak",
        "Noxious Scales",
        "Paladin's Helm",
        "Tempered Mail",
        "Void Bastion"
    ],
    support: [
        "Ancient Rootheart",
        "Healing Touch",
        "Herbal Mist",
        "Holy Pendant",
        "Oracle's Staff",
        "Verdant Wreath",
        "Void Nectar", "Void Salve"
    ],
    spell: [
        "Arcane Bolt",
        "Deathmark Tome",
        "Dragon Kris",
        "Malignant Staff",
        "Prism Barrier",
        "Supernova Pyre",
        "Tidal Band",
        "Void Burst"
    ],
    utility: [
        "Assassin's Mark",
        "Crimson Horn",
        "Glare Lantern",
        "Hex Doll",
        "Tempest Edge",
        "Virulent Darts",
        "Void Caster",
        "Windrunner Boots"
    ]
}

export const getItemColor = (itemName: string) => {
    const category = Object.entries(ITEM_CATEGORIES).find(([, itemNames]) =>
        itemNames.includes(itemName)
    )?.[0];

    return (category && ITEM_CATEGORY_COLORS[category]) || "#8884d8";
};

export const getClassColor = (itemName: string) => {
    const category = Object.entries(CLASS_CATEGORIES).find(([, itemNames]) =>
        itemNames.includes(itemName)
    )?.[0];

    return (category && CLASS_COLORS[category]) || "#666";
};

export const RARITY_COLORS: Record<string, string> = {
    Common: "#B0B0B0",
    Uncommon: "#4CAF50",
    Rare: "#2196F3",
    Epic: "#9C27B0",
    Legendary: "#FF9800",
};

export const getRarityColor = (rarity: string) => RARITY_COLORS[rarity] || "#8884d8";
