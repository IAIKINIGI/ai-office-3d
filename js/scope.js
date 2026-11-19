export const S = {};

// Shrunk H office tower, moved to the west empty plot. The original 22×14 m
// slab at the origin (rot 138°) sat on existing mid-rises; after the move those
// stay in the city mesh, and the leftover gap in the old plot is filled with
// a mid-rise. The west pad keeps every original building, the civic disc, the
// highway and ramps, and ATOM as on main. No mesh clipping, no new avenues.
// Decorative 14 m plaza ring at the old base has been removed.
//
// Local 12×14 m (width shrunk from 22, depth unchanged) at rot 90° so the
// door (local +Z) faces east toward the existing N–S street. World footprint
// is 14 m east–west by 12 m north–south.
S.TOWER_X = -36;
S.TOWER_Z = -1;
S.TOWER_ROT = 90; // degrees; door (local +Z) faces east
S.TOWER_FW = 12;
S.TOWER_FD = 14;

// Mid-rise that fills the leftover gap in the original origin plot.
S.OLD_SITE = { x: 10, z: 2, w: 12, d: 6, rot: 128, h: 18 };
