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
        "Reaver Halberd",
        "Cleaving Halberd",
        "Void Scythe",
        "Tidal Band",
        "Arcane Bolt",
        "Storm Hammer",
        "Crackling Embers"
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
        "Cleaving Halberd",
        "Demon Cat Idol",
        "Diminuendo Sword",
        "Hydra Lance",
        "Reaver Halberd",
        "Storm Hammer",
        "Titan's Axe",
        "Throwing Axe",
        "Toxic Trident",
        "Umbra’s Piercer",
        "Void Scythe"
    ],
    tank: [
        "Aegis Plate",
        "Basher Shield",
        "Chonk Whistle",
        "Iron Thistle",
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
        "Loaf Cat Plush",
        "Monsoon",
        "Oracle's Staff",
        "Verdant Wreath",
        "Void Nectar",
        "Void Salve"
    ],
    spell: [
        "Arcane Barrage",
        "Arcane Bolt",
        "Crackling Embers",
        "Deathmark Tome",
        "Dragon Kris",
        "Malignant Staff",
        "Mouse Charm",
        "Neko Charm",
        "Prism Barrier",
        "Stick of Doom",
        "Supernova Pyre",
        "Tidal Band",
        "Tidal Surge",
        "Void Burst",
        "Void Rime"
    ],
    utility: [
        "Assassin's Mark",
        "Crimson Horn",
        "Glare Lantern",
        "Hex Doll",
        "Pompom of Pep",
        "Tempest Edge",
        "Tiara of Bells",
        "Virulent Darts",
        "Void Caster",
        "Windrunner Boots"
    ]
}

// Returns the category color for items that belong to a named category, null otherwise.
export const getItemCategoryColor = (itemName: string): string | null => {
    const category = Object.entries(ITEM_CATEGORIES).find(([, itemNames]) =>
        itemNames.includes(itemName)
    )?.[0];
    return (category && ITEM_CATEGORY_COLORS[category]) ?? null;
};

export const getClassColor = (itemName: string) => {
    const category = Object.entries(CLASS_CATEGORIES).find(([, itemNames]) =>
        itemNames.includes(itemName)
    )?.[0];

    return (category && CLASS_COLORS[category]) || "#666";
};

export const RARITY_COLORS: Record<string, string> = {
    Common: "#888888",
    Uncommon: "#5fd35f",
    Rare: "#5aa9ff",
    Epic: "#c77dff",
    Mythic: "#d4a017"
};

export const getRarityColor = (rarity: string) => RARITY_COLORS[rarity] || "#8884d8";
