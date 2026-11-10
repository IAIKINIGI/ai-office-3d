# Character assets — Andrew and Mandy proof

Fictional adults. Fully clothed. Not likenesses of any real person.
The female silhouette is a slim adult frame with a fuller clothed chest.
The face is the stock Rocketbox face. It is not a portrait of any singer or other real person.
The cast split is in `cast.json`. Only Andrew and Mandy are skinned here.

| File | Source | File size |
| --- | --- | --- |
| `andrew.glb` | Rocketbox `Male_Adult_02` | 4.7 MB |
| `mandy.glb` | Rocketbox `Female_Adult_03` | 5.0 MB |

Source: https://github.com/microsoft/Microsoft-Rocketbox
License: MIT, Copyright (c) 2020 Microsoft. Full text in `LICENSE.md`.

These replace the security uniforms. The larger files are the clothed color textures.

## Body

Mandy's waist half-width, measured on the body mesh, went from 0.146 m to 0.094 m.
The clothed chest front moved from y = -0.100 m to y = -0.171 m (7 cm further forward).
The top and the pants stay on. Nothing is removed to expose skin.

## Hair

Hair is the model's own hair cards, skinned with the head, not a sphere parked on the neck.
Andrew's cards were pulled in toward the scalp. Their world Z after that edit is 1.588 m to 1.790 m, so the crop covers the crown and leaves the forehead.
Mandy's free card ends were extended. Their world Z is 1.126 m to 1.739 m: the top stays on the scalp and the length reaches the upper chest.
The color is pale pink on Mandy and dark brown on Andrew. It is card hair, not strands. The hairline is the card edge.

## Legs

Same knee fix as before: both thighs use local Z = +88° and both calves Z = -92°. The right bone is already mirrored, so the opposite sign folded that knee backward.
Walk root travel on `Bip01` was about 1.5 m and is zeroed again after export.

Measured lowest body-mesh vertex under 0.22 m, left foot and right foot:

| Pose | Andrew | Mandy |
| --- | --- | --- |
| Idle, start | -0.9 mm, -0.9 mm | -3.9 mm, -3.9 mm |
| Idle, middle | -1.1 mm, -1.5 mm | -3.9 mm, -4.1 mm |
| Sit | -0.7 mm, -0.7 mm (pelvis local X -40) | +10.1 mm, +10.3 mm (pelvis local X -36) |

Andrew's sit soles graze the floor by under 1 mm. Mandy's sit soles are about 1 cm above it. Mandy's idle soles intersect by about 4 mm. The office floor plane hides that contact line in a low camera, so the stills are not a second measurement.

## Clothes, still unfinished as cyberpunk

Andrew is a charcoal sweater and dark trousers. Mandy is a black fitted top and slim black pants, with the chest shape above.
An open yellow/blue coat was generated and then deleted: in the renderer it was a floating striped block, not a jacket.
This is not techwear, not the reference coat, and not a finished cyberpunk wardrobe.

## Other people

Hailey, Holly, Hazel, and Penny are still the procedural office figures. Their jackets are narrower and carry a clothed chest in the same fabric.
Street pedestrians whose model name contains "woman" get a waist pinch and a chest push on the cloned body mesh when those files load.
They are not the Mandy sculpt.
