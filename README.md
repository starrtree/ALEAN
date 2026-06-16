# ALEAN: Neon Pursuit

A cinematic 2D hover-bike chase shooter set inside the **ALEAN** universe.

This branch is a ground-up multi-file upgrade of the original single-file 8-bit prototype. ALEAN escapes through a cybernetic city while System police UFOs pursue, aim, shoot, flank and escalate the chase.

## Play locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Controls

| Action | Keyboard |
|---|---|
| Move | WASD / Arrow keys |
| Purple laser | J or left click |
| Green seed bomb | K or right click |
| Phase dash | Space |
| Third Eye Awakening | E when meter is full |
| Pause | P |
| Mute | M |

Touch/trackpad dragging also moves the bike.

## Current vertical slice

- Full delta-time movement and physics
- Multi-layer scrolling neon city
- Player acceleration, inertia, dash and invulnerability frames
- Purple rapid-fire laser system
- Green arcing seed bombs with chain-reaction vine explosions
- Awakening meter and Third Eye Overdrive
- Patrol, interceptor, sniper and Warden police enemies
- Aimed enemy fire and predictive shots
- Escalating System Alert level
- Flow/combo scoring and persistent local high score
- Procedurally generated placeholder art, so no external assets are required yet
- Synthesized browser sound effects
- Keyboard, mouse and basic touch controls

## Architecture

```text
src/
├── config/       Game constants and balancing
├── entities/     Player and enemy classes
├── scenes/       Boot, menu, gameplay and HUD scenes
├── systems/      Enemy director, events and synthesized audio
├── main.ts       Phaser bootstrap
└── styles.css    Page shell
```

## Classic prototype

The original game remains safely preserved on the `main` branch and in Git history while this upgrade is reviewed on `upgrade/neon-pursuit`.

## Next production upgrades

1. Replace generated textures with original sprite sheets and animation.
2. Add the official ALEAN instrumental and song-synchronized Story Mode timeline.
3. Add more enemy formations, bosses and environmental hazards.
4. Add settings, controller remapping and polished mobile controls.
5. Add authored background districts and Mother Nature transformation sequences.
6. Add optional pre-rendered 3D character and hover-bike sprites when models are ready.
