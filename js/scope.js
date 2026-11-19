export const S = {};

// H office tower stays on the original central plot (it was at the origin
// on main, rotated 138°, 22×14 m). That exact pose sits on top of original
// mid-rise blocks, so the tower is shrunk and slid to the only clear pocket
// still inside the original 22×14 footprint: the gap between those blocks
// and the eastern civic circle. The city GLB, roads, highway, and ATOM are
// unchanged. The decorative 14 m plaza ring that used to circle the old
// base has been removed.
S.TOWER_X = 10;
S.TOWER_Z = 2;
S.TOWER_ROT = 128; // degrees; was 138. Door is local +Z.
S.TOWER_FW = 12;   // world footprint (metres). Built locally at 22×14, then scaled.
S.TOWER_FD = 6;
