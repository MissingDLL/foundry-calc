// ============================================================
// data/game-data.js
// ============================================================
// Central constants for all game entities.
// All three objects are frozen (read-only) so accidental mutations
// are caught at runtime as TypeError (strict mode) or silently
// ignored (sloppy mode).
//
// Usage pattern throughout the codebase:
//   RECIPES["Iron Plate"].machines[M.ASSEMBLER_I]
//   r.category === CAT.METALLURGY
//   ing.item === I.STEEL_BEAMS
// ============================================================

// ── Machine name constants ────────────────────────────────────
// M is used as the key in every recipe's `machines` object.
// Referencing M.ASSEMBLER_I instead of the raw string prevents
// typos and enables IDE auto-complete / rename refactoring.
const M = Object.freeze({
  ADVANCED_SMELTER: "Advanced Smelter",
  ASSEMBLER_I: "Assembler I",
  ASSEMBLER_II: "Assembler II",
  ASSEMBLER_III: "Assembler III",
  BARREL_FILLER_I: "Barrel Filler I",
  BLAST_FURNACE: "Blast Furnace",
  CASTING_MACHINE: "Casting Machine",
  CHARACTER: "Character",           // hand-crafting by the player
  CHEMICAL_PROCESSOR: "Chemical Processor",
  CRYSTAL_REFINER: "Crystal Refiner",
  CRUSHER_I: "Crusher I",
  CRUSHER_II: "Crusher II",
  ELECTRIC_ARC_FURNACE: "Electric Arc Furnace",
  FLUID_ASSEMBLER_I: "Fluid-Assembler I",
  DRONE_MINER_I: "Drone Miner I",
  DRONE_MINER_II: "Drone Miner II",
  BOILER: "Boiler",
  GREENHOUSE: "Greenhouse",
  ORE_VEIN_MINER: "Ore Vein Miner",
  PUMPJACK_I: "Pumpjack I",
  LAVA_SMELTER_I: "Lava-Smelter I",
  LAVA_SMELTER_II: "Lava-Smelter II",
  SMELTER_SMALL: "Smelter (Small)",
  DISTILLATION_COLUMN: "Distillation Column",
  ASSEMBLY_LINE:          "Assembly Line",
  ASSEMBLY_LINE_START:    "Assembly Line Start",
  ASSEMBLY_LINE_PRODUCER: "Assembly Line Producer",
  ASSEMBLY_LINE_PAINTER:  "Assembly Line Painter",
});

// ── Assembly Line sub-machine composition ─────────────────────
// One fully-loaded Assembly Line (32 robots/min) consists of:
//   1× Start, 10× Producer (5 parts × 2 per part), 1× Painter
// Scale all three by the number of Assembly Lines in use.
const ASSEMBLY_LINE_COMPOSITION = Object.freeze({
  start:    { count: 1,  name: "Assembly Line Start"    },
  producer: { count: 10, name: "Assembly Line Producer" }, // 5 parts × 2
  painter:  { count: 1,  name: "Assembly Line Painter"  },
});

