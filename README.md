# Foundry Calculator

A browser-based production and material calculator for the game [Foundry](https://store.steampowered.com/app/983870/Foundry/).

**Live:** https://missingdll.github.io/foundry-calc/

---

## Features

- **Bot & Drone Planner** — Select bots and drones, set a production target (items/min), and instantly see how many machines you need
- **Recipe Calculator** — Search or browse the full recipe list, add multiple recipes, and calculate combined material requirements
- **Production Overview** — Summary of total machines, overall production rate, and overproduction per recipe
- **Raw Material Breakdown** — Shows direct material demand per minute and the base mineable resources needed
- **Machine Settings** — Configure productivity bonuses for miners and fluid extractors, choose machine variants (e.g. Smelter vs. Advanced Smelter)

## Usage

No installation required. Open [the calculator](https://missingdll.github.io/foundry-calc/) in any modern browser.

1. Switch between **Bots** and **Recipes** in the sidebar
2. Set your production goal and select the bots/recipes you want to use
3. Click **Calculate** to see the results

## Development

The entire app is a single self-contained `index.html` file with no build step or external dependencies (except Google Fonts).

To run locally just open the file in a browser:

```bash
# Clone the repo
git clone https://github.com/MissingDLL/foundry-calc.git

# Open in browser
xdg-open foundry-calc/index.html   # Linux
open foundry-calc/index.html        # macOS
```
