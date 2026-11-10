# Character assets — Andrew and Mandy proof

Fictional adults. Fully clothed. Mandy is not Karina, not a scan, and not an endorsement.
The female silhouette is a slim adult frame with a fuller clothed chest.
Mandy's head, above the neck, is a MakeHuman base shaped with the CC0 young East Asian female target. The hair is MakeHuman `long01`. It is not a portrait of Karina.
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
The clothed chest front is now y = -0.138 m, from y = -0.100 m on the untouched torso (about 3.8 cm). The volume is an ellipsoid on each side, lighter in the cleavage and at the armpit, with a small tuck under the bust so the tank has a lower edge. It is still the same body mesh, so the cloth follows that surface. There is no separate draped fabric and no bounce. Arms were not moved.
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

The Rocketbox head above the neck was replaced. The new head is MakeHuman hm08 with the `asian-female-young` target at full weight, plus a small jaw narrow and a 6 mm reduction in nose projection. The skin is the CC0 `young_asian_female` texture, darkened slightly so the key light does not wipe it out. Eyeballs are the base-mesh eyes, colored dark brown. Lashes are MakeHuman `eyelashes01`. The neck join is an overlap, not a welded loop, and the edge is still jagged.

Public photos of Karina were used only as a proportion guide. They were not pasted on. The result is an East Asian young-adult head on this body. It is not her face.

The lids were opened and the eyeballs were shrunk to about 1.4 cm and moved into the sockets, with a drawn brown iris and white. From the front the eyes are open and the iris is visible. They still look glassy and pink under the key light, and the skin is still flatter and paler than the neck. The neck edge is still a jagged overlap, not a welded loop. The long hair is a solid shell. Mandy is the label. It is not a likeness.

## Hair

Hair is the model's own hair cards, skinned with the head, not a sphere parked on the neck.
Andrew's cards stay a short crop on the scalp (world Z 1.588–1.794 m). A few millimetres of layering and a small sweep to one side were added on that same crop. It is not a new haircut and not a solid cap.
Mandy's hair is MakeHuman `long01`, recolored near-black with a faint rose in the highlights. It is a center-part fall past the waist, weighted to the head and, at the tips, to the upper spine. It is a game hair mesh, not strands.
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
