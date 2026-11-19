# City plan coordinates

The H office tower is a **12 × 14 m** slab (width shrunk from 22 m, depth unchanged) at world `(-36, -1)` in the west empty plot, rotated **90°** so the door (local +Z) faces east toward the existing street. World footprint is 14 m east–west by 12 m north–south. The original origin plot is filled with the existing city mid-rises plus a new 12 × 6 m, 18 m-tall mid-rise at `(10, 2)`, rotated 128°, in the leftover gap toward the eastern civic circle. The city mesh, roads, highway, ramps, and ATOM are otherwise unchanged from main. The decorative 14 m neon plaza ring around the old base has been removed.


To verify the H tower is clear of other buildings, the highway, rails, and roads:

```
python3 tools/check-overlaps.py
```

The script exits 0 when the H tower has no overlaps. Any pre-existing overlaps elsewhere in the original map are listed and left untouched.

Both `city-plan-blank.png` and `city-plan-current-roads.png` are the same 2048×2048 orthographic frame. North is up. World +X is right (east). World +Z is down (south), so world −Z is north.

The view is a 210 m square. One pixel is `210 / 2048` metres.

```
metersPerPixel = 210 / 2048          # 0.1025390625
x0 = -100.76154028251767             # world X at the left edge
z0 = -87.36261804588139              # world Z at the top edge
```

Pixel `(px, py)` is 0-based from the top-left. The world point at the centre of that pixel is:

```
worldX = x0 + (px + 0.5) * metersPerPixel
worldZ = z0 + (py + 0.5) * metersPerPixel
```

The inverse, for a world point:

```
px = (worldX - x0) / metersPerPixel - 0.5
py = (worldZ - z0) / metersPerPixel - 0.5
```

Grid lines are every 10 m, on multiples of 10. The labels are those world coordinates. The scale bar is 50 m. The office tower footprint is the magenta rectangle at world (-36, -1) in the west plot. A grey mid-rise at (10, 2) fills the leftover gap in the original origin plot. Open ground is white. Block footprints are mid-grey with a thin outline.

`city-plan-blank.png` has no generated roads. Grey paths inside the blocks are the city mesh itself. `city-plan-current-roads.png` adds the current avenue, lane pieces, and flyover in darker grey, with sidewalks lighter grey.

A stroke drawn on either PNG converts to a road centreline by sampling pixels along the stroke and applying the formula above. Use the pixel centre (`+ 0.5`). Y on the image increases downward and maps to increasing world Z.
