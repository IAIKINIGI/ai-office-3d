export const S = {};

// Shrunk H office tower, moved to the west empty plot. The original 22×14 m
// slab at the origin (rot 138°) sat on existing mid-rises; after the move those
// stay in the city mesh, and the leftover gap in the old plot is filled with
// a mid-rise. The west pad keeps every original building, the civic disc, the
// highway and ramps, and ATOM as on main. No mesh clipping, no new avenues.
// Decorative 14 m plaza ring at the old base has been removed.
//
// Local 8×8 m (both axes shrunk; 3F, lift, signs and rooftop logo still work)
// at rot 90° so the door (local +Z) faces east toward the existing N–S street.
// World footprint is an 8×8 m square. A 1.5 m clearance is required around
// every original building, shed, road, ramp, highway and the civic disc.
S.TOWER_X = -37.75;
S.TOWER_Z = 1.5;
S.TOWER_ROT = 90; // degrees; door (local +Z) faces east
S.TOWER_FW = 8;
S.TOWER_FD = 8;

// Mid-rise that fills the leftover gap in the original origin plot.
S.OLD_SITE = { x: 10, z: 2, w: 12, d: 6, rot: 128, h: 18 };
