# Character assets — Andrew and Mandy proof

Fictional adults. Fully clothed. Mandy is not Karina, not a scan, and not an endorsement.
The female silhouette is a slim adult frame with a fuller clothed chest.
Mandy's head is the Rocketbox `Female_Adult_03` head again. The MakeHuman head was removed. It is not a portrait of Karina.
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
The clothed chest front is now y = -0.180 m. The previous ellipsoid stopped at y = -0.138 m (about 3.8 cm forward of the untouched rib) and did not read at a normal camera distance. The new volume is a teardrop on each side, fullest around z = 1.20 m, with the center of the tank coming forward as a low bridge and the underbust curving back toward y = -0.08 m. It is still the same body mesh, so the cloth follows that surface. There is no separate draped fabric and no bounce. The waist half-width is still 0.138 m. Shoulder half-width is still 0.194 m. Arms were not moved.

## Skin

Head and body skin pixels were shifted toward a fair warm tone while keeping the texture's own light and dark. Roughness on the head material is 0.58, so it is not a mirror.
The office lights are cyan and magenta, so the face looks cooler in the room than in the neutral diagnostic shots. The diagnostic key is added on top of those lights, so the room color is still in the background.

## Face

Public photos used only as a proportion guide, not as a texture:

- https://en.wikipedia.org/wiki/Karina_(South_Korean_singer)
- https://commons.wikimedia.org/wiki/File:Aespa%27s_Karina_10.jpg (24 Nov 2023, CC BY, 티비텐)
- https://commons.wikimedia.org/wiki/File:240906_Karina_at_Musinsa_Beauty_Festa.jpg (6 Sep 2024, CC BY, 티비텐)

Those frames show a small oval face, a soft jaw, large dark eyes with a slight outer-corner lift, a small straight nose, and a rose lip. The photos were not copied onto the mesh.

The MakeHuman head, eyes, lashes, and hair were removed. Mandy is the Rocketbox head: fair skin, the jaw and nose sculpt, the eye bones at x = ±0.0268 m, and the dark lengthened card hair.

Measured on this mesh, crown of the skull to the soles is 1.731 m. Chin to crown is 0.217 m. That is 8.0 heads (1.731 / 0.217). The asked range is 7.5 to 8. The head was not scaled. Ear half-width on the head mesh is 0.094 m. Shoulder half-width is 0.194 m. Jaw half-width in the chin band is still 0.026 m.

A small pass on top of that head: the iris is slightly larger, the lid opening is a little taller through the middle with the outer corner still raised, the nose tip is about 1 mm less projected, the lips are a few millimetres fuller with a rose tint on the lip texels, and the skin mix is warmer with a light cheek blush. The jaw was tapered toward the chin, but the widest point of that band did not move, so it does not read as a sharp V. The card hair is still a side-swept fringe. A center-part nudge was applied and does not read as a clean part.

## Hair

Hair is the model's own hair cards, skinned with the head, not a sphere parked on the neck.
Andrew's cards stay a short crop on the scalp (world Z 1.588–1.794 m). A few millimetres of layering and a small sweep to one side were added on that same crop. It is not a new haircut and not a solid cap.
Mandy's cards are near-black with a faint rose in the highlights. Their world Z runs from about 1.03 m to 1.73 m: the top stays on the scalp and the length reaches the waist. It is card hair, not strands.
Andrew's color stays dark brown. The hairline is the card edge.

## Legs

Same knee fix as before: both thighs use local Z = +88° and both calves Z = -92°. The right bone is already mirrored, so the opposite sign folded that knee backward.
Walk root travel on `Bip01` was about 1.5 m and is zeroed again after export.

The office slab is 0.38 m thick and its top is the floor she stands on. The skinned model used to sit at the slab's bottom, so the legs disappeared into the floor. Mandy's model is lifted each frame so the lowest sole meets that top. Andrew is not lifted.

In Blender, before that lift, the lowest body vertex is:

| Pose | Mandy |
| --- | --- |
| Idle | -3.9 mm |
| Walk, lowest frame | -59 mm |
| Sit | +10 mm (pelvis local X -36) |

The walk cycle plants through the origin, so the lift rises on those frames and the posed foot stays on the slab. Sitting keeps the feet on the slab. The office chair seat is only 0.22 m above that slab, so a normal sit with feet down does not also land in the chair.

## Clothes, still unfinished as cyberpunk

Andrew is a charcoal sweater and dark trousers. Mandy is a black fitted top and slim black pants, with the chest shape above.
An open yellow/blue coat was generated and then deleted: in the renderer it was a floating striped block, not a jacket.
This is not techwear, not the reference coat, and not a finished cyberpunk wardrobe.

## Other people

Hailey, Holly, Hazel, and Penny are still the procedural office figures. Their jackets are narrower and carry a clothed chest in the same fabric.
Street pedestrians whose model name contains "woman" get a waist pinch and a chest push on the cloned body mesh when those files load.
They are not the Mandy sculpt.
