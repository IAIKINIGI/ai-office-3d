# Character assets — Andrew and Mandy proof

Fictional adults. Fully clothed. Mandy is not Karina, not a scan, and not an endorsement.
The female silhouette is a slim adult frame with a fuller clothed chest.
The face mesh and Mandy's hair were reshaped toward public photos of Karina (aespa). It is still the Rocketbox head, and it is not a portrait.
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
The office lights are cyan and magenta, so the face looks cooler in the room than in the neutral diagnostic shots. The diagnostic key is added on top of those lights, so the room color is still in the background.

## Face

Public photos used only as a proportion guide, not as a texture:

- https://en.wikipedia.org/wiki/Karina_(South_Korean_singer)
- https://commons.wikimedia.org/wiki/File:Aespa%27s_Karina_10.jpg (24 Nov 2023, CC BY, 티비텐)
- https://commons.wikimedia.org/wiki/File:240906_Karina_at_Musinsa_Beauty_Festa.jpg (6 Sep 2024, CC BY, 티비텐)

Those frames show a small oval face, a soft jaw, large dark eyes with a slight outer-corner lift, a small straight nose, and a rose lip. The photos were not copied onto the mesh.

The head is still Rocketbox `Female_Adult_03` (about 1,500 head vertices, eyelid and brow bones, a separate eyeball island). The edit is a smooth warp of that mesh. Ears and the neck below z = 1.48 m were left in place so the seam stays. Body, arms, hair cards, and Andrew were not part of this pass.

Measured on the head surface, world meters, after the smooth:

| | Before | After |
| --- | --- | --- |
| Cheek half-width | 0.0555 m | 0.0488 m |
| Jaw half-width | 0.0311 m | 0.0259 m |
| Nose tip, forward axis | -0.0711 m | -0.0619 m |
| Mouth corner | 0.0321 m | 0.0275 m |
| Upper-lid height | 1.6177 m | 1.6190 m |

What the first sculpt moved: cheeks about 12% narrower, jaw about 17% narrower, nose tip back by 9 mm and narrower, mouth about 14% narrower, philtrum lifted a few millimetres with the teeth so the lips stay closed. The iris drawing was recolored from hazel to dark brown. Purple eyeshadow pixels on the face UV were pulled toward the skin color. No neck band and no pasted photo.

The eye bones were then moved, and the lids and socket skin moved with them. In the exported file the eye bones sit at x = ±0.0268 m (they were ±0.030 m, so the pair is about 6 mm closer) and 1.2 mm further forward. The outer corner of each upper lid is raised about 4 mm relative to the inner corner. A row of 38 new vertices was cut above the lash line and pushed back 1.8 mm as a crease. The existing dark pixels on the lid UV were darkened into the lash line, and a narrow band of skin pixels just above that UV was shaded as the crease. Brow bones were raised (outer about 2.6 mm, inner about 1.8 mm) and the inner brows moved 2 mm toward the nose.

What this does not do: it does not become her face. The crease is one loop on the Rocketbox lid, not her double eyelid. The eyes are still that texture and that socket. There is no beauty mark. The render is still Mandy.

## Hair

Hair is the model's own hair cards, skinned with the head, not a sphere parked on the neck.
Andrew's cards stay a short crop on the scalp (world Z 1.588–1.794 m). A few millimetres of layering and a small sweep to one side were added on that same crop. It is not a new haircut and not a solid cap.
Mandy's cards were recolored from pale pink to near-black, with a faint rose only in the brightest texels. The crown verts within 2 cm of the midline were pushed apart to open a part. The bottom edges of the cards were extended straight down, then smoothed. The longest card verts reach world Z 1.032 m, about the waist, and the bulk still sits on the head and shoulders. It is still card hair: the part does not read as a clean center part, and some cards stay separated. A set of solid ribbons was tried and removed, because in the renderer they were flat bars, not hair.
Andrew's color stays dark brown. The hairline is the card edge.

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
