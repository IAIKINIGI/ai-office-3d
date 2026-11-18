# Hailey — third-party credits

- Base character mesh and textures: This work is based on "Japan young woman" (https://sketchfab.com/3d-models/japan-young-woman-1c7f142755b24de99ed75d530549d19a) by YØD (https://sketchfab.com/YOD3DD) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)
  Changes: the model was decimated and re-rigged to a 22-bone mixamorig skeleton, its bust was reshaped, its legs were completed below mid-thigh, the body and rig were symmetrised about the centre plane, and a parametric cyberpunk outfit was added (cropped armoured jacket with sheer chest panels over an opaque bandeau, latex leggings with thigh straps, belts, knee-high boots) with procedural textures.
- Jacket design is an original procedural recreation inspired by the look of "Cyberpunk hacker jacket" on Sketchfab (reference screenshots only; no geometry or textures from that model are used).
- Animations (Idle, Walk, Sit) retargeted from Quaternius "woman_casual" animations, CC0 1.0 (https://quaternius.com).

## v3.2 changes (all generated in-house, no new third-party assets)
- Jacket follows the "Cyberpunk hacker jacket" reference screenshots more closely: no inner top; the jacket forms two smoky
  translucent cups framed by white armour straps, with orange upper-chest panels, orange collar sides and inner lip, long orange
  outer-arm stripes, a centre zip, a white lower band with dark-grey insets, puffy hex sleeves and grey cuffs.
- Skin under the cups is a smooth inset surface with a uniform skin tone (no nipple detail). A radial smoky gradient layer
  (tex/shield.png, generated) sits under each cup.
- Leggings: one continuous shell over hips, seat and thighs (voxel union of the tubes plus morphological closing), mirror-symmetric.
- Body: iterative symmetrisation of hips and thighs; shoulders about 10% narrower; neck centred.

## v3.3 changes
- Leggings shell: smoothed source tubes, a crotch gusset, a coarser and more heavily smoothed field, and normals transferred from
  the dense surface so the reflections are even. AO on the shell is softened and its skin weights are smoothed (less fold when sitting).
- Cups are more transparent: sheer alpha 0.18 per layer and a gradient peak of 0.26, about 0.5 combined at the centre. The skin
  under the cups is still the smooth, featureless inset surface.

## v3.4 (2026-11-10)
- Jacket front rebuilt following Andrew's markup of the "cyberpunk hacker jacket" reference (refs/jacket_andrew_markup.jpg; the reference is used only as a design guide, no assets taken from it).
- Smoky semi-transparent panels: two tall chest panels beside the centre zip, upper-chest/shoulder yoke leaves, lower-front inverted V (+ small hem side bits), outer-forearm triangles on both sleeves. Everything else opaque (silver shell, dark hex outer bust and sleeves, orange accents, grey collar and cuffs).
- Skin under the panels stays the clean featureless inset surface with the soft darker gradient over the bust centre; sleeves get an inset skin layer weighted exactly like the sleeve.
- The jacket hem is lowered from z 1.065 to 1.015 so the lower front pieces fit (the reference covers the torso to the waist).
- All procedural; built in Blender 4.2.3. Body, shorts, straps, boots, rig and animations are unchanged from v3.3.

## v3.5 (2026-11-11)
- Jacket shoulders refitted. The yoke is projected onto the body along its normals at about 6 mm, using a mirror-symmetric fit surface. The sleeve cap flaps were removed. The collar is now a low stand collar whose base rows stay grey.
- The Idle, Walk and Sit retargeting now keeps the clavicles in their own rest direction. The source clip had shrugged the shoulders by about 9 cm.
- Hair tips and neck-base skin that showed through the collar base were removed.
- The neck accent patches were moved clear of the collar.
- There are no new third-party assets; the credits above still apply.

## v3.6 (2026-11-11)
- The body waist is narrower, giving a slim hourglass that is symmetric and blends smoothly into the ribs and hips. The hip curve is slightly fuller.
- The pants are now low-rise. The waistband and belt sit about 5 cm lower, on the hips. The crotch and front are unchanged and fully covered by opaque pants material.
- The exposed midriff has a clean, symmetric skin band.
- The sleeves are decimated less, which fixes the pinched elbows. The arm retarget is swing-only, with no roll, so the sleeves no longer twist. The Idle arms hang naturally.
- The shoulders, collar, panels and coverage are identical to v3.5 K.
- There are no new third-party assets.

## v3.7 (2026-11-17)
- Stronger hourglass. The waist is narrower and the hips and upper thighs a little fuller. The jacket hem, midriff band and pants follow the new shape. Andrew's waist reference was used only as a body-shape guide; no outfit or assets were taken from it.
- Lower rise, as in the Penny reference. The pants waistband now sits on the hips, with the belt at hip level well below the navel. The crotch and front stay fully covered by opaque pants material.
- Tidier shoulders. The shoulder line is about 15% narrower and more sloped. The jacket's shoulder cap now drapes down onto the sleeve cap, so it no longer overhangs as a boxy shelf and the sleeve does not puff out below it. The chest panels are unchanged.
- The Walk cycle is grounded. A per-key hip height correction keeps the lowest sole point at the Idle floor level, within about 1 mm.
- The Idle arms are opened about 5 degrees so the hands clear the fuller hips.
- There are no new third-party assets; the credits above still apply.

## v3.8 (2026-11-17)
- The jacket's shoulder cap now hugs the body. It is shrink-wrapped inward onto the deltoid at a minimal offset of about 4 mm, and stays just over the sleeve cap where the sleeve lies underneath. At the outer shoulder this removes the 1–2 cm float that made the shoulder line sit high and look shrugged.
- The ribbons and panels on the shell are laid out on the v3.7 surface and then carried with it, so the panel shapes and the chest panel widths are unchanged.
- Jacket skin weights over the shoulder are now taken almost directly from the body (8 smoothing passes instead of 25), so the yoke follows the clavicle and upper-arm bones.
- The neck, head, collar, rig, bind pose and animations are unchanged from v3.7. Clavicle elevation in Idle, Walk and Sit stays within 0.7° of rest, so there is no shrug in the animations. The Walk feet stay grounded.
- There are no new third-party assets; the credits above still apply.

## v3.9 (2026-11-17)
- The shoulders are a little wider again, about halfway back from the v3.7/v3.8 narrowing. The jacket shoulder width goes from 0.332 to 0.349 m and shoulder/hip from 0.89 to 0.94. Only the outer shoulder and deltoid of the body were widened. The rig joints were never moved by the narrowing, so the clavicle and upper-arm placement still match the mesh.
- The jacket shoulder cap still hugs the body (about 0–3 mm at the outer shoulder). It is not boxy or floating, and the shoulder line is not raised.
- Where the sleeve and its inner skin poked just through the jacket near the shoulder cap, they are now tucked under it.
- The neck, head, waist, low-rise pants, belt, grounded Walk feet, chest panels, rig and animations are unchanged from v3.8.
- There are no new third-party assets; the credits above still apply.