// ── Item name constants ───────────────────────────────────────
// I is used for ingredient/output item names in recipes.
// The key (e.g. I.STEEL_BEAMS) is the JS constant; the value
// ("Steel Beams") is the human-readable in-game name that also
// matches the icon filename and recipe lookup key.
const I = Object.freeze({
  ADVANCED_MACHINERY_PARTS: "Advanced Machinery Parts",
  ADVANCED_XENOFERRITE_IGNIUM_ORE_BLEND: "Advanced Xenoferrite-Ignium Ore Blend",
  AIR: "Air",
  ASSEMBLER_I: "Assembler I",
  ASSEMBLER_II: "Assembler II",
  BARREL: "Barrel",
  BARREL_EMPTY: "Barrel (Empty)",
  BARREL_OLUMITE: "Barrel (Olumite)",
  BIOMASS: "Biomass",
  BLAST_FURNACE_SLAG: "Blast Furnace Slag",
  BUILDING_BLOCK: "Building Block",
  CHARGED_XENO_CRYSTAL: "Charged Xeno-Crystal",
  CRUDE_OLUMITE: "Crude Olumite",
  CEMENT: "Cement",
  CIRCUIT_BOARDS: "Circuit Boards",
  COKED_IGNIUM: "Coked Ignium",
  CONCRETE: "Concrete",
  CONVEYOR_I: "Conveyor I",
  CONVEYOR_II: "Conveyor II",
  CONVEYOR_III: "Conveyor III",
  CONVEYOR_BALANCER_I: "Conveyor Balancer I",
  CONVEYOR_BALANCER_II: "Conveyor Balancer II",
  CONVEYOR_BALANCER_III: "Conveyor Balancer III",
  CONVEYOR_SLOPE_I: "Conveyor Slope I",
  CONVEYOR_SLOPE_II: "Conveyor Slope II",
  CONVEYOR_SLOPE_III: "Conveyor Slope III",
  CPU: "CPU",
  CRUSHER_I: "Crusher I",
  DRONE_MINER_I: "Drone Miner I",
  ELECTRONIC_COMPONENTS: "Electronic Components",
  EMERGENCY_BEACON: "Emergency Beacon",
  ENERGY_CELL: "Energy Cell",
  ESCALATOR_I: "Escalator I",
  ESCALATOR_II: "Escalator II",
  EXPLOSIVE_CHARGE: "Explosive Charge",
  EXPLOSIVES: "Explosives",
  FIRMARLITE_BAR: "Firmarlite Bar",
  FIRMARLITE_SHEET: "Firmarlite Sheet",
  FOREST_SEED_PLANTS: "Forest Seed (Plants)",
  FOREST_SEED_TREES: "Forest Seed (Trees)",
  FREIGHT_ELEVATOR_I: "Freight Elevator I",
  FREIGHT_ELEVATOR_II: "Freight Elevator II",
  FREIGHT_ELEVATOR_III: "Freight Elevator III",
  FUEL_ROD_CASING: "Fuel Rod Casing",
  GLASS: "Glass",
  GRAVEL: "Gravel",
  HIGH_DENSITY_OLUMITE: "High Density Olumite",
  HIGH_TECH_MACHINERY_PARTS: "High-Tech Machinery Parts",
  IMPURE_HIGH_DENSITY_OLUMITE: "Impure High Density Olumite",
  HOT_AIR: "Hot Air",
  HOVER_ENGINE: "Hover Engine",
  HYDRAULIC_PISTON: "Hydraulic Piston",
  IGNIUM_FUEL_ROD: "Ignium Fuel Rod",
  IGNIUM_ORE: "Ignium Ore",
  IGNIUM_ENRICHED_WATER: "Ignium-Enriched Water",
  IGNIUM_ORE_RUBBLE: "Ignium Ore Rubble",
  IGNIUM_POWDER: "Ignium Powder",
  LAVA_SMELTER_I: "Lava-Smelter I",
  LIQUID_FUEL: "Liquid Fuel",
  LIQUID_TELLUXITE: "Liquid Telluxite",
  LIQUID_POLYMER: "Liquid Polymer",
  LOW_DENSITY_OLUMITE: "Low Density Olumite",
  MACHINERY_PARTS: "Machinery Parts",
  MINERAL_ROCK: "Mineral Rock",
  MINING_DRILL: "Mining Drill",
  MAINTENANCE_DRONE: "Maintenance Drone",
  MODULAR_BUILDING_PLANNER: "Modular Building Planner",
  MOLTEN_SUPERALLOY: "Molten Superalloy",
  MOLTEN_TECHNUM: "Molten Technum",
  MOLTEN_XENOFERRITE: "Molten Xenoferrite",
  NAUTICAL_CHASSIS: "Nautical Chassis",
  OLUMIC_ACID: "Olumic Acid",
  OLUMITE: "Olumite",
  OLUMITE_GAS: "Olumite Gas",
  JETPACK_FUEL: "Jetpack Fuel",
  PIPE: "Pipe",
  PORTABLE_FUEL: "Portable Fuel",
  POLYMER_BOARD: "Polymer Board",
  PORTABLE_LIGHT: "Portable Light",
  ROBOT_PARTS: "Robot Parts",
  ROCKY_DESERT_SEED_PLANTS: "Rocky Desert Seed (Plants)",
  ROCKY_DESERT_SEED_TREES: "Rocky Desert Seed (Trees)",
  RUBBER: "Rubber",
  SANDY_DESERT_SEED_PLANTS: "Sandy Desert Seed (Plants)",
  SANDY_DESERT_SEED_TREES: "Sandy Desert Seed (Trees)",
  STEAM: "Steam",
  STEEL_BEAMS: "Steel Beams",
  SUPERALLOY: "Superalloy",
  TECHNUM_ORE: "Technum Ore",
  TECHNUM_ORE_RUBBLE: "Technum Ore Rubble",
  TECHNUM_RODS: "Technum Rods",
  TELLUXITE_INGOT: "Telluxite Ingot",
  TELLUXITE_ORE: "Telluxite Ore",
  TELLUXITE_ORE_RUBBLE: "Telluxite Ore Rubble",
  TELLUXITE_WAFER: "Telluxite Wafer",
  TROPICAL_RAINFOREST_SEED_PLANTS: "Tropical Rainforest Seed (Plants)",
  TROPICAL_RAINFOREST_SEED_TREES: "Tropical Rainforest Seed (Trees)",
  TUNDRA_SEED_PLANTS: "Tundra Seed (Plants)",
  TUNDRA_SEED_TREES: "Tundra Seed (Trees)",
  WASTE_GAS: "Waste Gas",
  WATER: "Water",
  WEAPON_COMPONENTS: "Weapon Components",
  WIRE_COIL: "Wire Coil",
  XENO_CRYSTAL: "Xeno-Crystal",
  XENO_SCRAP: "Xeno-Scrap",
  XENOFERRITE_IGNIUM_ORE_BLEND: "Xenoferrite-Ignium Ore Blend",
  XENOFERRITE_ORE: "Xenoferrite Ore",
  XENOFERRITE_ORE_RUBBLE: "Xenoferrite Ore Rubble",
  XENOFERRITE_PLATES: "Xenoferrite Plates",
  // ── Complete robots ──────────────────────────────────────────────
  COMBAT_ROBOT: "Combat Robot",
  FARMER_ROBOT: "Farmer Robot",
  MINER_ROBOT: "Miner Robot",
  OPERATOR_ROBOT: "Operator Robot",
  PERSONAL_ASSISTANT_ROBOT: "Personal Assistant Robot",
  SCIENCE_ROBOT: "Science Robot",
  // ── Robot parts (used as ingredients in complete-robot recipes) ──
  COMBAT_ROBOT_ARM: "Combat Robot Arm",
  COMBAT_ROBOT_HEAD: "Combat Robot Head",
  COMBAT_ROBOT_LEG: "Combat Robot Leg",
  COMBAT_ROBOT_TORSO: "Combat Robot Torso",
  FARMER_ROBOT_ARM: "Farmer Robot Arm",
  FARMER_ROBOT_HEAD: "Farmer Robot Head",
  FARMER_ROBOT_LEG: "Farmer Robot Leg",
  FARMER_ROBOT_TORSO: "Farmer Robot Torso",
  MINER_ROBOT_ARM: "Miner Robot Arm",
  MINER_ROBOT_HEAD: "Miner Robot Head",
  MINER_ROBOT_LEG: "Miner Robot Leg",
  MINER_ROBOT_TORSO: "Miner Robot Torso",
  OPERATOR_ROBOT_ARM: "Operator Robot Arm",
  OPERATOR_ROBOT_HEAD: "Operator Robot Head",
  OPERATOR_ROBOT_LEG: "Operator Robot Leg",
  OPERATOR_ROBOT_TORSO: "Operator Robot Torso",
  PERSONAL_ASSISTANT_ROBOT_ARM: "Personal Assistant Robot Arm",
  PERSONAL_ASSISTANT_ROBOT_HEAD: "Personal Assistant Robot Head",
  PERSONAL_ASSISTANT_ROBOT_LEG: "Personal Assistant Robot Leg",
  PERSONAL_ASSISTANT_ROBOT_TORSO: "Personal Assistant Robot Torso",
  SCIENCE_ROBOT_ARM: "Science Robot Arm",
  SCIENCE_ROBOT_HEAD: "Science Robot Head",
  SCIENCE_ROBOT_LEG: "Science Robot Leg",
  SCIENCE_ROBOT_TORSO: "Science Robot Torso",
  PAINT: "Paint",
});

