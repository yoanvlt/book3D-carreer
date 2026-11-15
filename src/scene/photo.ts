/**
 * Mode photo des captures automatiques (`?debug=1` seulement) : la caméra quitte le robot et se
 * place exactement où le script le demande. Sans effet tant que `active` est faux.
 */
export const photo = {
  active: false,
  position: [0, 0, 0] as [number, number, number],
  target: [0, 0, 0] as [number, number, number],
  fov: 40,
};
