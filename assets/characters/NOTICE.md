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

The first sculpt pinched the waist from 0.146 m to 0.094 m half-width and pushed the chest 7 cm forward. That read as a warped torso, so it was redone.
The current edit is an 8% waist ease, blended into the ribs and hips: half-width 0.146 m to 0.138 m.
The clothed chest front moved from y = -0.100 m to y = -0.126 m (about 2.6 cm), with no sideways balloon. Normals were rebuilt after a smooth pass.
The top and the pants stay on. Shoulders and arms were not squeezed.

## Skin

Head and body skin pixels were shifted toward a fair warm tone while keeping the texture's own light and dark. Roughness on the head material is 0.58, so it is not a mirror.
The office lights are cyan and magenta, so the face looks cooler in the room than in the neutral diagnostic shots.
The stock Rocketbox face mesh is unchanged. Eye spacing, lids, and gaze are still that mesh. A color pass cannot fix them.

## Face reference

Public photos used only as a guide, not as a texture:

- https://en.wikipedia.org/wiki/Karina_(South_Korean_singer)
- https://commons.wikimedia.org/wiki/File:Aespa%27s_Karina_10.jpg (24 Nov 2023, CC BY, 티비텐)
- https://commons.wikimedia.org/wiki/File:240906_Karina_at_Musinsa_Beauty_Festa.jpg (6 Sep 2024, CC BY, 티비텐)

Those photos show a small oval face, large open eyes with a defined lid and liner, a narrow nose, and a soft rose lip. Mandy's head is still `Female_Adult_03`. Its eye sockets, nose, and jaw do not match that structure. Painting makeup through the head UVs put dots on the lids and a brown band on the neck, so that paint was not kept. The preview face is the fair-skin pass only. It is not a likeness.

## Hair

Hair is the model's own hair cards, skinned with the head, not a sphere parked on the neck.
Andrew's cards stay a short crop on the scalp (world Z 1.588–1.794 m). A few millimetres of layering and a small sweep to one side were added on that same crop. It is not a new haircut and not a solid cap.
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
