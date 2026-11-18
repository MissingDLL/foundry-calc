const RECIPES = {
  // ── Buildings ──────────────────────────────────────────
  "Air Intake Base": {
    category: CAT.BUILDINGS,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 200 }, { item: I.STEEL_BEAMS, amount: 100 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 100 }, { item: I.CIRCUIT_BOARD, amount: 25 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 13.333333 },
      [M.CHARACTER]: { cycleTime: 20 },
      [M.ASSEMBLER_I]: { cycleTime: 20 },
    },
  },
  "Blast Furnace Base": {
    category: CAT.BUILDINGS,
    ingredients: [{ item: I.CONCRETE, amount: 600 }, { item: I.STEEL_BEAMS, amount: 600 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 300 }, { item: I.CIRCUIT_BOARD, amount: 200 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 13.333333 },
      [M.CHARACTER]: { cycleTime: 20 },
      [M.ASSEMBLER_I]: { cycleTime: 20 },
    },
  },
  "Heavy Caster Base": {
    category: CAT.BUILDINGS,
    ingredients: [{ item: I.CONCRETE, amount: 200 }, { item: I.STEEL_BEAMS, amount: 200 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 50 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666667 },
      [M.CHARACTER]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
    },
  },
  "Fracking Tower Base": {
    category: CAT.BUILDINGS,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 200 }, { item: I.STEEL_BEAMS, amount: 100 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 25 }, { item: I.CIRCUIT_BOARD, amount: 25 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 13.333333 },
      [M.CHARACTER]: { cycleTime: 20 },
      [M.ASSEMBLER_I]: { cycleTime: 20 },
    },
  },
  "Hot Air Stove Base": {
    category: CAT.BUILDINGS,
    ingredients: [{ item: I.CONCRETE, amount: 100 }, { item: I.STEEL_BEAMS, amount: 100 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 25 }, { item: I.ELECTRONIC_COMPONENTS, amount: 25 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 13.333333 },
      [M.CHARACTER]: { cycleTime: 20 },
      [M.ASSEMBLER_I]: { cycleTime: 20 },
    },
  },
  "Modular Storage Tank Base": {
    category: CAT.BUILDINGS,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 200 }, { item: I.STEEL_BEAMS, amount: 100 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 25 }, { item: I.CIRCUIT_BOARD, amount: 25 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 13.333333 },
      [M.CHARACTER]: { cycleTime: 20 },
      [M.ASSEMBLER_I]: { cycleTime: 20 },
    },
  },
  "Monument Base": {
    category: CAT.BUILDINGS,
    ingredients: [{ item: I.CONCRETE, amount: 50 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 13.333333 },
      [M.CHARACTER]: { cycleTime: 20 },
      [M.ASSEMBLER_I]: { cycleTime: 20 },
    },
  },
  "Cooling Tower Base": {
    category: CAT.BUILDINGS,
    ingredients: [{ item: I.CONCRETE, amount: 1000 }, { item: I.STEEL_BEAMS, amount: 400 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 13.333333 },
      [M.CHARACTER]: { cycleTime: 20 },
      [M.ASSEMBLER_I]: { cycleTime: 20 },
    },
  },
  "Reactor Fuel Mixer Base": {
    category: CAT.BUILDINGS,
    ingredients: [{ item: I.CONCRETE, amount: 250 }, { item: I.STEEL_BEAMS, amount: 100 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 13.333333 },
      [M.CHARACTER]: { cycleTime: 20 },
      [M.ASSEMBLER_I]: { cycleTime: 20 },
    },
  },
  "Xeno Reactor Base": {
    category: CAT.BUILDINGS,
    ingredients: [{ item: I.CONCRETE, amount: 1000 }, { item: I.STEEL_BEAMS, amount: 400 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 13.333333 },
      [M.CHARACTER]: { cycleTime: 20 },
      [M.ASSEMBLER_I]: { cycleTime: 20 },
    },
  },
  "Steam Generator Base": {
    category: CAT.BUILDINGS,
    ingredients: [{ item: I.CONCRETE, amount: 250 }, { item: I.STEEL_BEAMS, amount: 100 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 13.333333 },
      [M.CHARACTER]: { cycleTime: 20 },
      [M.ASSEMBLER_I]: { cycleTime: 20 },
    },
  },
  "High-Pressure Turbine Base": {
    category: CAT.BUILDINGS,
    ingredients: [{ item: I.CONCRETE, amount: 500 }, { item: I.STEEL_BEAMS, amount: 200 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 13.333333 },
      [M.CHARACTER]: { cycleTime: 20 },
      [M.ASSEMBLER_I]: { cycleTime: 20 },
    },
  },
  "Radio Tower Base": {
    category: CAT.BUILDINGS,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 200 }, { item: I.STEEL_BEAMS, amount: 100 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 25 }, { item: I.CIRCUIT_BOARD, amount: 25 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 13.333333 },
      [M.CHARACTER]: { cycleTime: 20 },
      [M.ASSEMBLER_I]: { cycleTime: 20 },
    },
  },
  "Long Range Scanner": {
    category: CAT.BUILDINGS,
    ingredients: [{ item: I.CONCRETE, amount: 25 }, { item: I.STEEL_BEAMS, amount: 50 }, { item: I.MACHINERY_PARTS, amount: 25 }, { item: I.ELECTRONIC_COMPONENTS, amount: 50 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 13.333333 },
      [M.CHARACTER]: { cycleTime: 20 },
      [M.ASSEMBLER_I]: { cycleTime: 20 },
    },
  },

  // ── Components ──────────────────────────────────────────
  "Empty Barreled Olumite": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.BARREL_OLUMITE, amount: 1 }],
    output: [{ item: I.BARREL_EMPTY, amount: 1 }, { item: I.CRUDE_OLUMITE, amount: 250 }],
    machines: {
      [M.BARREL_FILLER_I]: { cycleTime: 2 },
    },
  },
  "Barrel (Empty)": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Barrel (Olumite)": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.BARREL_EMPTY, amount: 1 }, { item: I.CRUDE_OLUMITE, amount: 250 }],
    output: { amount: 1 },
    machines: {
      [M.BARREL_FILLER_I]: { cycleTime: 2 },
    },
  },
  "Xenoferrite Plates (Barrel Recycle)": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.BARREL_EMPTY, amount: 1 }],
    output: [{ item: I.XENOFERRITE_PLATES, amount: 1 }],
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Olumite Gas": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.CRUDE_OLUMITE, amount: 100 }],
    output: [{ item: I.OLUMITE_GAS, amount: 90 }, { item: I.WASTE_GAS, amount: 10 }],
    machines: {
      [M.DISTILLATION_COLUMN]: { cycleTime: 4 },
    },
  },
  "Low Density Olumite": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.CRUDE_OLUMITE, amount: 100 }],
    output: [{ item: I.LOW_DENSITY_OLUMITE, amount: 100 }, { item: I.WASTE_GAS, amount: 25 }],
    machines: {
      [M.DISTILLATION_COLUMN]: { cycleTime: 4 },
    },
  },
  "Liquid Polymer": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.CRUDE_OLUMITE, amount: 100 }],
    output: [{ item: I.LIQUID_POLYMER, amount: 75 }, { item: I.WASTE_GAS, amount: 50 }],
    machines: {
      [M.DISTILLATION_COLUMN]: { cycleTime: 4 },
    },
  },
  "Biomass": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.BIOMASS, amount: 1 }, { item: I.MINERAL_ROCKS, amount: 1 }, { item: I.WATER, amount: 250 }],
    output: { amount: 2 },
    machines: {
      [M.GREENHOUSE]: { cycleTime: 60 },
    },
  },
  "Cement": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.MINERAL_ROCKS, amount: 2 }, { item: I.XENOFERRITE_ORE_RUBBLE, amount: 1 }],
    output: { amount: 2 },
    machines: {
      [M.CRUSHER_II]: { cycleTime: 6 },
      [M.CRUSHER_I]: { cycleTime: 12 },
    },
  },
  "Cement (Slag Reprocessing)": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.BLAST_FURNACE_SLAG, amount: 36 }],
    output: [{ item: I.CEMENT, amount: 1 }],
    machines: {
      [M.CHEMICAL_PROCESSOR]: { cycleTime: 12 },
    },
  },
  "Coked Ignium": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.IGNIUM_ORE, amount: 2 }],
    output: { amount: 5 },
    machines: {
      [M.ADVANCED_SMELTER]: { cycleTime: 7.5 },
    },
  },
  "Concrete": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.CEMENT, amount: 2 }, { item: I.GRAVEL, amount: 4 }, { item: I.WATER, amount: 20 }],
    output: { amount: 4 },
    machines: {
      [M.CASTING_MACHINE]: { cycleTime: 15 },
    },
  },
  "Hazard Concrete": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.CONCRETE, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 0.5 },
      [M.ASSEMBLER_II]: { cycleTime: 0.666667 },
      [M.CHARACTER]: { cycleTime: 1 },
      [M.ASSEMBLER_I]: { cycleTime: 1 },
    },
  },
  "Construction Material": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.FIRMARLITE_SHEET, amount: 90 }, { item: I.STEEL_BEAMS, amount: 15 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 15 }, { item: I.CONCRETE, amount: 30 }, { item: I.ELECTRONIC_COMPONENTS, amount: 15 }],
    output: { amount: 150 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 45 },
      [M.ASSEMBLER_II]: { cycleTime: 60 },
      [M.ASSEMBLER_I]: { cycleTime: 90 },
    },
  },
  "High-Tech Construction Material": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.SUPERALLOY, amount: 50 }, { item: I.HIGH_TECH_MACHINERY_PARTS, amount: 20 }, { item: I.RUBBER, amount: 20 }, { item: I.CIRCUIT_BOARD, amount: 10 }],
    output: { amount: 100 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 45 },
      [M.ASSEMBLER_II]: { cycleTime: 60 },
      [M.ASSEMBLER_I]: { cycleTime: 90 },
    },
  },
  "CPU": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.TELLUXITE_WAFER, amount: 1 }, { item: I.POLYMER_BOARD, amount: 2 }, { item: I.OLUMIC_ACID, amount: 80 }],
    output: { amount: 8 },
    machines: {
      [M.CHEMICAL_PROCESSOR]: { cycleTime: 120 },
    },
  },
  "Charged Xeno-Crystal": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.XENO_CRYSTAL, amount: 10 }, { item: I.ENERGY_CELL, amount: 1 }, { item: I.IGNIUM_ENRICHED_WATER, amount: 2000 }],
    output: { amount: 10 },
    machines: {
      [M.CRYSTAL_REFINER]: { cycleTime: 30 },
    },
  },
  "Electronic Components": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.TECHNUM_RODS, amount: 1 }, { item: I.WIRE_COIL, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Circuit Board": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.POLYMER_BOARD, amount: 1 }, { item: I.ELECTRONIC_COMPONENTS, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Energy Cell": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 3 }, { item: I.ELECTRONIC_COMPONENTS, amount: 6 }, { item: I.GLASS, amount: 6 }, { item: I.OLUMIC_ACID, amount: 60 }],
    output: { amount: 6 },
    machines: {
      [M.FLUID_ASSEMBLER_I]: { cycleTime: 30 },
    },
  },
  "Explosives (Primitive)": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.IGNIUM_ORE_RUBBLE, amount: 2 }, { item: I.TECHNUM_ORE_RUBBLE, amount: 2 }, { item: I.BIOMASS, amount: 1 }],
    output: [{ item: I.EXPLOSIVES, amount: 1 }],
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Explosives": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.IGNIUM_POWDER, amount: 4 }, { item: I.LOW_DENSITY_OLUMITE, amount: 50 }],
    output: { amount: 1 },
    machines: {
      [M.FLUID_ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Fracking Liquid": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.AIR, amount: 30 }, { item: I.OLUMITE_GAS, amount: 10 }, { item: I.WATER, amount: 60 }],
    output: { amount: 100 },
    machines: {
      [M.CHEMICAL_PROCESSOR]: { cycleTime: 5 },
    },
  },
  "Fuel Rod Casing": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.ADVANCED_MACHINERY_PARTS, amount: 1 }, { item: I.STEEL_BEAMS, amount: 1 }],
    output: { amount: 2 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.CHARACTER]: { cycleTime: 15 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Steam from Geothermal Vent": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.IGNIUM_ENRICHED_WATER, amount: 36 }],
    output: [{ item: I.STEAM, amount: 120 }],
    machines: {
      [M.GEOTHERMAL_BOILER]: { cycleTime: 1 },
    },
  },
  "Glass": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.GRAVEL, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ADVANCED_SMELTER]: { cycleTime: 3.333333 },
      [M.SMELTER_SMALL]: { cycleTime: 5 },
    },
  },
  "Gravel": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.MINERAL_ROCKS, amount: 2 }],
    output: { amount: 6 },
    machines: {
      [M.CRUSHER_II]: { cycleTime: 6 },
      [M.CRUSHER_I]: { cycleTime: 12 },
    },
  },
  "High Density Olumite": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.IMPURE_HIGH_DENSITY_OLUMITE, amount: 50 }],
    output: [{ item: I.HIGH_DENSITY_OLUMITE, amount: 40 }, { item: I.WASTE_GAS, amount: 10 }],
    machines: {
      [M.DISTILLATION_COLUMN]: { cycleTime: 6 },
    },
  },
  "Hover Engine": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.TECHNUM_RODS, amount: 1 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 1 }, { item: I.ELECTRONIC_COMPONENTS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 4 },
      [M.ASSEMBLER_I]: { cycleTime: 6 },
    },
  },
  "Hydraulic Piston": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 1 }, { item: I.LOW_DENSITY_OLUMITE, amount: 30 }],
    output: { amount: 1 },
    machines: {
      [M.FLUID_ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Ignium-Enriched Water": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.IGNIUM_POWDER, amount: 2 }, { item: I.WATER, amount: 270 }],
    output: { amount: 270 },
    machines: {
      [M.CHEMICAL_PROCESSOR]: { cycleTime: 2.5 },
    },
  },
  "Ignium Fuel Rod": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.FUEL_ROD_CASING, amount: 1 }, { item: I.WIRE_COIL, amount: 10 }, { item: I.IGNIUM_POWDER, amount: 20 }, { item: I.LIQUID_FUEL, amount: 400 }],
    output: { amount: 1 },
    machines: {
      [M.FLUID_ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Ignium Powder": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.IGNIUM_ORE_RUBBLE, amount: 1 }],
    output: { amount: 5 },
    machines: {
      [M.CRUSHER_II]: { cycleTime: 2.5 },
      [M.CRUSHER_I]: { cycleTime: 5 },
    },
  },
  "Impure High Density Olumite": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.CRUDE_OLUMITE, amount: 100 }, { item: I.STEAM, amount: 60 }],
    output: [{ item: I.IMPURE_HIGH_DENSITY_OLUMITE, amount: 50 }, { item: I.WASTE_GAS, amount: 50 }],
    machines: {
      [M.DISTILLATION_COLUMN]: { cycleTime: 6 },
    },
  },
  "Jetpack Fuel": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.LIQUID_FUEL, amount: 30 }],
    output: { amount: 1 },
    machines: {
      [M.FLUID_ASSEMBLER_I]: { cycleTime: 4 },
    },
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
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 0.75 },
      [M.ASSEMBLER_II]: { cycleTime: 1 },
      [M.CHARACTER]: { cycleTime: 1.5 },
      [M.ASSEMBLER_I]: { cycleTime: 1.5 },
    },
  },
  "Advanced Machinery Parts": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.MACHINERY_PARTS, amount: 2 }, { item: I.STEEL_BEAMS, amount: 1 }],
    output: { amount: 2 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2 },
      [M.ASSEMBLER_II]: { cycleTime: 2.666667 },
      [M.CHARACTER]: { cycleTime: 4 },
      [M.ASSEMBLER_I]: { cycleTime: 4 },
    },
  },
  "High-Tech Machinery Parts": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.SUPERALLOY, amount: 1 }, { item: I.RUBBER, amount: 2 }, { item: I.LOW_DENSITY_OLUMITE, amount: 5 }],
    output: { amount: 2 },
    machines: {
      [M.FLUID_ASSEMBLER_I]: { cycleTime: 6 },
    },
  },
  "Reactor Fuel Mix": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.REACTIVE_BRIQUETTE, amount: 128 }, { item: I.IGNIUM_ENRICHED_WATER, amount: 2592 }],
    output: { amount: 4320 },
    machines: {
      [M.REACTOR_FUEL_MIXER_BASE]: { cycleTime: 6 },
    },
  },
  "Olumic Acid": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.IGNIUM_POWDER, amount: 16 }, { item: I.OLUMITE_GAS, amount: 75 }, { item: I.WATER, amount: 25 }],
    output: { amount: 40 },
    machines: {
      [M.CHEMICAL_PROCESSOR]: { cycleTime: 8 },
    },
  },
  "Paint": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.LOW_DENSITY_OLUMITE, amount: 50 }, { item: I.OLUMITE_GAS, amount: 50 }, { item: I.WATER, amount: 50 }],
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
    ingredients: [{ item: I.BARREL_EMPTY, amount: 1 }, { item: I.LIQUID_FUEL, amount: 30 }],
    output: { amount: 1 },
    machines: {
      [M.FLUID_ASSEMBLER_I]: { cycleTime: 4 },
    },
  },
  "Xeno Power Core": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.SUPERALLOY, amount: 1 }, { item: I.XENO_SCRAP, amount: 1 }, { item: I.CHARGED_XENO_CRYSTAL, amount: 1 }, { item: I.RUBBER, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.CRYSTAL_REFINER]: { cycleTime: 1.5 },
    },
  },
  "Reactive Briquette": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.XENO_CRYSTAL_SLUDGE, amount: 750 }],
    output: [{ item: I.REACTIVE_BRIQUETTE, amount: 32 }, { item: I.XENO_CRYSTAL, amount: 1, chance: 0.05 }, { item: I.CHARGED_XENO_CRYSTAL, amount: 1, chance: 0.01 }],
    machines: {
      [M.CASTING_MACHINE]: { cycleTime: 15 },
    },
  },
  "Robot Parts": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.FIRMARLITE_SHEET, amount: 2 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 1 }, { item: I.ELECTRONIC_COMPONENTS, amount: 4 }, { item: I.POLYMER_BOARD, amount: 2 }],
    output: { amount: 2 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.ASSEMBLER_I]: { cycleTime: 30 },
    },
  },
  "High-Tech Robot Parts": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.ROBOT_PARTS, amount: 2 }, { item: I.HIGH_TECH_MACHINERY_PARTS, amount: 1 }, { item: I.RUBBER, amount: 1 }],
    output: { amount: 2 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.ASSEMBLER_I]: { cycleTime: 30 },
    },
  },
  "Rubber": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.LIQUID_POLYMER, amount: 5 }, { item: I.HIGH_DENSITY_OLUMITE, amount: 10 }],
    output: { amount: 1 },
    machines: {
      [M.CASTING_MACHINE]: { cycleTime: 2 },
    },
  },
  "Science Pack I": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.MACHINERY_PARTS, amount: 5 }, { item: I.TECHNUM_RODS, amount: 4 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.CHARACTER]: { cycleTime: 30 },
      [M.ASSEMBLER_I]: { cycleTime: 30 },
    },
  },
  "Science Pack II": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.CONVEYOR_I, amount: 3 }, { item: I.BUILDING_BLOCK, amount: 6 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.CHARACTER]: { cycleTime: 30 },
      [M.ASSEMBLER_I]: { cycleTime: 30 },
    },
  },
  "Science Pack III": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.ADVANCED_MACHINERY_PARTS, amount: 2 }, { item: I.CONCRETE, amount: 12 }, { item: I.FIRMARLITE_BAR, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 30 },
      [M.ASSEMBLER_II]: { cycleTime: 40 },
      [M.CHARACTER]: { cycleTime: 60 },
      [M.ASSEMBLER_I]: { cycleTime: 60 },
    },
  },
  "Science Pack IV": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.CIRCUIT_BOARD, amount: 4 }, { item: I.ENERGY_CELL, amount: 4 }, { item: I.FIRMARLITE_SHEET, amount: 4 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 30 },
      [M.ASSEMBLER_II]: { cycleTime: 40 },
      [M.CHARACTER]: { cycleTime: 60 },
      [M.ASSEMBLER_I]: { cycleTime: 60 },
    },
  },
  "Science Pack V": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.ROBOT_PARTS, amount: 4 }, { item: I.HYDRAULIC_PISTON, amount: 12 }, { item: I.CPU, amount: 1 }],
    output: { amount: 4 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 120 },
      [M.ASSEMBLER_II]: { cycleTime: 160 },
      [M.CHARACTER]: { cycleTime: 240 },
      [M.ASSEMBLER_I]: { cycleTime: 240 },
    },
  },
  "Space Ship Fuel Canister": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.BARREL_EMPTY, amount: 1 }, { item: I.FIRMARLITE_SHEET, amount: 5 }, { item: I.IGNIUM_POWDER, amount: 5 }, { item: I.LIQUID_FUEL, amount: 100 }, { item: I.WATER, amount: 20 }],
    output: { amount: 1 },
    machines: {
      [M.CHEMICAL_PROCESSOR]: { cycleTime: 5 },
    },
  },
  "Telluxite Wafer": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.LIQUID_TELLUXITE, amount: 400 }],
    output: { amount: 1 },
    machines: {
      [M.CASTING_MACHINE]: { cycleTime: 24 },
    },
  },
  "Nautical Chassis": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.SUPERALLOY, amount: 1 }, { item: I.RUBBER, amount: 1 }, { item: I.GLASS, amount: 1 }, { item: I.HIGH_TECH_MACHINERY_PARTS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 0.75 },
      [M.ASSEMBLER_II]: { cycleTime: 1 },
      [M.ASSEMBLER_I]: { cycleTime: 1.5 },
    },
  },
  "Weapon Components": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.FIRMARLITE_SHEET, amount: 1 }, { item: I.MACHINERY_PARTS, amount: 1 }, { item: I.EXPLOSIVES, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 4 },
      [M.ASSEMBLER_I]: { cycleTime: 6 },
    },
  },
  "Wire Coil": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.TECHNUM_RODS, amount: 1 }],
    output: { amount: 2 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 0.75 },
      [M.ASSEMBLER_II]: { cycleTime: 1 },
      [M.CHARACTER]: { cycleTime: 1.5 },
      [M.ASSEMBLER_I]: { cycleTime: 1.5 },
    },
  },
  "Xeno-Crystal Sludge": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.XENO_CRYSTAL, amount: 3 }, { item: I.CHARGED_XENO_CRYSTAL, amount: 3 }, { item: I.OLUMIC_ACID, amount: 10 }],
    output: { amount: 750 },
    machines: {
      [M.DISTILLATION_COLUMN]: { cycleTime: 7.5 },
    },
  },
  "Steam": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.WATER, amount: 20 }],
    output: { amount: 60 },
    machines: {
      [M.BOILER]: { cycleTime: 1 },
    },
  },
  "Scrap Recycler: Xeno-Scrap": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.XENO_SCRAP, amount: 1 }],
    output: [{ item: I.ADVANCED_MACHINERY_PARTS, amount: 0.65 }, { item: I.ELECTRONIC_COMPONENTS, amount: 0.35 }],
    chanceOutputs: true,
    machines: {
      [M.SCRAP_RECYCLER]: { cycleTime: 0.375 },
    },
  },
  "Resource Separator: Biomass": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.BIOMASS, amount: 1 }],
    output: [{ item: I.BIOMASS, amount: 1 }],
    chanceOutputs: true,
    machines: {
      [M.RESOURCE_SEPARATOR]: { cycleTime: 0.1875 },
    },
  },
  "Resource Separator: Forest Seed (Plants)": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.FOREST_SEED_PLANTS, amount: 1 }],
    output: [{ item: I.BIOMASS, amount: 0.1 }],
    chanceOutputs: true,
    machines: {
      [M.RESOURCE_SEPARATOR]: { cycleTime: 0.1875 },
    },
  },
  "Resource Separator: Forest Seed (Trees)": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.FOREST_SEED_TREES, amount: 1 }],
    output: [{ item: I.BIOMASS, amount: 0.1 }],
    chanceOutputs: true,
    machines: {
      [M.RESOURCE_SEPARATOR]: { cycleTime: 0.1875 },
    },
  },
  "Resource Separator: Concrete": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.CONCRETE, amount: 1 }],
    output: [{ item: I.MINERAL_ROCKS, amount: 0.25 }],
    chanceOutputs: true,
    machines: {
      [M.RESOURCE_SEPARATOR]: { cycleTime: 0.1875 },
    },
  },
  "Resource Separator: Hazard Concrete": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.HAZARD_CONCRETE, amount: 1 }],
    output: [{ item: I.MINERAL_ROCKS, amount: 0.25 }],
    chanceOutputs: true,
    machines: {
      [M.RESOURCE_SEPARATOR]: { cycleTime: 0.1875 },
    },
  },
  "Resource Separator: Dirt": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.DIRT, amount: 1 }],
    output: [{ item: I.XENOFERRITE_ORE_RUBBLE, amount: 0.05 }, { item: I.TECHNUM_ORE_RUBBLE, amount: 0.05 }, { item: I.IGNIUM_ORE_RUBBLE, amount: 0.05 }, { item: I.MINERAL_ROCKS, amount: 0.05 }],
    chanceOutputs: true,
    machines: {
      [M.RESOURCE_SEPARATOR]: { cycleTime: 0.1875 },
    },
  },
  "Resource Separator: Marble (Black)": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.MARBLE_BLACK, amount: 1 }],
    output: [{ item: I.MINERAL_ROCKS, amount: 0.25 }],
    chanceOutputs: true,
    dlc: "_deluxe_edition",
    machines: {
      [M.RESOURCE_SEPARATOR]: { cycleTime: 0.1875 },
    },
  },
  "Resource Separator: Marble (White)": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.MARBLE_WHITE, amount: 1 }],
    output: [{ item: I.MINERAL_ROCKS, amount: 0.25 }],
    chanceOutputs: true,
    dlc: "_deluxe_edition",
    machines: {
      [M.RESOURCE_SEPARATOR]: { cycleTime: 0.1875 },
    },
  },
  "Resource Separator: Rocky Desert Dirt": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.ROCKY_DESERT_DIRT, amount: 1 }],
    output: [{ item: I.XENOFERRITE_ORE_RUBBLE, amount: 0.05 }, { item: I.TECHNUM_ORE_RUBBLE, amount: 0.05 }, { item: I.IGNIUM_ORE_RUBBLE, amount: 0.05 }, { item: I.MINERAL_ROCKS, amount: 0.05 }],
    chanceOutputs: true,
    machines: {
      [M.RESOURCE_SEPARATOR]: { cycleTime: 0.1875 },
    },
  },
  "Resource Separator: Rocky Desert Seed (Plants)": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.ROCKY_DESERT_SEED_PLANTS, amount: 1 }],
    output: [{ item: I.BIOMASS, amount: 0.1 }],
    chanceOutputs: true,
    machines: {
      [M.RESOURCE_SEPARATOR]: { cycleTime: 0.1875 },
    },
  },
  "Resource Separator: Rocky Desert Seed (Trees)": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.ROCKY_DESERT_SEED_TREES, amount: 1 }],
    output: [{ item: I.BIOMASS, amount: 0.1 }],
    chanceOutputs: true,
    machines: {
      [M.RESOURCE_SEPARATOR]: { cycleTime: 0.1875 },
    },
  },
  "Resource Separator: Sand": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.SAND, amount: 1 }],
    output: [{ item: I.XENOFERRITE_ORE_RUBBLE, amount: 0.05 }, { item: I.TECHNUM_ORE_RUBBLE, amount: 0.05 }, { item: I.IGNIUM_ORE_RUBBLE, amount: 0.05 }, { item: I.MINERAL_ROCKS, amount: 0.05 }],
    chanceOutputs: true,
    machines: {
      [M.RESOURCE_SEPARATOR]: { cycleTime: 0.1875 },
    },
  },
  "Resource Separator: Sandy Desert Seed (Plants)": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.SANDY_DESERT_SEED_PLANTS, amount: 1 }],
    output: [{ item: I.BIOMASS, amount: 0.1 }],
    chanceOutputs: true,
    machines: {
      [M.RESOURCE_SEPARATOR]: { cycleTime: 0.1875 },
    },
  },
  "Resource Separator: Sandy Desert Seed (Trees)": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.SANDY_DESERT_SEED_TREES, amount: 1 }],
    output: [{ item: I.BIOMASS, amount: 0.1 }],
    chanceOutputs: true,
    machines: {
      [M.RESOURCE_SEPARATOR]: { cycleTime: 0.1875 },
    },
  },
  "Resource Separator: Stone": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.STONE, amount: 1 }],
    output: [{ item: I.XENOFERRITE_ORE_RUBBLE, amount: 0.05 }, { item: I.TECHNUM_ORE_RUBBLE, amount: 0.05 }, { item: I.IGNIUM_ORE_RUBBLE, amount: 0.05 }, { item: I.MINERAL_ROCKS, amount: 0.05 }],
    chanceOutputs: true,
    machines: {
      [M.RESOURCE_SEPARATOR]: { cycleTime: 0.1875 },
    },
  },
  "Resource Separator: Tropical Rainforest Dirt": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.TROPICAL_RAINFOREST_DIRT, amount: 1 }],
    output: [{ item: I.XENOFERRITE_ORE_RUBBLE, amount: 0.05 }, { item: I.TECHNUM_ORE_RUBBLE, amount: 0.05 }, { item: I.IGNIUM_ORE_RUBBLE, amount: 0.05 }, { item: I.MINERAL_ROCKS, amount: 0.05 }],
    chanceOutputs: true,
    machines: {
      [M.RESOURCE_SEPARATOR]: { cycleTime: 0.1875 },
    },
  },
  "Resource Separator: Tropical Rainforest Seed (Plants)": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.TROPICAL_RAINFOREST_SEED_PLANTS, amount: 1 }],
    output: [{ item: I.BIOMASS, amount: 0.1 }],
    chanceOutputs: true,
    machines: {
      [M.RESOURCE_SEPARATOR]: { cycleTime: 0.1875 },
    },
  },
  "Resource Separator: Tropical Rainforest Seed (Trees)": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.TROPICAL_RAINFOREST_SEED_TREES, amount: 1 }],
    output: [{ item: I.BIOMASS, amount: 0.1 }],
    chanceOutputs: true,
    machines: {
      [M.RESOURCE_SEPARATOR]: { cycleTime: 0.1875 },
    },
  },
  "Resource Separator: Tundra Dirt": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.TUNDRA_DIRT, amount: 1 }],
    output: [{ item: I.XENOFERRITE_ORE_RUBBLE, amount: 0.05 }, { item: I.TECHNUM_ORE_RUBBLE, amount: 0.05 }, { item: I.IGNIUM_ORE_RUBBLE, amount: 0.05 }, { item: I.MINERAL_ROCKS, amount: 0.05 }],
    chanceOutputs: true,
    machines: {
      [M.RESOURCE_SEPARATOR]: { cycleTime: 0.1875 },
    },
  },
  "Resource Separator: Tundra Seed (Plants)": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.TUNDRA_SEED_PLANTS, amount: 1 }],
    output: [{ item: I.BIOMASS, amount: 0.1 }],
    chanceOutputs: true,
    machines: {
      [M.RESOURCE_SEPARATOR]: { cycleTime: 0.1875 },
    },
  },
  "Resource Separator: Tundra Seed (Trees)": {
    category: CAT.COMPONENTS,
    ingredients: [{ item: I.TUNDRA_SEED_TREES, amount: 1 }],
    output: [{ item: I.BIOMASS, amount: 0.1 }],
    chanceOutputs: true,
    machines: {
      [M.RESOURCE_SEPARATOR]: { cycleTime: 0.1875 },
    },
  },

  // ── Decor ──────────────────────────────────────────
  "Forest Seed (Plants)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.FOREST_SEED_PLANTS, amount: 1 }, { item: I.MINERAL_ROCKS, amount: 1 }, { item: I.WATER, amount: 250 }],
    output: { amount: 3, chance: 0.5 },
    machines: {
      [M.GREENHOUSE]: { cycleTime: 300 },
    },
  },
  "Forest Seed (Trees)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.FOREST_SEED_TREES, amount: 1 }, { item: I.MINERAL_ROCKS, amount: 1 }, { item: I.WATER, amount: 250 }],
    output: { amount: 3, chance: 0.5 },
    machines: {
      [M.GREENHOUSE]: { cycleTime: 300 },
    },
  },
  "Construction Site Decor": {
    category: CAT.DECOR,
    ingredients: [{ item: I.POLYMER_BOARD, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 0.5 },
      [M.ASSEMBLER_II]: { cycleTime: 0.666667 },
      [M.CHARACTER]: { cycleTime: 1 },
      [M.ASSEMBLER_I]: { cycleTime: 1 },
    },
  },
  "Decor (Basic Shapes)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }],
    output: { amount: 4 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 0.5 },
      [M.ASSEMBLER_II]: { cycleTime: 0.666667 },
      [M.CHARACTER]: { cycleTime: 1 },
      [M.ASSEMBLER_I]: { cycleTime: 1 },
    },
  },
  "Decor (Misc)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 10 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 0.5 },
      [M.ASSEMBLER_II]: { cycleTime: 0.666667 },
      [M.CHARACTER]: { cycleTime: 1 },
      [M.ASSEMBLER_I]: { cycleTime: 1 },
    },
  },
  "Decor (Struts)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 1 }],
    output: { amount: 2 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 0.5 },
      [M.ASSEMBLER_II]: { cycleTime: 0.666667 },
      [M.CHARACTER]: { cycleTime: 1 },
      [M.ASSEMBLER_I]: { cycleTime: 1 },
    },
  },
  "Decor (Support)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 1 }],
    output: { amount: 2 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 0.5 },
      [M.ASSEMBLER_II]: { cycleTime: 0.666667 },
      [M.CHARACTER]: { cycleTime: 1 },
      [M.ASSEMBLER_I]: { cycleTime: 1 },
    },
  },
  "Decor (Support Truss)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 1 }],
    output: { amount: 2 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 0.5 },
      [M.ASSEMBLER_II]: { cycleTime: 0.666667 },
      [M.CHARACTER]: { cycleTime: 1 },
      [M.ASSEMBLER_I]: { cycleTime: 1 },
    },
  },
  "Decor (Walls)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 0.5 },
      [M.ASSEMBLER_II]: { cycleTime: 0.666667 },
      [M.CHARACTER]: { cycleTime: 1 },
      [M.ASSEMBLER_I]: { cycleTime: 1 },
    },
  },
  "Decor (Windows)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 1 }, { item: I.GLASS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 0.5 },
      [M.ASSEMBLER_II]: { cycleTime: 0.666667 },
      [M.CHARACTER]: { cycleTime: 1 },
      [M.ASSEMBLER_I]: { cycleTime: 1 },
    },
  },
  "Decor (Modular Windows)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.GLASS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 0.5 },
      [M.ASSEMBLER_II]: { cycleTime: 0.666667 },
      [M.CHARACTER]: { cycleTime: 1 },
      [M.ASSEMBLER_I]: { cycleTime: 1 },
    },
  },
  "Decor (Windows Modular Slope)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.GLASS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 0.5 },
      [M.ASSEMBLER_II]: { cycleTime: 0.666667 },
      [M.CHARACTER]: { cycleTime: 1 },
      [M.ASSEMBLER_I]: { cycleTime: 1 },
    },
  },
  "Decor (Windows Modular Slope Edge)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.GLASS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 0.5 },
      [M.ASSEMBLER_II]: { cycleTime: 0.666667 },
      [M.CHARACTER]: { cycleTime: 1 },
      [M.ASSEMBLER_I]: { cycleTime: 1 },
    },
  },
  "Decor (Windows Modular Wedge)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.GLASS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 0.5 },
      [M.ASSEMBLER_II]: { cycleTime: 0.666667 },
      [M.CHARACTER]: { cycleTime: 1 },
      [M.ASSEMBLER_I]: { cycleTime: 1 },
    },
  },
  "Door (Single)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 10 }, { item: I.MACHINERY_PARTS, amount: 2 }, { item: I.ELECTRONIC_COMPONENTS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Door (Double)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 20 }, { item: I.MACHINERY_PARTS, amount: 5 }, { item: I.ELECTRONIC_COMPONENTS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Hangar Gate": {
    category: CAT.DECOR,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 25 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 10 }, { item: I.ELECTRONIC_COMPONENTS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Ceiling Light I": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 2 }, { item: I.ELECTRONIC_COMPONENTS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1 },
      [M.ASSEMBLER_II]: { cycleTime: 1.333333 },
      [M.CHARACTER]: { cycleTime: 2 },
      [M.ASSEMBLER_I]: { cycleTime: 2 },
    },
  },
  "Ceiling Light II": {
    category: CAT.DECOR,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 5 }, { item: I.ELECTRONIC_COMPONENTS, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1 },
      [M.ASSEMBLER_II]: { cycleTime: 1.333333 },
      [M.CHARACTER]: { cycleTime: 2 },
      [M.ASSEMBLER_I]: { cycleTime: 2 },
    },
  },
  "Portable Light": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.ELECTRONIC_COMPONENTS, amount: 1 }, { item: I.ENERGY_CELL, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Wall Light I": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 2 }, { item: I.ELECTRONIC_COMPONENTS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1 },
      [M.ASSEMBLER_II]: { cycleTime: 1.333333 },
      [M.CHARACTER]: { cycleTime: 2 },
      [M.ASSEMBLER_I]: { cycleTime: 2 },
    },
  },
  "Light Pole I": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 5 }, { item: I.ELECTRONIC_COMPONENTS, amount: 1 }, { item: I.TECHNUM_RODS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Light Pole II": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 3 }, { item: I.ELECTRONIC_COMPONENTS, amount: 1 }, { item: I.TECHNUM_RODS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Neon Decor": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.POLYMER_BOARD, amount: 1 }],
    output: { amount: 4 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1 },
      [M.ASSEMBLER_II]: { cycleTime: 1.333333 },
      [M.CHARACTER]: { cycleTime: 2 },
      [M.ASSEMBLER_I]: { cycleTime: 2 },
    },
  },
  "Neon Decor (Slopes)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.POLYMER_BOARD, amount: 1 }],
    output: { amount: 4 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1 },
      [M.ASSEMBLER_II]: { cycleTime: 1.333333 },
      [M.CHARACTER]: { cycleTime: 2 },
      [M.ASSEMBLER_I]: { cycleTime: 2 },
    },
  },
  "Neon Decor (Slope Junctions)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.POLYMER_BOARD, amount: 1 }],
    output: { amount: 4 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1 },
      [M.ASSEMBLER_II]: { cycleTime: 1.333333 },
      [M.CHARACTER]: { cycleTime: 2 },
      [M.ASSEMBLER_I]: { cycleTime: 2 },
    },
  },
  "Neon Decor (Large)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.POLYMER_BOARD, amount: 1 }],
    output: { amount: 2 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1 },
      [M.ASSEMBLER_II]: { cycleTime: 1.333333 },
      [M.CHARACTER]: { cycleTime: 2 },
      [M.ASSEMBLER_I]: { cycleTime: 2 },
    },
  },
  "Neon Decor (Large Slopes)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.POLYMER_BOARD, amount: 1 }],
    output: { amount: 2 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1 },
      [M.ASSEMBLER_II]: { cycleTime: 1.333333 },
      [M.CHARACTER]: { cycleTime: 2 },
      [M.ASSEMBLER_I]: { cycleTime: 2 },
    },
  },
  "Neon Decor (Large Slope Junctions)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.POLYMER_BOARD, amount: 1 }],
    output: { amount: 2 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1 },
      [M.ASSEMBLER_II]: { cycleTime: 1.333333 },
      [M.CHARACTER]: { cycleTime: 2 },
      [M.ASSEMBLER_I]: { cycleTime: 2 },
    },
  },
  "Wooden Blocks": {
    category: CAT.DECOR,
    ingredients: [{ item: I.BIOMASS, amount: 1 }],
    output: { amount: 5 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Wooden Decor Blocks": {
    category: CAT.DECOR,
    ingredients: [{ item: I.BIOMASS, amount: 1 }],
    output: { amount: 5 },
    dlc: "_deluxe_edition",
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Office Chair": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Executive Office Chair": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.BIOMASS, amount: 1 }],
    output: { amount: 1 },
    dlc: "_deluxe_edition",
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Office Couch": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Executive Office Couch": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 2 }, { item: I.BIOMASS, amount: 1 }],
    output: { amount: 1 },
    dlc: "_deluxe_edition",
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Office Desk": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 2 }, { item: I.ELECTRONIC_COMPONENTS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Executive Office Desk": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 2 }, { item: I.ELECTRONIC_COMPONENTS, amount: 1 }, { item: I.BIOMASS, amount: 1 }],
    output: { amount: 1 },
    dlc: "_deluxe_edition",
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Office File Cabinet": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Executive Office File Cabinet": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 2 }, { item: I.BIOMASS, amount: 1 }],
    output: { amount: 1 },
    dlc: "_deluxe_edition",
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Marble (Black)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.MINERAL_ROCKS, amount: 1 }, { item: I.CRUDE_OLUMITE, amount: 5 }],
    output: { amount: 2 },
    dlc: "_deluxe_edition",
    machines: {
      [M.FLUID_ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Marble (White)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.MINERAL_ROCKS, amount: 1 }, { item: I.WATER, amount: 5 }],
    output: { amount: 2 },
    dlc: "_deluxe_edition",
    machines: {
      [M.FLUID_ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Office Nameplate": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }],
    output: { amount: 1 },
    dlc: "_deluxe_edition",
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Office Plant": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.BIOMASS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Executive Office Plant": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.BIOMASS, amount: 1 }],
    output: { amount: 1 },
    dlc: "_deluxe_edition",
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Office Statue": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 3 }, { item: I.BIOMASS, amount: 1 }],
    output: { amount: 1 },
    dlc: "_deluxe_edition",
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Office Table": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Executive Office Table": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 2 }, { item: I.BIOMASS, amount: 1 }],
    output: { amount: 1 },
    dlc: "_deluxe_edition",
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Office Wall Plaque": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.BIOMASS, amount: 1 }],
    output: { amount: 1 },
    dlc: "_deluxe_edition",
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Railings": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 0.75 },
      [M.ASSEMBLER_II]: { cycleTime: 1 },
      [M.CHARACTER]: { cycleTime: 1.5 },
      [M.ASSEMBLER_I]: { cycleTime: 1.5 },
    },
  },
  "Rocky Desert Seed (Plants)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.ROCKY_DESERT_SEED_PLANTS, amount: 1 }, { item: I.MINERAL_ROCKS, amount: 1 }, { item: I.WATER, amount: 250 }],
    output: { amount: 3, chance: 0.5 },
    machines: {
      [M.GREENHOUSE]: { cycleTime: 300 },
    },
  },
  "Rocky Desert Seed (Trees)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.ROCKY_DESERT_SEED_TREES, amount: 1 }, { item: I.MINERAL_ROCKS, amount: 1 }, { item: I.WATER, amount: 250 }],
    output: { amount: 3, chance: 0.5 },
    machines: {
      [M.GREENHOUSE]: { cycleTime: 300 },
    },
  },
  "Sandy Desert Seed (Plants)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.SANDY_DESERT_SEED_PLANTS, amount: 1 }, { item: I.MINERAL_ROCKS, amount: 1 }, { item: I.WATER, amount: 250 }],
    output: { amount: 3, chance: 0.5 },
    machines: {
      [M.GREENHOUSE]: { cycleTime: 300 },
    },
  },
  "Sandy Desert Seed (Trees)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.SANDY_DESERT_SEED_TREES, amount: 1 }, { item: I.MINERAL_ROCKS, amount: 1 }, { item: I.WATER, amount: 250 }],
    output: { amount: 3, chance: 0.5 },
    machines: {
      [M.GREENHOUSE]: { cycleTime: 300 },
    },
  },
  "Sign": {
    category: CAT.DECOR,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 4 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 0.75 },
      [M.ASSEMBLER_II]: { cycleTime: 1 },
      [M.CHARACTER]: { cycleTime: 1.5 },
      [M.ASSEMBLER_I]: { cycleTime: 1.5 },
    },
  },
  "Tropical Rainforest Seed (Plants)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.TROPICAL_RAINFOREST_SEED_PLANTS, amount: 1 }, { item: I.MINERAL_ROCKS, amount: 1 }, { item: I.WATER, amount: 250 }],
    output: { amount: 3, chance: 0.5 },
    machines: {
      [M.GREENHOUSE]: { cycleTime: 300 },
    },
  },
  "Tropical Rainforest Seed (Trees)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.TROPICAL_RAINFOREST_SEED_TREES, amount: 1 }, { item: I.MINERAL_ROCKS, amount: 1 }, { item: I.WATER, amount: 250 }],
    output: { amount: 3, chance: 0.5 },
    machines: {
      [M.GREENHOUSE]: { cycleTime: 300 },
    },
  },
  "Tundra Seed (Plants)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.TUNDRA_SEED_PLANTS, amount: 1 }, { item: I.MINERAL_ROCKS, amount: 1 }, { item: I.WATER, amount: 250 }],
    output: { amount: 3, chance: 0.5 },
    machines: {
      [M.GREENHOUSE]: { cycleTime: 300 },
    },
  },
  "Tundra Seed (Trees)": {
    category: CAT.DECOR,
    ingredients: [{ item: I.TUNDRA_SEED_TREES, amount: 1 }, { item: I.MINERAL_ROCKS, amount: 1 }, { item: I.WATER, amount: 250 }],
    output: { amount: 3, chance: 0.5 },
    machines: {
      [M.GREENHOUSE]: { cycleTime: 300 },
    },
  },

  // ── Handhelds ──────────────────────────────────────────
  "Excavation Drone Controller": {
    category: CAT.HANDHELDS,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 5 }, { item: I.MACHINERY_PARTS, amount: 5 }, { item: I.ELECTRONIC_COMPONENTS, amount: 25 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666667 },
      [M.CHARACTER]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
    },
  },
  "Explosive Charge": {
    category: CAT.HANDHELDS,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.EXPLOSIVES, amount: 1 }, { item: I.WIRE_COIL, amount: 3 }, { item: I.ELECTRONIC_COMPONENTS, amount: 3 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Heavy Explosive Charge": {
    category: CAT.HANDHELDS,
    ingredients: [{ item: I.EXPLOSIVE_CHARGE, amount: 1 }, { item: I.EXPLOSIVES, amount: 1 }, { item: I.LIQUID_FUEL, amount: 150 }],
    output: { amount: 1 },
    machines: {
      [M.CHEMICAL_PROCESSOR]: { cycleTime: 8 },
    },
  },
  "Explosives Detonator": {
    category: CAT.HANDHELDS,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 2 }, { item: I.ELECTRONIC_COMPONENTS, amount: 40 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333333 },
      [M.CHARACTER]: { cycleTime: 8 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
    },
  },
  "Modular Building Planner": {
    category: CAT.HANDHELDS,
    ingredients: [{ item: I.POLYMER_BOARD, amount: 1 }, { item: I.MACHINERY_PARTS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2 },
      [M.ASSEMBLER_II]: { cycleTime: 2.666667 },
      [M.CHARACTER]: { cycleTime: 4 },
      [M.ASSEMBLER_I]: { cycleTime: 4 },
    },
  },
  "Mining Drill": {
    category: CAT.HANDHELDS,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 2 }, { item: I.MACHINERY_PARTS, amount: 1 }, { item: I.ELECTRONIC_COMPONENTS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333333 },
      [M.CHARACTER]: { cycleTime: 8 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
    },
  },
  "Mining Laser": {
    category: CAT.HANDHELDS,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 2 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 15 }, { item: I.ENERGY_CELL, amount: 15 }, { item: I.ELECTRONIC_COMPONENTS, amount: 15 }],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 10 },
    },
  },
  "Orbital Uplink": {
    category: CAT.HANDHELDS,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.MACHINERY_PARTS, amount: 5 }, { item: I.ELECTRONIC_COMPONENTS, amount: 20 }, { item: I.CIRCUIT_BOARD, amount: 10 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666667 },
      [M.CHARACTER]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
    },
  },
  "Ore Scanner": {
    category: CAT.HANDHELDS,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 4 }, { item: I.ELECTRONIC_COMPONENTS, amount: 20 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666667 },
      [M.CHARACTER]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
    },
  },
  "Paint Roller": {
    category: CAT.HANDHELDS,
    ingredients: [{ item: I.BIOMASS, amount: 10 }, { item: I.TECHNUM_RODS, amount: 1 }, { item: I.MACHINERY_PARTS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 6 },
    },
  },
  "Plumber Tool": {
    category: CAT.HANDHELDS,
    ingredients: [{ item: I.BIOMASS, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 6 },
    },
  },
  "Power Line": {
    category: CAT.HANDHELDS,
    ingredients: [{ item: I.WIRE_COIL, amount: 2 }],
    output: { amount: 2 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2 },
      [M.ASSEMBLER_II]: { cycleTime: 2.666667 },
      [M.CHARACTER]: { cycleTime: 4 },
      [M.ASSEMBLER_I]: { cycleTime: 4 },
    },
  },
  "Shaped Charge": {
    category: CAT.HANDHELDS,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 1 }, { item: I.EXPLOSIVES, amount: 1 }, { item: I.CIRCUIT_BOARD, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333333 },
      [M.CHARACTER]: { cycleTime: 8 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
    },
  },
  "Shaped Charge (Heavy)": {
    category: CAT.HANDHELDS,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 2 }, { item: I.EXPLOSIVES, amount: 2 }, { item: I.CIRCUIT_BOARD, amount: 1 }, { item: I.RUBBER, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 6 },
      [M.ASSEMBLER_II]: { cycleTime: 8 },
      [M.CHARACTER]: { cycleTime: 12 },
      [M.ASSEMBLER_I]: { cycleTime: 12 },
    },
  },
  "Irrigation Tool": {
    category: CAT.HANDHELDS,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 5 }, { item: I.MACHINERY_PARTS, amount: 5 }, { item: I.PIPE, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.CHARACTER]: { cycleTime: 30 },
      [M.ASSEMBLER_I]: { cycleTime: 30 },
    },
  },

  // ── Metallurgy ──────────────────────────────────────────
  "Advanced Xenoferrite-Ignium Ore Blend": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.XENOFERRITE_ORE, amount: 4 }, { item: I.IGNIUM_ORE, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.CRUSHER_II]: { cycleTime: 1.5 },
      [M.CRUSHER_I]: { cycleTime: 3 },
    },
  },
  "Firmarlite Sheet": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.FIRMARLITE_BAR, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.LAVA_SMELTER_II]: { cycleTime: 3 },
      [M.LAVA_SMELTER_I]: { cycleTime: 6 },
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
  "Molten Superalloy": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.FIRMARLITE_SHEET, amount: 160 }, { item: I.TELLUXITE_INGOT, amount: 40 }, { item: I.COKED_IGNIUM, amount: 40 }],
    output: { amount: 4000 },
    machines: {
      [M.ELECTRIC_ARC_FURNACE]: { cycleTime: 60 },
    },
  },
  "Ignium Ore": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.IGNIUM_ORE_RUBBLE, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.CRUSHER_II]: { cycleTime: 0.75 },
      [M.CRUSHER_I]: { cycleTime: 1.5 },
    },
  },
  "Technum Ore": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.TECHNUM_ORE_RUBBLE, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.CRUSHER_II]: { cycleTime: 0.75 },
      [M.CRUSHER_I]: { cycleTime: 1.5 },
    },
  },
  "Technum Ore (Alternative)": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.TECHNUM_ORE_RUBBLE, amount: 2 }, { item: I.XENO_CRYSTAL, amount: 1 }],
    output: [{ item: I.TECHNUM_ORE, amount: 3 }],
    machines: {
      [M.CRUSHER_II]: { cycleTime: 2.25 },
      [M.CRUSHER_I]: { cycleTime: 4.5 },
    },
  },
  "Telluxite Ore": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.TELLUXITE_ORE_RUBBLE, amount: 4 }],
    output: { amount: 1 },
    machines: {
      [M.CRUSHER_II]: { cycleTime: 0.75 },
      [M.CRUSHER_I]: { cycleTime: 1.5 },
    },
  },
  "Xenoferrite Ore": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.XENOFERRITE_ORE_RUBBLE, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.CRUSHER_II]: { cycleTime: 0.75 },
      [M.CRUSHER_I]: { cycleTime: 1.5 },
    },
  },
  "Xenoferrite Ore (Alternative)": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.XENOFERRITE_ORE_RUBBLE, amount: 2 }, { item: I.XENO_CRYSTAL, amount: 1 }],
    output: [{ item: I.XENOFERRITE_ORE, amount: 3 }],
    machines: {
      [M.CRUSHER_II]: { cycleTime: 2.25 },
      [M.CRUSHER_I]: { cycleTime: 4.5 },
    },
  },
  "Xenoferrite-Ignium Ore Blend": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.XENOFERRITE_ORE_RUBBLE, amount: 4 }, { item: I.IGNIUM_ORE_RUBBLE, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.CRUSHER_II]: { cycleTime: 1.5 },
      [M.CRUSHER_I]: { cycleTime: 3 },
    },
  },
  "Steel Beams (Tier 1)": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.XENOFERRITE_IGNIUM_ORE_BLEND, amount: 1 }],
    output: [{ item: I.STEEL_BEAMS, amount: 1 }],
    machines: {
      [M.ADVANCED_SMELTER]: { cycleTime: 4 },
      [M.SMELTER_SMALL]: { cycleTime: 6 },
    },
  },
  "Steel Beams (Tier 2)": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.ADVANCED_XENOFERRITE_IGNIUM_ORE_BLEND, amount: 1 }],
    output: [{ item: I.STEEL_BEAMS, amount: 2 }],
    machines: {
      [M.ADVANCED_SMELTER]: { cycleTime: 4 },
    },
  },
  "Superalloy": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.MOLTEN_SUPERALLOY, amount: 50 }],
    output: { amount: 1 },
    machines: {
      [M.CASTING_MACHINE]: { cycleTime: 3 },
    },
  },
  "Technum Rods (Tier 1)": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.TECHNUM_ORE_RUBBLE, amount: 1 }],
    output: [{ item: I.TECHNUM_RODS, amount: 1 }],
    machines: {
      [M.ADVANCED_SMELTER]: { cycleTime: 2 },
      [M.SMELTER_SMALL]: { cycleTime: 3 },
    },
  },
  "Technum Rods (Tier 2)": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.TECHNUM_ORE, amount: 2 }],
    output: [{ item: I.TECHNUM_RODS, amount: 3 }],
    machines: {
      [M.ADVANCED_SMELTER]: { cycleTime: 4 },
      [M.SMELTER_SMALL]: { cycleTime: 6 },
    },
  },
  "Technum Rods (Tier 3)": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.MOLTEN_TECHNUM, amount: 15 }],
    output: [{ item: I.TECHNUM_RODS, amount: 5 }],
    machines: {
      [M.HEAVY_CASTER_BASE]: { cycleTime: 0.234375 },
      [M.CASTING_MACHINE]: { cycleTime: 7.5 },
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
  "Xenoferrite Plates (Tier 1)": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.XENOFERRITE_ORE_RUBBLE, amount: 1 }],
    output: [{ item: I.XENOFERRITE_PLATES, amount: 1 }],
    machines: {
      [M.ADVANCED_SMELTER]: { cycleTime: 2 },
      [M.SMELTER_SMALL]: { cycleTime: 3 },
    },
  },
  "Xenoferrite Plates (Tier 2)": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.XENOFERRITE_ORE, amount: 2 }],
    output: [{ item: I.XENOFERRITE_PLATES, amount: 3 }],
    machines: {
      [M.ADVANCED_SMELTER]: { cycleTime: 4 },
      [M.SMELTER_SMALL]: { cycleTime: 6 },
    },
  },
  "Xenoferrite Plates (Tier 3)": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.MOLTEN_XENOFERRITE, amount: 15 }],
    output: [{ item: I.XENOFERRITE_PLATES, amount: 5 }],
    machines: {
      [M.HEAVY_CASTER_BASE]: { cycleTime: 0.234375 },
      [M.CASTING_MACHINE]: { cycleTime: 7.5 },
    },
  },
  "Molten Technum": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.TECHNUM_ORE, amount: 640 }, { item: I.COKED_IGNIUM, amount: 320 }, { item: I.MINERAL_ROCKS, amount: 128 }],
    output: [{ item: I.MOLTEN_TECHNUM, amount: 5760 }, { item: I.BLAST_FURNACE_SLAG, amount: 640 }],
    machines: {
      [M.BLAST_FURNACE_BASE]: { cycleTime: 60 },
    },
  },
  "Molten Xenoferrite": {
    category: CAT.METALLURGY,
    ingredients: [{ item: I.XENOFERRITE_ORE, amount: 640 }, { item: I.COKED_IGNIUM, amount: 320 }, { item: I.MINERAL_ROCKS, amount: 128 }],
    output: [{ item: I.MOLTEN_XENOFERRITE, amount: 5760 }, { item: I.BLAST_FURNACE_SLAG, amount: 640 }],
    machines: {
      [M.BLAST_FURNACE_BASE]: { cycleTime: 60 },
    },
  },
  "Mineral Rocks": {
    category: CAT.METALLURGY,
    ingredients: [],
    output: { amount: 1 },
    machines: {
      [M.ORE_VEIN_MINER]: { cycleTime: 0.375 },
      [M.DRONE_MINER_II]: { cycleTime: 0.666667 },
      [M.DRONE_MINER_I]: { cycleTime: 1 },
    },
  },
  "Ignium Ore Rubble": {
    category: CAT.METALLURGY,
    ingredients: [],
    output: { amount: 1 },
    machines: {
      [M.ORE_VEIN_MINER]: { cycleTime: 0.375 },
      [M.DRONE_MINER_II]: { cycleTime: 0.666667 },
      [M.DRONE_MINER_I]: { cycleTime: 1 },
    },
  },
  "Technum Ore Rubble": {
    category: CAT.METALLURGY,
    ingredients: [],
    output: { amount: 1 },
    machines: {
      [M.ORE_VEIN_MINER]: { cycleTime: 0.375 },
      [M.DRONE_MINER_II]: { cycleTime: 0.666667 },
      [M.DRONE_MINER_I]: { cycleTime: 1 },
    },
  },
  "Telluxite Ore Rubble": {
    category: CAT.METALLURGY,
    ingredients: [],
    output: { amount: 1 },
    machines: {
      [M.ORE_VEIN_MINER]: { cycleTime: 0.375 },
    },
  },
  "Xenoferrite Ore Rubble": {
    category: CAT.METALLURGY,
    ingredients: [],
    output: { amount: 1 },
    machines: {
      [M.ORE_VEIN_MINER]: { cycleTime: 0.375 },
      [M.DRONE_MINER_II]: { cycleTime: 0.666667 },
      [M.DRONE_MINER_I]: { cycleTime: 1 },
    },
  },
  "Xeno-Crystal": {
    category: CAT.METALLURGY,
    ingredients: [],
    output: { amount: 1 },
    machines: {
      [M.XENO_CRYSTAL_EXTRACTOR]: { cycleTime: 6 },
    },
  },
  "Xeno-Scrap": {
    category: CAT.METALLURGY,
    ingredients: [],
    output: { amount: 1 },
    machines: {
      [M.XENO_SCRAP_EXTRACTOR]: { cycleTime: 12 },
    },
  },

  // ── Robots ──────────────────────────────────────────
  "Operator Bot": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.POLYMER_BOARD, amount: 1 }, { item: I.MACHINERY_PARTS, amount: 1 }, { item: I.ELECTRONIC_COMPONENTS, amount: 2 }, { item: I.CIRCUIT_BOARD, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 13.333333 },
      [M.ASSEMBLER_I]: { cycleTime: 20 },
    },
  },
  "Operator Robot Arm": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.ROBOT_PARTS, amount: 1 }, { item: I.HYDRAULIC_PISTON, amount: 1 }, { item: I.RUBBER, amount: 2 }, { item: I.MODULAR_BUILDING_PLANNER, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Operator Robot Head": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.ROBOT_PARTS, amount: 1 }, { item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.CPU, amount: 4 }, { item: I.CIRCUIT_BOARD, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Operator Robot Leg": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.ROBOT_PARTS, amount: 1 }, { item: I.HYDRAULIC_PISTON, amount: 1 }, { item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.RUBBER, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Operator Robot Torso": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.ROBOT_PARTS, amount: 1 }, { item: I.XENOFERRITE_PLATES, amount: 2 }, { item: I.CIRCUIT_BOARD, amount: 1 }, { item: I.ENERGY_CELL, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Planter Drone": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.FIRMARLITE_SHEET, amount: 1 }, { item: I.MACHINERY_PARTS, amount: 2 }, { item: I.ELECTRONIC_COMPONENTS, amount: 2 }, { item: I.HOVER_ENGINE, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333333 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
    },
  },
  "Hydro-Farming Bot": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.NAUTICAL_CHASSIS, amount: 1 }, { item: I.CPU, amount: 1 }, { item: I.BARREL_EMPTY, amount: 2 }, { item: I.IGNIUM_FUEL_ROD, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.ASSEMBLER_I]: { cycleTime: 30 },
    },
  },
  "Farmer Robot Arm": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.ROBOT_PARTS, amount: 1 }, { item: I.HYDRAULIC_PISTON, amount: 1 }, { item: I.XENOFERRITE_PLATES, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Farmer Robot Head": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.ROBOT_PARTS, amount: 1 }, { item: I.CPU, amount: 1 }, { item: I.POLYMER_BOARD, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Farmer Robot Leg": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.ROBOT_PARTS, amount: 1 }, { item: I.HYDRAULIC_PISTON, amount: 1 }, { item: I.XENOFERRITE_PLATES, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Farmer Robot Torso": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.ROBOT_PARTS, amount: 1 }, { item: I.XENOFERRITE_PLATES, amount: 2 }, { item: I.BARREL_EMPTY, amount: 1 }, { item: I.ENERGY_CELL, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Vacuum Bot": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.MACHINERY_PARTS, amount: 1 }, { item: I.ELECTRONIC_COMPONENTS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 6 },
      [M.ASSEMBLER_II]: { cycleTime: 8 },
      [M.ASSEMBLER_I]: { cycleTime: 12 },
    },
  },
  "Cleaning Bot": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.POLYMER_BOARD, amount: 1 }, { item: I.MACHINERY_PARTS, amount: 1 }, { item: I.CIRCUIT_BOARD, amount: 1 }, { item: I.ENERGY_CELL, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Light Bot": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 1 }, { item: I.MACHINERY_PARTS, amount: 1 }, { item: I.ELECTRONIC_COMPONENTS, amount: 1 }, { item: I.GLASS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 6 },
      [M.ASSEMBLER_II]: { cycleTime: 8 },
      [M.ASSEMBLER_I]: { cycleTime: 12 },
    },
  },
  "Maintenance Drone": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.FIRMARLITE_SHEET, amount: 1 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 1 }, { item: I.CIRCUIT_BOARD, amount: 1 }, { item: I.HOVER_ENGINE, amount: 1 }, { item: I.ENERGY_CELL, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.ASSEMBLER_I]: { cycleTime: 30 },
    },
  },
  "Combat Drone": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.FIRMARLITE_SHEET, amount: 1 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 1 }, { item: I.CIRCUIT_BOARD, amount: 1 }, { item: I.HOVER_ENGINE, amount: 1 }, { item: I.WEAPON_COMPONENTS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Combat Robot Arm": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.ROBOT_PARTS, amount: 1 }, { item: I.HYDRAULIC_PISTON, amount: 1 }, { item: I.STEEL_BEAMS, amount: 1 }, { item: I.WEAPON_COMPONENTS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Combat Robot Head": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.ROBOT_PARTS, amount: 1 }, { item: I.FIRMARLITE_SHEET, amount: 1 }, { item: I.WEAPON_COMPONENTS, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Combat Robot Leg": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.ROBOT_PARTS, amount: 1 }, { item: I.HYDRAULIC_PISTON, amount: 1 }, { item: I.STEEL_BEAMS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Combat Robot Torso": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.ROBOT_PARTS, amount: 1 }, { item: I.CPU, amount: 1 }, { item: I.STEEL_BEAMS, amount: 1 }, { item: I.ENERGY_CELL, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Assault Robot Arm": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.HIGH_TECH_ROBOT_PARTS, amount: 1 }, { item: I.HYDRAULIC_PISTON, amount: 1 }, { item: I.SUPERALLOY, amount: 1 }, { item: I.WEAPON_COMPONENTS, amount: 4 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Assault Robot Head": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.HIGH_TECH_ROBOT_PARTS, amount: 1 }, { item: I.SUPERALLOY, amount: 1 }, { item: I.CPU, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Assault Robot Leg": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.HIGH_TECH_ROBOT_PARTS, amount: 1 }, { item: I.HYDRAULIC_PISTON, amount: 1 }, { item: I.SUPERALLOY, amount: 1 }, { item: I.RUBBER, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Assault Robot Torso": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.HIGH_TECH_ROBOT_PARTS, amount: 1 }, { item: I.CPU, amount: 1 }, { item: I.SUPERALLOY, amount: 2 }, { item: I.ENERGY_CELL, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Mining Drone": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 1 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 1 }, { item: I.CIRCUIT_BOARD, amount: 1 }, { item: I.HOVER_ENGINE, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 10 },
      [M.ASSEMBLER_II]: { cycleTime: 13.333333 },
      [M.ASSEMBLER_I]: { cycleTime: 20 },
    },
  },
  "Hydro-Mining Bot": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.NAUTICAL_CHASSIS, amount: 1 }, { item: I.CPU, amount: 1 }, { item: I.MINING_DRILL, amount: 1 }, { item: I.IGNIUM_FUEL_ROD, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.ASSEMBLER_I]: { cycleTime: 30 },
    },
  },
  "Miner Robot Arm": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.ROBOT_PARTS, amount: 1 }, { item: I.HYDRAULIC_PISTON, amount: 1 }, { item: I.STEEL_BEAMS, amount: 1 }, { item: I.MINING_DRILL, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Miner Robot Head": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.ROBOT_PARTS, amount: 1 }, { item: I.CPU, amount: 1 }, { item: I.XENOFERRITE_PLATES, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Miner Robot Leg": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.ROBOT_PARTS, amount: 1 }, { item: I.HYDRAULIC_PISTON, amount: 1 }, { item: I.STEEL_BEAMS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Miner Robot Torso": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.ROBOT_PARTS, amount: 1 }, { item: I.FIRMARLITE_SHEET, amount: 2 }, { item: I.CIRCUIT_BOARD, amount: 1 }, { item: I.ENERGY_CELL, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Personal Assistant Robot Arm": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.ROBOT_PARTS, amount: 1 }, { item: I.HYDRAULIC_PISTON, amount: 1 }, { item: I.XENOFERRITE_PLATES, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Personal Assistant Robot Head": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.ROBOT_PARTS, amount: 1 }, { item: I.CPU, amount: 1 }, { item: I.GLASS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Personal Assistant Robot Leg": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.ROBOT_PARTS, amount: 1 }, { item: I.HYDRAULIC_PISTON, amount: 1 }, { item: I.XENOFERRITE_PLATES, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Personal Assistant Robot Torso": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.ROBOT_PARTS, amount: 1 }, { item: I.FIRMARLITE_SHEET, amount: 2 }, { item: I.CIRCUIT_BOARD, amount: 1 }, { item: I.ENERGY_CELL, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Hazard Robot Arm": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.HIGH_TECH_ROBOT_PARTS, amount: 1 }, { item: I.HYDRAULIC_PISTON, amount: 1 }, { item: I.SUPERALLOY, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Hazard Robot Head": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.HIGH_TECH_ROBOT_PARTS, amount: 1 }, { item: I.SUPERALLOY, amount: 1 }, { item: I.CPU, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Hazard Robot Leg": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.HIGH_TECH_ROBOT_PARTS, amount: 1 }, { item: I.HYDRAULIC_PISTON, amount: 1 }, { item: I.SUPERALLOY, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Hazard Robot Torso": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.HIGH_TECH_ROBOT_PARTS, amount: 1 }, { item: I.SUPERALLOY, amount: 3 }, { item: I.CIRCUIT_BOARD, amount: 1 }, { item: I.ENERGY_CELL, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Science Robot Arm": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.ROBOT_PARTS, amount: 1 }, { item: I.HYDRAULIC_PISTON, amount: 1 }, { item: I.POLYMER_BOARD, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Science Robot Head": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.ROBOT_PARTS, amount: 1 }, { item: I.POLYMER_BOARD, amount: 1 }, { item: I.CPU, amount: 2 }, { item: I.GLASS, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Science Robot Leg": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.ROBOT_PARTS, amount: 1 }, { item: I.HYDRAULIC_PISTON, amount: 1 }, { item: I.FIRMARLITE_SHEET, amount: 1 }, { item: I.POLYMER_BOARD, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Science Robot Torso": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.ROBOT_PARTS, amount: 1 }, { item: I.POLYMER_BOARD, amount: 2 }, { item: I.CIRCUIT_BOARD, amount: 1 }, { item: I.ENERGY_CELL, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Scout Robot Arm": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.HIGH_TECH_ROBOT_PARTS, amount: 1 }, { item: I.HYDRAULIC_PISTON, amount: 1 }, { item: I.FIRMARLITE_SHEET, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Scout Robot Head": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.HIGH_TECH_ROBOT_PARTS, amount: 1 }, { item: I.FIRMARLITE_SHEET, amount: 2 }, { item: I.CPU, amount: 1 }, { item: I.GLASS, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Scout Robot Leg": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.HIGH_TECH_ROBOT_PARTS, amount: 2 }, { item: I.HYDRAULIC_PISTON, amount: 3 }, { item: I.FIRMARLITE_SHEET, amount: 3 }, { item: I.RUBBER, amount: 3 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Scout Robot Torso": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.HIGH_TECH_ROBOT_PARTS, amount: 2 }, { item: I.POLYMER_BOARD, amount: 2 }, { item: I.SUPERALLOY, amount: 1 }, { item: I.ENERGY_CELL, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Science Assistant Drone": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.POLYMER_BOARD, amount: 1 }, { item: I.MACHINERY_PARTS, amount: 1 }, { item: I.CIRCUIT_BOARD, amount: 1 }, { item: I.HOVER_ENGINE, amount: 1 }, { item: I.ENERGY_CELL, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666667 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
    },
  },
  "Marine Exploration Bot": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.NAUTICAL_CHASSIS, amount: 1 }, { item: I.CPU, amount: 1 }, { item: I.PORTABLE_LIGHT, amount: 1 }, { item: I.IGNIUM_FUEL_ROD, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.ASSEMBLER_I]: { cycleTime: 30 },
    },
  },
  "Screen Bot": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.POLYMER_BOARD, amount: 1 }, { item: I.CIRCUIT_BOARD, amount: 1 }, { item: I.GLASS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333333 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
    },
  },
  "Snack Bot": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.MACHINERY_PARTS, amount: 1 }, { item: I.ELECTRONIC_COMPONENTS, amount: 1 }, { item: I.GLASS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 6 },
      [M.ASSEMBLER_II]: { cycleTime: 8 },
      [M.ASSEMBLER_I]: { cycleTime: 12 },
    },
  },
  "Transport Bot": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.MACHINERY_PARTS, amount: 1 }, { item: I.ELECTRONIC_COMPONENTS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666667 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
    },
  },
  "Heavy Duty Transport Bot": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 1 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 1 }, { item: I.ELECTRONIC_COMPONENTS, amount: 1 }, { item: I.FIRMARLITE_SHEET, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Aquatic Hauling Bot": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.NAUTICAL_CHASSIS, amount: 1 }, { item: I.CPU, amount: 1 }, { item: I.HYDRAULIC_PISTON, amount: 1 }, { item: I.IGNIUM_FUEL_ROD, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.ASSEMBLER_I]: { cycleTime: 30 },
    },
  },
  "Transport Drone": {
    category: CAT.ROBOTS,
    ingredients: [{ item: I.FIRMARLITE_SHEET, amount: 2 }, { item: I.POLYMER_BOARD, amount: 1 }, { item: I.CIRCUIT_BOARD, amount: 1 }, { item: I.HOVER_ENGINE, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 6 },
      [M.ASSEMBLER_II]: { cycleTime: 8 },
      [M.ASSEMBLER_I]: { cycleTime: 12 },
    },
  },

  // ── Structures ──────────────────────────────────────────
  "Assembly Line Logistics Container": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 30 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 10 }, { item: I.CIRCUIT_BOARD, amount: 10 }, { item: I.POLYMER_BOARD, amount: 10 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333333 },
      [M.CHARACTER]: { cycleTime: 8 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
    },
  },
  "Assembly Line Merger": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 25 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 6 }, { item: I.CIRCUIT_BOARD, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Assembly Line Painter": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 40 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 10 }, { item: I.CIRCUIT_BOARD, amount: 10 }, { item: I.HYDRAULIC_PISTON, amount: 10 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333333 },
      [M.CHARACTER]: { cycleTime: 8 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
    },
  },
  "Assembly Line Producer": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 40 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 10 }, { item: I.CIRCUIT_BOARD, amount: 10 }, { item: I.HYDRAULIC_PISTON, amount: 10 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333333 },
      [M.CHARACTER]: { cycleTime: 8 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
    },
  },
  "Assembly Line Rail": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 6 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Assembly Line Splitter": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 25 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 6 }, { item: I.CIRCUIT_BOARD, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Assembly Line Start": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 30 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 8 }, { item: I.CIRCUIT_BOARD, amount: 4 }, { item: I.HYDRAULIC_PISTON, amount: 8 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333333 },
      [M.CHARACTER]: { cycleTime: 8 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
    },
  },
  "Fluid Assembler I": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 15 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 10 }, { item: I.CIRCUIT_BOARD, amount: 5 }, { item: I.POLYMER_BOARD, amount: 10 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666667 },
      [M.CHARACTER]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
    },
  },
  "Assembler I": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 10 }, { item: I.MACHINERY_PARTS, amount: 10 }, { item: I.ELECTRONIC_COMPONENTS, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333333 },
      [M.CHARACTER]: { cycleTime: 8 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
    },
  },
  "Assembler II": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.ASSEMBLER_I, amount: 1 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 6 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 4 },
      [M.CHARACTER]: { cycleTime: 6 },
      [M.ASSEMBLER_I]: { cycleTime: 6 },
    },
  },
  "Assembler III": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.ASSEMBLER_II, amount: 1 }, { item: I.FIRMARLITE_SHEET, amount: 20 }, { item: I.CIRCUIT_BOARD, amount: 10 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 4 },
      [M.CHARACTER]: { cycleTime: 6 },
      [M.ASSEMBLER_I]: { cycleTime: 6 },
    },
  },
  "Barrel Filler I": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 15 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 10 }, { item: I.CIRCUIT_BOARD, amount: 5 }, { item: I.PIPE, amount: 3 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666667 },
      [M.CHARACTER]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
    },
  },
  "Battery (Small)": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 10 }, { item: I.ELECTRONIC_COMPONENTS, amount: 4 }, { item: I.TECHNUM_RODS, amount: 20 }, { item: I.ENERGY_CELL, amount: 10 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Battery (Large)": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 10 }, { item: I.CIRCUIT_BOARD, amount: 10 }, { item: I.ENERGY_CELL, amount: 20 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 3.75 },
      [M.ASSEMBLER_II]: { cycleTime: 5 },
      [M.CHARACTER]: { cycleTime: 7.5 },
      [M.ASSEMBLER_I]: { cycleTime: 7.5 },
    },
  },
  "Biomass Burner": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 5 }, { item: I.ELECTRONIC_COMPONENTS, amount: 5 }, { item: I.TECHNUM_RODS, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2 },
      [M.ASSEMBLER_II]: { cycleTime: 2.666667 },
      [M.CHARACTER]: { cycleTime: 4 },
      [M.ASSEMBLER_I]: { cycleTime: 4 },
    },
  },
  "Boiler": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.PIPE, amount: 5 }, { item: I.MACHINERY_PARTS, amount: 10 }, { item: I.STEEL_BEAMS, amount: 10 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Building Block": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 6 }, { item: I.TECHNUM_RODS, amount: 4 }],
    output: { amount: 20 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Burner Generator": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 25 }, { item: I.ELECTRONIC_COMPONENTS, amount: 10 }, { item: I.TECHNUM_RODS, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2 },
      [M.ASSEMBLER_II]: { cycleTime: 2.666667 },
      [M.CHARACTER]: { cycleTime: 4 },
      [M.ASSEMBLER_I]: { cycleTime: 4 },
    },
  },
  "Casting Machine": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 15 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 20 }, { item: I.ELECTRONIC_COMPONENTS, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333333 },
      [M.CHARACTER]: { cycleTime: 8 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
    },
  },
  "Chemical Processor": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 20 }, { item: I.POLYMER_BOARD, amount: 10 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 5 }, { item: I.CIRCUIT_BOARD, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333333 },
      [M.CHARACTER]: { cycleTime: 8 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
    },
  },
  "Construction Ship Port": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 100 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 100 }, { item: I.CIRCUIT_BOARD, amount: 25 }, { item: I.ENERGY_CELL, amount: 10 }, { item: I.POLYMER_BOARD, amount: 50 }, { item: I.MAINTENANCE_DRONE, amount: 8 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666667 },
      [M.CHARACTER]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
    },
  },
  "Construction Warehouse": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 200 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 50 }, { item: I.CIRCUIT_BOARD, amount: 50 }, { item: I.POLYMER_BOARD, amount: 100 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666667 },
      [M.CHARACTER]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
    },
  },
  "Container": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 30 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Conveyor Balancer I": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.CONVEYOR_I, amount: 4 }, { item: I.MACHINERY_PARTS, amount: 4 }, { item: I.ELECTRONIC_COMPONENTS, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Conveyor Balancer II": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.CONVEYOR_BALANCER_I, amount: 1 }, { item: I.MACHINERY_PARTS, amount: 4 }, { item: I.ELECTRONIC_COMPONENTS, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Conveyor Balancer III": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.CONVEYOR_BALANCER_II, amount: 1 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 2 }, { item: I.CIRCUIT_BOARD, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Conveyor Balancer IV": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.CONVEYOR_BALANCER_III, amount: 1 }, { item: I.FIRMARLITE_SHEET, amount: 4 }, { item: I.HYDRAULIC_PISTON, amount: 2 }, { item: I.RUBBER, amount: 4 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Conveyor I": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.MACHINERY_PARTS, amount: 1 }],
    output: { amount: 2 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Conveyor II": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.CONVEYOR_I, amount: 2 }, { item: I.MACHINERY_PARTS, amount: 2 }, { item: I.ELECTRONIC_COMPONENTS, amount: 2 }],
    output: { amount: 2 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Conveyor III": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.CONVEYOR_II, amount: 2 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 1 }, { item: I.CIRCUIT_BOARD, amount: 1 }],
    output: { amount: 2 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 3.75 },
      [M.ASSEMBLER_II]: { cycleTime: 5 },
      [M.CHARACTER]: { cycleTime: 7.5 },
      [M.ASSEMBLER_I]: { cycleTime: 7.5 },
    },
  },
  "Conveyor IV": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.CONVEYOR_III, amount: 2 }, { item: I.FIRMARLITE_SHEET, amount: 2 }, { item: I.HYDRAULIC_PISTON, amount: 1 }, { item: I.RUBBER, amount: 2 }],
    output: { amount: 2 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 3.75 },
      [M.ASSEMBLER_II]: { cycleTime: 5 },
      [M.CHARACTER]: { cycleTime: 7.5 },
      [M.ASSEMBLER_I]: { cycleTime: 7.5 },
    },
  },
  "Conveyor Slope I": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.CONVEYOR_I, amount: 2 }, { item: I.MACHINERY_PARTS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 0.75 },
      [M.ASSEMBLER_II]: { cycleTime: 1 },
      [M.CHARACTER]: { cycleTime: 1.5 },
      [M.ASSEMBLER_I]: { cycleTime: 1.5 },
    },
  },
  "Conveyor Slope II": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.CONVEYOR_SLOPE_I, amount: 1 }, { item: I.MACHINERY_PARTS, amount: 2 }, { item: I.ELECTRONIC_COMPONENTS, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.25 },
      [M.ASSEMBLER_II]: { cycleTime: 1.666667 },
      [M.CHARACTER]: { cycleTime: 2.5 },
      [M.ASSEMBLER_I]: { cycleTime: 2.5 },
    },
  },
  "Conveyor Slope III": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.CONVEYOR_SLOPE_II, amount: 1 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 1 }, { item: I.CIRCUIT_BOARD, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.875 },
      [M.ASSEMBLER_II]: { cycleTime: 2.5 },
      [M.CHARACTER]: { cycleTime: 3.75 },
      [M.ASSEMBLER_I]: { cycleTime: 3.75 },
    },
  },
  "Conveyor Slope IV": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.CONVEYOR_SLOPE_III, amount: 1 }, { item: I.FIRMARLITE_SHEET, amount: 2 }, { item: I.HYDRAULIC_PISTON, amount: 1 }, { item: I.RUBBER, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.875 },
      [M.ASSEMBLER_II]: { cycleTime: 2.5 },
      [M.CHARACTER]: { cycleTime: 3.75 },
      [M.ASSEMBLER_I]: { cycleTime: 3.75 },
    },
  },
  "Crate": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 6 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1 },
      [M.ASSEMBLER_II]: { cycleTime: 1.333333 },
      [M.CHARACTER]: { cycleTime: 2 },
      [M.ASSEMBLER_I]: { cycleTime: 2 },
    },
  },
  "Crusher I": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 10 }, { item: I.MACHINERY_PARTS, amount: 10 }, { item: I.ELECTRONIC_COMPONENTS, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333333 },
      [M.CHARACTER]: { cycleTime: 8 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
    },
  },
  "Crusher II": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.CRUSHER_I, amount: 1 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 5 }, { item: I.CIRCUIT_BOARD, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 4 },
      [M.CHARACTER]: { cycleTime: 6 },
      [M.ASSEMBLER_I]: { cycleTime: 6 },
    },
  },
  "Crystal Refiner": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 50 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 20 }, { item: I.CIRCUIT_BOARD, amount: 10 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333333 },
      [M.CHARACTER]: { cycleTime: 8 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
    },
  },
  "Data Cable": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.POLYMER_BOARD, amount: 1 }, { item: I.WIRE_COIL, amount: 2 }],
    output: { amount: 5 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1 },
      [M.ASSEMBLER_II]: { cycleTime: 1.333333 },
      [M.CHARACTER]: { cycleTime: 2 },
      [M.ASSEMBLER_I]: { cycleTime: 2 },
    },
  },
  "Data Evaluator": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.POLYMER_BOARD, amount: 1 }, { item: I.CIRCUIT_BOARD, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Data Memory Cell": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.POLYMER_BOARD, amount: 1 }, { item: I.CIRCUIT_BOARD, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Data Processor": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.POLYMER_BOARD, amount: 1 }, { item: I.CIRCUIT_BOARD, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Data Source (Button)": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.POLYMER_BOARD, amount: 1 }, { item: I.CIRCUIT_BOARD, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Data Source (Lever)": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.POLYMER_BOARD, amount: 1 }, { item: I.CIRCUIT_BOARD, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Data Source": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.POLYMER_BOARD, amount: 1 }, { item: I.CIRCUIT_BOARD, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Distillation Column": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 30 }, { item: I.PIPE, amount: 30 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 15 }, { item: I.ELECTRONIC_COMPONENTS, amount: 15 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666667 },
      [M.CHARACTER]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
    },
  },
  "Drill Ship": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 200 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 100 }, { item: I.CIRCUIT_BOARD, amount: 100 }, { item: I.HOVER_ENGINE, amount: 20 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.CHARACTER]: { cycleTime: 30 },
      [M.ASSEMBLER_I]: { cycleTime: 30 },
    },
  },
  "Drone Miner I": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 10 }, { item: I.MACHINERY_PARTS, amount: 8 }, { item: I.ELECTRONIC_COMPONENTS, amount: 6 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Drone Miner II": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.DRONE_MINER_I, amount: 1 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 10 }, { item: I.CIRCUIT_BOARD, amount: 4 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 3.75 },
      [M.ASSEMBLER_II]: { cycleTime: 5 },
      [M.CHARACTER]: { cycleTime: 7.5 },
      [M.ASSEMBLER_I]: { cycleTime: 7.5 },
    },
  },
  "Cargo Shuttle Start Pad": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 200 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 100 }, { item: I.CIRCUIT_BOARD, amount: 50 }, { item: I.GLASS, amount: 20 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.CHARACTER]: { cycleTime: 30 },
      [M.ASSEMBLER_I]: { cycleTime: 30 },
    },
  },
  "Cargo Shuttle Start Pad (Liquids)": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 200 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 100 }, { item: I.CIRCUIT_BOARD, amount: 50 }, { item: I.GLASS, amount: 20 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.CHARACTER]: { cycleTime: 30 },
      [M.ASSEMBLER_I]: { cycleTime: 30 },
    },
  },
  "Cargo Shuttle Target Pad": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 100 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 10 }, { item: I.CIRCUIT_BOARD, amount: 10 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 6 },
      [M.ASSEMBLER_II]: { cycleTime: 8 },
      [M.CHARACTER]: { cycleTime: 12 },
      [M.ASSEMBLER_I]: { cycleTime: 12 },
    },
  },
  "Cargo Shuttle Target Pad (Liquids)": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 100 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 10 }, { item: I.CIRCUIT_BOARD, amount: 10 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 6 },
      [M.ASSEMBLER_II]: { cycleTime: 8 },
      [M.CHARACTER]: { cycleTime: 12 },
      [M.ASSEMBLER_I]: { cycleTime: 12 },
    },
  },
  "Electric Arc Furnace": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 30 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 25 }, { item: I.ELECTRONIC_COMPONENTS, amount: 50 }, { item: I.CIRCUIT_BOARD, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.CHARACTER]: { cycleTime: 15 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Elevator": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 50 }, { item: I.STEEL_BEAMS, amount: 50 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 20 }, { item: I.ELECTRONIC_COMPONENTS, amount: 15 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666667 },
      [M.CHARACTER]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
    },
  },
  "Emergency Beacon": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 2 }, { item: I.ELECTRONIC_COMPONENTS, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Xeno-Crystal-Extractor": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 25 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 25 }, { item: I.CIRCUIT_BOARD, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Xeno-Scrap-Extractor": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 25 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 25 }, { item: I.CIRCUIT_BOARD, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Escalator I": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 3 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 0.75 },
      [M.ASSEMBLER_II]: { cycleTime: 1 },
      [M.CHARACTER]: { cycleTime: 1.5 },
      [M.ASSEMBLER_I]: { cycleTime: 1.5 },
    },
  },
  "Escalator II": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.ESCALATOR_I, amount: 1 }, { item: I.MACHINERY_PARTS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 0.75 },
      [M.ASSEMBLER_II]: { cycleTime: 1 },
      [M.CHARACTER]: { cycleTime: 1.5 },
      [M.ASSEMBLER_I]: { cycleTime: 1.5 },
    },
  },
  "Escalator III": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.ESCALATOR_II, amount: 1 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 0.75 },
      [M.ASSEMBLER_II]: { cycleTime: 1 },
      [M.CHARACTER]: { cycleTime: 1.5 },
      [M.ASSEMBLER_I]: { cycleTime: 1.5 },
    },
  },
  "Omni-Analyzer": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 15 }, { item: I.MACHINERY_PARTS, amount: 10 }, { item: I.ELECTRONIC_COMPONENTS, amount: 10 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666667 },
      [M.CHARACTER]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
    },
  },
  "Flare Stack": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 10 }, { item: I.STEEL_BEAMS, amount: 5 }, { item: I.MACHINERY_PARTS, amount: 5 }, { item: I.ELECTRONIC_COMPONENTS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Freight Elevator I": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 15 }, { item: I.STEEL_BEAMS, amount: 15 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 3.75 },
      [M.ASSEMBLER_II]: { cycleTime: 5 },
      [M.CHARACTER]: { cycleTime: 7.5 },
      [M.ASSEMBLER_I]: { cycleTime: 7.5 },
    },
  },
  "Freight Elevator II": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.FREIGHT_ELEVATOR_I, amount: 1 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 5 }, { item: I.CIRCUIT_BOARD, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 3.75 },
      [M.ASSEMBLER_II]: { cycleTime: 5 },
      [M.CHARACTER]: { cycleTime: 7.5 },
      [M.ASSEMBLER_I]: { cycleTime: 7.5 },
    },
  },
  "Freight Elevator III": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.FREIGHT_ELEVATOR_II, amount: 1 }, { item: I.HYDRAULIC_PISTON, amount: 15 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 3.75 },
      [M.ASSEMBLER_II]: { cycleTime: 5 },
      [M.CHARACTER]: { cycleTime: 7.5 },
      [M.ASSEMBLER_I]: { cycleTime: 7.5 },
    },
  },
  "Freight Elevator IV": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.FREIGHT_ELEVATOR_III, amount: 1 }, { item: I.CPU, amount: 2 }, { item: I.RUBBER, amount: 10 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 3.75 },
      [M.ASSEMBLER_II]: { cycleTime: 5 },
      [M.CHARACTER]: { cycleTime: 7.5 },
      [M.ASSEMBLER_I]: { cycleTime: 7.5 },
    },
  },
  "Geothermal Boiler": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.FIRMARLITE_SHEET, amount: 50 }, { item: I.STEEL_BEAMS, amount: 25 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 25 }, { item: I.CIRCUIT_BOARD, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.CHARACTER]: { cycleTime: 15 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Greenhouse": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 20 }, { item: I.GLASS, amount: 6 }, { item: I.PIPE, amount: 4 }, { item: I.ELECTRONIC_COMPONENTS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333333 },
      [M.CHARACTER]: { cycleTime: 8 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
    },
  },
  "Incinerator": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 20 }, { item: I.ELECTRONIC_COMPONENTS, amount: 5 }, { item: I.CONCRETE, amount: 25 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Ladder": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 0.75 },
      [M.ASSEMBLER_II]: { cycleTime: 1 },
      [M.CHARACTER]: { cycleTime: 1.5 },
      [M.ASSEMBLER_I]: { cycleTime: 1.5 },
    },
  },
  "Loader": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 3 }, { item: I.MACHINERY_PARTS, amount: 3 }, { item: I.ELECTRONIC_COMPONENTS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Filter Loader": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 4 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 4 }, { item: I.ELECTRONIC_COMPONENTS, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Loader (2nd Lane)": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 8 }, { item: I.MACHINERY_PARTS, amount: 4 }, { item: I.ELECTRONIC_COMPONENTS, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Loader (3rd Lane)": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 12 }, { item: I.MACHINERY_PARTS, amount: 4 }, { item: I.ELECTRONIC_COMPONENTS, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Logistic Container I": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 15 }, { item: I.MACHINERY_PARTS, amount: 4 }, { item: I.ELECTRONIC_COMPONENTS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Logistic Container II": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 15 }, { item: I.STEEL_BEAMS, amount: 10 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 4 }, { item: I.ELECTRONIC_COMPONENTS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 3.75 },
      [M.ASSEMBLER_II]: { cycleTime: 5 },
      [M.CHARACTER]: { cycleTime: 7.5 },
      [M.ASSEMBLER_I]: { cycleTime: 7.5 },
    },
  },
  "Logistic Container III": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 25 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 4 }, { item: I.CIRCUIT_BOARD, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666667 },
      [M.CHARACTER]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
    },
  },
  "Xeno-Logistics Tower": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.MACHINERY_PARTS, amount: 10 }, { item: I.ELECTRONIC_COMPONENTS, amount: 10 }, { item: I.XENO_SCRAP, amount: 5 }, { item: I.XENO_CRYSTAL, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 4 },
      [M.CHARACTER]: { cycleTime: 6 },
      [M.ASSEMBLER_I]: { cycleTime: 6 },
    },
  },
  "Ore Vein Miner": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 10 }, { item: I.MACHINERY_PARTS, amount: 10 }, { item: I.ELECTRONIC_COMPONENTS, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333333 },
      [M.CHARACTER]: { cycleTime: 8 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
    },
  },
  "Xeno-Logistics Container": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.MACHINERY_PARTS, amount: 10 }, { item: I.ELECTRONIC_COMPONENTS, amount: 10 }, { item: I.XENO_SCRAP, amount: 5 }, { item: I.XENO_CRYSTAL, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 3 },
      [M.ASSEMBLER_II]: { cycleTime: 4 },
      [M.CHARACTER]: { cycleTime: 6 },
      [M.ASSEMBLER_I]: { cycleTime: 6 },
    },
  },
  "Pipe": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 2 }],
    output: { amount: 2 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2 },
      [M.ASSEMBLER_II]: { cycleTime: 2.666667 },
      [M.CHARACTER]: { cycleTime: 4 },
      [M.ASSEMBLER_I]: { cycleTime: 4 },
    },
  },
  "Pipe Adapter": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 6 }],
    output: { amount: 1 },
    machines: {
      [M.CHARACTER]: { cycleTime: 4 },
    },
  },
  "Liquid Intake": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.PIPE, amount: 1 }, { item: I.MACHINERY_PARTS, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Pipeline": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 8 }],
    output: { amount: 2 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2 },
      [M.ASSEMBLER_II]: { cycleTime: 2.666667 },
      [M.CHARACTER]: { cycleTime: 4 },
      [M.ASSEMBLER_I]: { cycleTime: 4 },
    },
  },
  "Liquid Intake (Pipeline)": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.PIPELINE, amount: 1 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Power Pole (Small)": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 10 }, { item: I.ELECTRONIC_COMPONENTS, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Power Pole (Large)": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 10 }, { item: I.ELECTRONIC_COMPONENTS, amount: 5 }, { item: I.POLYMER_BOARD, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Power Pole (Wall-Mounted)": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 4 }, { item: I.ELECTRONIC_COMPONENTS, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Pipe-to-Pipeline Pump": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 6 }, { item: I.MACHINERY_PARTS, amount: 5 }, { item: I.ELECTRONIC_COMPONENTS, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Pipeline-to-Pipe Pump": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 6 }, { item: I.MACHINERY_PARTS, amount: 5 }, { item: I.ELECTRONIC_COMPONENTS, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Pump (Pipelines)": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 6 }, { item: I.MACHINERY_PARTS, amount: 5 }, { item: I.ELECTRONIC_COMPONENTS, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Pumpjack I": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 12 }, { item: I.PIPE, amount: 8 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 5 }, { item: I.ELECTRONIC_COMPONENTS, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333333 },
      [M.CHARACTER]: { cycleTime: 8 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
    },
  },
  "Pump (Pipes)": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 6 }, { item: I.MACHINERY_PARTS, amount: 5 }, { item: I.ELECTRONIC_COMPONENTS, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Quarry": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 30 }, { item: I.MACHINERY_PARTS, amount: 20 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 20 }, { item: I.ELECTRONIC_COMPONENTS, amount: 10 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Train Tracks": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 0.75 },
      [M.ASSEMBLER_II]: { cycleTime: 1 },
      [M.CHARACTER]: { cycleTime: 1.5 },
      [M.ASSEMBLER_I]: { cycleTime: 1.5 },
    },
  },
  "Scrap Recycler": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 20 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 10 }, { item: I.ELECTRONIC_COMPONENTS, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333333 },
      [M.CHARACTER]: { cycleTime: 8 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
    },
  },
  "Resource Separator": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 20 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 10 }, { item: I.ELECTRONIC_COMPONENTS, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333333 },
      [M.CHARACTER]: { cycleTime: 8 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
    },
  },
  "Research Server": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 20 }, { item: I.ELECTRONIC_COMPONENTS, amount: 10 }, { item: I.TECHNUM_RODS, amount: 20 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2 },
      [M.ASSEMBLER_II]: { cycleTime: 2.666667 },
      [M.CHARACTER]: { cycleTime: 4 },
      [M.ASSEMBLER_I]: { cycleTime: 4 },
    },
  },
  "Shipping Pad (Small)": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 50 }, { item: I.MACHINERY_PARTS, amount: 10 }, { item: I.ELECTRONIC_COMPONENTS, amount: 5 }, { item: I.EMERGENCY_BEACON, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.CHARACTER]: { cycleTime: 15 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Shipping Pad (Medium)": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 100 }, { item: I.CONCRETE, amount: 100 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 50 }, { item: I.ELECTRONIC_COMPONENTS, amount: 50 }, { item: I.EMERGENCY_BEACON, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.CHARACTER]: { cycleTime: 30 },
      [M.ASSEMBLER_I]: { cycleTime: 30 },
    },
  },
  "Shipping Pad (Medium, Assembly Line)": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 100 }, { item: I.CONCRETE, amount: 100 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 50 }, { item: I.ELECTRONIC_COMPONENTS, amount: 50 }, { item: I.EMERGENCY_BEACON, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 15 },
      [M.ASSEMBLER_II]: { cycleTime: 20 },
      [M.CHARACTER]: { cycleTime: 30 },
      [M.ASSEMBLER_I]: { cycleTime: 30 },
    },
  },
  "Advanced Smelter": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 15 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 5 }, { item: I.CIRCUIT_BOARD, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666667 },
      [M.CHARACTER]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
    },
  },
  "Lava-Smelter I": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 10 }, { item: I.FIRMARLITE_BAR, amount: 10 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 5 }, { item: I.ELECTRONIC_COMPONENTS, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666667 },
      [M.CHARACTER]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
    },
  },
  "Lava-Smelter II": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.LAVA_SMELTER_I, amount: 1 }, { item: I.FIRMARLITE_SHEET, amount: 50 }, { item: I.CIRCUIT_BOARD, amount: 15 }, { item: I.ENERGY_CELL, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 7.5 },
      [M.ASSEMBLER_II]: { cycleTime: 10 },
      [M.CHARACTER]: { cycleTime: 15 },
      [M.ASSEMBLER_I]: { cycleTime: 15 },
    },
  },
  "Smelter (Small)": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 10 }, { item: I.MACHINERY_PARTS, amount: 4 }, { item: I.ELECTRONIC_COMPONENTS, amount: 4 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666667 },
      [M.CHARACTER]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
    },
  },
  "Solar Panel (Small)": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 10 }, { item: I.ELECTRONIC_COMPONENTS, amount: 10 }, { item: I.GLASS, amount: 10 }, { item: I.ENERGY_CELL, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333333 },
      [M.CHARACTER]: { cycleTime: 8 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
    },
  },
  "Solar Panel (Large)": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 30 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 5 }, { item: I.CIRCUIT_BOARD, amount: 10 }, { item: I.ENERGY_CELL, amount: 10 }, { item: I.GLASS, amount: 10 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666667 },
      [M.CHARACTER]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
    },
  },
  "Space Station Terminal": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 4 }, { item: I.ELECTRONIC_COMPONENTS, amount: 2 }, { item: I.EMERGENCY_BEACON, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Stairs": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 0.75 },
      [M.ASSEMBLER_II]: { cycleTime: 1 },
      [M.CHARACTER]: { cycleTime: 1.5 },
      [M.ASSEMBLER_I]: { cycleTime: 1.5 },
    },
  },
  "Tank I": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 10 }, { item: I.STEEL_BEAMS, amount: 20 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Train Signal": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 1 }, { item: I.ELECTRONIC_COMPONENTS, amount: 1 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1 },
      [M.ASSEMBLER_II]: { cycleTime: 1.333333 },
      [M.CHARACTER]: { cycleTime: 2 },
      [M.ASSEMBLER_I]: { cycleTime: 2 },
    },
  },
  "Train Engine": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 15 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 25 }, { item: I.ELECTRONIC_COMPONENTS, amount: 25 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666667 },
      [M.CHARACTER]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
    },
  },
  "Train Loading Station": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 30 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 15 }, { item: I.ELECTRONIC_COMPONENTS, amount: 10 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Train Station": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 30 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 5 }, { item: I.ELECTRONIC_COMPONENTS, amount: 10 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Train Tanker Wagon": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 15 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Train Cargo Wagon": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 15 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 5 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Transformer (Small)": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 15 }, { item: I.ELECTRONIC_COMPONENTS, amount: 10 }, { item: I.TECHNUM_RODS, amount: 15 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Transformer (Large)": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 25 }, { item: I.ELECTRONIC_COMPONENTS, amount: 10 }, { item: I.CIRCUIT_BOARD, amount: 10 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 5 },
      [M.ASSEMBLER_II]: { cycleTime: 6.666667 },
      [M.CHARACTER]: { cycleTime: 10 },
      [M.ASSEMBLER_I]: { cycleTime: 10 },
    },
  },
  "Transport Ship Port": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.STEEL_BEAMS, amount: 400 }, { item: I.ADVANCED_MACHINERY_PARTS, amount: 200 }, { item: I.CIRCUIT_BOARD, amount: 100 }, { item: I.ENERGY_CELL, amount: 40 }, { item: I.POLYMER_BOARD, amount: 200 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 6 },
      [M.ASSEMBLER_II]: { cycleTime: 8 },
      [M.CHARACTER]: { cycleTime: 12 },
      [M.ASSEMBLER_I]: { cycleTime: 12 },
    },
  },
  "Steam Turbine": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.PIPE, amount: 10 }, { item: I.MACHINERY_PARTS, amount: 40 }, { item: I.STEEL_BEAMS, amount: 25 }, { item: I.ELECTRONIC_COMPONENTS, amount: 25 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333333 },
      [M.CHARACTER]: { cycleTime: 8 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
    },
  },
  "Walkway": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 3 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 0.75 },
      [M.ASSEMBLER_II]: { cycleTime: 1 },
      [M.CHARACTER]: { cycleTime: 1.5 },
      [M.ASSEMBLER_I]: { cycleTime: 1.5 },
    },
  },
  "Robot Workstation I": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 10 }, { item: I.ELECTRONIC_COMPONENTS, amount: 10 }, { item: I.GLASS, amount: 2 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 1.5 },
      [M.ASSEMBLER_II]: { cycleTime: 2 },
      [M.CHARACTER]: { cycleTime: 3 },
      [M.ASSEMBLER_I]: { cycleTime: 3 },
    },
  },
  "Robot Workstation II": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 25 }, { item: I.ELECTRONIC_COMPONENTS, amount: 20 }, { item: I.CIRCUIT_BOARD, amount: 10 }, { item: I.GLASS, amount: 4 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 2.5 },
      [M.ASSEMBLER_II]: { cycleTime: 3.333333 },
      [M.CHARACTER]: { cycleTime: 5 },
      [M.ASSEMBLER_I]: { cycleTime: 5 },
    },
  },
  "Robot Workstation III": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.XENOFERRITE_PLATES, amount: 50 }, { item: I.CIRCUIT_BOARD, amount: 15 }, { item: I.CPU, amount: 3 }, { item: I.GLASS, amount: 6 }],
    output: { amount: 1 },
    machines: {
      [M.ASSEMBLER_III]: { cycleTime: 4 },
      [M.ASSEMBLER_II]: { cycleTime: 5.333333 },
      [M.CHARACTER]: { cycleTime: 8 },
      [M.ASSEMBLER_I]: { cycleTime: 8 },
    },
  },
  "Air": {
    category: CAT.STRUCTURES,
    ingredients: [],
    output: { amount: 27000 },
    machines: {
      [M.AIR_INTAKE_BASE]: { cycleTime: 60 },
    },
  },
  "Hot Air": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.AIR, amount: 54000 }],
    output: { amount: 54000 },
    machines: {
      [M.HOT_AIR_STOVE_BASE]: { cycleTime: 60 },
    },
  },
  "High-Pressure Steam": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.ENERGIZED_REACTOR_COMPOUND, amount: 180000 }, { item: I.WATER, amount: 90000 }],
    output: [{ item: I.HIGH_PRESSURE_STEAM, amount: 360000 }, { item: I.DEPLETED_REACTOR_COMPOUND, amount: 180000 }],
    machines: {
      [M.STEAM_GENERATOR_BASE]: { cycleTime: 60 },
    },
  },
  "Crude Olumite": {
    category: CAT.STRUCTURES,
    ingredients: [],
    output: { amount: 30 },
    machines: {
      [M.PUMPJACK_I]: { cycleTime: 1 },
    },
  },
  "Energized Reactor Compound": {
    category: CAT.STRUCTURES,
    ingredients: [{ item: I.REACTOR_FUEL_MIX, amount: 43200 }, { item: I.DEPLETED_REACTOR_COMPOUND, amount: 180000 }],
    output: { amount: 180000 },
    machines: {
      [M.XENO_REACTOR_BASE]: { cycleTime: 60 },
    },
  },
};