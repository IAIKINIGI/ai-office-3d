# Character assets — Andrew and Mandy proof

These two figures replace only the executive-floor proof pair. They are stock
humans from the Microsoft Rocketbox library, not portraits of any real person.

| File | Source character | Triangles | File size |
| --- | --- | --- | --- |
| `andrew.glb` | `Security_Male_01` | 9,515 | 1.4 MB |
| `mandy.glb` | `Security_Female_01` | 8,006 | 0.7 MB |

Source repository: https://github.com/microsoft/Microsoft-Rocketbox
License: MIT, Copyright (c) 2020 Microsoft. The full license is in `LICENSE.md`
in this folder and must stay with these files.

## What was changed

- Colour textures were resized to 1024 px and packed as JPEG. Normal and
  specular maps were left out so the pages stay small.
- Mandy's hat and holster polygons were removed.
- Walk cycles had their forward root motion removed so the office director
  still moves the figure. Idle and a male talking gesture are the original
  Rocketbox clips. The seated pose is a bent-leg pose on the same skeleton,
  because the library's sit file is a seated bind pose rather than a clip that
  can be copied onto the standing mesh.
- The mesh rest pose is a T-pose. The idle clip does not lower the arms, so a
  standing idle still holds the arms out. Walking uses the library walk cycle.
- White "SECURITY" badge areas on the shirt textures were painted over. Andrew's
  peaked cap is part of the head mesh and is still there.

## What these are not

The clothes are the library's black security workwear (jacket, shirt, cargo
trousers, boots). They are realistic fabric on a realistic body. They are not
a Night City costume. No CC0, CC-BY, or MIT realistic cyberpunk outfit was
available to download without an account or a paid licence. Mixamo needs an
Adobe account and does not allow redistributing the character by itself.
Quaternius's cyberpunk kit is CC0 but it is untextured and stylized.
