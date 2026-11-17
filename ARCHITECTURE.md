# Architecture

The page is a static site. `index.html` is the shell: CSS, the HUD nodes, the Three.js import map, and the classic scripts that hourly tooling and offline embeds depend on. The scene itself lives in `js/` as ES modules. They share one binding object, `js/scope.js`, so the split keeps the original order and the original closures.

GitHub Pages and a local `file://` open both work. Modules use relative imports, and the import map still points `three` at the inlined build.

## What stays put

- `data.js` is still a classic script. `sync_from_page.py` rewrites that file hourly and pushes it to `main`. It must keep setting `window.OFFICE_DATA`. The filename and the shape of that object do not change.
- `assets/glb-embeds-*.js`, `assets/tex-embeds.js`, and `assets/inline-0a754ce43265.js` still load as classic scripts and still fill `window.__GLB` and `window.OFFICE_TEX`.

## Which file owns what

| File | Owns |
| --- | --- |
| `index.html` | Document shell, CSS, import map, classic script tags. |
| `js/scope.js` | The shared binding object `S`. |
| `js/shared.js` | `OFFICE_DATA` checks, floor roster patch, textures, materials, `box` / `glow` helpers. |
| `js/main.js` | Renderer, camera, controls, global lights, bloom, quality tiers, the frame loop. Boots the other modules in the original order. |
| `js/city.js` | Skyline and megatowers, the corporate tower, rain, koi and dancer sprites, vehicles, Kenney props, the cyberpunk city GLB, ATOM, street poles, and facade dressing. |
| `js/highway.js` | The orange ring, the ramp decks, and the ring piers. |
| `js/office.js` | The six office floors, rooms, desks, the lift, interior lights, and the roof hologram H. |
| `js/characters.js` | Procedural staff, the life director, street pedestrians, GLB loading, animation, and name tags. |
| `js/ui.js` | HUD: weather, usage, floor list, and the report panel. |

## Startup

Facade raycasts in `dressCityFacades` run a few milliseconds per frame instead of one long block on the main thread. Highway piers and street poles still all have a glowing head. A real `PointLight` is kept on every 6th highway pier and every 4th street pole.
