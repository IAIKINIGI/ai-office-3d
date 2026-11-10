# Character assets — Andrew and Mandy proof

Fictional adults. Fully clothed. Mandy is not a portrait of a real person.
The cast split is in `cast.json`. Only Andrew and Mandy are skinned here.
The sections below the credits describe the previous Rocketbox Mandy sculpt. That mesh is no longer the file in `mandy.glb`.

| File | Source | File size |
| --- | --- | --- |
| `andrew.glb` | Rocketbox `Male_Adult_02` | 4.7 MB |
| `mandy.glb` | Mai Shiranui, rigged Mixamo clips | 3.5 MB |

Andrew: https://github.com/microsoft/Microsoft-Rocketbox
License: MIT, Copyright (c) 2020 Microsoft. Full text in `LICENSE.md`.

Mandy: This work is based on "Mai Shiranui | Anime Hot GIrl | Street fighter" (https://sketchfab.com/3d-models/mai-shiranui-anime-hot-girl-street-fighter-2bdc3c3111ea492bba9a33eac0a6dfc7) by lawlietrecluze (https://sketchfab.com/lawlietrecluze), licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/). Modified: decimated, arms separated, rigged and animated. The file in `mandy.glb` is that rig, about 1.68 m, feet at the origin, with Idle, Walk, and Sit embedded. The office uses those clips directly.

Hovercar: This work is based on "(FREE) Cyberpunk Hovercar" (https://sketchfab.com/3d-models/free-cyberpunk-hovercar-3205b1075bb44ffc826bce0c2a04d74c) by Karol Miklas (https://sketchfab.com/karolmiklas), licensed under CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/). Modified: wheels removed, hover pads added. That derivative stays CC BY-SA 4.0. The file is `assets/vehicles/hovercar-nowheels.glb`.

City: This work is based on "Cyberpunk City - #1" (https://sketchfab.com/3d-models/cyberpunk-city-1-14d2eaa145ee42938e004115871adf6c) by born2012 (https://sketchfab.com/born2012), licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/). The meshopt GLB is `assets/city/cyberpunk-city.glb`. The centre is cut out so the office tower stands on the plaza. Full credit line is in `assets/city/license.txt`.

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

Mandy's old card strips were removed. The hair on her now is original sheet geometry, not a downloaded asset: a center part, crown volume, and the length down the back, with two thin strands beside the jaw. It is skinned to the head and the spine. It is still one smooth shape, not strands.
Andrew's cards stay a short crop on the scalp (world Z 1.588–1.794 m). A few millimetres of layering and a small sweep to one side were added on that same crop. It is not a new haircut and not a solid cap.
The new sheets are near-black, roughness 0.30, with the alpha faded at the edges. From the back the length passes the shoulders. From the front the sides still come down to the shoulders, and the crown is still a smooth cap.
Andrew's color stays dark brown. The hairline is the card edge.

## Legs

Same knee fix as before: both thighs use local Z = +88° and both calves Z = -92°. The right bone is already mirrored, so the opposite sign folded that knee backward.
Walk root travel on `Bip01` was about 1.5 m and is zeroed again after export.

The office slab is 0.38 m thick and its top is the floor she stands on. The skinned model used to sit at the slab's bottom, so the legs disappeared into the floor. Mandy's model is lifted each frame so the lowest sole meets that top. Inside the lift the target is the cabin plate, 0.08 m, not the office slab. Andrew stays at y = 0 on his own desk. On the raised lounge seats his model is lifted to 0.43 m so his pelvis meets the cushion.

Her seated pelvis underside is 0.415 m up in the sit pose, and the feet are 0.013 m up, so with the feet on the slab the cushion has to be at 0.78 m. That is her desk chair, every rest-corner sofa, and the two gaming stools. Other desk chairs are still at 0.60 m. The procedural staff drop to rig y = -0.10 on the lounge seats and stay at -0.38 at a desk.

At her own desk the chair sits under that pelvis, the backrest is a few centimetres behind her back, and the desktop (top 1.14 m, 0.76 m above the floor) starts just in front of her knees. The seat is 0.40 m above the floor.

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

## Penny

Penny is "Wuthering Waves Lucy (downloadable)" by Spessartite, https://sketchfab.com/3d-models/wuthering-waves-lucy-downloadable-4e5ee86e11e8470a8f621f6cc754bc40, Sketchfab Standard license.

The file in `penny.glb` is the lit PBR mesh, about 1.65 m, with the gold cables and whips already removed. It was not re-exported through Blender, because applying transforms there breaks the skin. The GLB root already stands her upright. Walk, idle, and sit are retargeted from Quaternius's CC0 Universal Animation Library (see `quaternius/LICENSE.txt`): `Walk_Loop`, `Idle_Loop`, and `Sitting_Idle_Loop`, with `A_TPose` as the source rest. For each bone in `bone-map-mixamo.json` the page takes the rotation that swings the source bind direction onto the posed direction and applies that swing to her own bind direction. The upper arms are then aimed to hang about 10 degrees off vertical, and the jacket roots follow that swing so the sleeves stay on the shoulders. Hair, coat tails, and twist bones are not keyed. Neck and head stay at the bind so the chin stays level. Bone names contain spaces. The GLB loader stores them with underscores, and the map is read through that same sanitizing step. Hair stays a lit material, darkened a little so the warm office key does not wash it out. Her chair cushion is raised so the sit pose, feet on the slab, lands on the seat.

## Other people

Hailey, Holly, and Hazel are still the procedural office figures. Their jackets are narrower and carry a clothed chest in the same fabric.
Street pedestrians whose model name contains "woman" get a waist pinch and a chest push on the cloned body mesh when those files load.
They are not the Mandy sculpt.