// ── Category constants ────────────────────────────────────────
// CAT values appear as the `category` field of every recipe.
// They drive the recipe browser filter tabs and the bot list
// sidebar (which shows only the "Robots" category).
const CAT = Object.freeze({
  METALLURGY: "Metallurgy",
  COMPONENTS: "Components",
  STRUCTURES: "Structures",
  ROBOTS: "Robots",
  HANDHELDS: "Handhelds",
  BUILDINGS: "Buildings",
  DECOR: "Decor",
});

// ── Recipe browser subcategory groupings ──────────────────────
// Maps category name → ordered array of subgroups.
// Each subgroup: { label: string, rows: string[][] }
//   rows[0] = first visual row of items, rows[1] = second row, etc.
//   Items are referenced by canonical name (same as shown in browser).
//   Items not listed in any subgroup appear in an implicit "Other" group.
// Populate this (from subgroups-template.csv) to enable subgroup headers.
const RECIPE_SUBGROUPS = {
  "Metallurgy": [
    { label: "Xenoferrite", rows: [
      ["Xenoferrite Ore", "Xenoferrite Ore (Alternative)", "Xenoferrite Plates (Tier 1)", "Xenoferrite Plates (Tier 2)", "Xenoferrite Plates (Tier 3)"],
    ]},
    { label: "Technum", rows: [
      ["Technum Ore", "Technum Ore (Alternative)", "Technum Rods (Tier 1)", "Technum Rods (Tier 2)", "Technum Rods (Tier 3)"],
    ]},
    { label: "Steel", rows: [
      ["Ignium Ore", "Xenoferrite-Ignium Ore Blend", "Steel Beams (Tier 1)", "Steel Beams (Tier 2)"],
    ]},
    { label: "Telluxite", rows: [
      ["Telluxite Ore", "Telluxite Ingot", "Liquid Telluxite"],
    ]},
    { label: "Firmarlite", rows: [
      ["Firmarlite Sheet"],
    ]},
    { label: "Superalloy", rows: [
      ["Molten Superalloy", "Superalloy"],
    ]},
  ],
  "Components": [
    { label: "Mechanical Components", rows: [
      ["Machinery Parts", "Advanced Machinery Parts", "High-Tech Machinery Parts", "Hydraulic Piston", "Robot Parts", "Construction Materials", "Hover Engine", "Nautical Chassis", "Weapon Components"],
    ]},
    { label: "Electronic Components", rows: [
      ["Wire Coil", "Electronic Components", "Circuit Boards", "Telluxite Wafer", "CPU", "Energy Cell", "Charged Xeno-Crystal", "Xeno Power Core"],
    ]},
    { label: "Chemical", rows: [
      ["Explosives (Primitive)", "Explosives", "Glass", "Low Density Olumite", "Olumite Gas", "Liquid Polymer", "Polymer Board", "Olumic Acid", "Impure High Density Olumite", "High Density Olumite", "Rubber", "Ignium-Enriched Water"],
      ["Paint", "Fracking Liquid"],
    ]},
    { label: "Concrete", rows: [
      ["Gravel", "Cement", "Cement (Slag Reprocessing)", "Concrete", "Hazard Concrete"],
    ]},
    { label: "Fuel", rows: [
      ["Ignium Powder", "Fuel Rod Casing", "Ignium Fuel Rod", "Liquid Fuel", "Space Ship Fuel Canister", "Portable Fuel", "Jetpack Fuel"],
    ]},
    { label: "Barrels", rows: [
      ["Barrel (Empty)", "Barrel (Olumite)", "Empty Barreled Olumite", "Xenoferrite Plates (Barrel Recycle)"],
    ]},
    { label: "Science", rows: [
      ["Science Pack I", "Science Pack II", "Science Pack III", "Science Pack IV", "Science Pack V"],
    ]},
    { label: "Miscellaneous", rows: [
      ["Biomass", "Coked Ignium"],
    ]},
  ],
  "Structures": [
    { label: "Infrastructure", rows: [
      ["Building Block", "Emergency Beacon", "Space Station Terminal", "Research Server", "Omni-Analyzer", "Robot Workstation I", "Robot Workstation II", "Robot Workstation III"],
    ]},
    { label: "Solid Item Logistics", rows: [
      ["Conveyor Belt", "Conveyor Slope I", "Conveyor Slope II", "Conveyor Slope III", "Conveyor Slope IV", "Conveyor Balancer I", "Conveyor Balancer II", "Conveyor Balancer III", "Conveyor Balancer IV"],
      ["Freight Elevator I", "Freight Elevator II", "Freight Elevator III", "Freight Elevator IV", "Shipping Pad (Small)", "Shipping Pad (Medium, Assembly Line)", "Shipping Pad (Medium)", "Cargo Shuttle Start Pad", "Cargo Shuttle Target Pad"],
    ]},
    { label: "Liquid Handling", rows: [
      ["Pipe", "Pipeline", "Pipe Intake", "Pump (Pipes)", "Pump (Pipelines)", "Pipe-to-Pipeline Pump", "Pipeline-to-Pipe Pump", "Cargo Shuttle Start Pad (Liquids)", "Cargo Shuttle Target Pad (Liquids)"],
    ]},
    { label: "Loaders", rows: [
      ["Loader", "Filter Loader", "Loader Second Lane", "Loader Third Lane"],
    ]},
    { label: "Energy", rows: [
      ["Biomass Burner", "Burner Generator", "Boiler", "Geothermal Boiler", "Steam Turbine", "Solar Panel (Small)", "Solar Panel (Large)", "Battery (Small)", "Battery (Large)", "Power Pole (Small)", "Power Pole (Large)", "Power Pole (Wall-Mounted)"],
      ["Transformer (Small)", "Transformer (Large)"],
    ]},
    { label: "Resource Gathering", rows: [
      ["Drone Miner I", "Drone Miner II", "Pumpjack I", "Ore Vein Miner", "Xeno-Scrap-Extraktor", "Xeno-Crystal-Extraktor"],
    ]},
    { label: "Processing", rows: [
      ["Assembler I", "Assembler II", "Assembler III", "Fluid-Assembler I", "Barrel Filler I", "Smelter (Small)", "Advanced Smelter", "Electric Arc Furnace", "Lava-Smelter I", "Lava-Smelter II", "Crusher I", "Crusher II"],
      ["Distillation Column", "Chemical Processor", "Casting Machine", "Crystal Refiner", "Incinerator", "Flare Stack", "Greenhouse", "Resource Separator", "Scrap Recycler"],
    ]},
    { label: "Assembly Lines", rows: [
      ["Assembly Line Rail", "Assembly Line Splitter", "Assembly Line Merger", "Assembly Line Start", "Assembly Line Producer", "Assembly Line Painter", "Assembly Line Logistics Container"],
    ]},
    { label: "Storage", rows: [
      ["Crate", "Container", "Logistic Container I", "Logistic Container II", "Logistic Container III", "Tank", "Xeno-Logistics Container", "Xeno-Logistics Tower"],
    ]},
    { label: "Mobility", rows: [
      ["Elevator", "Walkway", "Escalator I", "Escalator II", "Escalator III", "Ladder", "Stairs"],
    ]},
    { label: "Construction Industry", rows: [
      ["Transport Ship Port", "Construction Ship Port", "Construction Warehouse", "Quarry", "Drill Ship"],
    ]},
    { label: "Data Cable System", rows: [
      ["Data Cable", "Data Evaluator", "Data Memory Cell", "Data Processor", "Data Source", "Data Source (Button)", "Data Source (Lever)"],
    ]},
  ],
  "Buildings": [
    { label: "Modular Buildings", rows: [
      ["Long Range Scanner Base", "Radio Tower Base", "Modular Storage Tank Base", "Fracking Tower Base", "Air Intake Base", "Hot Air Stove Base", "Blast Furnace Base", "Monument Base"],
    ]},
  ],
  "Handhelds": [
    { label: "General", rows: [
      ["Mining Drill", "Mining Laser", "Excavation Drone Controller", "Ore Scanner (Handheld)", "Power Line", "Orbital Uplink", "Plumber Tool", "Modular Building Planner", "Paint Roller", "Irrigation Tool"],
    ]},
    { label: "Explosives", rows: [
      ["Explosives Detonator", "Explosive Charge", "Heavy Explosive Charge", "Shaped Charge", "Shaped Charge (Heavy)"],
    ]},
  ],
  "Robots": [
    { label: "Bots", rows: [
      ["Transport Bot", "Heavy Duty Transport Bot", "Transport Drone", "Vacuum Bot", "Cleaning Bot", "Snack Bot", "Light Bot", "Screen Bot", "Science Assistant Drone", "Operator Bot", "Planter Drone", "Mining Drone"],
      ["Maintenance Drone", "Combat Drone", "Aquatic Hauling Bot", "Marine Exploration Bot", "Hydro Mining Bot", "Hydro Farming Bot"],
    ]},
    { label: "Personal Assistant Robot", rows: [
      ["Personal Assistant Robot Torso", "Personal Assistant Robot Head", "Personal Assistant Robot Arm", "Personal Assistant Robot Leg"],
    ]},
    { label: "Operator Robot", rows: [
      ["Operator Robot Torso", "Operator Robot Head", "Operator Robot Arm", "Operator Robot Leg"],
    ]},
    { label: "Farmer Robot", rows: [
      ["Farmer Robot Torso", "Farmer Robot Head", "Farmer Robot Arm", "Farmer Robot Leg"],
    ]},
    { label: "Combat Robot", rows: [
      ["Combat Robot Torso", "Combat Robot Head", "Combat Robot Arm", "Combat Robot Leg"],
    ]},
    { label: "Mining Robot", rows: [
      ["Miner Robot Torso", "Miner Robot Head", "Miner Robot Arm", "Miner Robot Leg"],
    ]},
    { label: "Science Robot", rows: [
      ["Science Robot Torso", "Science Robot Head", "Science Robot Arm", "Science Robot Leg"],
    ]},
  ],
  "Decor": [
    { label: "Miscellaneous", rows: [
      ["Sign", "Railings", "Construction Site Decor"],
    ]},
    { label: "Lights", rows: [
      ["Ceiling Light", "Ceiling Light (Large)", "Wall Light", "Portable Light", "Light Pole I", "Light Pole II"],
    ]},
    { label: "Doors", rows: [
      ["Door (Single)", "Door (Double)", "Hangar Gate"],
    ]},
    { label: "Blocks", rows: [
      ["Decor (Basic Shapes)", "Wooden Blocks"],
    ]},
    { label: "Structures", rows: [
      ["Decor (Misc)", "Decor (Struts)", "Decor (Support Truss)", "Decor (Support)", "Decor (Walls)", "Decor (Modular Windows Slope Edge)", "Decor (Modular Windows Slope)", "Decor (Modular Window Wedge)", "Decor (Modular Windows)", "Decor (Windows)"],
    ]},
    { label: "Office", rows: [
      ["Office Chair", "Office Couch", "Office Desk", "Office File Cabinet", "Office Plant", "Office Table"],
    ]},
    { label: "Seeds", rows: [
      ["Forest Seed (Plants)", "Forest Seed (Trees)", "Rocky Desert Seed (Plants)", "Rocky Desert Seed (Trees)", "Sandy Desert Seed (Plants)", "Sandy Desert Seed (Trees)", "Tropical Rainforest Seed (Plants)", "Tropical Rainforest Seed (Trees)", "Tundra Seed (Plants)", "Tundra Seed (Trees)"],
    ]},
  ],
};
