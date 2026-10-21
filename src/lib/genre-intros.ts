/**
 * Unique intro copy for /genre/[slug] directory pages.
 * Pages are only generated for tags that appear on ≥10 catalog games
 * and have an entry here.
 */
export const GENRE_PAGE_INTROS: Record<
  string,
  { name: string; description: string }
> = {
  survival: {
    name: "Survival",
    description:
      "Open-world survival, crafting, and base-building Steam Early Access games tracked for patch frequency and abandonment risk.",
  },
  strategy: {
    name: "Strategy & City Builder",
    description:
      "4X, RTS, grand strategy, and colony/city builders in Steam Early Access.",
  },
  rpg: {
    name: "RPG & Action RPG",
    description:
      "Role-playing games, dungeon crawlers, and ARPGs currently or formerly in Steam Early Access.",
  },
  simulation: {
    name: "Simulation & Sandbox",
    description:
      "Physics sandboxes, management sims, and vehicle/space simulators in Steam Early Access.",
  },
  action: {
    name: "Action & Roguelite",
    description:
      "Co-op shooters, roguelites, and tactical action titles in Steam Early Access.",
  },
  space: {
    name: "Space & Sci-Fi",
    description:
      "Space exploration, orbital colony sims, and fleet combat games in Steam Early Access.",
  },
  adventure: {
    name: "Adventure",
    description:
      "Story-driven and exploration-focused Steam Early Access adventures audited for update cadence.",
  },
  indie: {
    name: "Indie",
    description:
      "Independent Steam Early Access titles — small studios where patch cadence is the make-or-break signal.",
  },
  "early-access": {
    name: "Early Access",
    description:
      "Every Steam Early Access title in our audit catalog, ranked by recent patches, posts, and build activity.",
  },
  "open-world": {
    name: "Open World",
    description:
      "Large sandbox worlds in Steam Early Access — we track whether the map keeps expanding or the build freezes.",
  },
  crafting: {
    name: "Crafting",
    description:
      "Gather, craft, and progress loops in Steam Early Access, scored by how often recipes and systems still ship.",
  },
  "base-building": {
    name: "Base Building",
    description:
      "Colony, outpost, and fortress builders in Early Access monitored for construction and balance patches.",
  },
  "co-op": {
    name: "Co-op",
    description:
      "Cooperative Early Access games where multiplayer stability patches matter as much as content drops.",
  },
  "online-co-op": {
    name: "Online Co-Op",
    description:
      "Online co-op Early Access titles tracked for netcode fixes, server patches, and shared-world updates.",
  },
  multiplayer: {
    name: "Multiplayer",
    description:
      "Multiplayer Steam Early Access games audited for whether live services keep shipping after launch hype.",
  },
  singleplayer: {
    name: "Singleplayer",
    description:
      "Primarily single-player Early Access games — progress is measured in campaign patches, not seasonal resets.",
  },
  sandbox: {
    name: "Sandbox",
    description:
      "Sandbox Early Access playgrounds where creative tools and world systems either keep growing or stall.",
  },
  "first-person": {
    name: "First-Person",
    description:
      "First-person Early Access games checked for camera, combat, and world-update cadence over time.",
  },
  "third-person": {
    name: "Third Person",
    description:
      "Third-person Early Access adventures monitored for animation, traversal, and content patch frequency.",
  },
  atmospheric: {
    name: "Atmospheric",
    description:
      "Mood-driven Early Access worlds — we watch whether ambience updates keep coming after the first trailer.",
  },
  exploration: {
    name: "Exploration",
    description:
      "Exploration-first Early Access games tracked for new biomes, points of interest, and traversal patches.",
  },
  horror: {
    name: "Horror",
    description:
      "Horror Early Access titles audited for scare-content drops, bug fixes, and long silent gaps.",
  },
  "sci-fi": {
    name: "Sci-Fi",
    description:
      "Science-fiction Early Access games — space stations, mechs, and future tech scored by update history.",
  },
  fantasy: {
    name: "Fantasy",
    description:
      "Fantasy Early Access RPGs and sandboxes checked for spell, quest, and world-building patch cadence.",
  },
  casual: {
    name: "Casual",
    description:
      "Casual Early Access games tracked for light progression updates versus quiet store pages.",
  },
  racing: {
    name: "Racing",
    description:
      "Racing and driving Early Access titles monitored for physics, track, and vehicle update frequency.",
  },
  sports: {
    name: "Sports",
    description:
      "Sports Early Access games audited for season patches, roster updates, and long inactivity windows.",
  },
  "massively-multiplayer": {
    name: "Massively Multiplayer",
    description:
      "MMO-style Early Access live services scored by whether servers and content seasons still ship.",
  },
  building: {
    name: "Building",
    description:
      "Construction-focused Early Access games tracked for new pieces, blueprints, and structural fixes.",
  },
  realistic: {
    name: "Realistic",
    description:
      "Simulation-leaning realistic Early Access titles checked for systems depth versus stalled patches.",
  },
  funny: {
    name: "Funny",
    description:
      "Comedy and chaotic-fun Early Access games — we still score them on real patch dates, not memes.",
  },
  moddable: {
    name: "Moddable",
    description:
      "Mod-friendly Early Access games where official patches and workshop support both matter.",
  },
  roguelike: {
    name: "Roguelike",
    description:
      "Roguelike Early Access runs audited for new biomes, enemies, and meta-progression patches.",
  },
  roguelite: {
    name: "Roguelite",
    description:
      "Roguelite Early Access titles tracked for run variety updates and balance hotfixes over time.",
  },
  fps: {
    name: "FPS",
    description:
      "First-person shooters in Early Access monitored for gunplay patches, maps, and netcode fixes.",
  },
  shooter: {
    name: "Shooter",
    description:
      "Shooter Early Access games scored by weapon, map, and multiplayer update frequency.",
  },
  pvp: {
    name: "PvP",
    description:
      "Player-versus-player Early Access titles where balance patches and anti-cheat updates are the signal.",
  },
  pve: {
    name: "PvE",
    description:
      "PvE Early Access co-op and missions tracked for encounter updates and post-launch content drops.",
  },
  management: {
    name: "Management",
    description:
      "Management and tycoon Early Access sims audited for economy patches and feature roadmap follow-through.",
  },
  "resource-management": {
    name: "Resource Management",
    description:
      "Resource-loop Early Access games checked for production-chain updates versus abandoned balance states.",
  },
  "city-builder": {
    name: "City Builder",
    description:
      "City and settlement builders in Early Access monitored for zoning, pathfinding, and civic-system patches.",
  },
  "colony-sim": {
    name: "Colony Sim",
    description:
      "Colony sims in Early Access tracked for colonist AI, needs systems, and long-term content cadence.",
  },
  zombies: {
    name: "Zombies",
    description:
      "Zombie survival Early Access games scored by horde, loot, and map update frequency.",
  },
  combat: {
    name: "Combat",
    description:
      "Combat-heavy Early Access games audited for fighting-system patches and encounter updates.",
  },
  "pixel-graphics": {
    name: "Pixel Graphics",
    description:
      "Pixel-art Early Access titles tracked for content expansions beyond the initial art pass.",
  },
  "2d": {
    name: "2D",
    description:
      "2D Early Access games monitored for level, combat, and system patches after the first vertical slice.",
  },
  "3d": {
    name: "3D",
    description:
      "3D Early Access worlds checked for asset, performance, and content update cadence.",
  },
  "free-to-play": {
    name: "Free to Play",
    description:
      "Free-to-play Early Access titles audited for live-ops patches versus monetization-only store silence.",
  },
  vr: {
    name: "VR",
    description:
      "VR Early Access experiences tracked for comfort fixes, locomotion patches, and content drops.",
  },
  procedural: {
    name: "Procedural Generation",
    description:
      "Procedurally generated Early Access worlds scored by generator updates and new seed variety.",
  },
  "procedural-generation": {
    name: "Procedural Generation",
    description:
      "Proc-gen Early Access games monitored for map algorithm changes and content variety patches.",
  },
  difficult: {
    name: "Difficult",
    description:
      "High-difficulty Early Access games tracked for balance hotfixes and fairness patches over time.",
  },
  "story-rich": {
    name: "Story Rich",
    description:
      "Narrative Early Access games audited for chapter drops, dialogue patches, and unfinished act gaps.",
  },
  medieval: {
    name: "Medieval",
    description:
      "Medieval Early Access strategy and RPG settings checked for castle, army, and kingdom-system updates.",
  },
  "post-apocalyptic": {
    name: "Post-apocalyptic",
    description:
      "Post-apocalyptic Early Access sandboxes scored by world, loot, and faction update frequency.",
  },
  farming: {
    name: "Farming",
    description:
      "Farming and rural-life Early Access sims tracked for crop, animal, and seasonal content patches.",
  },
  "farming-sim": {
    name: "Farming Sim",
    description:
      "Farming sims in Early Access monitored for homestead systems and whether seasons keep shipping.",
  },
  automation: {
    name: "Automation",
    description:
      "Factory and automation Early Access games audited for logistics patches and machine-tier updates.",
  },
  mining: {
    name: "Mining",
    description:
      "Mining and extraction Early Access games tracked for vein, tool, and underground-content updates.",
  },
  "loot": {
    name: "Loot",
    description:
      "Loot-driven Early Access games scored by drop-table patches and endgame gear updates.",
  },
  "character-customization": {
    name: "Character Customization",
    description:
      "Avatar-heavy Early Access titles checked for cosmetics systems versus core gameplay patch cadence.",
  },
  "great-soundtrack": {
    name: "Great Soundtrack",
    description:
      "Music-forward Early Access games — we still judge them by code patches, not playlist length.",
  },
  controller: {
    name: "Controller",
    description:
      "Controller-supported Early Access games tracked for input fixes alongside content updates.",
  },
  colorful: {
    name: "Colorful",
    description:
      "Visually vibrant Early Access games audited for whether gameplay systems keep pace with the art.",
  },
  cute: {
    name: "Cute",
    description:
      "Cute-aesthetic Early Access titles scored by cozy-content drops and long-term maintenance.",
  },
  relaxing: {
    name: "Relaxing",
    description:
      "Low-stress Early Access games monitored for gentle feature updates versus abandoned quietude.",
  },
  cozy: {
    name: "Cozy",
    description:
      "Cozy Early Access experiences tracked for lifestyle-system patches and seasonal content.",
  },
  tactical: {
    name: "Tactical",
    description:
      "Tactical Early Access combat games audited for mission packs, AI, and balance patch history.",
  },
  "turn-based": {
    name: "Turn-Based",
    description:
      "Turn-based Early Access strategy and RPG titles checked for campaign and systems update cadence.",
  },
  "turn-based-strategy": {
    name: "Turn-Based Strategy",
    description:
      "Turn-based strategy Early Access games monitored for map, faction, and diplomacy patches.",
  },
  "action-rpg": {
    name: "Action RPG",
    description:
      "Action RPG Early Access titles scored by skill-tree, loot, and dungeon update frequency.",
  },
  "action-roguelike": {
    name: "Action Roguelike",
    description:
      "Action-roguelike Early Access runs audited for biome packs, builds, and meta-progression patches.",
  },
  "action-adventure": {
    name: "Action-Adventure",
    description:
      "Action-adventure Early Access games tracked for traversal, combat, and story-content patches.",
  },
  "artificial-intelligence": {
    name: "Artificial Intelligence",
    description:
      "AI-tagged Early Access games monitored for companion, enemy, and simulation-intelligence updates.",
  },
  science: {
    name: "Science",
    description:
      "Science-themed Early Access titles scored by research systems and lab-content patch cadence.",
  },
  platformer: {
    name: "Platformer",
    description:
      "Platformer Early Access games audited for level packs, movement tech, and polish hotfixes.",
  },
  puzzle: {
    name: "Puzzle",
    description:
      "Puzzle Early Access titles monitored for new puzzle packs and quality-of-life patch cadence.",
  },
  stealth: {
    name: "Stealth",
    description:
      "Stealth Early Access games scored by AI, mission, and detection-system update history.",
  },
  "open-world-survival-craft": {
    name: "Open World Survival Craft",
    description:
      "Open-world survival-craft Early Access staples tracked for biome, craft tree, and base patches.",
  },
  physics: {
    name: "Physics",
    description:
      "Physics-sandbox Early Access games audited for simulation fixes and creative-tool updates.",
  },
  vehicles: {
    name: "Vehicles",
    description:
      "Vehicle-focused Early Access titles checked for handling patches and new machine content.",
  },
  "vehicular-combat": {
    name: "Vehicular Combat",
    description:
      "Vehicular combat Early Access games monitored for weapon, map, and physics update cadence.",
  },
  "automobile-sim": {
    name: "Automobile Sim",
    description:
      "Driving sims in Early Access tracked for handling models, tracks, and car-pack update frequency.",
  },
  economy: {
    name: "Economy",
    description:
      "Economy-driven Early Access sims scored by market, trade, and balance patch follow-through.",
  },
  war: {
    name: "War",
    description:
      "War-themed Early Access games audited for faction, battle, and campaign content cadence.",
  },
  military: {
    name: "Military",
    description:
      "Military Early Access shooters and sims tracked for kit, map, and realism-system patches.",
  },
  aliens: {
    name: "Aliens",
    description:
      "Alien-invasion and xeno Early Access games monitored for creature, map, and combat updates.",
  },
  robots: {
    name: "Robots",
    description:
      "Robot and mech Early Access titles scored by chassis, AI, and factory-system patch history.",
  },
  cyberpunk: {
    name: "Cyberpunk",
    description:
      "Cyberpunk Early Access worlds checked for district, quest, and neon-future system updates.",
  },
  "dark-fantasy": {
    name: "Dark Fantasy",
    description:
      "Dark fantasy Early Access games audited for bleak-world content drops and combat patches.",
  },
  "souls-like": {
    name: "Souls-like",
    description:
      "Souls-like Early Access titles tracked for boss, area, and difficulty-balance update cadence.",
  },
  "hack-and-slash": {
    name: "Hack and Slash",
    description:
      "Hack-and-slash Early Access ARPGs scored by skill, loot, and horde-content patch frequency.",
  },
  "loot-shooter": {
    name: "Looter Shooter",
    description:
      "Looter-shooter Early Access games monitored for seasonal loot, maps, and build-crafting patches.",
  },
  "extraction-shooter": {
    name: "Extraction Shooter",
    description:
      "Extraction shooter Early Access titles audited for raid, stash, and wipe-related update history.",
  },
  "battle-royale": {
    name: "Battle Royale",
    description:
      "Battle royale Early Access games scored by map, weapon, and ranked-season patch cadence.",
  },
  mmorpg: {
    name: "MMORPG",
    description:
      "MMORPG Early Access worlds tracked for expansion patches, class balance, and server maintenance signals.",
  },
  "life-sim": {
    name: "Life Sim",
    description:
      "Life-sim Early Access games audited for NPC, career, and household-system update frequency.",
  },
  "immersive-sim": {
    name: "Immersive Sim",
    description:
      "Immersive-sim Early Access titles checked for systemic interaction patches and emergent-tool updates.",
  },
  "top-down": {
    name: "Top-Down",
    description:
      "Top-down Early Access games monitored for camera-friendly content packs and systems patches.",
  },
  isometric: {
    name: "Isometric",
    description:
      "Isometric Early Access RPGs and tactics games scored by campaign and systems update cadence.",
  },
  "local-multiplayer": {
    name: "Local Multiplayer",
    description:
      "Local multiplayer Early Access games tracked for couch-co-op fixes and shared-screen updates.",
  },
  "local-co-op": {
    name: "Local Co-Op",
    description:
      "Local co-op Early Access titles audited for split-screen patches and party-play content drops.",
  },
  "team-based": {
    name: "Team-Based",
    description:
      "Team-based Early Access multiplayer games scored by mode, map, and balance patch history.",
  },
  competitive: {
    name: "Competitive",
    description:
      "Competitive Early Access titles monitored for ranked balance patches and anti-cheat updates.",
  },
  "character-action-game": {
    name: "Character Action Game",
    description:
      "Stylish character-action Early Access games tracked for combo, boss, and mission update cadence.",
  },
  "third-person-shooter": {
    name: "Third-Person Shooter",
    description:
      "Third-person shooter Early Access games audited for gunplay, cover, and map patch frequency.",
  },
  "survival-horror": {
    name: "Survival Horror",
    description:
      "Survival-horror Early Access titles scored by scare content, resource tension, and fix cadence.",
  },
  psychological: {
    name: "Psychological",
    description:
      "Psychological Early Access experiences monitored for narrative drops and atmosphere-system patches.",
  },
  "psychological-horror": {
    name: "Psychological Horror",
    description:
      "Psychological horror Early Access games tracked for story beats and unsettling-system updates.",
  },
  mystery: {
    name: "Mystery",
    description:
      "Mystery Early Access games audited for clue, case, and investigation-content patch history.",
  },
  investigation: {
    name: "Investigation",
    description:
      "Investigation Early Access titles scored by case packs, deduction tools, and narrative updates.",
  },
  "choices-matter": {
    name: "Choices Matter",
    description:
      "Choice-driven Early Access narratives checked for branching-content drops and ending patches.",
  },
  nonlinear: {
    name: "Nonlinear",
    description:
      "Nonlinear Early Access stories monitored for path variety updates and unfinished-branch gaps.",
  },
  "multiple-endings": {
    name: "Multiple Endings",
    description:
      "Multiple-ending Early Access games tracked for finale content and choice-consequence patches.",
  },
  replay: {
    name: "Replay Value",
    description:
      "High-replay Early Access games scored by new modes, seeds, and meta updates after launch.",
  },
  "replay-value": {
    name: "Replay Value",
    description:
      "Replay-focused Early Access titles audited for fresh-run content and long-term mode patches.",
  },
  "perma-death": {
    name: "Perma Death",
    description:
      "Permadeath Early Access runs monitored for fairness hotfixes and new failure-state content.",
  },
  "inventory-management": {
    name: "Inventory Management",
    description:
      "Inventory-puzzle Early Access games tracked for stash, weight, and logistics-system updates.",
  },
  god: {
    name: "God Game",
    description:
      "God-game Early Access sandboxes scored by deity powers, follower systems, and world patches.",
  },
  "god-game": {
    name: "God Game",
    description:
      "God games in Early Access audited for divine-tool updates and sandbox-system patch cadence.",
  },
  "grand-strategy": {
    name: "Grand Strategy",
    description:
      "Grand strategy Early Access titles tracked for diplomacy, war, and map DLC-style patch history.",
  },
  "4x": {
    name: "4X",
    description:
      "4X Early Access empires monitored for tech-tree, faction, and late-game balance updates.",
  },
  rts: {
    name: "RTS",
    description:
      "Real-time strategy Early Access games scored by unit, map, and multiplayer balance patches.",
  },
  "real-time-tactics": {
    name: "Real Time Tactics",
    description:
      "Real-time tactics Early Access titles audited for mission packs and squad-system updates.",
  },
  "tower-defense": {
    name: "Tower Defense",
    description:
      "Tower defense Early Access games tracked for tower kits, maps, and wave-balance patch cadence.",
  },
  "card-game": {
    name: "Card Game",
    description:
      "Card-game Early Access titles monitored for deck, balance, and expansion-pack update frequency.",
  },
  deckbuilding: {
    name: "Deckbuilding",
    description:
      "Deckbuilding Early Access games scored by card pool expansions and meta-balance patches.",
  },
  "roguelike-deckbuilder": {
    name: "Roguelike Deckbuilder",
    description:
      "Roguelike deckbuilders in Early Access audited for act, relic, and card-pool update cadence.",
  },
  "dungeon-crawler": {
    name: "Dungeon Crawler",
    description:
      "Dungeon-crawler Early Access games tracked for floor generation, loot, and party-system patches.",
  },
  crpg: {
    name: "CRPG",
    description:
      "CRPG Early Access titles scored by companion, quest, and reactivity patch follow-through.",
  },
  jrpg: {
    name: "JRPG",
    description:
      "JRPG-style Early Access games monitored for party, story, and turn-battle content updates.",
  },
  "party-based-rpg": {
    name: "Party-Based RPG",
    description:
      "Party-based RPG Early Access titles audited for companion, formation, and quest patch cadence.",
  },
  "tactical-rpg": {
    name: "Tactical RPG",
    description:
      "Tactical RPG Early Access games tracked for grid combat, class, and campaign update frequency.",
  },
  "strategy-rpg": {
    name: "Strategy RPG",
    description:
      "Strategy RPG Early Access titles scored by map, unit, and story-chapter patch history.",
  },
  metroidvania: {
    name: "Metroidvania",
    description:
      "Metroidvania Early Access games monitored for map expansions, abilities, and backtracking content.",
  },
  "side-scroller": {
    name: "Side Scroller",
    description:
      "Side-scrolling Early Access titles audited for level packs and movement-tech patch cadence.",
  },
  "bullet-hell": {
    name: "Bullet Hell",
    description:
      "Bullet-hell Early Access shooters tracked for pattern packs, ships, and difficulty updates.",
  },
  arcade: {
    name: "Arcade",
    description:
      "Arcade-style Early Access games scored by score-attack modes and bite-sized content patches.",
  },
  retro: {
    name: "Retro",
    description:
      "Retro-inspired Early Access titles monitored for classic-feel content drops and polish fixes.",
  },
  "old-school": {
    name: "Old School",
    description:
      "Old-school Early Access games audited for classic-systems updates versus nostalgia-only silence.",
  },
  stylized: {
    name: "Stylized",
    description:
      "Stylized-art Early Access games scored by whether systems patches match the visual ambition.",
  },
  cartoon: {
    name: "Cartoon",
    description:
      "Cartoon-styled Early Access titles monitored for content updates behind the playful presentation.",
  },
  cartoony: {
    name: "Cartoony",
    description:
      "Cartoony Early Access games audited for feature cadence beneath the bright art direction.",
  },
  anime: {
    name: "Anime",
    description:
      "Anime-styled Early Access games tracked for story, combat, and character-content patch history.",
  },
  "female-protagonist": {
    name: "Female Protagonist",
    description:
      "Early Access games led by female protagonists — still judged strictly by update evidence.",
  },
  violent: {
    name: "Violent",
    description:
      "Violent Early Access titles audited for combat-system patches and content drops over time.",
  },
  gore: {
    name: "Gore",
    description:
      "Gore-heavy Early Access games scored by combat feedback updates and long-term patch support.",
  },
  dark: {
    name: "Dark",
    description:
      "Dark-toned Early Access worlds monitored for narrative and systems updates after the mood pitch.",
  },
  comedy: {
    name: "Comedy",
    description:
      "Comedy Early Access games tracked for joke-content drops and whether the build still ships.",
  },
  "dark-humor": {
    name: "Dark Humor",
    description:
      "Dark-humor Early Access titles audited for writing updates and systems patch follow-through.",
  },
  memes: {
    name: "Memes",
    description:
      "Meme-forward Early Access games — entertainment value aside, we still count real Steam patches.",
  },
  "family-friendly": {
    name: "Family Friendly",
    description:
      "Family-friendly Early Access games monitored for kid-safe content packs and stability fixes.",
  },
  wholesome: {
    name: "Wholesome",
    description:
      "Wholesome Early Access experiences scored by cozy-feature updates and long-term care signals.",
  },
  nature: {
    name: "Nature",
    description:
      "Nature-focused Early Access games tracked for biome, wildlife, and outdoor-system patches.",
  },
  animals: {
    name: "Animals",
    description:
      "Animal-centric Early Access titles audited for creature behavior updates and content cadence.",
  },
  cats: {
    name: "Cats",
    description:
      "Cat-themed Early Access games monitored for feline-feature drops and ongoing patch support.",
  },
  dogs: {
    name: "Dogs",
    description:
      "Dog-themed Early Access titles scored by companion systems and post-launch update frequency.",
  },
  dragons: {
    name: "Dragons",
    description:
      "Dragon-filled Early Access worlds tracked for mount, boss, and fantasy-content patch history.",
  },
  magic: {
    name: "Magic",
    description:
      "Magic-system Early Access games audited for spell trees, rituals, and balance update cadence.",
  },
  supernatural: {
    name: "Supernatural",
    description:
      "Supernatural Early Access titles monitored for occult content drops and encounter patches.",
  },
  demons: {
    name: "Demons",
    description:
      "Demon-themed Early Access games scored by infernal encounter updates and combat patches.",
  },
  vampires: {
    name: "Vampires",
    description:
      "Vampire Early Access titles tracked for blood-system, clan, and night-world content updates.",
  },
  lovecraftian: {
    name: "Lovecraftian",
    description:
      "Lovecraftian Early Access horror audited for cosmic-dread content and sanity-system patches.",
  },
  underwater: {
    name: "Underwater",
    description:
      "Underwater Early Access adventures monitored for depth zones, craft, and ocean-content updates.",
  },
  flight: {
    name: "Flight",
    description:
      "Flight Early Access sims and games scored by aircraft, map, and avionics patch frequency.",
  },
  naval: {
    name: "Naval",
    description:
      "Naval Early Access titles audited for ship systems, seas, and fleet-combat update cadence.",
  },
  trains: {
    name: "Trains",
    description:
      "Train and rail Early Access sims tracked for route, locomotive, and logistics-system patches.",
  },
  transportation: {
    name: "Transportation",
    description:
      "Transportation Early Access sims monitored for vehicle networks and logistics update history.",
  },
  cooking: {
    name: "Cooking",
    description:
      "Cooking Early Access games scored by recipe packs, kitchen systems, and service-loop patches.",
  },
  fishing: {
    name: "Fishing",
    description:
      "Fishing Early Access titles audited for waterways, catch tables, and outdoor-content updates.",
  },
  hunting: {
    name: "Hunting",
    description:
      "Hunting Early Access games tracked for animal AI, weapon, and reserve-map patch cadence.",
  },
  "level-editor": {
    name: "Level Editor",
    description:
      "Level-editor Early Access games audited for creator tools and workshop-support patch history.",
  },
  "class-based": {
    name: "Class-Based",
    description:
      "Class-based Early Access multiplayer games scored by role balance and kit update cadence.",
  },
  "gun-customization": {
    name: "Gun Customization",
    description:
      "Gun-customization Early Access shooters monitored for attachment trees and weapon-balance patches.",
  },
  parkour: {
    name: "Parkour",
    description:
      "Parkour Early Access games audited for movement tech, maps, and traversal-system updates.",
  },
  "fast-paced": {
    name: "Fast-Paced",
    description:
      "Fast-paced Early Access action titles tracked for feel-tuning hotfixes and mode content drops.",
  },
  destruction: {
    name: "Destruction",
    description:
      "Destruction-focused Early Access games scored by physics breakage updates and sandbox tools.",
  },
  voxel: {
    name: "Voxel",
    description:
      "Voxel Early Access worlds monitored for terrain tools, generation, and building-system patches.",
  },
  "space-sim": {
    name: "Space Sim",
    description:
      "Space-sim Early Access titles audited for ship systems, trade routes, and orbital-content updates.",
  },
  spaceships: {
    name: "Spaceships",
    description:
      "Spaceship Early Access games tracked for hull, module, and fleet-combat patch frequency.",
  },
  mechs: {
    name: "Mechs",
    description:
      "Mech Early Access titles scored by chassis kits, customization, and mission update cadence.",
  },
  futuristic: {
    name: "Futuristic",
    description:
      "Futuristic Early Access settings audited for tech-tree content and sci-fi systems updates.",
  },
  dystopian: {
    name: "Dystopian",
    description:
      "Dystopian Early Access worlds tracked for faction, quest, and oppressive-system patch history.",
  },
  historical: {
    name: "Historical",
    description:
      "Historical Early Access games scored by period content packs and authenticity-system updates.",
  },
  "alternate-history": {
    name: "Alternate History",
    description:
      "Alternate-history Early Access titles monitored for timeline branches and faction-content patches.",
  },
  "world-war-ii": {
    name: "World War II",
    description:
      "WWII Early Access games audited for theater maps, kit, and campaign update frequency.",
  },
  mythology: {
    name: "Mythology",
    description:
      "Mythology-inspired Early Access games tracked for pantheon content and legendary-encounter patches.",
  },
  pirates: {
    name: "Pirates",
    description:
      "Pirate Early Access adventures scored by ship combat, islands, and loot-route update cadence.",
  },
  western: {
    name: "Western",
    description:
      "Western Early Access titles monitored for frontier content, gunplay, and town-system patches.",
  },
  ninjas: {
    name: "Ninja",
    description:
      "Ninja Early Access games audited for stealth, combat, and clan-content update history.",
  },
  ninja: {
    name: "Ninja",
    description:
      "Ninja-themed Early Access titles tracked for stealth tools and mission pack patch cadence.",
  },
  samurai: {
    name: "Samurai",
    description:
      "Samurai Early Access games scored by duel systems, clan wars, and period-content updates.",
  },
  vikings: {
    name: "Vikings",
    description:
      "Viking Early Access worlds monitored for raid, craft, and Norse-myth content patch frequency.",
  },
  "sexual-content": {
    name: "Sexual Content",
    description:
      "Adult-tagged Early Access titles still measured by the same patch and announcement evidence rules.",
  },
  nudity: {
    name: "Nudity",
    description:
      "Nudity-tagged Early Access games audited with the same update-cadence methodology as the rest of the catalog.",
  },
  hentai: {
    name: "Hentai",
    description:
      "Hentai-tagged Early Access titles scored only on public Steam patch and announcement evidence.",
  },
  utilities: {
    name: "Utilities",
    description:
      "Utility-tagged Early Access apps monitored for feature drops — rarely games, but still timestamped.",
  },
  education: {
    name: "Education",
    description:
      "Education-tagged Early Access titles tracked for lesson-content updates and long-term maintenance.",
  },
  "game-development": {
    name: "Game Development",
    description:
      "Game-development Early Access tools audited for editor features and pipeline patch cadence.",
  },
  software: {
    name: "Software",
    description:
      "Software-tagged Early Access entries scored by release notes and whether builds still ship.",
  },
  tutorial: {
    name: "Tutorial",
    description:
      "Tutorial-heavy Early Access games monitored for onboarding fixes and first-hour content patches.",
  },
  short: {
    name: "Short",
    description:
      "Short-form Early Access experiences tracked for epilogue content and post-launch polish cadence.",
  },
  linear: {
    name: "Linear",
    description:
      "Linear Early Access campaigns audited for chapter drops and unfinished-act silence.",
  },
  cinematic: {
    name: "Cinematic",
    description:
      "Cinematic Early Access titles scored by cutscene content and narrative-system update frequency.",
  },
  narrative: {
    name: "Narrative",
    description:
      "Narrative-first Early Access games monitored for story chapter patches and dialogue updates.",
  },
  emotional: {
    name: "Emotional",
    description:
      "Emotionally driven Early Access stories tracked for character beats and ending-content cadence.",
  },
  philosophical: {
    name: "Philosophical",
    description:
      "Philosophical Early Access experiences audited for thematic content drops and systems patches.",
  },
  experimental: {
    name: "Experimental",
    description:
      "Experimental Early Access games scored by whether wild prototypes keep iterating in public builds.",
  },
  minimalist: {
    name: "Minimalist",
    description:
      "Minimalist Early Access titles monitored for focused feature updates beneath spare presentation.",
  },
  abstract: {
    name: "Abstract",
    description:
      "Abstract Early Access games tracked for mechanic experiments and post-launch design patches.",
  },
  surreal: {
    name: "Surreal",
    description:
      "Surreal Early Access worlds audited for dreamlike content drops and systems update cadence.",
  },
  psychedelic: {
    name: "Psychedelic",
    description:
      "Psychedelic Early Access titles scored by sensory-content updates and long-term patch support.",
  },
  immersive: {
    name: "Immersive",
    description:
      "Immersion-focused Early Access games monitored for presence systems and world-reactivity patches.",
  },
  addictive: {
    name: "Addictive",
    description:
      "Loop-driven Early Access games tracked for retention-feature updates and balance hotfixes.",
  },
  "score-attack": {
    name: "Score Attack",
    description:
      "Score-attack Early Access titles audited for leaderboard modes and challenge-pack update cadence.",
  },
  "time-management": {
    name: "Time Management",
    description:
      "Time-management Early Access games scored by shift, level, and service-loop content patches.",
  },
  idler: {
    name: "Idler",
    description:
      "Idle Early Access games monitored for prestige systems and offline-progress update frequency.",
  },
  incremental: {
    name: "Incremental",
    description:
      "Incremental Early Access titles tracked for prestige layers and number-go-up content cadence.",
  },
  "auto-battler": {
    name: "Auto Battler",
    description:
      "Auto-battler Early Access games audited for unit pools, seasons, and balance patch history.",
  },
  "hero-shooter": {
    name: "Hero Shooter",
    description:
      "Hero-shooter Early Access titles scored by roster, map, and ability-balance update cadence.",
  },
  "boomer-shooter": {
    name: "Boomer Shooter",
    description:
      "Boomer-shooter Early Access games monitored for level packs, weapon kits, and movement patches.",
  },
  "arena-shooter": {
    name: "Arena Shooter",
    description:
      "Arena-shooter Early Access titles tracked for map pools and competitive balance hotfixes.",
  },
  "twin-stick-shooter": {
    name: "Twin Stick Shooter",
    description:
      "Twin-stick shooter Early Access games scored by horde modes and weapon-mod update frequency.",
  },
  "top-down-shooter": {
    name: "Top-Down Shooter",
    description:
      "Top-down shooter Early Access titles audited for wave content and gunplay patch cadence.",
  },
  "shoot-em-up": {
    name: "Shoot 'Em Up",
    description:
      "Shoot 'em up Early Access games monitored for stage packs and ship-upgrade update history.",
  },
  fighting: {
    name: "Fighting",
    description:
      "Fighting-game Early Access titles tracked for roster, balance, and netcode patch frequency.",
  },
  "2d-fighter": {
    name: "2D Fighter",
    description:
      "2D fighter Early Access games scored by character kits and competitive balance updates.",
  },
  "3d-fighter": {
    name: "3D Fighter",
    description:
      "3D fighter Early Access titles audited for move lists, stages, and online-play patch cadence.",
  },
  "beat-em-up": {
    name: "Beat 'em up",
    description:
      "Beat 'em up Early Access games monitored for stage packs and co-op combat update frequency.",
  },
  swordplay: {
    name: "Swordplay",
    description:
      "Swordplay Early Access titles scored by melee-feel hotfixes and duel-content patch history.",
  },
  "martial-arts": {
    name: "Martial Arts",
    description:
      "Martial-arts Early Access games audited for stance systems and tournament-content updates.",
  },
  boxing: {
    name: "Boxing",
    description:
      "Boxing Early Access titles monitored for fighter kits, career modes, and physics patches.",
  },
  golf: {
    name: "Golf",
    description:
      "Golf Early Access games tracked for course packs and swing-physics update cadence.",
  },
  basketball: {
    name: "Basketball",
    description:
      "Basketball Early Access titles scored by season modes and gameplay-feel patch frequency.",
  },
  soccer: {
    name: "Football (Soccer)",
    description:
      "Soccer Early Access games audited for matchmaking, kits, and pitch-physics update history.",
  },
  "football-soccer": {
    name: "Football (Soccer)",
    description:
      "Football (soccer) Early Access titles monitored for career modes and match-feel patches.",
  },
  "football-american": {
    name: "Football (American)",
    description:
      "American football Early Access games tracked for playbooks, seasons, and physics updates.",
  },
  baseball: {
    name: "Baseball",
    description:
      "Baseball Early Access titles scored by diamond modes and batting/pitching patch cadence.",
  },
  hockey: {
    name: "Hockey",
    description:
      "Hockey Early Access games audited for rink modes and skating-physics update frequency.",
  },
  tennis: {
    name: "Tennis",
    description:
      "Tennis Early Access titles monitored for court packs and rally-feel patch history.",
  },
  skiing: {
    name: "Skiing",
    description:
      "Skiing Early Access games tracked for slope packs and snow-physics update cadence.",
  },
  snowboarding: {
    name: "Snowboarding",
    description:
      "Snowboarding Early Access titles scored by mountain content and board-feel patches.",
  },
  skateboarding: {
    name: "Skateboarding",
    description:
      "Skateboarding Early Access games audited for park packs and trick-system update frequency.",
  },
  skating: {
    name: "Skating",
    description:
      "Skating Early Access titles monitored for map drops and movement-tech patch cadence.",
  },
  bikes: {
    name: "Bikes",
    description:
      "Bike Early Access games tracked for track packs and vehicle-handling update history.",
  },
  motorbike: {
    name: "Motorbike",
    description:
      "Motorbike Early Access titles scored for courses, physics, and customization patch frequency.",
  },
  motocross: {
    name: "Motocross",
    description:
      "Motocross Early Access games audited for track content and dirt-bike handling updates.",
  },
  offroad: {
    name: "Offroad",
    description:
      "Offroad Early Access titles monitored for trail maps and vehicle-physics patch cadence.",
  },
  driving: {
    name: "Driving",
    description:
      "Driving Early Access games tracked for handling models, routes, and vehicle-content updates.",
  },
  "combat-racing": {
    name: "Combat Racing",
    description:
      "Combat-racing Early Access titles scored by weaponized tracks and vehicle-kit patch history.",
  },
  tanks: {
    name: "Tanks",
    description:
      "Tank Early Access games monitored for hull kits, maps, and armored-combat update frequency.",
  },
  submarine: {
    name: "Submarine",
    description:
      "Submarine Early Access titles tracked for deep-sea systems and naval-mission patch cadence.",
  },
  sailing: {
    name: "Sailing",
    description:
      "Sailing Early Access games scored by wind models, routes, and ship-content update history.",
  },
  "naval-combat": {
    name: "Naval Combat",
    description:
      "Naval-combat Early Access titles audited for fleet battles and ship-system patch frequency.",
  },
  capitalism: {
    name: "Capitalism",
    description:
      "Market-and-capital Early Access sims tracked for economy patches and tycoon-feature cadence.",
  },
  trading: {
    name: "Trading",
    description:
      "Trading Early Access games monitored for market routes, goods, and economy-balance updates.",
  },
  "shop-keeper": {
    name: "Shop Keeper",
    description:
      "Shopkeeper Early Access sims scored by inventory, customer, and storefront-system patches.",
  },
  decorating: {
    name: "Decorating",
    description:
      "Decorating Early Access games audited for furniture packs and housing-system update cadence.",
  },
  "hobby-sim": {
    name: "Hobby Sim",
    description:
      "Hobby-sim Early Access titles tracked for collection systems and lifestyle-content patches.",
  },
  "job-simulator": {
    name: "Job Simulator",
    description:
      "Job-sim Early Access games monitored for workplace scenarios and task-loop update frequency.",
  },
  "medical-sim": {
    name: "Medical Sim",
    description:
      "Medical-sim Early Access titles scored by procedure systems and hospital-content patch history.",
  },
  "outbreak-sim": {
    name: "Outbreak Sim",
    description:
      "Outbreak-sim Early Access games audited for pathogen systems and containment-content updates.",
  },
  "political-sim": {
    name: "Political Sim",
    description:
      "Political-sim Early Access titles tracked for policy systems and campaign-content patch cadence.",
  },
  diplomacy: {
    name: "Diplomacy",
    description:
      "Diplomacy-focused Early Access games monitored for negotiation systems and faction updates.",
  },
  crime: {
    name: "Crime",
    description:
      "Crime Early Access titles scored by heist content, heat systems, and underworld patch history.",
  },
  heist: {
    name: "Heist",
    description:
      "Heist Early Access games audited for mission packs and stealth-action update frequency.",
  },
  espionage: {
    name: "Espionage",
    description:
      "Espionage Early Access titles tracked for spy tools, missions, and intrigue-system patches.",
  },
  conspiracy: {
    name: "Conspiracy",
    description:
      "Conspiracy Early Access narratives monitored for clue drops and shadowy-faction content updates.",
  },
  detective: {
    name: "Detective",
    description:
      "Detective Early Access games scored by case files, evidence tools, and mystery-content cadence.",
  },
  thriller: {
    name: "Thriller",
    description:
      "Thriller Early Access titles audited for tension set pieces and story-chapter patch frequency.",
  },
  noir: {
    name: "Noir",
    description:
      "Noir Early Access mysteries tracked for case content and moody-world system updates.",
  },
  gothic: {
    name: "Gothic",
    description:
      "Gothic Early Access worlds monitored for haunted-content drops and dark-fantasy system patches.",
  },
  romance: {
    name: "Romance",
    description:
      "Romance Early Access games scored by route content and relationship-system update cadence.",
  },
  "dating-sim": {
    name: "Dating Sim",
    description:
      "Dating-sim Early Access titles audited for character routes and affection-system patch history.",
  },
  "visual-novel": {
    name: "Visual Novel",
    description:
      "Visual-novel Early Access stories tracked for chapter drops and route-completion update frequency.",
  },
  "interactive-fiction": {
    name: "Interactive Fiction",
    description:
      "Interactive-fiction Early Access works monitored for passage content and choice-system patches.",
  },
  "choose-your-own-adventure": {
    name: "Choose Your Own Adventure",
    description:
      "Choice-adventure Early Access titles scored for branching path content and ending patches.",
  },
  "text-based": {
    name: "Text-Based",
    description:
      "Text-based Early Access games audited for prose drops and parser/choice-system update cadence.",
  },
  "dialogue-heavy": {
    name: "Dialogue Heavy",
    description:
      "Dialogue-heavy Early Access titles tracked for conversation content and companion-voice updates.",
  },
  "lore-rich": {
    name: "Lore-Rich",
    description:
      "Lore-rich Early Access worlds monitored for codex entries and worldbuilding content cadence.",
  },
  "walking-simulator": {
    name: "Walking Simulator",
    description:
      "Walking-simulator Early Access experiences scored by narrative area drops and ambient updates.",
  },
  "hidden-object": {
    name: "Hidden Object",
    description:
      "Hidden-object Early Access games audited for scene packs and collectible-content patch frequency.",
  },
  "point-and-click": {
    name: "Point & Click",
    description:
      "Point-and-click Early Access adventures tracked for puzzle rooms and dialogue-content updates.",
  },
  "puzzle-platformer": {
    name: "Puzzle Platformer",
    description:
      "Puzzle-platformer Early Access titles scored by level packs and movement-puzzle patch cadence.",
  },
  "2d-platformer": {
    name: "2D Platformer",
    description:
      "2D platformer Early Access games monitored for stage content and precision-movement updates.",
  },
  "3d-platformer": {
    name: "3D Platformer",
    description:
      "3D platformer Early Access titles audited for world maps and collectathon-content patch history.",
  },
  "precision-platformer": {
    name: "Precision Platformer",
    description:
      "Precision-platformer Early Access games tracked for tough level packs and feel-tuning hotfixes.",
  },
  collectathon: {
    name: "Collectathon",
    description:
      "Collectathon Early Access titles scored by collectible packs and exploration-content updates.",
  },
  runner: {
    name: "Runner",
    description:
      "Runner Early Access games monitored for course packs and speed-loop update frequency.",
  },
  rhythm: {
    name: "Rhythm",
    description:
      "Rhythm Early Access titles audited for track packs and timing-feel patch cadence.",
  },
  music: {
    name: "Music",
    description:
      "Music-focused Early Access games tracked for song packs and audio-system update history.",
  },
  soundtrack: {
    name: "Soundtrack",
    description:
      "Soundtrack-forward Early Access titles — still judged by code patches, not album length alone.",
  },
  "electronic-music": {
    name: "Electronic Music",
    description:
      "Electronic-music Early Access games scored by track drops and synesthesia-system patches.",
  },
  "rock-music": {
    name: "Rock Music",
    description:
      "Rock-music Early Access titles monitored for song content and performance-mode update cadence.",
  },
  "8-bit-music": {
    name: "8-bit Music",
    description:
      "8-bit music Early Access games audited for chiptune packs and retro-audio feature updates.",
  },
  "instrumental-music": {
    name: "Instrumental Music",
    description:
      "Instrumental-music Early Access titles tracked for score drops and adaptive-audio patches.",
  },
  "music-based-procedural-generation": {
    name: "Music-Based Procedural Generation",
    description:
      "Music-driven proc-gen Early Access games scored by generator and audio-reactive content updates.",
  },
  fmv: {
    name: "FMV",
    description:
      "FMV Early Access titles monitored for filmed chapter drops and interactive-branch patches.",
  },
  "comic-book": {
    name: "Comic Book",
    description:
      "Comic-book Early Access games audited for panel content and superhero-system update cadence.",
  },
  superhero: {
    name: "Superhero",
    description:
      "Superhero Early Access titles tracked for power kits, villains, and open-city content patches.",
  },
  "spectacle-fighter": {
    name: "Spectacle fighter",
    description:
      "Spectacle-fighter Early Access games scored by combo showcases and mission-pack update frequency.",
  },
  musou: {
    name: "Musou",
    description:
      "Musou-style Early Access titles audited for battlefield maps and warrior-kit patch cadence.",
  },
  "action-rts": {
    name: "Action RTS",
    description:
      "Action-RTS Early Access games monitored for hero units, maps, and multiplayer balance updates.",
  },
  moba: {
    name: "MOBA",
    description:
      "MOBA Early Access titles scored by hero roster, map, and ranked-balance patch frequency.",
  },
  "asynchronous-multiplayer": {
    name: "Asynchronous Multiplayer",
    description:
      "Async multiplayer Early Access games tracked for turn timers, seasons, and shared-world updates.",
  },
  "split-screen": {
    name: "Split Screen",
    description:
      "Split-screen Early Access titles audited for local-play fixes and shared-camera content patches.",
  },
  "4-player-local": {
    name: "4 Player Local",
    description:
      "Four-player local Early Access games monitored for couch modes and party-play update cadence.",
  },
  "party-game": {
    name: "Party Game",
    description:
      "Party-game Early Access titles scored by mini-game packs and local multiplayer patches.",
  },
  party: {
    name: "Party",
    description:
      "Party Early Access experiences tracked for social modes and mini-game content update frequency.",
  },
  "social-deduction": {
    name: "Social Deduction",
    description:
      "Social-deduction Early Access games audited for role kits, maps, and lobby-feature patch history.",
  },
  gambling: {
    name: "Gambling",
    description:
      "Gambling-tagged Early Access titles monitored for table modes and economy-system update cadence.",
  },
  poker: {
    name: "Poker",
    description:
      "Poker Early Access games tracked for table variants and multiplayer lobby patch frequency.",
  },
  chess: {
    name: "Chess",
    description:
      "Chess Early Access titles scored by mode packs and rating-system update history.",
  },
  "board-game": {
    name: "Board Game",
    description:
      "Board-game Early Access adaptations audited for rule implementations and digital-mode patches.",
  },
  tabletop: {
    name: "Tabletop",
    description:
      "Tabletop Early Access titles monitored for rulebook features and multiplayer table updates.",
  },
  dice: {
    name: "Dice",
    description:
      "Dice-driven Early Access games tracked for probability systems and mode-content patch cadence.",
  },
  "card-battler": {
    name: "Card Battler",
    description:
      "Card-battler Early Access titles scored by card pools, seasons, and balance update frequency.",
  },
  "trading-card-game": {
    name: "Trading Card Game",
    description:
      "TCG Early Access games audited for set releases and competitive balance patch history.",
  },
  "creature-collector": {
    name: "Creature Collector",
    description:
      "Creature-collector Early Access titles monitored for monster dex expansions and battle patches.",
  },
  "grid-based-movement": {
    name: "Grid-Based Movement",
    description:
      "Grid-movement Early Access tactics audited for board packs and unit-system patch frequency.",
  },
  "hex-grid": {
    name: "Hex Grid",
    description:
      "Hex-grid Early Access strategy games scored by map tools and turn-structure update history.",
  },
  "turn-based-combat": {
    name: "Turn-Based Combat",
    description:
      "Turn-based combat Early Access titles monitored for encounter packs and ability-balance patches.",
  },
  "turn-based-tactics": {
    name: "Turn-Based Tactics",
    description:
      "Turn-based tactics Early Access games tracked for mission content and squad-system updates.",
  },
  "real-time": {
    name: "Real-Time",
    description:
      "Real-time Early Access strategy and action hybrids scored by pace-tuning and mode patch cadence.",
  },
  "real-time-with-pause": {
    name: "Real-Time with Pause",
    description:
      "Real-time-with-pause Early Access games audited for pause-combat systems and campaign updates.",
  },
  wargame: {
    name: "Wargame",
    description:
      "Wargame Early Access titles monitored for scenario packs and order-of-battle patch frequency.",
  },
  "cold-war": {
    name: "Cold War",
    description:
      "Cold War Early Access games tracked for theater content and period-systems update cadence.",
  },
  "world-war-i": {
    name: "World War I",
    description:
      "WWI Early Access titles scored by front-line maps and period-kit patch history.",
  },
  rome: {
    name: "Rome",
    description:
      "Rome-themed Early Access games audited for empire systems and classical-world content updates.",
  },
  mars: {
    name: "Mars",
    description:
      "Mars Early Access colonies tracked for habitat systems and red-planet content patch cadence.",
  },
  snow: {
    name: "Snow",
    description:
      "Snow-biome Early Access titles monitored for winter systems and cold-survival update frequency.",
  },
  underground: {
    name: "Underground",
    description:
      "Underground Early Access worlds scored by cave generation and subterranean-content patches.",
  },
  "based-on-a-novel": {
    name: "Based On A Novel",
    description:
      "Novel-adapted Early Access games tracked for chapter fidelity and adaptation-content updates.",
  },
  remake: {
    name: "Remake",
    description:
      "Remake Early Access projects audited for parity features and modernization patch cadence.",
  },
  reboot: {
    name: "Reboot",
    description:
      "Reboot Early Access titles scored by legacy-feature returns and new-systems update frequency.",
  },
  sequel: {
    name: "Sequel",
    description:
      "Sequel Early Access games monitored for franchise-feature drops and post-launch content cadence.",
  },
  episodic: {
    name: "Episodic",
    description:
      "Episodic Early Access titles tracked for episode drops and unfinished-season silence.",
  },
  "co-op-campaign": {
    name: "Co-op Campaign",
    description:
      "Co-op campaign Early Access games scored by shared-story missions and drop-in patch history.",
  },
};
