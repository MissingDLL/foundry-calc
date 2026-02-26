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
