import {useLocation, useNavigate} from 'react-router-dom';
import {Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import type {Item, NavState} from "../types";

const ITEM_CATEGORY_COLORS: Record<string, string> = {
    poison: "#4CAF50",
    aoe: "#FF9800",
};

const ITEM_CATEGORIES: Record<string, string[]> = {
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

const CLASS_COLORS: Record<string, string> = {
    attack: "#FC6238",
    tank: "#00A5E3",
    support: "#00CDAC",
    spell: "#0065A2",
    utility: "#FF60A8"
}

const CLASS_CATEGORIES: Record<string, string[]> = {
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

const getItemColor = (itemName: string) => {
    const category = Object.entries(ITEM_CATEGORIES).find(([, itemNames]) =>
        itemNames.includes(itemName)
    )?.[0];

    return (category && ITEM_CATEGORY_COLORS[category]) || "#8884d8";
};

const getXAxisColor = (itemName: string) => {
    const category = Object.entries(CLASS_CATEGORIES).find(([, itemNames]) =>
        itemNames.includes(itemName)
    )?.[0];

    return (category && CLASS_COLORS[category]) || "#666";
};

interface XAxisTickProps {
    x?: number;
    y?: number;
    payload?: { value: string };
}

const XAxisTick = ({x, y, payload}: XAxisTickProps) => (
    <g transform={`translate(${x},${y})`}>
        <text
            x={0}
            y={0}
            dy={16}
            textAnchor="end"
            fill={getXAxisColor(payload?.value ?? "")}
            transform="rotate(-45)"
        >
            {payload?.value}
        </text>
    </g>
);

export default function TrialChart() {
    const navigate = useNavigate();
    const location = useLocation();
    const {trial_id, json, file_name} = (location.state as NavState) || {};

    const trialData: Item[] = (trial_id != null && json?.items_by_trial?.[trial_id]) || [];
    const trialSummary = json?.trials?.find((trial) => trial.trial_id === trial_id);

    const trials = json?.trials ?? [];
    const currentIndex = trials.findIndex((trial) => trial.trial_id === trial_id);
    const prevTrial = currentIndex > 0 ? trials[currentIndex - 1] : undefined;
    const nextTrial = currentIndex >= 0 && currentIndex < trials.length - 1
        ? trials[currentIndex + 1]
        : undefined;

    const goToTrial = (id: number) => {
        navigate('/TrialChart', {
            state: {
                json: json,
                file_name: file_name,
                trial_id: id
            }
        });
    };

    return (
        <div style={{width: '100%', height: 400}}>
            <button onClick={() =>
                navigate('/AllTrialsChart', {
                    state: {
                        json: json,
                        file_name: file_name
                    }
                })}>
                Back
            </button>
            <button
                onClick={() => prevTrial && goToTrial(prevTrial.trial_id)}
                disabled={!prevTrial}
                style={{marginLeft: 8}}
            >
                Previous
            </button>
            <button
                onClick={() => nextTrial && goToTrial(nextTrial.trial_id)}
                disabled={!nextTrial}
                style={{marginLeft: 8}}
            >
                Next
            </button>
            <h2 style={{textAlign: 'center', marginBottom: 10, marginTop: 10}}>
                Trial {trial_id}
            </h2>
            <h4 style={{textAlign: 'center', marginBottom: 10, marginTop: 10}}>
                {trialSummary && `Clear Rate: ${Math.trunc(trialSummary.clear_rate * 100)}%, Total Clears: ${trialSummary.total_clears}, Total Sims: ${trialSummary.total_sims}`}
            </h4>
            <h4 style={{textAlign: 'center', marginBottom: 10, marginTop: 10}}>
                {trialSummary && `Avg. Level: ${trialSummary.avg_level}, Avg. Tier: ${trialSummary.avg_tier}, Unique Builds: ${trialSummary.unique_builds}`}
            </h4>
            <ResponsiveContainer>
                <BarChart
                    data={trialData}
                    margin={{top: 5, right: 30, left: 20, bottom: 100}}
                >
                    <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                        height={100}
                        tick={<XAxisTick/>}
                    />
                    <YAxis domain={[0, "dataMax"]} tickFormatter={(value) => `${value}%`}/>
                    <Tooltip formatter={(value) => `${value}%`}/>
                    <Bar
                        dataKey="win_rate"
                    >
                        {trialData.map((item) => (
                            <Cell key={item.name} fill={getItemColor(item.name)}/>
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
