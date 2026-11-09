# Character assets — Andrew and Mandy proof

Fictional adults. Fully clothed. Not likenesses of any real person.
The cast split is in `cast.json`. Only Andrew and Mandy are skinned here.

| File | Source | Triangles | File size |
| --- | --- | --- | --- |
| `andrew.glb` | Rocketbox `Security_Male_01` | about 9.5k plus a hair shell | 1.6 MB |
| `mandy.glb` | Rocketbox `Security_Female_01` | about 8.0k plus a hair shell | 1.0 MB |

Source: https://github.com/microsoft/Microsoft-Rocketbox
License: MIT, Copyright (c) 2020 Microsoft. Full text in `LICENSE.md`.

## Legs

Idle keeps both feet on the ground for the whole clip. That was measured on the skeleton and on the mesh, at several times, and it matches the standing renders.

The folded leg was the seated pose. The right thigh used the opposite local rotation from the left, and that knee bent backward. Both thighs now use the same local sign, so both knees come forward and both feet meet the floor. The hips drop with that pose. Walking had about 1.5 m of forward travel on the armature root; that travel is removed so the stride stays in place. Knee height during the cycle stays near a normal step, not a high march. The feet-together moment is the passing phase of the same cycle.

## Hair

The police cap was deleted. It is not pushed into the scalp. A separate matte shell is weighted to the head bone. Andrew's is a short crop with the forehead and ears showing. Mandy's is a dark bob that comes to about the shoulder. The shell is smooth-shaded, but the hairline is still angular because the head mesh is coarse. It is not strand hair, and it is not the old glossy helmet.

## Still not cyberpunk clothing

The shirts, pockets, tie shape, and jackets are still the Rocketbox security uniform, only darkened. Mandy's clothed chest change is small on this mesh.
