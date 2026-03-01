const RECIPES = {
  // ── Metallurgy ──────────────────────────────────────────
  "Telluxite Ore Rubble": {
    category: CAT.METALLURGY,
    ingredients: [],
    output: { amount: 1 },
    machines: {
      [M.ORE_VEIN_MINER]: { cycleTime: 60 / 160 },
    },
  },
  "Xenoferrite Ore Rubble": {
    category: CAT.METALLURGY,
    ingredients: [],
    output: { amount: 1 },
    machines: {
      [M.DRONE_MINER_I]: { cycleTime: 60 / 65 },
      [M.DRONE_MINER_II]: { cycleTime: 60 / 95 },
      [M.ORE_VEIN_MINER]: { cycleTime: 60 / 160 },
    },
  },
  "Ignium Ore Rubble": {
    category: CAT.METALLURGY,
    ingredients: [],
    output: { amount: 1 },
    machines: {
      [M.DRONE_MINER_I]: { cycleTime: 60 / 65 },
      [M.DRONE_MINER_II]: { cycleTime: 60 / 95 },
      [M.ORE_VEIN_MINER]: { cycleTime: 60 / 160 },
    },
  },
  "Technum Ore Rubble": {
    category: CAT.METALLURGY,
    ingredients: [],
    output: { amount: 1 },
    machines: {
      [M.DRONE_MINER_I]: { cycleTime: 60 / 65 },
      [M.DRONE_MINER_II]: { cycleTime: 60 / 95 },
      [M.ORE_VEIN_MINER]: { cycleTime: 60 / 160 },
    },
  },
  "Advanced Xenoferrite-Ignium Ore Blend": {
    category: CAT.METALLURGY,
    ingredients: [
      { item: I.XENOFERRITE_ORE, amount: 4 },
      { item: I.IGNIUM_ORE, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CRUSHER_I]: { cycleTime: 3 },
      [M.CRUSHER_II]: { cycleTime: 1.5 },
    },
  },
  "Firmarlite Sheet": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.FIRMARLITE_BAR, amount: 4 }],
    output: { amount: 1 },
    machines: {
      [M.LAVA_SMELTER_I]: { cycleTime: 6 },
      [M.LAVA_SMELTER_II]: { cycleTime: 3 },
    },
  },
  "Ignium Ore": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.IGNIUM_ORE_RUBBLE, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.CRUSHER_I]: { cycleTime: 1.5 },
      [M.CRUSHER_II]: { cycleTime: 0.75 },
    },
  },
  "Liquid Telluxite": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.TELLUXITE_INGOT, amount: 40 }],
    output: { amount: 2000 },
    machines: {
      [M.ELECTRIC_ARC_FURNACE]: { cycleTime: 60 },
    },
  },
  "Steel Beams (Tier 1)": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.XENOFERRITE_IGNIUM_ORE_BLEND, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ADVANCED_SMELTER]: { cycleTime: 4 },
      [M.SMELTER_SMALL]: { cycleTime: 6 },
    },
  },
  "Steel Beams (Tier 2)": {
    category: CAT.METALLURGY,
    ingredients: [
      { item: I.ADVANCED_XENOFERRITE_IGNIUM_ORE_BLEND, amount: 1 },
    ],
    output: { amount: 2 },
    machines: { [M.ADVANCED_SMELTER]: { cycleTime: 4 } },
  },
  "Technum Ore": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.TECHNUM_ORE_RUBBLE, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.CRUSHER_I]: { cycleTime: 1.5 },
      [M.CRUSHER_II]: { cycleTime: 0.75 },
    },
  },
  "Technum Ore (Alternative)": {
    category: CAT.METALLURGY,
    ingredients: [
      { item: I.TECHNUM_ORE_RUBBLE, amount: 2 },
      { item: I.XENO_CRYSTAL, amount: 1 },
    ],
    output: { amount: 3 },
    machines: {
      [M.CRUSHER_I]: { cycleTime: 4.5 },
      [M.CRUSHER_II]: { cycleTime: 2.25 },
    },
  },
  "Steam": {
      category: CAT.COMPONENTS,
      ingredients: [
        { item: I.WATER, amount: 20 },
      ],
      output: { amount: 60 },
      machines: {
        [M.BOILER]: { cycleTime: 60 },
      },
      variants: [
        "Steam (Portable Fuel)",
        "Steam (Jetpack Fuel)",
        "Steam (Coked Ignium)",
        "Steam (Ignium Fuel Rod)",
      ],
    },
    "Steam (Portable Fuel)": {
      category: CAT.COMPONENTS,
      ingredients: [
        { item: I.WATER, amount: 20 },
        { item: I.PORTABLE_FUEL, amount: 13.5 },
      ],
      output: { amount: 60 },
      machines: {
        [M.BOILER]: { cycleTime: 60 },
      },
    },
    "Steam (Jetpack Fuel)": {
      category: CAT.COMPONENTS,
      ingredients: [
        { item: I.WATER, amount: 20 },
        { item: I.JETPACK_FUEL, amount: 8.64 },
      ],
      output: { amount: 60 },
      machines: {
        [M.BOILER]: { cycleTime: 60 },
      },
    },
    "Steam (Coked Ignium)": {
      category: CAT.COMPONENTS,
      ingredients: [
        { item: I.WATER, amount: 20 },
        { item: I.COKED_IGNIUM, amount: 0.54 },
      ],
      output: { amount: 60 },
      machines: {
        [M.BOILER]: { cycleTime: 60 },
      },
    },
    "Steam (Ignium Fuel Rod)": {
      category: CAT.COMPONENTS,
      ingredients: [
        { item: I.WATER, amount: 20 },
        { item: I.IGNIUM_FUEL_ROD, amount: 0.54 },
      ],
      output: { amount: 60 },
      machines: {
        [M.BOILER]: { cycleTime: 60 },
      },
    },
        "Technum Rods (Tier 1)": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.TECHNUM_ORE_RUBBLE, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ADVANCED_SMELTER]: { cycleTime: 2 },
      [M.SMELTER_SMALL]: { cycleTime: 3 },
    },
  },
  "Technum Rods (Tier 2)": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.TECHNUM_ORE, amount: 2 }],
    output: { amount: 3 },
    machines: {
      [M.ADVANCED_SMELTER]: { cycleTime: 4 },
      [M.SMELTER_SMALL]: { cycleTime: 6 },
    },
  },
  "Technum Rods (Tier 3)": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.MOLTEN_TECHNUM, amount: 15 }],
    output: { amount: 5 },
    machines: {
      [M.CASTING_MACHINE]: { cycleTime: 7.5 },
    },
  },
  "Molten Technum": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.TECHNUM_ORE, amount: 1280 }, { item: I.HOT_AIR, amount: 324000 }, { item: I.COKED_IGNIUM, amount: 640 }, { item: I.MINERAL_ROCK, amount: 256 }],
    output: [{ item: I.MOLTEN_TECHNUM, amount: 11520 }, { item: I.BLAST_FURNACE_SLAG, amount: 1280 }],
    machines: {
      [M.BLAST_FURNACE]: { cycleTime: 1 },
    },
  },
  "Molten Xenoferrite": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.XENOFERRITE_ORE, amount: 1280 }, { item: I.HOT_AIR, amount: 324000 }, { item: I.COKED_IGNIUM, amount: 640 }, { item: I.MINERAL_ROCK, amount: 256 }],
    output: [{ item: I.MOLTEN_XENOFERRITE, amount: 11520 }, { item: I.BLAST_FURNACE_SLAG, amount: 1280 }],
    machines: {
      [M.BLAST_FURNACE]: { cycleTime: 1 },
    },
  },
  "Telluxite Ingot": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.TELLUXITE_ORE, amount: 4 }],
    output: { amount: 1 },
    machines: {
      [M.ADVANCED_SMELTER]: { cycleTime: 4 },
    },
  },
  "Telluxite Ore": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.TELLUXITE_ORE_RUBBLE, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.CRUSHER_I]: { cycleTime: 1.5 },
      [M.CRUSHER_II]: { cycleTime: 0.75 },
    },
  },
  "Molten Superalloy": {
    category: CAT.METALLURGY,
    ingredients: [
      { item: I.FIRMARLITE_SHEET, amount: 160 },
      { item: I.TELLUXITE_INGOT, amount: 40 },
      { item: I.COKED_IGNIUM, amount: 40 },
    ],
    output: { amount: 4000 },
    machines: {
      [M.ELECTRIC_ARC_FURNACE]: { cycleTime: 60 },
    },
  },
  Superalloy: {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.MOLTEN_SUPERALLOY, amount: 50 }],
    output: { amount: 1 },
    machines: {
      [M.CASTING_MACHINE]: { cycleTime: 3 },
    },
  },
  "Xenoferrite Ore": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.XENOFERRITE_ORE_RUBBLE, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.CRUSHER_I]: { cycleTime: 1.5 },
      [M.CRUSHER_II]: { cycleTime: 0.75 },
    },
  },
  "Xenoferrite Ore (Alternative)": {
    category: CAT.METALLURGY,
    ingredients: [
      { item: I.XENOFERRITE_ORE_RUBBLE, amount: 2 },
      { item: I.XENO_CRYSTAL, amount: 2 },
    ],
    output: { amount: 3 },
    machines: {
      [M.CRUSHER_I]: { cycleTime: 4.5 },
      [M.CRUSHER_II]: { cycleTime: 2.25 },
    },
  },
  "Xenoferrite Plates (Tier 1)": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.XENOFERRITE_ORE_RUBBLE, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ADVANCED_SMELTER]: { cycleTime: 2 },
      [M.SMELTER_SMALL]: { cycleTime: 3 },
    },
  },
  "Xenoferrite Plates (Tier 2)": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.XENOFERRITE_ORE, amount: 2 }],
    output: { amount: 3 },
    machines: {
      [M.ADVANCED_SMELTER]: { cycleTime: 4 },
      [M.SMELTER_SMALL]: { cycleTime: 6 },
    },
  },
  "Xenoferrite Plates (Tier 3)": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.MOLTEN_XENOFERRITE, amount: 15 }],
    output: { amount: 5 },
    machines: {
      [M.CASTING_MACHINE]: { cycleTime: 7.5 },
    },
  },
  "Xenoferrite-Ignium Ore Blend": {
    category: CAT.METALLURGY,
    ingredients: [
      { item: I.XENOFERRITE_ORE, amount: 4 },
      { item: I.IGNIUM_ORE, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CRUSHER_I]: { cycleTime: 3 },
      [M.CRUSHER_II]: { cycleTime: 1.5 },
    },
  },

  // ── Components ──────────────────────────────────────────
  "Advanced Machinery Parts": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.MACHINERY_PARTS, amount: 2 },
      { item: I.STEEL_BEAMS, amount: 1 },
    ],
    output: { amount: 2 },
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 2.666 },
      [M.ASSEMBLER_III]: { cycleTime: 2 },
    },
  },
  "Barrel (Empty)": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
  },
  "Barrel (Olumite)": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.BARREL, amount: 1 },
      { item: I.OLUMITE, amount: 250 },
    ],
    output: { amount: 1 },
    machines: {
      [M.BARREL_FILLER_I]: { cycleTime: 2 },
    },
  },
  Biomass: {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.BIOMASS, amount: 1 },
      { item: I.WATER, amount: 250 },
      { item: I.MINERAL_ROCK, amount: 1 },
    ],
    output: { amount: 2 },
    machines: {
      Greenhouse: { cycleTime: 60 },
    },
    fuel_value: 5,
    fuel_value_unit: "MJ",
  },
  CPU: {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.TELLUXITE_WAFER, amount: 1 },
      { item: I.OLUMIC_ACID, amount: 80 },
      { item: I.POLYMER_BOARD, amount: 2 },
    ],
    output: { amount: 8 },
    machines: {
      [M.CHEMICAL_PROCESSOR]: { cycleTime: 120 },
    },
  },
  Cement: {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.MINERAL_ROCK, amount: 2 },
      { item: I.XENOFERRITE_ORE_RUBBLE, amount: 1 },
    ],
    output: { amount: 2 },
    machines: {
      [M.CRUSHER_I]: { cycleTime: 12 },
      [M.CRUSHER_II]: { cycleTime: 6 },
    },
  },
  "Cement (Slag Reprocessing)": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.BLAST_FURNACE_SLAG, amount: 36 }],
    output: { amount: 1 },
    machines: {
      [M.CHEMICAL_PROCESSOR]: { cycleTime: 12 },
    },
  },
  "Charged Xeno-Crystal": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.XENO_CRYSTAL, amount: 10 },
      { item: I.ENERGY_CELL, amount: 1 },
      { item: I.IGNIUM_ENRICHED_WATER, amount: 2000 },
    ],
    output: { amount: 10 },
    machines: {
      [M.CRYSTAL_REFINER]: { cycleTime: 30 },
    },
  },
  "Circuit Boards": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.POLYMER_BOARD, amount: 1 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.833 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333 },
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
    },
  },
  "Coked Ignium": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.IGNIUM_ORE, amount: 2 }],
    output: { amount: 5 },
    machines: {
      [M.ADVANCED_SMELTER]: { cycleTime: 7.5 },
    },
    fuel_value: 400,
    fuel_value_unit: "MJ",
  },
  Concrete: {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.CEMENT, amount: 2 },
      { item: I.GRAVEL, amount: 4 },
      { item: I.WATER, amount: 20 },
    ],
    output: { amount: 4 },
    machines: {
      [M.CASTING_MACHINE]: { cycleTime: 12 },
    },
  },
  "Construction Materials": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.FIRMARLITE_SHEET, amount: 90 },
      { item: I.STEEL_BEAMS, amount: 15 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 15 },
      { item: I.CONCRETE, amount: 30 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 15 },
    ],
    output: { amount: 150 },
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 90 },
      [M.ASSEMBLER_II]: { cycleTime: 60 },
      [M.ASSEMBLER_III]: { cycleTime: 45 },
    },
  },
  "Crude Olumite": {
    category: CAT.COMPONENTS,
    ingredients: [],
    output: { amount: 1 },
    machines: {
      [M.PUMPJACK_I]: { cycleTime: 60 / 1800 },
    },
  },
  "Electronic Components": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.TECHNUM_RODS, amount: 1 },
      { item: I.WIRE_COIL, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
  },
  "Empty Barreled Olumite": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.BARREL_OLUMITE, amount: 1 },
      { item: I.OLUMITE, amount: 250 },
    ],
    output: [
      { item: I.BARREL_EMPTY, amount: 1 },
      { item: I.OLUMITE, amount: 250 },
    ],
    machines: {
      [M.BARREL_FILLER_I]: { cycleTime: 2 },
    },
  },
  "Energy Cell": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 3 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 6 },
      { item: I.GLASS, amount: 6 },
      { item: I.OLUMIC_ACID, amount: 60 },
    ],
    output: { amount: 6 },
    machines: { [M.FLUID_ASSEMBLER_I]: { cycleTime: 30 } },
  },
  Explosives: {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.IGNIUM_POWDER, amount: 4 },
      { item: I.LOW_DENSITY_OLUMITE, amount: 50 },
    ],
    output: { amount: 1 },
    machines: { [M.FLUID_ASSEMBLER_I]: { cycleTime: 5 } },
  },
  "Explosives (Primitive)": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.IGNIUM_ORE_RUBBLE, amount: 2 },
      { item: I.TECHNUM_ORE_RUBBLE, amount: 2 },
      { item: I.BIOMASS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.833 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333 },
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
    },
  },
  "Fracking Liquid": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.AIR, amount: 30 },
      { item: I.OLUMITE_GAS, amount: 10 },
      { item: I.WATER, amount: 60 },
    ],
    output: { amount: 100 },
    machines: {
      [M.CHEMICAL_PROCESSOR]: { cycleTime: 5 },
    },
  },
  "Fuel Rod Casing": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 1 },
      { item: I.STEEL_BEAMS, amount: 1 },
    ],
    output: { amount: 2 },
    machines: {
      [M.CHARACTER]: { cycleTime: 2.5 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
  },
  Glass: {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.GRAVEL, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      [M.ADVANCED_SMELTER]: { cycleTime: 3.333 },
      [M.SMELTER_SMALL]: { cycleTime: 5 },
    },
  },
  Gravel: {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.MINERAL_ROCK, amount: 2 },
    ],
    output: { amount: 6 },
    machines: {
      [M.CRUSHER_I]: { cycleTime: 12 },
      [M.CRUSHER_II]: { cycleTime: 6 },
    },
  },
  "Hazard Concrete": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.CONCRETE, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.166 },
      [M.ASSEMBLER_I]: { cycleTime: 1 },
      [M.ASSEMBLER_II]: { cycleTime: 0.666 },
      [M.ASSEMBLER_III]: { cycleTime: 0.5 },
    },
  },
  "High Density Olumite": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.IMPURE_HIGH_DENSITY_OLUMITE, amount: 50 },],
    output: [{ item: I.HIGH_DENSITY_OLUMITE, amount: 40 }, { item: I.WASTE_GAS, amount: 10 }],
    machines: { [M.DISTILLATION_COLUMN]: { cycleTime: 6 } },
  },
  "High-Tech Machinery Parts": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.SUPERALLOY, amount: 1 },
      { item: I.RUBBER, amount: 2 },
      { item: I.LOW_DENSITY_OLUMITE, amount: 5 },
    ],
    output: { amount: 2 },
    machines: { [M.FLUID_ASSEMBLER_I]: { cycleTime: 6 } },
  },
  "Hover Engine": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.TECHNUM_RODS, amount: 1 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 1 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 6 },
      [M.ASSEMBLER_II]: { cycleTime: 4 },
      [M.ASSEMBLER_III]: { cycleTime: 3 },
    },
  },
  "Hydraulic Piston": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 1 },
      { item: I.LOW_DENSITY_OLUMITE, amount: 30 },
    ],
    output: { amount: 1 },
    machines: { [M.FLUID_ASSEMBLER_I]: { cycleTime: 5 } },
  },
  "Ignium Fuel Rod": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.FUEL_ROD_CASING, amount: 1 },
      { item: I.WIRE_COIL, amount: 10 },
      { item: I.IGNIUM_POWDER, amount: 20 },
      { item: I.LIQUID_FUEL, amount: 400 },
    ],
    output: { amount: 1 },
    machines: { [M.FLUID_ASSEMBLER_I]: { cycleTime: 15 } },
    fuel_value: 400,
    fuel_value_unit: "MJ",
  },
  "Ignium Powder": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.IGNIUM_ORE_RUBBLE, amount: 1 },
    ],
    output: { amount: 5 },
    machines: {
      [M.CRUSHER_I]: { cycleTime: 5 },
      [M.CRUSHER_I]: { cycleTime: 2.5 },
    },
  },
  "Ignium-Enriched Water": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.IGNIUM_POWDER, amount: 2 },
      { item: I.WATER, amount: 270 },
    ],
    output: { amount: 270 },
    machines: {
      [M.CHEMICAL_PROCESSOR]: { cycleTime: 2.5 },
    },
  },
  "Impure High Density Olumite": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.CRUDE_OLUMITE, amount: 100 }, { item: I.STEAM, amount: 60 }],
    output: [{ item: I.IMPURE_HIGH_DENSITY_OLUMITE, amount: 50 }, { item: I.WASTE_GAS, amount: 50 }],
    machines: { [M.DISTILLATION_COLUMN]: { cycleTime: 6 } },
  },
  "Jetpack Fuel": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 1 },
      { item: I.LIQUID_FUEL, amount: 30 },
    ],
    output: { amount: 1 },
    machines: { [M.FLUID_ASSEMBLER_I]: { cycleTime: 4 } },
    fuel_value: 25,
    fuel_value_unit: "MJ",
  },
  "Liquid Fuel": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.LOW_DENSITY_OLUMITE, amount: 50 }],
    output: { amount: 150 },
    machines: {
      [M.CHEMICAL_PROCESSOR]: { cycleTime: 8 },
    },
  },
  "Machinery Parts": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 1 },
      [M.ASSEMBLER_III]: { cycleTime: 0.75 },
    },
  },
  "Mineral Rock": {
    category: CAT.COMPONENTS,
    ingredients: [],
    output: { amount: 1 },
    machines: {
      [M.DRONE_MINER_I]: { cycleTime: 60 / 65 },
      [M.DRONE_MINER_II]: { cycleTime: 60 / 95 },
      [M.ORE_VEIN_MINER]: { cycleTime: 60 / 160 },
    },
  },
  "Nautical Chassis": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.SUPERALLOY, amount: 1 },
      { item: I.RUBBER, amount: 1 },
      { item: I.GLASS, amount: 1 },
      { item: I.HIGH_TECH_MACHINERY_PARTS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 1 },
      [M.ASSEMBLER_III]: { cycleTime: 0.75 },
    },
  },
  "Olumic Acid": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.IGNIUM_POWDER, amount: 16 },
      { item: I.OLUMITE_GAS, amount: 75 },
      { item: I.WATER, amount: 25 },
    ],
    output: { amount: 40 },
    machines: {
      [M.CHEMICAL_PROCESSOR]: { cycleTime: 8 },
    },
  },
  "Liquid Polymer": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.CRUDE_OLUMITE, amount: 100 }],
    output: [{ item: I.LIQUID_POLYMER, amount: 75 }, { item: I.WASTE_GAS, amount: 50 }],
    machines: { [M.DISTILLATION_COLUMN]: { cycleTime: 4 } },
  },
  "Low Density Olumite": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.CRUDE_OLUMITE, amount: 100 }],
    output: [{ item: I.LOW_DENSITY_OLUMITE, amount: 100 }, { item: I.WASTE_GAS, amount: 25 }],
    machines: { [M.DISTILLATION_COLUMN]: { cycleTime: 4 } },
  },
  "Olumite Gas": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.CRUDE_OLUMITE, amount: 100 }],
    output: [{ item: I.OLUMITE_GAS, amount: 90 }, { item: I.WASTE_GAS, amount: 10 }],
    machines: { [M.DISTILLATION_COLUMN]: { cycleTime: 4 } },
  },
  Paint: {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.LOW_DENSITY_OLUMITE, amount: 50 },
      { item: I.OLUMITE_GAS, amount: 50 },
      { item: I.WATER, amount: 50 },
    ],
    output: { amount: 100 },
    machines: {
      [M.CHEMICAL_PROCESSOR]: { cycleTime: 7.5 },
    },
  },
  "Polymer Board": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.LIQUID_POLYMER, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.CASTING_MACHINE]: { cycleTime: 2 },
    },
  },
  "Portable Fuel": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.BARREL_EMPTY, amount: 1 },
      { item: I.LIQUID_FUEL, amount: 30 },
    ],
    output: { amount: 1 },
    machines: { [M.FLUID_ASSEMBLER_I]: { cycleTime: 4 } },
    fuel_value: 16,
    fuel_value_unit: "MJ",
  },
  "Robot Parts": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.FIRMARLITE_SHEET, amount: 2 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 1 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 4 },
      { item: I.POLYMER_BOARD, amount: 2 },
    ],
    output: { amount: 2 },
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 30 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.ASSEMBLER_III]: { cycleTime: 15 },
    },
  },
  Rubber: {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.LIQUID_POLYMER, amount: 5 },
      { item: I.HIGH_DENSITY_OLUMITE, amount: 10 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CASTING_MACHINE]: { cycleTime: 2 },
    },
  },
  "Science Pack I": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.MACHINERY_PARTS, amount: 5 },
      { item: I.TECHNUM_RODS, amount: 4 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 30 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.ASSEMBLER_III]: { cycleTime: 15 },
    },
  },
  "Science Pack II": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.CONVEYOR_I, amount: 3 },
      { item: I.BUILDING_BLOCK, amount: 6 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 30 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.ASSEMBLER_III]: { cycleTime: 15 },
    },
  },
  "Science Pack III": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 2 },
      { item: I.CONCRETE, amount: 12 },
      { item: I.FIRMARLITE_BAR, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 60 },
      [M.ASSEMBLER_II]: { cycleTime: 40 },
      [M.ASSEMBLER_III]: { cycleTime: 30 },
    },
  },
  "Science Pack IV": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.CIRCUIT_BOARDS, amount: 4 },
      { item: I.ENERGY_CELL, amount: 4 },
      { item: I.FIRMARLITE_SHEET, amount: 4 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 60 },
      [M.ASSEMBLER_II]: { cycleTime: 40 },
      [M.ASSEMBLER_III]: { cycleTime: 30 },
    },
  },
  "Science Pack V": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.ROBOT_PARTS, amount: 4 },
      { item: I.HYDRAULIC_PISTON, amount: 12 },
      { item: I.CPU, amount: 1 },
    ],
    output: { amount: 4 },
    machines: {
      [M.CHARACTER]: { cycleTime: 40 },
      [M.ASSEMBLER_I]: { cycleTime: 240 },
      [M.ASSEMBLER_II]: { cycleTime: 160 },
      [M.ASSEMBLER_III]: { cycleTime: 120 },
    },
  },
  "Space Ship Fuel Canister": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.BARREL_EMPTY, amount: 1 },
      { item: I.FIRMARLITE_SHEET, amount: 5 },
      { item: I.IGNIUM_POWDER, amount: 5 },
      { item: I.LIQUID_FUEL, amount: 100 },
      { item: I.WATER, amount: 20 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHEMICAL_PROCESSOR]: { cycleTime: 5 },
    },
  },
  "Telluxite Wafer": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.LIQUID_TELLUXITE, amount: 400 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CASTING_MACHINE]: { cycleTime: 24 },
    },
  },
  "Weapon Components": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.FIRMARLITE_SHEET, amount: 1 },
      { item: I.MACHINERY_PARTS, amount: 1 },
      { item: I.EXPLOSIVES, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 6 },
      [M.ASSEMBLER_II]: { cycleTime: 4 },
      [M.ASSEMBLER_III]: { cycleTime: 3 },
    },
  },
  "Wire Coil": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.TECHNUM_RODS, amount: 1 }
    ],
    output: { amount: 2 },
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 1 },
      [M.ASSEMBLER_III]: { cycleTime: 0.75 },
    },
  },
  "Xeno Power Core": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.SUPERALLOY, amount: 1 },
      { item: I.XENO_SCRAP, amount: 1 },
      { item: I.CHARGED_XENO_CRYSTAL, amount: 1 },
      { item: I.RUBBER, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CRYSTAL_REFINER]: { cycleTime: 1.5 },
    },
  },
  "Xenoferrite Plates (Barrel Recycle)": {
    category: CAT.COMPONENTS,
    ingredients: [
      { item: I.BARREL_EMPTY, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
  },

  // ── Structures ──────────────────────────────────────────
  [M.ADVANCED_SMELTER]: {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 15 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 5 },
      { item: I.CIRCUIT_BOARDS, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 1.666 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666 },
      [M.ASSEMBLER_III]: { cycleTime: 5 },
    },
    power_consumption: 150,
    power_consumption_unit: "kW",
    size: "3x6x3",
    tags: ["Requires Foundation", "Low Voltage Grid", "Data System Support"],
  },
  [M.ASSEMBLER_I]: {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 10 },
      { item: I.MACHINERY_PARTS, amount: 10 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 1.333 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333 },
      [M.ASSEMBLER_III]: { cycleTime: 4 },
    },
    speed: 1,
    power_consumption: 50,
    power_consumption_unit: "kW",
    size: "3x4x3",
    tags: ["Requires Foundation", "Low Voltage Grid", "Data System Support"],
  },

  [M.ASSEMBLER_III]: {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.ASSEMBLER_II, amount: 1 },
      { item: I.FIRMARLITE_SHEET, amount: 20 },
      { item: I.CIRCUIT_BOARDS, amount: 10 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 1 },
      [M.ASSEMBLER_I]: { cycleTime: 6 },
      [M.ASSEMBLER_II]: { cycleTime: 4 },
      [M.ASSEMBLER_III]: { cycleTime: 3 },
    },
    speed: 2,
    power_consumption: 250,
    power_consumption_unit: "kW",
    size: "3x4x3",
    tags: ["Requires Foundation", "Low Voltage Grid", "Data System Support"],
  },
  "Assembly Line Logistics Container": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 30 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 10 },
      { item: I.CIRCUIT_BOARDS, amount: 10 },
      { item: I.POLYMER_BOARD, amount: 10 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.333 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333 },
      [M.ASSEMBLER_III]: { cycleTime: 4 },
    },
    size: "11x7x11",

    tags: ["Data System Support"],
  },
  "Assembly Line Merger": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 25 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 6 },
      { item: I.CIRCUIT_BOARDS, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.833 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333 },
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
    },
    size: "7x8x7",

    grid: "High Voltage",

    connection_range_m: 15,

    max_connections: 4,
  },
  "Assembly Line Painter": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 40 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 10 },
      { item: I.CIRCUIT_BOARDS, amount: 10 },
      { item: I.HYDRAULIC_PISTON, amount: 10 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.333 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333 },
      [M.ASSEMBLER_III]: { cycleTime: 4 },
    },
    size: "7x8x15",

    type: "Power Consumer",

    grid: "High Voltage",

    connection_range_m: 15,

    max_connections: 4,
  },
  "Assembly Line Producer": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 40 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 10 },
      { item: I.CIRCUIT_BOARDS, amount: 10 },
      { item: I.HYDRAULIC_PISTON, amount: 10 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.333 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333 },
      [M.ASSEMBLER_III]: { cycleTime: 4 },
    },
    size: "7x8x15",

    type: "Power Consumer",

    grid: "High Voltage",

    connection_range_m: 15,

    max_connections: 4,
  },
  "Assembly Line Rail": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 6 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
    size: "Depends on item mode",

    modes: ['Straight', 'Straight (HVG Connector)', 'Curve Right (HVG Connector)', 'Curve Left (HVG Connector)', 'Slope Up', 'Slope Down', 'Slope Up (HVG Connector)', 'Slope Down (HVG Connector)', ],
  },
  "Assembly Line Splitter": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 25 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 6 },
      { item: I.CIRCUIT_BOARDS, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.833 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333 },
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
    },
    size: "7x8x7",

    grid: "High Voltage",

    connection_range_m: 15,

    max_connections: 4,
  },
  "Assembly Line Start": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 30 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 8 },
      { item: I.CIRCUIT_BOARDS, amount: 4 },
      { item: I.HYDRAULIC_PISTON, amount: 8 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.333 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333 },
      [M.ASSEMBLER_III]: { cycleTime: 4 },
    },
    size: "5x8x7",

    type: "Power Consumer",

    grid: "High Voltage",

    connection_range_m: 15,

    max_connections: 4,
  },
  [M.BARREL_FILLER_I]: {
    category: CAT.STRUCTURES,
    ingredients: [],
    output: { amount: 0 },
    machines: {},
  },
  "Battery (Large)": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 10 },
      { item: I.CIRCUIT_BOARDS, amount: 10 },
      { item: I.ENERGY_CELL, amount: 20 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.25 },
      [M.ASSEMBLER_I]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 5 },
      [M.ASSEMBLER_III]: { cycleTime: 3.75 },
    },
    capacity: 1,

    capacity_unit: "GJ",

    size: "5x3x3",

    type: "Battery",

    connection_range_m: 10,

    max_connections: 2,

    grid: "High Voltage",

    tags: ["Requires Foundation", "Data System Support"],
  },
  "Battery (Small)": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 10 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 4 },
      { item: I.TECHNUM_RODS, amount: 20 },
      { item: I.ENERGY_CELL, amount: 10 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.833 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333 },
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
    },
    capacity: 250,

    capacity_unit: "MJ",

    size: "3x2x2",

    type: "Battery",

    connection_range_m: 10,

    max_connections: 2,

    grid: "High Voltage",

    tags: ["Requires Foundation", "Data System Support"],
  },
  "Biomass Burner": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 5 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 5 },
      { item: I.TECHNUM_RODS, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.666 },
      [M.ASSEMBLER_I]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 2.666 },
      [M.ASSEMBLER_III]: { cycleTime: 2 },
    },
    power_generation: 600,
    power_generation_unit: "kW",
    efficiency: 0.7,
    requires_fuel: true,
    size: "1x2x1",
    tags: ["Requires Foundation", "Low Voltage Grid"],
  },
  Boiler: {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.PIPE, amount: 5 },
      { item: I.MACHINERY_PARTS, amount: 10 },
      { item: I.STEEL_BEAMS, amount: 10 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.833 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333 },
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
    },
    input_water_l_per_s: 20,
    output_steam_l_per_s: 60,
    energy_required_mw: 3.6,
    size: "5x5x3",
    tags: ["Requires Foundation"],
  },
  "Building Block": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 6 },
      { item: I.TECHNUM_RODS, amount: 4 },
    ],
    output: { amount: 20 },
    machines: {
      Character: { cycleTime: 0.833 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333 },
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
    },
    size: "1x1x1",
  },
  "Burner Generator": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 25 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 10 },
      { item: I.TECHNUM_RODS, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.666 },
      [M.ASSEMBLER_I]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 2.666 },
      [M.ASSEMBLER_III]: { cycleTime: 2 },
    },
    power_generation: 1.8,
    power_generation_unit: "MW",
    efficiency: 0.8,
    requires_fuel: true,
    size: "4x6x4",
    tags: ["Requires Foundation", "Low Voltage Grid", "Data System Support"],
  },
  "Cargo Shuttle Start Pad": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 200 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 100 },
      { item: I.CIRCUIT_BOARDS, amount: 50 },
      { item: I.GLASS, amount: 20 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 30 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.ASSEMBLER_III]: { cycleTime: 15 },
    },
    size: "31x14x31",
    power_consumption: 300,
    power_consumption_unit: "kW",
    tags: ["Requires Foundation", "Low Voltage Grid", "Blast Resistant"],
    description: "Used for planetary logistics.",
  },
  "Cargo Shuttle Start Pad (Liquids)": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 200 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 100 },
      { item: I.CIRCUIT_BOARDS, amount: 50 },
      { item: I.GLASS, amount: 20 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 30 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.ASSEMBLER_III]: { cycleTime: 15 },
    },
    size: "31x14x31",
    power_consumption: 300,
    power_consumption_unit: "kW",
    tags: ["Requires Foundation", "Low Voltage Grid", "Blast Resistant"],
    description: "Used for planetary logistics.",
  },
  "Cargo Shuttle Target Pad": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 100 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 10 },
      { item: I.CIRCUIT_BOARDS, amount: 10 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 2 },
      [M.ASSEMBLER_I]: { cycleTime: 12 },
      [M.ASSEMBLER_II]: { cycleTime: 8 },
      [M.ASSEMBLER_III]: { cycleTime: 6 },
    },
    size: "31x14x31",
    power_consumption: 300,
    power_consumption_unit: "kW",
    tags: ["Requires Foundation", "Low Voltage Grid", "Blast Resistant"],
    description: "Used for planetary logistics.",
  },
  "Cargo Shuttle Target Pad (Liquids)": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 100 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 10 },
      { item: I.CIRCUIT_BOARDS, amount: 10 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 2 },
      [M.ASSEMBLER_I]: { cycleTime: 12 },
      [M.ASSEMBLER_II]: { cycleTime: 8 },
      [M.ASSEMBLER_III]: { cycleTime: 6 },
    },
    size: "31x14x31",
    power_consumption: 300,
    power_consumption_unit: "kW",
    tags: ["Requires Foundation", "Low Voltage Grid", "Blast Resistant"],
    description: "Used for planetary logistics.",
  },

  "Construction Ship Port": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 100 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 100 },
      { item: I.CIRCUIT_BOARDS, amount: 25 },
      { item: I.ENERGY_CELL, amount: 10 },
      { item: I.POLYMER_BOARD, amount: 50 },
      { item: I.MAINTENANCE_DRONE, amount: 8 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.666 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666 },
      [M.ASSEMBLER_III]: { cycleTime: 5 },
    },
  },
  "Construction Warehouse": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 200 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 50 },
      { item: I.CIRCUIT_BOARDS, amount: 50 },
      { item: I.POLYMER_BOARD, amount: 100 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.666 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666 },
      [M.ASSEMBLER_III]: { cycleTime: 5 },
    },
  },
  Container: {
    category: CAT.STRUCTURES,
    ingredients: [],
    output: { amount: 0 },
    machines: {},
  },
  "Conveyor Balancer I": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.CONVEYOR_I, amount: 4 },
      { item: I.MACHINERY_PARTS, amount: 4 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
    items_per_min: 160,
    size: "2x1x2",
  },
  "Conveyor Balancer II": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.CONVEYOR_BALANCER_I, amount: 1 },
      { item: I.MACHINERY_PARTS, amount: 4 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
    items_per_min: 320,
    size: "2x1x2",
  },
  "Conveyor Balancer III": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.CONVEYOR_BALANCER_II, amount: 1 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 2 },
      { item: I.CIRCUIT_BOARDS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
    items_per_min: 640,
    size: "2x1x2",
  },
  "Conveyor Balancer IV": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.CONVEYOR_BALANCER_III, amount: 1 },
      { item: I.FIRMARLITE_SHEET, amount: 4 },
      { item: I.HYDRAULIC_PISTON, amount: 2 },
      { item: I.RUBBER, amount: 4 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
    items_per_min: 1280,
    size: "2x1x2",
  },
  "Conveyor I": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 1 },
      { item: I.MACHINERY_PARTS, amount: 1 },
    ],
    output: { amount: 2 },
    machines: {
      Character: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
    items_per_min: 160,
    size: "1x1x1",
    tags: ["Data System Support"],
  },
  "Conveyor II": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.CONVEYOR_I, amount: 2 },
      { item: I.MACHINERY_PARTS, amount: 2 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 2 },
    ],
    output: { amount: 2 },
    machines: {
      Character: { cycleTime: 0.833 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333 },
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
    },
    items_per_min: 320,
    size: "1x1x1",
    tags: ["Data System Support"],
  },
  "Conveyor III": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.CONVEYOR_II, amount: 2 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 1 },
      { item: I.CIRCUIT_BOARDS, amount: 1 },
    ],
    output: { amount: 2 },
    machines: {
      Character: { cycleTime: 1.25 },
      [M.ASSEMBLER_I]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 5 },
      [M.ASSEMBLER_III]: { cycleTime: 3.75 },
    },
    items_per_min: 640,
    size: "1x1x1",
    tags: ["Data System Support"],
  },
  "Conveyor IV": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.CONVEYOR_III, amount: 2 },
      { item: I.FIRMARLITE_SHEET, amount: 2 },
      { item: I.HYDRAULIC_PISTON, amount: 1 },
      { item: I.RUBBER, amount: 2 },
    ],
    output: {
      amount: 2,
    },
    machines: {
      Character: { cycleTime: 1.25 },
      [M.ASSEMBLER_I]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 5 },
      [M.ASSEMBLER_III]: { cycleTime: 3.75 },
    },
    items_per_min: 640,
    size: "1x1x1",
    tags: ["Data System Support"],
  },
  "Conveyor Slope I": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.CONVEYOR_I, amount: 2 },
      { item: I.MACHINERY_PARTS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.25 },
      [M.ASSEMBLER_I]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 1 },
      [M.ASSEMBLER_III]: { cycleTime: 0.75 },
    },
    items_per_min: 160,
    size: "2x2x1",
    modes: ["Slope Up", "Slope Down"],
  },
  "Conveyor Slope II": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.CONVEYOR_SLOPE_I, amount: 1 },
      { item: I.MACHINERY_PARTS, amount: 2 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.416 },
      [M.ASSEMBLER_I]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 1.666 },
      [M.ASSEMBLER_III]: { cycleTime: 1.25 },
    },
    items_per_min: 320,
    size: "2x2x1",
    modes: ["Slope Up", "Slope Down"],
  },
  "Conveyor Slope III": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.CONVEYOR_SLOPE_II, amount: 1 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 1 },
      { item: I.CIRCUIT_BOARDS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.625 },
      [M.ASSEMBLER_I]: { cycleTime: 3.75 },
      [M.ASSEMBLER_II]: { cycleTime: 2.5 },
      [M.ASSEMBLER_III]: { cycleTime: 1.875 },
    },
    items_per_min: 640,
    size: "2x2x1",
    modes: ["Slope Up", "Slope Down"],
  },
  "Conveyor Slope IV": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.CONVEYOR_SLOPE_III, amount: 1 },
      { item: I.FIRMARLITE_SHEET, amount: 2 },
      { item: I.HYDRAULIC_PISTON, amount: 1 },
      { item: I.RUBBER, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.625 },
      [M.ASSEMBLER_I]: { cycleTime: 3.75 },
      [M.ASSEMBLER_II]: { cycleTime: 2.5 },
      [M.ASSEMBLER_III]: { cycleTime: 1.875 },
    },
    items_per_min: 1280,
    size: "2x2x1",
    modes: ["Slope Up", "Slope Down"],
  },
  Crate: {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 6 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.333 },
      [M.ASSEMBLER_I]: { cycleTime: 2 },
      [M.ASSEMBLER_II]: { cycleTime: 1.333 },
      [M.ASSEMBLER_III]: { cycleTime: 1 },
    },
    slots: 8,

    size: "2x1x1",
  },
  "Crystal Refiner": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 50 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 20 },
      { item: I.CIRCUIT_BOARDS, amount: 10 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.333 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333 },
      [M.ASSEMBLER_III]: { cycleTime: 4 },
    },
    speed: 1,

    power_consumption: 500,

    power_consumption_unit: "kW",

    size: "4x9x4",

    grid: "Low Voltage",

    tags: ["Requires Foundation", "Data System Support"],
  },
  "Data Cable": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.POLYMER_BOARD, amount: 1 },
      { item: I.WIRE_COIL, amount: 2 },
    ],
    output: { amount: 5 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.333 },
      [M.ASSEMBLER_I]: { cycleTime: 2 },
      [M.ASSEMBLER_II]: { cycleTime: 1.333 },
      [M.ASSEMBLER_III]: { cycleTime: 1 },
    },
  },
  "Data Evaluator": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 1 },
      { item: I.POLYMER_BOARD, amount: 1 },
      { item: I.CIRCUIT_BOARDS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
  },
  "Data Memory Cell": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 1 },
      { item: I.POLYMER_BOARD, amount: 1 },
      { item: I.CIRCUIT_BOARDS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
  },
  "Data Processor": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 1 },
      { item: I.POLYMER_BOARD, amount: 1 },
      { item: I.CIRCUIT_BOARDS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
  },
  "Data Source": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 1 },
      { item: I.POLYMER_BOARD, amount: 1 },
      { item: I.CIRCUIT_BOARDS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
  },
  "Data Source (Button)": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 1 },
      { item: I.POLYMER_BOARD, amount: 1 },
      { item: I.CIRCUIT_BOARDS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
  },
  "Data Source (Lever)": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 1 },
      { item: I.POLYMER_BOARD, amount: 1 },
      { item: I.CIRCUIT_BOARDS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
  },
  "Drill Ship": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 200 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 100 },
      { item: I.CIRCUIT_BOARDS, amount: 100 },
      { item: I.HOVER_ENGINE, amount: 20 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 30 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.ASSEMBLER_III]: { cycleTime: 15 },
    },
  },
  "Drone Miner I": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 10 },
      { item: I.MACHINERY_PARTS, amount: 8 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 6 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.833 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333 },
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
    },
    drone_range: 6,
    drone_count: 4,
    power_consumption: 200,
    power_consumption_unit: "kW",
    size: "2x2x2",
    tags: ["Requires Foundation", "Low Voltage Grid", "Data System Support"],
  },
  "Drone Miner II": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.DRONE_MINER_I, amount: 1 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 10 },
      { item: I.CIRCUIT_BOARDS, amount: 4 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 1.25 },
      [M.ASSEMBLER_I]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 5 },
      [M.ASSEMBLER_III]: { cycleTime: 3.75 },
    },
    drone_range: 8,
    drone_count: 4,
    power_consumption: 400,
    power_consumption_unit: "kW",
    size: "2x2x2",
    tags: ["Requires Foundation", "Low Voltage Grid", "Data System Support"],
  },
  [M.ELECTRIC_ARC_FURNACE]: {
    category: CAT.STRUCTURES,
    ingredients: [],
    output: { amount: 0 },
    machines: {},
  },
  Elevator: {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 50 },
      { item: I.STEEL_BEAMS, amount: 50 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 20 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 15 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.666 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666 },
      [M.ASSEMBLER_III]: { cycleTime: 5 },
    },
    size: "5x3x6",

    type: "Power Conveyor",

    grid: "High Voltage",

    connection_range_m: 15,

    max_connections: 4,

    tags: ["Blast Resistant"],
  },
  "Emergency Beacon": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 2 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
    size: "5x5x5",
    tags: ["Blast Resistant"],
  },
  "Escalator I": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 3 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.25 },
      [M.ASSEMBLER_I]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 1 },
      [M.ASSEMBLER_III]: { cycleTime: 0.75 },
    },
  },
  "Escalator II": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.ESCALATOR_I, amount: 1 },
      { item: I.MACHINERY_PARTS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.25 },
      [M.ASSEMBLER_I]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 1 },
      [M.ASSEMBLER_III]: { cycleTime: 0.75 },
    },
  },
  "Escalator III": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.ESCALATOR_II, amount: 1 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.25 },
      [M.ASSEMBLER_I]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 1 },
      [M.ASSEMBLER_III]: { cycleTime: 0.75 },
    },
  },
  "Filter Loader": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 4 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 4 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
    items_per_min: 1800,
    power_consumption: 5,
    power_consumption_unit: "kW",
    size: "2x2x1",
    tags: ["Requires Foundation", "Low Voltage Grid", "Data System Support"],
    modes: ["Input", "Default", "Output"],
  },
  "Flare Stack": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 10 },
      { item: I.STEEL_BEAMS, amount: 5 },
      { item: I.MACHINERY_PARTS, amount: 5 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.833 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333 },
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
    },
    power_consumption: 200,

    power_consumption_unit: "kW",

    size: "3x12x3",

    grid: "Low Voltage",

    tags: ["Requires Foundation"],
  },
  "Freight Elevator I": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 15 },
      { item: I.STEEL_BEAMS, amount: 15 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 1.25 },
      [M.ASSEMBLER_I]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 5 },
      [M.ASSEMBLER_III]: { cycleTime: 3.75 },
    },
    items_per_min: 320,
    size: "variable",
    tags: ["Blast Resistant"],
    modes: ["Freight Elevator Bottom", "Freight Elevator Top"],
  },
  "Freight Elevator II": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.FREIGHT_ELEVATOR_I, amount: 1 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 5 },
      { item: I.CIRCUIT_BOARDS, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 1.25 },
      [M.ASSEMBLER_I]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 5 },
      [M.ASSEMBLER_III]: { cycleTime: 3.75 },
    },
    items_per_min: 640,
    size: "variable",
    tags: ["Blast Resistant"],
    modes: ["Freight Elevator Bottom", "Freight Elevator Top"],
  },
  "Freight Elevator III": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.FREIGHT_ELEVATOR_II, amount: 1 },
      { item: I.HYDRAULIC_PISTON, amount: 15 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 1.25 },
      [M.ASSEMBLER_I]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 5 },
      [M.ASSEMBLER_III]: { cycleTime: 3.75 },
    },
    items_per_min: 1280,
    size: "variable",
    tags: ["Blast Resistant"],
    modes: ["Freight Elevator Bottom", "Freight Elevator Top"],
  },
  "Freight Elevator IV": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.FREIGHT_ELEVATOR_III, amount: 1 },
      { item: I.CPU, amount: 2 },
      { item: I.RUBBER, amount: 10 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 1.25 },
      [M.ASSEMBLER_I]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 5 },
      [M.ASSEMBLER_III]: { cycleTime: 3.75 },
    },
    items_per_min: 2560,
    size: "variable",
    tags: ["Blast Resistant"],
    modes: ["Freight Elevator Bottom", "Freight Elevator Top"],
  },
  "Geothermal Boiler": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.FIRMARLITE_SHEET, amount: 50 },
      { item: I.STEEL_BEAMS, amount: 25 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 25 },
      { item: I.CIRCUIT_BOARDS, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 2.5 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    input_l_per_min: 2160,
    output_steam_l_per_s: 120,
    size: "7x9x7",
    tags: ["Requires Geothermal Vent", "Data System Support"],
  },
  "Ladder": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.25 },
      [M.ASSEMBLER_I]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 1 },
      [M.ASSEMBLER_III]: { cycleTime: 0.75 },
    },
  },
  [M.LAVA_SMELTER_I]: {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 10 },
      { item: I.FIRMARLITE_BAR, amount: 10 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 5 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.666 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666 },
      [M.ASSEMBLER_III]: { cycleTime: 5 },
    },
    size: "11x12x7",

    tags: ["Data System Support"],
  },
  [M.LAVA_SMELTER_II]: {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: M.LAVA_SMELTER_I, amount: 1 },
      { item: I.FIRMARLITE_SHEET, amount: 50 },
      { item: I.CIRCUIT_BOARDS, amount: 15 },
      { item: I.ENERGY_CELL, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 2.5 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    size: "11x12x7",

    tags: ["Data System Support"],
  },
  Loader: {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 3 },
      { item: I.MACHINERY_PARTS, amount: 3 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
    items_per_min: 1800,
    power_consumption: 5,
    power_consumption_unit: "kW",
    size: "2x2x1",
    tags: ["Requires Foundation", "Low Voltage Grid", "Data System Support"],
    modes: ["Input", "Default", "Output"],
  },
  "Loader Second Lane": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 8 },
      { item: I.MACHINERY_PARTS, amount: 4 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
    items_per_min: 1800,
    power_consumption: 10,
    power_consumption_unit: "kW",
    size: "3x2x1",
    tags: ["Requires Foundation", "Low Voltage Grid", "Data System Support"],
    modes: ["Input", "Default", "Output"],
  },
  "Loader Third Lane": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 12 },
      { item: I.MACHINERY_PARTS, amount: 4 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
    items_per_min: 1800,
    power_consumption: 12,
    power_consumption_unit: "kW",
    size: "4x2x1",
    tags: ["Requires Foundation", "Low Voltage Grid", "Data System Support"],
    modes: ["Input", "Default", "Output"],
  },

  'Container': {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 30 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.833 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333 },
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
    },
    slots: 32,

    size: "4x2x2",
  },
  "Logistic Container I": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 15 },
      { item: I.MACHINERY_PARTS, amount: 4 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.833 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333 },
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
    },
    slots: 10,

    size: "2x3x2",

    tags: ["Loader Support", "Data System Support"],
  },
  "Logistic Container II": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 15 },
      { item: I.STEEL_BEAMS, amount: 10 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 4 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.25 },
      [M.ASSEMBLER_I]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 5 },
      [M.ASSEMBLER_III]: { cycleTime: 3.75 },
    },
    slots: 20,

    size: "4x3x2",

    tags: ["Loader Support", "Data System Support"],
  },
  "Logistic Container III": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 25 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 4 },
      { item: I.CIRCUIT_BOARDS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.666 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666 },
      [M.ASSEMBLER_III]: { cycleTime: 5 },
    },
    slots: 40,

    size: "4x3x4",

    tags: ["Loader Support", "Data System Support"],
  },
  "Omni-Analyzer": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 15 },
      { item: I.MACHINERY_PARTS, amount: 10 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 10 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 1.666 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666 },
      [M.ASSEMBLER_III]: { cycleTime: 5 },
    },
    description:
      "Allows analyzing collectibles like crystals to unlock upgrades.",
    size: "3x2x6",
    tags: ["Blast Resistant"],
  },
  "Ore Vein Miner": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 10 },
      { item: I.MACHINERY_PARTS, amount: 10 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 1.333 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333 },
      [M.ASSEMBLER_III]: { cycleTime: 4 },
    },
    power_consumption: 500,
    power_consumption_unit: "kW",
    size: "10x4x5",
    tags: [
      "High Voltage Grid",
      "Power Consumer",
      "Blast Resistant",
      "Data System Support",
    ],
    hv_connection_range_m: 15,
    hv_max_connections: 1,
  },
  Pipe: {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 2 }],
    output: { amount: 2 },
    machines: {
      Character: { cycleTime: 0.666 },
      [M.ASSEMBLER_I]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 2.666 },
      [M.ASSEMBLER_III]: { cycleTime: 2 },
    },
    size: "1x1x1",
    modes: [
      "Straight",
      "Corner",
      "T-Intersection",
      "4-Intersection",
      "6-Intersection",
      "Smart Drag Mode",
    ],
  },
  "Pipe Intake": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.PIPE, amount: 1 },
      { item: I.MACHINERY_PARTS, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
    throughput_l_per_min: 30000,
    size: "1x1x1",
  },
  "Pipe-to-Pipeline Pump": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 6 },
      { item: I.MACHINERY_PARTS, amount: 5 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
    power_consumption: 1,
    power_consumption_unit: "MW",
    size: "5x4x3",
    tags: ["Requires Foundation", "Low Voltage Grid", "Data System Support"],
    modes: ["LVG", "HVG"],
  },
  Pipeline: {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 8 }],
    output: { amount: 2 },
    machines: {
      Character: { cycleTime: 0.666 },
      [M.ASSEMBLER_I]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 2.666 },
      [M.ASSEMBLER_III]: { cycleTime: 2 },
    },
    size: "variable",
    modes: [
      "Straight",
      "Corner",
      "T-Intersection",
      "4-Intersection",
      "6-Intersection",
    ],
  },
  "Pipeline-to-Pipe Pump": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 6 },
      { item: I.MACHINERY_PARTS, amount: 5 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
    power_consumption: 1,
    power_consumption_unit: "MW",
    size: "5x4x3",
    tags: ["Requires Foundation", "Low Voltage Grid", "Data System Support"],
    modes: ["LVG", "HVG"],
  },
  "Power Pole (Large)": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 10 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 5 },
      { item: I.POLYMER_BOARD, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.833 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333 },
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
    },
    size: "3x13x3",
    tags: ["High Voltage Grid", "Power Conveyor"],
    hv_connection_range_m: 64,
    hv_max_connections: 10,
  },
  "Power Pole (Small)": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 10 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
    size: "1x6x1",
    tags: ["High Voltage Grid", "Power Conveyor"],
    hv_connection_range_m: 32,
    hv_max_connections: 5,
  },
  "Power Pole (Wall-Mounted)": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 4 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
    size: "1x1x1",

    type: "Power Conveyor",

    connection_range_m: 24,

    max_connections: 3,

    grid: "High Voltage",
  },
  "Pump (Pipelines)": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 6 },
      { item: I.MACHINERY_PARTS, amount: 5 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
    power_consumption: 1,
    power_consumption_unit: "MW",
    size: "5x4x3",
    tags: ["Requires Foundation", "Low Voltage Grid", "Data System Support"],
    modes: ["LVG", "HVG"],
  },
  "Pump (Pipes)": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 6 },
      { item: I.MACHINERY_PARTS, amount: 5 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
    power_consumption: 200,
    power_consumption_unit: "kW",
    size: "2x2x1",
    tags: ["Requires Foundation", "Low Voltage Grid", "Data System Support"],
    modes: ["LVG", "HVG"],
  },
  "Pumpjack I": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 12 },
      { item: I.PIPE, amount: 8 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 5 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 1.333 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333 },
      [M.ASSEMBLER_III]: { cycleTime: 4 },
    },
    output_l_per_min: 1800,
    power_consumption: 200,
    power_consumption_unit: "kW",
    size: "3x6x3",
    tags: ["High Voltage Grid", "Power Consumer", "Data System Support"],
    hv_connection_range_m: 15,
    hv_max_connections: 2,
  },
  Quarry: {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 30 },
      { item: I.MACHINERY_PARTS, amount: 20 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 20 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 10 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.833 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333 },
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
    },
  },
  "Research Server": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 20 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 10 },
      { item: I.TECHNUM_RODS, amount: 20 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.666 },
      [M.ASSEMBLER_I]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 2.666 },
      [M.ASSEMBLER_III]: { cycleTime: 2 },
    },
    power_consumption: 200,
    power_consumption_unit: "kW",
    size: "3x4x3",
    tags: ["Requires Foundation", "Low Voltage Grid"],
  },
  "Resource Separator": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 20 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 10 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.333 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333 },
      [M.ASSEMBLER_III]: { cycleTime: 4 },
    },
    power_consumption: 250,

    power_consumption_unit: "kW",

    size: "9x5x5",

    grid: "Low Voltage",

    tags: ["Requires Foundation"],
  },
  "Robot Workstation I": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 10 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 10 },
      { item: I.GLASS, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
    description: "Robots can work here to improve various machines.",
    size: "2x2x2",
  },
  "Robot Workstation II": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 25 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 20 },
      { item: I.CIRCUIT_BOARDS, amount: 10 },
      { item: I.GLASS, amount: 4 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.833 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333 },
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
    },
    description: "Robots can work here to improve various machines.",
    size: "4x2x2",
  },
  "Robot Workstation III": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 50 },
      { item: I.CIRCUIT_BOARDS, amount: 15 },
      { item: I.CPU, amount: 3 },
      { item: I.GLASS, amount: 6 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 1.333 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333 },
      [M.ASSEMBLER_III]: { cycleTime: 4 },
    },
    description: "Robots can work here to improve various machines.",
    size: "4x2x3",
  },
  "Scrap Recycler": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 20 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 10 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.333 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333 },
      [M.ASSEMBLER_III]: { cycleTime: 4 },
    },
    power_consumption: 250,

    power_consumption_unit: "kW",

    size: "9x5x5",

    grid: "Low Voltage",

    tags: ["Requires Foundation"],
  },
  "Shipping Pad (Medium)": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 100 },
      { item: I.CONCRETE, amount: 100 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 50 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 50 },
      { item: I.EMERGENCY_BEACON, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 30 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.ASSEMBLER_III]: { cycleTime: 15 },
    },
    size: "31x19x27",
    tags: ["Blast Resistant"],
    description: "Used for space station logistics.",
  },
  "Shipping Pad (Medium, Assembly Line)": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 100 },
      { item: I.CONCRETE, amount: 100 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 50 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 50 },
      { item: I.EMERGENCY_BEACON, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 30 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.ASSEMBLER_III]: { cycleTime: 15 },
    },
    size: "31x19x27",
    tags: ["Blast Resistant"],
    description: "Used for space station logistics.",
  },
  "Shipping Pad (Small)": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 50 },
      { item: I.MACHINERY_PARTS, amount: 10 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 5 },
      { item: I.EMERGENCY_BEACON, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 2.5 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    size: "20x13x10",
    tags: ["Blast Resistant"],
    description: "Used for space station logistics.",
  },
  [M.SMELTER_SMALL]: {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 10 },
      { item: I.MACHINERY_PARTS, amount: 4 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 4 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 1.666 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666 },
      [M.ASSEMBLER_III]: { cycleTime: 5 },
    },
    power_consumption: 100,
    power_consumption_unit: "kW",
    size: "2x3x2",
    tags: ["Requires Foundation", "Low Voltage Grid"],
  },
  "Solar Panel (Large)": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 30 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 5 },
      { item: I.CIRCUIT_BOARDS, amount: 10 },
      { item: I.ENERGY_CELL, amount: 10 },
      { item: I.GLASS, amount: 10 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 1.666 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666 },
      [M.ASSEMBLER_III]: { cycleTime: 5 },
    },
    power_generation: 650,
    power_generation_unit: "kW",
    size: "5x4x5",
    tags: [
      "Requires Foundation",
      "High Voltage Grid",
      "Power Source",
      "Data System Support",
    ],
    hv_connection_range_m: 10,
    hv_max_connections: 2,
  },
  "Solar Panel (Small)": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 10 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 10 },
      { item: I.GLASS, amount: 10 },
      { item: I.ENERGY_CELL, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 1.333 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333 },
      [M.ASSEMBLER_III]: { cycleTime: 4 },
    },
    power_generation: 300,
    power_generation_unit: "kW",
    size: "3x2x3",
    tags: [
      "Requires Foundation",
      "High Voltage Grid",
      "Power Source",
      "Data System Support",
    ],
    hv_connection_range_m: 10,
    hv_max_connections: 2,
  },
  "Space Station Terminal": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 4 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 2 },
      { item: I.EMERGENCY_BEACON, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
    power_consumption: 50,
    power_consumption_unit: "kW",
    size: "2x4x2",
    tags: ["Requires Foundation", "Low Voltage Grid", "Blast Resistant"],
  },
  Stairs: {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.25 },
      [M.ASSEMBLER_I]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 1 },
      [M.ASSEMBLER_III]: { cycleTime: 0.75 },
    },
  },
  "Steam Turbine": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.PIPE, amount: 10 },
      { item: I.MACHINERY_PARTS, amount: 40 },
      { item: I.STEEL_BEAMS, amount: 25 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 25 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 1.333 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333 },
      [M.ASSEMBLER_III]: { cycleTime: 4 },
    },
    max_steam_intake_l_per_s: 60,
    power_generation: 3.6,
    power_generation_unit: "MW",
    efficiency: 1.0,
    requires_fuel: true,
    size: "12x6x5",
    tags: [
      "Requires Foundation",
      "High Voltage Grid",
      "Power Source",
      "Data System Support",
    ],
    hv_connection_range_m: 15,
    hv_max_connections: 2,
  },
  Tank: {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 10 },
      { item: I.STEEL_BEAMS, amount: 20 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.833 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333 },
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
    },
    capacity: 25000,

    capacity_unit: "l",

    size: "7x4x3",

    tags: ["Requires Foundation", "Data System Support"],
  },
  "Transformer (Large)": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 25 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 10 },
      { item: I.CIRCUIT_BOARDS, amount: 10 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.666 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666 },
      [M.ASSEMBLER_III]: { cycleTime: 5 },
    },
    transmission_mw: 25,

    size: "4x3x3",

    type: "Transformer",

    connection_range_m: 10,

    max_connections: 2,

    grid: ["Low Voltage", "High Voltage"],

    tags: ["Requires Foundation", "Data System Support"],
  },
  "Transformer (Small)": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 15 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 10 },
      { item: I.TECHNUM_RODS, amount: 15 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.833 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333 },
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
    },
    transmission_mw: 5,

    size: "2x2x2",

    type: "Transformer",

    connection_range_m: 10,

    max_connections: 2,

    grid: ["Low Voltage", "High Voltage"],

    tags: ["Requires Foundation", "Data System Support"],
  },
  "Transport Ship Port": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 400 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 200 },
      { item: I.CIRCUIT_BOARDS, amount: 100 },
      { item: I.ENERGY_CELL, amount: 40 },
      { item: I.POLYMER_BOARD, amount: 200 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 2 },
      [M.ASSEMBLER_I]: { cycleTime: 12 },
      [M.ASSEMBLER_II]: { cycleTime: 8 },
      [M.ASSEMBLER_III]: { cycleTime: 6 },
    },
  },
  Walkway: {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 3 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.25 },
      [M.ASSEMBLER_I]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 1 },
      [M.ASSEMBLER_III]: { cycleTime: 0.75 },
    },
    size: "Depends on item mode",

    modes: ['Platform', 'Stairs', 'Ledge', 'Ledge Inside Corner', 'Ledge Outside Corner', ],
  },
  "Xeno-Crystal-Extraktor": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 25 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 25 },
      { item: I.CIRCUIT_BOARDS, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.833 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333 },
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
    },
  },
  "Xeno-Logistics Container": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.MACHINERY_PARTS, amount: 10 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 10 },
      { item: I.XENO_SCRAP, amount: 5 },
      { item: I.XENO_CRYSTAL, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1 },
      [M.ASSEMBLER_I]: { cycleTime: 6 },
      [M.ASSEMBLER_II]: { cycleTime: 4 },
      [M.ASSEMBLER_III]: { cycleTime: 3 },
    },
    slots: 40,

    size: "4x4x4",

    tags: ["Loader Support", "Data System Support"],
  },
  "Xeno-Logistics Tower": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.MACHINERY_PARTS, amount: 10 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 10 },
      { item: I.XENO_SCRAP, amount: 5 },
      { item: I.XENO_CRYSTAL, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1 },
      [M.ASSEMBLER_I]: { cycleTime: 6 },
      [M.ASSEMBLER_II]: { cycleTime: 4 },
      [M.ASSEMBLER_III]: { cycleTime: 3 },
    },
    coverage_area: "96x96",

    power_consumption: 250,

    power_consumption_unit: "kW",

    size: "4x11x4",

    type: "Power Consumer",

    grid: "High Voltage",

    connection_range_m: 32,

    max_connections: 4,
  },
  "Electric Arc Furnace": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 30 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 25 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 50 },
      { item: I.CIRCUIT_BOARDS, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 2.5 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    speed: 1,

    power_consumption: 4,

    power_consumption_unit: "MW",

    size: "18x12x9",

    grid: "Low Voltage",

    tags: ["Requires Foundation", "Data System Support"],
  },

  "Assembler II": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.ASSEMBLER_I, amount: 1 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 6 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1 },
      [M.ASSEMBLER_I]: { cycleTime: 6 },
      [M.ASSEMBLER_II]: { cycleTime: 4 },
      [M.ASSEMBLER_III]: { cycleTime: 3 },
    }, speed: 1.5,
 power_consumption: 125,
 power_consumption_unit: "kW",
 size: "3x4x3",
 grid: "Low Voltage",
 tags: ["Requires Foundation", "Data System Support"],
  },

  "Fluid-Assembler I": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 15 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 10 },
      { item: I.CIRCUIT_BOARDS, amount: 5 },
      { item: I.POLYMER_BOARD, amount: 10 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.666 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666 },
      [M.ASSEMBLER_III]: { cycleTime: 5 },
    }, speed: 1,
 power_consumption: 300,
 power_consumption_unit: "kW",
 size: "3x4x3",
 grid: "Low Voltage",
 tags: ["Requires Foundation", "Data System Support"],
  },

  "Barrel Filler I": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 15 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 10 },
      { item: I.CIRCUIT_BOARDS, amount: 5 },
      { item: I.PIPE, amount: 3 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.666 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666 },
      [M.ASSEMBLER_III]: { cycleTime: 5 },
    }, speed: 1,
 power_consumption: 100,
 power_consumption_unit: "kW",
 size: "3x4x3",
 grid: "Low Voltage",
 tags: ["Requires Foundation", "Data System Support"],
  },

  "Lava-Smelter I": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 10 },
      { item: I.FIRMARLITE_BAR, amount: 10 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 5 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.666 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666 },
      [M.ASSEMBLER_III]: { cycleTime: 5 },
    }, size: "11x12x7",
 tags: ["Data System Support"],
  },

  "Lava-Smelter II": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.LAVA_SMELTER_I, amount: 1 },
      { item: I.FIRMARLITE_SHEET, amount: 50 },
      { item: I.CIRCUIT_BOARDS, amount: 15 },
      { item: I.ENERGY_CELL, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 2.5 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    }, size: "11x12x7",
 tags: ["Data System Support"],
  },

  "Crusher I": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 10 },
      { item: I.MACHINERY_PARTS, amount: 10 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.333 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333 },
      [M.ASSEMBLER_III]: { cycleTime: 4 },
    }, speed: 1,
 power_consumption: 75,
 power_consumption_unit: "kW",
 size: "2x4x2",
 grid: "Low Voltage",
 tags: ["Requires Foundation", "Data System Support"],
  },

  "Crusher II": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.CRUSHER_I, amount: 1 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 5 },
      { item: I.CIRCUIT_BOARDS, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1 },
      [M.ASSEMBLER_I]: { cycleTime: 6 },
      [M.ASSEMBLER_II]: { cycleTime: 4 },
      [M.ASSEMBLER_III]: { cycleTime: 3 },
    }, speed: 2,
 power_consumption: 200,
 power_consumption_unit: "kW",
 size: "2x4x2",
 grid: "Low Voltage",
 tags: ["Requires Foundation", "Data System Support"],
  },

  'Distillation Column': {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 30 },
      { item: I.PIPE, amount: 30 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 15 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 15 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.666 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666 },
      [M.ASSEMBLER_III]: { cycleTime: 5 },
    },
    speed: 1,

    power_consumption: 1,

    power_consumption_unit: "MW",

    size: "5x12x5",

    grid: "Low Voltage",

    tags: ["Requires Foundation", "Data System Support"],
  },
  "Chemical Processor": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 20 },
      { item: I.POLYMER_BOARD, amount: 10 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 5 },
      { item: I.CIRCUIT_BOARDS, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.333 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333 },
      [M.ASSEMBLER_III]: { cycleTime: 4 },
    },
    speed: 1,

    power_consumption: 300,

    power_consumption_unit: "kW",

    size: "7x8x5",

    grid: "Low Voltage",

    tags: ["Requires Foundation", "Data System Support"],
  },

  "Casting Machine": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 15 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 20 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.333 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333 },
      [M.ASSEMBLER_III]: { cycleTime: 4 },
    }, speed: 1,
 power_consumption: 100,
 power_consumption_unit: "kW",
 size: "6x7x3",
 grid: "Low Voltage",
 tags: ["Requires Foundation", "Data System Support"],
  },

  "Incinerator": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 20 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 5 },
      { item: I.CONCRETE, amount: 25 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.833 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333 },
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
    }, power_consumption: 1,
 power_consumption_unit: "MW",
 size: "4x4x3",
 grid: "Low Voltage",
 tags: ["Requires Foundation"],
  },

  "Greenhouse": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 20 },
      { item: I.GLASS, amount: 6 },
      { item: I.PIPE, amount: 4 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.333 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333 },
      [M.ASSEMBLER_III]: { cycleTime: 4 },
    }, speed: 1,
 power_consumption: 100,
 power_consumption_unit: "kW",
 size: "5x7x7",
 grid: "Low Voltage",
 tags: ["Requires Foundation"],
  },

  "Xeno-Scrap-Extraktor": {
    category: CAT.STRUCTURES,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 25 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 25 },
      { item: I.CIRCUIT_BOARDS, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 0.833 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333 },
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
    },
  },

  // ── Buildings ───────────────────────────────────────────
  "Air Intake Base": {
    category: CAT.BUILDINGS,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 200 },
      { item: I.STEEL_BEAMS, amount: 100 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 100 },
      { item: I.CIRCUIT_BOARDS, amount: 25 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 3.333 },
      [M.ASSEMBLER_I]: { cycleTime: 20 },
      [M.ASSEMBLER_II]: { cycleTime: 13.333 },
      [M.ASSEMBLER_III]: { cycleTime: 10 },
    },
    size: "5x5x5",

    modular_building: true,

    modular_building_details: {
        input: "none",
        output: "air",
        adjacency_bonus: false,
      },

    tags: ["Blast Resistant", "Requires Foundation"],
  },
  "Blast Furnace Base": {
    category: CAT.BUILDINGS,
    ingredients: [
      { item: I.CONCRETE, amount: 600 },
      { item: I.STEEL_BEAMS, amount: 600 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 300 },
      { item: I.CIRCUIT_BOARDS, amount: 200 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 3.333 },
      [M.ASSEMBLER_I]: { cycleTime: 20 },
      [M.ASSEMBLER_II]: { cycleTime: 13.333 },
      [M.ASSEMBLER_III]: { cycleTime: 10 },
    },
    size: "26x5x26",

    modular_building: true,

    modular_building_details: {
        input: "none",
        output: "none",
        base_speed: "100%",
        adjacency_bonus: "none",
      },

    tags: ["Blast Resistant", "Requires Foundation"],
  },
  "Fracking Tower Base": {
    category: CAT.BUILDINGS,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 200 },
      { item: I.STEEL_BEAMS, amount: 100 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 25 },
      { item: I.CIRCUIT_BOARDS, amount: 25 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 3.333 },
      [M.ASSEMBLER_I]: { cycleTime: 20 },
      [M.ASSEMBLER_II]: { cycleTime: 13.333 },
      [M.ASSEMBLER_III]: { cycleTime: 10 },
    },
    size: "21x11x21",

    modular_building: true,

    modular_building_details: {
        input: "none",
        output: "none",
        adjacency_bonus: "none",
        power_consumption: 500,
    power_consumption_unit: "kW",
        
      },

    tags: ["Blast Resistant"],
  },
  "Hot Air Stove Base": {
    category: CAT.BUILDINGS,
    ingredients: [
      { item: I.CONCRETE, amount: 100 },
      { item: I.STEEL_BEAMS, amount: 100 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 25 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 25 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 3.333 },
      [M.ASSEMBLER_I]: { cycleTime: 20 },
      [M.ASSEMBLER_II]: { cycleTime: 13.333 },
      [M.ASSEMBLER_III]: { cycleTime: 10 },
    },
    size: "11x5x17",

    modular_building: true,

    modular_building_details: {
        input: "air",
        output: "hot_air",
        adjacency_bonus: true,
      },

    tags: ["Blast Resistant", "Requires Foundation"],
  },
  "Long Range Scanner Base": {
    category: CAT.BUILDINGS,
    ingredients: [
      { item: I.CONCRETE, amount: 25 },
      { item: I.STEEL_BEAMS, amount: 50 },
      { item: I.MACHINERY_PARTS, amount: 25 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 50 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 3.333 },
      [M.ASSEMBLER_I]: { cycleTime: 20 },
      [M.ASSEMBLER_II]: { cycleTime: 13.333 },
      [M.ASSEMBLER_III]: { cycleTime: 10 },
    },
    size: "10x1x27",

    modular_building: true,

    modular_building_details: {
        input: "none",
        output: "none",
        adjacency_bonus: "none",
        power_consumption: 500,
    power_consumption_unit: "kW",
        
      },

    tags: ["Blast Resistant", "Requires Foundation"],
  },
  "Modular Storage Tank Base": {
    category: CAT.BUILDINGS,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 200 },
      { item: I.STEEL_BEAMS, amount: 100 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 25 },
      { item: I.CIRCUIT_BOARDS, amount: 25 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 3.333 },
      [M.ASSEMBLER_I]: { cycleTime: 20 },
      [M.ASSEMBLER_II]: { cycleTime: 13.333 },
      [M.ASSEMBLER_III]: { cycleTime: 10 },
    },
    size: "25x6x25",

    modular_building: true,

    modular_building_details: {},

    tags: ["Blast Resistant", "Requires Foundation"],
  },
  "Monument Base": {
    category: CAT.BUILDINGS,
    ingredients: [{ item: I.CONCRETE, amount: 50 }],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 3.333 },
      [M.ASSEMBLER_I]: { cycleTime: 20 },
      [M.ASSEMBLER_II]: { cycleTime: 13.333 },
      [M.ASSEMBLER_III]: { cycleTime: 10 },
    },
    size: "14x1x10",

    modular_building: true,

    modular_building_details: {},

    tags: ["Blast Resistant"],
  },
  "Radio Tower Base": {
    category: CAT.BUILDINGS,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 200 },
      { item: I.STEEL_BEAMS, amount: 100 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 25 },
      { item: I.CIRCUIT_BOARDS, amount: 25 },
    ],
    output: { amount: 1 },
    machines: {
      Character: { cycleTime: 3.333 },
      [M.ASSEMBLER_I]: { cycleTime: 20 },
      [M.ASSEMBLER_II]: { cycleTime: 13.333 },
      [M.ASSEMBLER_III]: { cycleTime: 10 },
    },
    size: "11x10x11",

    modular_building: true,

    modular_building_details: {
        input: "none",
        output: "none",
        adjacency_bonus: "none",
        power_consumption: 10,
    power_consumption_unit: "MW",
        
      },

    tags: ["Blast Resistant", "Requires Foundation"],
  },

  // ── Handhelds ───────────────────────────────────────────
  "Excavation Drone Controller": {
    category: CAT.HANDHELDS,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 5 },
      { item: I.MACHINERY_PARTS, amount: 5 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 25 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.666 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666 },
      [M.ASSEMBLER_III]: { cycleTime: 5 },
    },
  },
  "Explosive Charge": {
    category: CAT.HANDHELDS,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 1 },
      { item: I.EXPLOSIVES, amount: 1 },
      { item: I.WIRE_COIL, amount: 3 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 3 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.833 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333 },
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
    },
  },
  "Explosives Detonator": {
    category: CAT.HANDHELDS,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 2 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 40 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.333 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333 },
      [M.ASSEMBLER_III]: { cycleTime: 4 },
    },
  },
  "Heavy Explosive Charge": {
    category: CAT.HANDHELDS,
    ingredients: [
      { item: I.EXPLOSIVE_CHARGE, amount: 1 },
      { item: I.EXPLOSIVES, amount: 1 },
      { item: I.LIQUID_FUEL, amount: 150 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHEMICAL_PROCESSOR]: { cycleTime: 8 },
    },
  },
  "Irrigation Tool": {
    category: CAT.HANDHELDS,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 5 },
      { item: I.MACHINERY_PARTS, amount: 5 },
      { item: I.PIPE, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 30 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.ASSEMBLER_III]: { cycleTime: 15 },
    },
  },
  "Mining Drill": {
    category: CAT.HANDHELDS,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 2 },
      { item: I.MACHINERY_PARTS, amount: 1 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.333 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333 },
      [M.ASSEMBLER_III]: { cycleTime: 4 },
    },
  },
  "Mining Laser": {
    category: CAT.HANDHELDS,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 2 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 15 },
      { item: I.ENERGY_CELL, amount: 15 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 15 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.666 },
    },
  },
  "Modular Building Planner": {
    category: CAT.HANDHELDS,
    ingredients: [
      { item: I.POLYMER_BOARD, amount: 1 },
      { item: I.MACHINERY_PARTS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.666 },
      [M.ASSEMBLER_I]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 2.666 },
      [M.ASSEMBLER_III]: { cycleTime: 2 },
    },
  },
  "Orbital Uplink": {
    category: CAT.HANDHELDS,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 1 },
      { item: I.MACHINERY_PARTS, amount: 5 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 20 },
      { item: I.CIRCUIT_BOARDS, amount: 10 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.666 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666 },
      [M.ASSEMBLER_III]: { cycleTime: 5 },
    },
  },
  "Ore Scanner (Handheld)": {
    category: CAT.HANDHELDS,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 4 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 20 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.666 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666 },
      [M.ASSEMBLER_III]: { cycleTime: 5 },
    },
  },
  "Paint Roller": {
    category: CAT.HANDHELDS,
    ingredients: [
      { item: I.BIOMASS, amount: 10 },
      { item: I.TECHNUM_RODS, amount: 1 },
      { item: I.MACHINERY_PARTS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1 },
    },
  },
  "Plumber Tool": {
    category: CAT.HANDHELDS,
    ingredients: [
      { item: I.BIOMASS, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1 },
    },
  },
  "Power Line": {
    category: CAT.HANDHELDS,
    ingredients: [
      { item: I.WIRE_COIL, amount: 2 },
    ],
    output: { amount: 2 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.666 },
      [M.ASSEMBLER_I]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 2.666 },
      [M.ASSEMBLER_III]: { cycleTime: 2 },
    },
  },
  "Shaped Charge": {
    category: CAT.HANDHELDS,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 1 },
      { item: I.EXPLOSIVES, amount: 1 },
      { item: I.CIRCUIT_BOARDS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 1.333 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333 },
      [M.ASSEMBLER_III]: { cycleTime: 4 },
    },
  },
  "Shaped Charge (Heavy)": {
    category: CAT.HANDHELDS,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 2 },
      { item: I.EXPLOSIVES, amount: 2 },
      { item: I.CIRCUIT_BOARDS, amount: 1 },
      { item: I.RUBBER, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 2 },
      [M.ASSEMBLER_I]: { cycleTime: 12 },
      [M.ASSEMBLER_II]: { cycleTime: 8 },
      [M.ASSEMBLER_III]: { cycleTime: 6 },
    },
  },

  // ── Robots ──────────────────────────────────────────────
  "Aquatic Hauling Bot": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.NAUTICAL_CHASSIS, amount: 1 },
      { item: I.CPU, amount: 1 },
      { item: I.HYDRAULIC_PISTON, amount: 1 },
      { item: I.IGNIUM_FUEL_ROD, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 30 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.ASSEMBLER_III]: { cycleTime: 15 },
    },
    weight: 100,
    sales_price: 222,
    workstation_effect: {
      machine_efficiency: 4,
      power_consumption: 20,
    power_consumption_unit: "kW",
      applies_to: ["Chemical Buildings"],
    },
  },
  "Cleaning Bot": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 1 },
      { item: I.POLYMER_BOARD, amount: 1 },
      { item: I.MACHINERY_PARTS, amount: 1 },
      { item: I.CIRCUIT_BOARDS, amount: 1 },
      { item: I.ENERGY_CELL, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 27.5,
    sales_price: 130,
    workstation_effect: {
      machine_efficiency: 2,
      power_consumption: 15,
    power_consumption_unit: "kW",
      applies_to: ["Casting Machines"],
    },
  },
  // ── Vollständige Roboter (Assembly Line) ─────────────────────
  // Eine voll ausgelastete Assembly Line produziert 32 Roboter/min.
  // Zykluszeit = 60 / 32 = 1.875 s. Painter verbraucht 100 Paint/Roboter.
  "Combat Robot": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.COMBAT_ROBOT_HEAD,  amount: 1 },
      { item: I.COMBAT_ROBOT_TORSO, amount: 1 },
      { item: I.COMBAT_ROBOT_ARM,   amount: 2 },
      { item: I.COMBAT_ROBOT_LEG,   amount: 2 },
      { item: I.PAINT,              amount: 100 },
    ],
    output: { amount: 1 },
    machines: { [M.ASSEMBLY_LINE]: { cycleTime: 1.875 } },
  },
  "Farmer Robot": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.FARMER_ROBOT_HEAD,  amount: 1 },
      { item: I.FARMER_ROBOT_TORSO, amount: 1 },
      { item: I.FARMER_ROBOT_ARM,   amount: 2 },
      { item: I.FARMER_ROBOT_LEG,   amount: 2 },
      { item: I.PAINT,              amount: 100 },
    ],
    output: { amount: 1 },
    machines: { [M.ASSEMBLY_LINE]: { cycleTime: 1.875 } },
  },
  "Miner Robot": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.MINER_ROBOT_HEAD,  amount: 1 },
      { item: I.MINER_ROBOT_TORSO, amount: 1 },
      { item: I.MINER_ROBOT_ARM,   amount: 2 },
      { item: I.MINER_ROBOT_LEG,   amount: 2 },
      { item: I.PAINT,             amount: 100 },
    ],
    output: { amount: 1 },
    machines: { [M.ASSEMBLY_LINE]: { cycleTime: 1.875 } },
  },
  "Operator Robot": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.OPERATOR_ROBOT_HEAD,  amount: 1 },
      { item: I.OPERATOR_ROBOT_TORSO, amount: 1 },
      { item: I.OPERATOR_ROBOT_ARM,   amount: 2 },
      { item: I.OPERATOR_ROBOT_LEG,   amount: 2 },
      { item: I.PAINT,                amount: 100 },
    ],
    output: { amount: 1 },
    machines: { [M.ASSEMBLY_LINE]: { cycleTime: 1.875 } },
  },
  "Personal Assistant Robot": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.PERSONAL_ASSISTANT_ROBOT_HEAD,  amount: 1 },
      { item: I.PERSONAL_ASSISTANT_ROBOT_TORSO, amount: 1 },
      { item: I.PERSONAL_ASSISTANT_ROBOT_ARM,   amount: 2 },
      { item: I.PERSONAL_ASSISTANT_ROBOT_LEG,   amount: 2 },
      { item: I.PAINT,                          amount: 100 },
    ],
    output: { amount: 1 },
    machines: { [M.ASSEMBLY_LINE]: { cycleTime: 1.875 } },
  },
  "Science Robot": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.SCIENCE_ROBOT_HEAD,  amount: 1 },
      { item: I.SCIENCE_ROBOT_TORSO, amount: 1 },
      { item: I.SCIENCE_ROBOT_ARM,   amount: 2 },
      { item: I.SCIENCE_ROBOT_LEG,   amount: 2 },
      { item: I.PAINT,               amount: 100 },
    ],
    output: { amount: 1 },
    machines: { [M.ASSEMBLY_LINE]: { cycleTime: 1.875 } },
  },
  "Combat Drone": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.FIRMARLITE_SHEET, amount: 1 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 1 },
      { item: I.CIRCUIT_BOARDS, amount: 1 },
      { item: I.HOVER_ENGINE, amount: 1 },
      { item: I.WEAPON_COMPONENTS, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 45,
    sales_price: 167,
    workstation_effect: {
      machine_efficiency: 2.5,
      power_consumption: 20,
    power_consumption_unit: "kW",
      applies_to: ["Crushers"],
    },
  },
  "Combat Robot Arm": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.ROBOT_PARTS, amount: 1 },
      { item: I.HYDRAULIC_PISTON, amount: 1 },
      { item: I.STEEL_BEAMS, amount: 1 },
      { item: I.WEAPON_COMPONENTS, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 240,
    sales_price: 930,
    workstation_effect: {
      machine_efficiency: 5,
      power_consumption: 40,
    power_consumption_unit: "kW",
      applies_to: ["Crushers"],
    },
  },
  "Combat Robot Head": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.ROBOT_PARTS, amount: 1 },
      { item: I.FIRMARLITE_SHEET, amount: 1 },
      { item: I.WEAPON_COMPONENTS, amount: 2 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 240,
    sales_price: 930,
    workstation_effect: {
      machine_efficiency: 5,
      power_consumption: 40,
    power_consumption_unit: "kW",
      applies_to: ["Crushers"],
    },
  },
  "Combat Robot Leg": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.ROBOT_PARTS, amount: 1 },
      { item: I.HYDRAULIC_PISTON, amount: 1 },
      { item: I.STEEL_BEAMS, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 240,
    sales_price: 930,
    workstation_effect: {
      machine_efficiency: 5,
      power_consumption: 40,
    power_consumption_unit: "kW",
      applies_to: ["Crushers"],
    },
  },
  "Combat Robot Torso": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.ROBOT_PARTS, amount: 1 },
      { item: I.CPU, amount: 1 },
      { item: I.STEEL_BEAMS, amount: 1 },
      { item: I.ENERGY_CELL, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 240,
    sales_price: 930,
    workstation_effect: {
      machine_efficiency: 5,
      power_consumption: 40,
    power_consumption_unit: "kW",
      applies_to: ["Crushers"],
    },
  },
  "Farmer Robot Arm": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.ROBOT_PARTS, amount: 1 },
      { item: I.HYDRAULIC_PISTON, amount: 1 },
      { item: I.XENOFERRITE_PLATES, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 170,
    sales_price: 680,
    workstation_effect: {
      machine_speed: 25,
      power_consumption: 15,
    power_consumption_unit: "kW",
      applies_to: ["Greenhouses", "Crystal Refiners", "Pumpjacks"],
    },
  },
  "Farmer Robot Head": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.ROBOT_PARTS, amount: 1 },
      { item: I.CPU, amount: 1 },
      { item: I.POLYMER_BOARD, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 170,
    sales_price: 680,
    workstation_effect: {
      machine_speed: 25,
      power_consumption: 15,
    power_consumption_unit: "kW",
      applies_to: ["Greenhouses", "Crystal Refiners", "Pumpjacks"],
    },
  },
  "Farmer Robot Leg": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.ROBOT_PARTS, amount: 1 },
      { item: I.HYDRAULIC_PISTON, amount: 1 },
      { item: I.XENOFERRITE_PLATES, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 170,
    sales_price: 680,
    workstation_effect: {
      machine_speed: 25,
      power_consumption: 15,
    power_consumption_unit: "kW",
      applies_to: ["Greenhouses", "Crystal Refiners", "Pumpjacks"],
    },
  },
  "Farmer Robot Torso": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.ROBOT_PARTS, amount: 1 },
      { item: I.XENOFERRITE_PLATES, amount: 2 },
      { item: I.BARREL_EMPTY, amount: 1 },
      { item: I.ENERGY_CELL, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 170,
    sales_price: 680,
    workstation_effect: {
      machine_speed: 25,
      power_consumption: 15,
    power_consumption_unit: "kW",
      applies_to: ["Greenhouses", "Crystal Refiners", "Pumpjacks"],
    },
  },
  "Heavy Duty Transport Bot": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 1 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 1 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 1 },
      { item: I.FIRMARLITE_SHEET, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 30,
    sales_price: 75,
    workstation_effect: {
      machine_speed: 5,
      power_consumption: 2,
    power_consumption_unit: "kW",
      applies_to: ["Crushers", "Smelters"],
    },
  },
  "Hydro Farming Bot": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.NAUTICAL_CHASSIS, amount: 1 },
      { item: I.CPU, amount: 1 },
      { item: I.BARREL_EMPTY, amount: 2 },
      { item: I.IGNIUM_FUEL_ROD, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 30 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.ASSEMBLER_III]: { cycleTime: 15 },
    },
    weight: 95,
    sales_price: 210,
    workstation_effect: {
      machine_speed: 15,
      power_consumption: 5,
    power_consumption_unit: "kW",
      applies_to: ["Greenhouses", "Crystal Refiners", "Pumpjacks"],
    },
  },
  "Hydro Mining Bot": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.NAUTICAL_CHASSIS, amount: 1 },
      { item: I.CPU, amount: 1 },
      { item: I.MINING_DRILL, amount: 1 },
      { item: I.IGNIUM_FUEL_ROD, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 30 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.ASSEMBLER_III]: { cycleTime: 15 },
    },
    weight: 110,
    sales_price: 220,
    workstation_effect: {
      machine_efficiency: 15,
      power_consumption: 40,
    power_consumption_unit: "kW",
      applies_to: ["Pumpjacks"],
    },
  },
  "Light Bot": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 1 },
      { item: I.MACHINERY_PARTS, amount: 1 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 1 },
      { item: I.GLASS, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 12 },
      [M.ASSEMBLER_II]: { cycleTime: 8 },
      [M.ASSEMBLER_III]: { cycleTime: 6 },
    },
    weight: 25,
    sales_price: 67,
    workstation_effect: {
      machine_speed: 30,
      power_consumption: 20,
    power_consumption_unit: "kW",
      applies_to: ["Miners"],
    },
  },
  "Maintenance Drone": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.FIRMARLITE_SHEET, amount: 1 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 1 },
      { item: I.CIRCUIT_BOARDS, amount: 1 },
      { item: I.HOVER_ENGINE, amount: 1 },
      { item: I.ENERGY_CELL, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 30 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.ASSEMBLER_III]: { cycleTime: 15 },
    },
    weight: 35,
    sales_price: 176,
    workstation_effect: {
      machine_speed: 7.5,
      power_consumption: null,
    power_consumption_unit: "kW",
      applies_to: [
        "Assemblers",
        "Casting Machines",
        "Chemical Buildings",
      ],
    },
  },
  "Marine Exploration Bot": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.NAUTICAL_CHASSIS, amount: 1 },
      { item: I.CPU, amount: 1 },
      { item: I.PORTABLE_LIGHT, amount: 1 },
      { item: I.IGNIUM_FUEL_ROD, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 30 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.ASSEMBLER_III]: { cycleTime: 15 },
    },
    weight: 105,
    sales_price: 240,
    workstation_effect: {
      machine_speed: 15,
      power_consumption: 5,
    power_consumption_unit: "kW",
      applies_to: ["Research Servers"],
    },
  },
  "Mining Drone": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 1 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 1 },
      { item: I.CIRCUIT_BOARDS, amount: 1 },
      { item: I.HOVER_ENGINE, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 20 },
      [M.ASSEMBLER_II]: { cycleTime: 13.333 },
      [M.ASSEMBLER_III]: { cycleTime: 10 },
    },
    weight: 42.5,
    sales_price: 147,
    workstation_effect: {
      machine_speed: 12.5,
      power_consumption: 5,
    power_consumption_unit: "kW",
      applies_to: ["Crushers", "Miners", "Smelters"],
    },
  },
  "Miner Robot Arm": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.ROBOT_PARTS, amount: 1 },
      { item: I.HYDRAULIC_PISTON, amount: 1 },
      { item: I.STEEL_BEAMS, amount: 1 },
      { item: I.MINING_DRILL, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 225,
    sales_price: 900,
    workstation_effect: {
      machine_speed: 25,
      power_consumption: 15,
    power_consumption_unit: "kW",
      applies_to: ["Crushers", "Miners", "Smelters"],
    },
  },
  "Miner Robot Head": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.ROBOT_PARTS, amount: 1 },
      { item: I.CPU, amount: 1 },
      { item: I.XENOFERRITE_PLATES, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 225,
    sales_price: 900,
    workstation_effect: {
      machine_speed: 25,
      power_consumption: 15,
    power_consumption_unit: "kW",
      applies_to: ["Crushers", "Miners", "Smelters"],
    },
  },
  "Miner Robot Leg": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.ROBOT_PARTS, amount: 1 },
      { item: I.HYDRAULIC_PISTON, amount: 1 },
      { item: I.STEEL_BEAMS, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 225,
    sales_price: 900,
    workstation_effect: {
      machine_speed: 25,
      power_consumption: 15,
    power_consumption_unit: "kW",
      applies_to: ["Crushers", "Miners", "Smelters"],
    },
  },
  "Miner Robot Torso": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.ROBOT_PARTS, amount: 1 },
      { item: I.FIRMARLITE_SHEET, amount: 2 },
      { item: I.CIRCUIT_BOARDS, amount: 1 },
      { item: I.ENERGY_CELL, amount: 2 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 225,
    sales_price: 900,
    workstation_effect: {
      machine_speed: 25,
      power_consumption: 15,
    power_consumption_unit: "kW",
      applies_to: ["Crushers", "Miners", "Smelters"],
    },
  },
  "Operator Bot": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.POLYMER_BOARD, amount: 1 },
      { item: I.MACHINERY_PARTS, amount: 1 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 2 },
      { item: I.CIRCUIT_BOARDS, amount: 2 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 20 },
      [M.ASSEMBLER_II]: { cycleTime: 13.333 },
      [M.ASSEMBLER_III]: { cycleTime: 10 },
    },
    weight: 30,
    sales_price: 179,
    workstation_effect: {
      machine_efficiency: 3,
      power_consumption: 20,
    power_consumption_unit: "kW",
      applies_to: ["Assemblers", "Miners", "Pumpjacks", "Smelters"],
      exempt: ["Extractors (Xeno-Scrap & Crystals)"],
    },
  },
  "Operator Robot Arm": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.ROBOT_PARTS, amount: 1 },
      { item: I.HYDRAULIC_PISTON, amount: 1 },
      { item: I.RUBBER, amount: 2 },
      { item: I.MODULAR_BUILDING_PLANNER, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 200,
    sales_price: 999,
    workstation_effect: {
      machine_efficiency: 6,
      power_consumption: 40,
    power_consumption_unit: "kW",
      applies_to: ["Assemblers", "Miners", "Pumpjacks", "Smelters"],
      exempt: ["Extractors (Xeno-Scrap & Crystals)"],
    },
  },
  "Operator Robot Head": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.ROBOT_PARTS, amount: 1 },
      { item: I.XENOFERRITE_PLATES, amount: 1 },
      { item: I.CPU, amount: 4 },
      { item: I.CIRCUIT_BOARDS, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 200,
    sales_price: 999,
    workstation_effect: {
      machine_efficiency: 6,
      power_consumption: 40,
    power_consumption_unit: "kW",
      applies_to: ["Assemblers", "Miners", "Pumpjacks", "Smelters"],
      exempt: ["Extractors (Xeno-Scrap & Crystals)"],
    },
  },
  "Operator Robot Leg": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.ROBOT_PARTS, amount: 1 },
      { item: I.HYDRAULIC_PISTON, amount: 1 },
      { item: I.XENOFERRITE_PLATES, amount: 1 },
      { item: I.RUBBER, amount: 2 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 200,
    sales_price: 999,
    workstation_effect: {
      machine_efficiency: 6,
      power_consumption: 40,
    power_consumption_unit: "kW",
      applies_to: ["Assemblers", "Miners", "Pumpjacks", "Smelters"],
      exempt: ["Extractors (Xeno-Scrap & Crystals)"],
    },
  },
  "Operator Robot Torso": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.ROBOT_PARTS, amount: 1 },
      { item: I.XENOFERRITE_PLATES, amount: 2 },
      { item: I.CIRCUIT_BOARDS, amount: 1 },
      { item: I.ENERGY_CELL, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 200,
    sales_price: 999,
    workstation_effect: {
      machine_efficiency: 6,
      power_consumption: 40,
    power_consumption_unit: "kW",
      applies_to: ["Assemblers", "Miners", "Pumpjacks", "Smelters"],
      exempt: ["Extractors (Xeno-Scrap & Crystals)"],
    },
  },
  "Personal Assistant Robot Arm": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.ROBOT_PARTS, amount: 1 },
      { item: I.HYDRAULIC_PISTON, amount: 1 },
      { item: I.XENOFERRITE_PLATES, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 135,
    sales_price: 700,
    workstation_effect: {
      machine_speed: 25,
      power_consumption: 15,
    power_consumption_unit: "kW",
      applies_to: [
        "Assemblers",
        "Casting Machines",
        "Chemical Buildings",
        "Incinerators",
        "Flare Stacks",
      ],
    },
  },
  "Personal Assistant Robot Head": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.ROBOT_PARTS, amount: 1 },
      { item: I.CPU, amount: 1 },
      { item: I.GLASS, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 135,
    sales_price: 700,
    workstation_effect: {
      machine_speed: 25,
      power_consumption: 15,
    power_consumption_unit: "kW",
      applies_to: [
        "Assemblers",
        "Casting Machines",
        "Chemical Buildings",
        "Incinerators",
        "Flare Stacks",
      ],
    },
  },
  "Personal Assistant Robot Leg": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.ROBOT_PARTS, amount: 1 },
      { item: I.HYDRAULIC_PISTON, amount: 1 },
      { item: I.XENOFERRITE_PLATES, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 135,
    sales_price: 700,
    workstation_effect: {
      machine_speed: 25,
      power_consumption: 15,
    power_consumption_unit: "kW",
      applies_to: [
        "Assemblers",
        "Casting Machines",
        "Chemical Buildings",
        "Incinerators",
        "Flare Stacks",
      ],
    },
  },
  "Personal Assistant Robot Torso": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.ROBOT_PARTS, amount: 1 },
      { item: I.FIRMARLITE_SHEET, amount: 2 },
      { item: I.CIRCUIT_BOARDS, amount: 1 },
      { item: I.ENERGY_CELL, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 135,
    sales_price: 700,
    workstation_effect: {
      machine_speed: 25,
      power_consumption: 15,
    power_consumption_unit: "kW",
      applies_to: [
        "Assemblers",
        "Casting Machines",
        "Chemical Buildings",
        "Incinerators",
        "Flare Stacks",
      ],
    },
  },
  "Planter Drone": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.FIRMARLITE_SHEET, amount: 1 },
      { item: I.MACHINERY_PARTS, amount: 2 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 2 },
      { item: I.HOVER_ENGINE, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 8 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333 },
      [M.ASSEMBLER_III]: { cycleTime: 4 },
    },
    weight: 25,
    sales_price: 103,
    workstation_effect: {
      machine_speed: 12.5,
      power_consumption: 5,
    power_consumption_unit: "kW",
      applies_to: ["Greenhouses", "Crystal Refiners", "Pumpjacks"],
    },
  },
  "Science Assistant Drone": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.POLYMER_BOARD, amount: 1 },
      { item: I.MACHINERY_PARTS, amount: 1 },
      { item: I.CIRCUIT_BOARDS, amount: 1 },
      { item: I.HOVER_ENGINE, amount: 1 },
      { item: I.ENERGY_CELL, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666 },
      [M.ASSEMBLER_III]: { cycleTime: 5 },
    },
    weight: 52.5,
    sales_price: 151,
    workstation_effect: {
      machine_efficiency: 1.5,
      power_consumption: 15,
    power_consumption_unit: "kW",
      applies_to: ["Research Servers"],
    },
  },
  "Science Robot Arm": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.ROBOT_PARTS, amount: 1 },
      { item: I.HYDRAULIC_PISTON, amount: 1 },
      { item: I.POLYMER_BOARD, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 210,
    sales_price: 890,
    workstation_effect: {
      machine_efficiency: 3,
      power_consumption: 30,
    power_consumption_unit: "kW",
      applies_to: ["Research Servers"],
    },
  },
  "Science Robot Head": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.ROBOT_PARTS, amount: 1 },
      { item: I.POLYMER_BOARD, amount: 1 },
      { item: I.CPU, amount: 2 },
      { item: I.GLASS, amount: 2 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 210,
    sales_price: 890,
    workstation_effect: {
      machine_efficiency: 3,
      power_consumption: 30,
    power_consumption_unit: "kW",
      applies_to: ["Research Servers"],
    },
  },
  "Science Robot Leg": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.ROBOT_PARTS, amount: 1 },
      { item: I.HYDRAULIC_PISTON, amount: 1 },
      { item: I.FIRMARLITE_SHEET, amount: 1 },
      { item: I.POLYMER_BOARD, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 210,
    sales_price: 890,
    workstation_effect: {
      machine_efficiency: 3,
      power_consumption: 30,
    power_consumption_unit: "kW",
      applies_to: ["Research Servers"],
    },
  },
  "Science Robot Torso": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.ROBOT_PARTS, amount: 1 },
      { item: I.POLYMER_BOARD, amount: 2 },
      { item: I.CIRCUIT_BOARDS, amount: 1 },
      { item: I.ENERGY_CELL, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
    },
    weight: 210,
    sales_price: 890,
    workstation_effect: {
      machine_efficiency: 3,
      power_consumption: 30,
    power_consumption_unit: "kW",
      applies_to: ["Research Servers"],
    },
  },
  "Screen Bot": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 1 },
      { item: I.POLYMER_BOARD, amount: 1 },
      { item: I.CIRCUIT_BOARDS, amount: 1 },
      { item: I.GLASS, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 8 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333 },
      [M.ASSEMBLER_III]: { cycleTime: 4 },
    },
    weight: 20,
    sales_price: 69,
    workstation_effect: {
      machine_speed: 30,
      power_consumption: 20,
    power_consumption_unit: "kW",
      applies_to: ["Casting Machines"],
    },
  },
  "Snack Bot": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 1 },
      { item: I.MACHINERY_PARTS, amount: 1 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 1 },
      { item: I.GLASS, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 12 },
      [M.ASSEMBLER_II]: { cycleTime: 8 },
      [M.ASSEMBLER_III]: { cycleTime: 6 },
    },
    weight: 22.5,
    sales_price: 52,
    workstation_effect: {
      machine_speed: 30,
      power_consumption: 20,
    power_consumption_unit: "kW",
      applies_to: [
        "Chemical Buildings",
        "Incinerators",
        "Flare Stacks",
      ],
    },
  },
  "Transport Bot": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 1 },
      { item: I.MACHINERY_PARTS, amount: 1 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0, // +32%
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666 },
      [M.ASSEMBLER_III]: { cycleTime: 5 },
    },
    weight: 20, // kg
    sales_price: 34, // F
    workstation_effect: {
      machine_speed: 5, // +5%
      power_consumption: 1,
    power_consumption_unit: "kW", // +1%
      applies_to: ["Assemblers", "Miners"],
    },
  },
  "Transport Drone": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.FIRMARLITE_SHEET, amount: 2 },
      { item: I.POLYMER_BOARD, amount: 1 },
      { item: I.CIRCUIT_BOARDS, amount: 1 },
      { item: I.HOVER_ENGINE, amount: 2 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 12 },
      [M.ASSEMBLER_II]: { cycleTime: 8 },
      [M.ASSEMBLER_III]: { cycleTime: 6 },
    },
    weight: 37.5,
    sales_price: 149,
    workstation_effect: {
      machine_speed: 15,
      power_consumption: 5,
    power_consumption_unit: "kW",
      applies_to: ["Casting Machines"],
    },
  },
  "Vacuum Bot": {
    category: CAT.ROBOTS,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 1 },
      { item: I.MACHINERY_PARTS, amount: 1 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 1 },
    ],
    output: { amount: 1 },
    efficiency: 0,
    machines: {
      [M.ASSEMBLER_I]: { cycleTime: 12 },
      [M.ASSEMBLER_II]: { cycleTime: 8 },
      [M.ASSEMBLER_III]: { cycleTime: 6 },
    },
    weight: 15,
    sales_price: 37,
    workstation_effect: {
      machine_efficiency: 2,
      power_consumption: 15,
    power_consumption_unit: "kW",
      applies_to: ["Smelters"],
    },
  },

  // ── Decor ───────────────────────────────────────────────
  "Ceiling Light": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 2 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.333 },
      [M.ASSEMBLER_I]: { cycleTime: 2 },
      [M.ASSEMBLER_II]: { cycleTime: 1.333 },
      [M.ASSEMBLER_III]: { cycleTime: 1 },
    },
  },
  "Ceiling Light (Large)": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 5 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.333 },
      [M.ASSEMBLER_I]: { cycleTime: 2 },
      [M.ASSEMBLER_II]: { cycleTime: 1.333 },
      [M.ASSEMBLER_III]: { cycleTime: 1 },
    },
  },
  "Construction Site Decor": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.POLYMER_BOARD, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.166 },
      [M.ASSEMBLER_I]: { cycleTime: 1 },
      [M.ASSEMBLER_II]: { cycleTime: 0.666 },
      [M.ASSEMBLER_III]: { cycleTime: 0.5 },
    },
  },
  "Decor (Basic Shapes)": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 1 },
    ],
    output: { amount: 4 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.166 },
      [M.ASSEMBLER_I]: { cycleTime: 1 },
      [M.ASSEMBLER_II]: { cycleTime: 0.666 },
      [M.ASSEMBLER_III]: { cycleTime: 0.5 },
    },
  },
  "Decor (Misc)": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 10 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.166 },
      [M.ASSEMBLER_I]: { cycleTime: 1 },
      [M.ASSEMBLER_II]: { cycleTime: 0.666 },
      [M.ASSEMBLER_III]: { cycleTime: 0.5 },
    },
  },
  "Decor (Modular Window Wedge)": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.GLASS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.166 },
      [M.ASSEMBLER_I]: { cycleTime: 1 },
      [M.ASSEMBLER_II]: { cycleTime: 0.666 },
      [M.ASSEMBLER_III]: { cycleTime: 0.5 },
    },
  },
  "Decor (Modular Windows Slope Edge)": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.GLASS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.166 },
      [M.ASSEMBLER_I]: { cycleTime: 1 },
      [M.ASSEMBLER_II]: { cycleTime: 0.666 },
      [M.ASSEMBLER_III]: { cycleTime: 0.5 },
    },
  },
  "Decor (Modular Windows Slope)": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.GLASS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.166 },
      [M.ASSEMBLER_I]: { cycleTime: 1 },
      [M.ASSEMBLER_II]: { cycleTime: 0.666 },
      [M.ASSEMBLER_III]: { cycleTime: 0.5 },
    },
  },
  "Decor (Modular Windows)": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.GLASS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.166 },
      [M.ASSEMBLER_I]: { cycleTime: 1 },
      [M.ASSEMBLER_II]: { cycleTime: 0.666 },
      [M.ASSEMBLER_III]: { cycleTime: 0.5 },
    },
  },
  "Decor (Struts)": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 1 },
    ],
    output: { amount: 2 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.166 },
      [M.ASSEMBLER_I]: { cycleTime: 1 },
      [M.ASSEMBLER_II]: { cycleTime: 0.666 },
      [M.ASSEMBLER_III]: { cycleTime: 0.5 },
    },
  },
  "Decor (Support Truss)": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 1 },
    ],
    output: { amount: 2 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.166 },
      [M.ASSEMBLER_I]: { cycleTime: 1 },
      [M.ASSEMBLER_II]: { cycleTime: 0.666 },
      [M.ASSEMBLER_III]: { cycleTime: 0.5 },
    },
  },
  "Decor (Support)": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 1 },
    ],
    output: { amount: 2 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.166 },
      [M.ASSEMBLER_I]: { cycleTime: 1 },
      [M.ASSEMBLER_II]: { cycleTime: 0.666 },
      [M.ASSEMBLER_III]: { cycleTime: 0.5 },
    },
  },
  "Decor (Walls)": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 5 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.166 },
      [M.ASSEMBLER_I]: { cycleTime: 1 },
      [M.ASSEMBLER_II]: { cycleTime: 0.666 },
      [M.ASSEMBLER_III]: { cycleTime: 0.5 },
    },
  },
  "Decor (Windows)": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 1 },
      { item: I.GLASS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.166 },
      [M.ASSEMBLER_I]: { cycleTime: 1 },
      [M.ASSEMBLER_II]: { cycleTime: 0.666 },
      [M.ASSEMBLER_III]: { cycleTime: 0.5 },
    },
  },
  "Door (Double)": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 20 },
      { item: I.MACHINERY_PARTS, amount: 5 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.833 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333 },
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
    },
  },
  "Door (Single)": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 10 },
      { item: I.MACHINERY_PARTS, amount: 2 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.833 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333 },
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
    },
  },
  "Forest Seed (Plants)": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.FOREST_SEED_PLANTS, amount: 1 },
      { item: I.MINERAL_ROCK, amount: 1 },
      { item: I.WATER, amount: 250 },
    ],
    output: { amount: 3, chance: 0.5 },
    machines: {
      [M.GREENHOUSE]: { cycleTime: 300 },
    },
  },
  "Forest Seed (Trees)": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.FOREST_SEED_TREES, amount: 1 },
      { item: I.MINERAL_ROCK, amount: 1 },
      { item: I.WATER, amount: 250 },
    ],
    output: { amount: 3, chance: 0.5 },
    machines: {
      [M.GREENHOUSE]: { cycleTime: 300 },
    },
  },
  "Hangar Gate": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.STEEL_BEAMS, amount: 25 },
      { item: I.ADVANCED_MACHINERY_PARTS, amount: 10 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.833 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333 },
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
    },
  },
  "Light Pole I": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 5 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 1 },
      { item: I.TECHNUM_RODS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
  },
  "Light Pole II": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 3 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 1 },
      { item: I.TECHNUM_RODS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
  },
  "Office Chair": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
  },
  "Office Couch": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
  },
  "Office Desk": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 2 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
  },
  "Office File Cabinet": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
  },
  "Office Plant": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 1 },
      { item: I.BIOMASS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
  },
  "Office Table": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 2 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
  },
  "Portable Light": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 1 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 1 },
      { item: I.ENERGY_CELL, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.5 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
    },
  },
  Railings: {
    category: CAT.DECOR,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.25 },
      [M.ASSEMBLER_I]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 1 },
      [M.ASSEMBLER_III]: { cycleTime: 0.75 },
    },
  },
  "Rocky Desert Seed (Plants)": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.ROCKY_DESERT_SEED_PLANTS, amount: 1 },
      { item: I.MINERAL_ROCK, amount: 1 },
      { item: I.WATER, amount: 250 },
    ],
    output: { amount: 3, chance: 0.5 },
    machines: {
      [M.GREENHOUSE]: { cycleTime: 300 },
    },
  },
  "Rocky Desert Seed (Trees)": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.ROCKY_DESERT_SEED_TREES, amount: 1 },
      { item: I.MINERAL_ROCK, amount: 1 },
      { item: I.WATER, amount: 250 },
    ],
    output: { amount: 3, chance: 0.5 },
    machines: {
      [M.GREENHOUSE]: { cycleTime: 300 },
    },
  },
  "Sandy Desert Seed (Plants)": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.SANDY_DESERT_SEED_PLANTS, amount: 1 },
      { item: I.MINERAL_ROCK, amount: 1 },
      { item: I.WATER, amount: 250 },
    ],
    output: { amount: 3, chance: 0.5 },
    machines: {
      [M.GREENHOUSE]: { cycleTime: 300 },
    },
  },
  "Sandy Desert Seed (Trees)": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.SANDY_DESERT_SEED_TREES, amount: 1 },
      { item: I.MINERAL_ROCK, amount: 1 },
      { item: I.WATER, amount: 250 },
    ],
    output: { amount: 3, chance: 0.5 },
    machines: {
      [M.GREENHOUSE]: { cycleTime: 300 },
    },
  },
  Sign: {
    category: CAT.DECOR,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 4 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.25 },
      [M.ASSEMBLER_I]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 1 },
      [M.ASSEMBLER_III]: { cycleTime: 0.75 },
    },
  },
  "Tropical Rainforest Seed (Plants)": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.TROPICAL_RAINFOREST_SEED_PLANTS, amount: 1 },
      { item: I.MINERAL_ROCK, amount: 1 },
      { item: I.WATER, amount: 250 },
    ],
    output: { amount: 3, chance: 0.5 },
    machines: {
      [M.GREENHOUSE]: { cycleTime: 300 },
    },
  },
  "Tropical Rainforest Seed (Trees)": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.TROPICAL_RAINFOREST_SEED_TREES, amount: 1 },
      { item: I.MINERAL_ROCK, amount: 1 },
      { item: I.WATER, amount: 250 },
    ],
    output: { amount: 3, chance: 0.5 },
    machines: {
      [M.GREENHOUSE]: { cycleTime: 300 },
    },
  },
  "Tundra Seed (Plants)": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.TUNDRA_SEED_PLANTS, amount: 1 },
      { item: I.MINERAL_ROCK, amount: 1 },
      { item: I.WATER, amount: 250 },
    ],
    output: { amount: 3, chance: 0.5 },
    machines: {
      [M.GREENHOUSE]: { cycleTime: 300 },
    },
  },
  "Tundra Seed (Trees)": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.TUNDRA_SEED_TREES, amount: 1 },
      { item: I.MINERAL_ROCK, amount: 1 },
      { item: I.WATER, amount: 250 },
    ],
    output: { amount: 3, chance: 0.5 },
    machines: {
      [M.GREENHOUSE]: { cycleTime: 300 },
    },
  },
  "Wall Light": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.XENOFERRITE_PLATES, amount: 2 },
      { item: I.ELECTRONIC_COMPONENTS, amount: 1 },
    ],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.333 },
      [M.ASSEMBLER_I]: { cycleTime: 2 },
      [M.ASSEMBLER_II]: { cycleTime: 1.333 },
      [M.ASSEMBLER_III]: { cycleTime: 1 },
    },
  },
  "Wooden Blocks": {
    category: CAT.DECOR,
    ingredients: [
      { item: I.BIOMASS, amount: 1 },
    ],
    output: { amount: 5 },
    machines: {
      [M.CHARACTER]: { cycleTime: 0.833 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333 },
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
    },
  },
};
