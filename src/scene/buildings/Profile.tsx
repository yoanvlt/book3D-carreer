import { Ball, Box, Cylinder, GLASS, METAL, Sign } from '../Primitives';
import { Awning, Bevel, Planter, WallLamp, Windows } from '../kit';
import { color as C } from '../../design/tokens';
import { place, site } from '../../content';

const SKIN = '#ffd3ad';
const HAIR = '#5a3e2e';

/** Profil : un portrait habitable. Jambes = rez-de-chaussée, buste = étages, tête = belvédère. */
export default function Portrait() {
  return (
    <>
      {[-1, 1].map((side) => (
        <group key={side}>
          {/* Chaussures : socle */}
          <Bevel p={[side * 2.5, 0.45, 0.5]} s={[4.1, 0.9, 9.5]} color={C.slate} radius={0.3} />
          <Box p={[side * 2.5, 0.92, 0.5]} s={[3.9, 0.06, 9.3]} color={C.white} shadow={false} />
          {/* Jambes : rez-de-chaussée vitré */}
          <Bevel p={[side * 2.5, 2.4, -0.1]} s={[3.5, 3.2, 7.8]} color='#3f7fc4' radius={0.15} />
          <Windows p={[side * 2.5, 2.45, 3.82]} w={2.6} h={2.2} cols={2} rows={2} lit={[side < 0 ? 1 : 2]} />
          <Windows p={[side * 4.27, 2.45, -0.4]} r={[0, side * (Math.PI / 2), 0]} w={5.2} h={1.6} cols={4} />
          {/* Bras : volumes latéraux, poignets et mains */}
          <Bevel
            p={[side * 6.05, 7.8, -0.3]}
            s={[2.2, 8.7, 5]}
            r={[0, 0, side * 0.14]}
            color={C.orange}
            radius={0.35}
          />
          <Box p={[side * 6.62, 3.95, -0.25]} s={[2.3, 0.45, 5.1]} r={[0, 0, side * 0.14]} color={C.white} />
          <Bevel p={[side * 6.7, 3.1, 0.2]} s={[2, 1.3, 4.2]} color={SKIN} radius={0.4} />
          <group position={[side * 6.05, 7.8, -0.3]} rotation={[0, 0, side * 0.14]}>
            <Windows
              p={[side * 1.12, 0.4, 0]}
              r={[0, side * (Math.PI / 2), 0]}
              w={3.2}
              h={4.4}
              cols={2}
              rows={3}
              lit={[3]}
            />
          </group>
          {/* Col de chemise */}
          <Box p={[side * 1.35, 13.25, 3.72]} s={[2.8, 0.5, 0.3]} r={[0, 0, side * -0.42]} color={C.white} />
        </group>
      ))}
      {/* Ceinture */}
      <Box p={[0, 4.15, -0.1]} s={[8.6, 0.42, 8]} color={C.slate} />
      <Box p={[0, 4.15, 3.92]} s={[0.9, 0.5, 0.12]} color={C.yellow} finish={METAL} />
      {/* Buste : chemise orange, façade vitrée */}
      <Bevel p={[0, 8.8, -0.5]} s={[10.5, 9.6, 8.2]} color='#ff7a4d' radius={0.65} />
      <Windows p={[0, 8.1, 3.72]} w={4.6} h={5.6} cols={3} rows={4} frame={C.white} lit={[4, 7]} />
      <Windows p={[0, 8.6, -4.62]} r={[0, Math.PI, 0]} w={7} h={5} cols={4} rows={3} />
      {[5.4, 7.2, 9, 10.8].map((y) => (
        <Ball key={y} p={[2.75, y, 3.72]} s={[0.16, 0.16, 0.08]} color={C.white} />
      ))}
      <Sign text={site.nom.toUpperCase()} p={[0, 12.1, 3.77]} s={[7.6, 1]} color={C.white} bg='#e8552c' />
      {/* Cou et tête */}
      <Cylinder p={[0, 14, 0]} s={[2, 1.4, 2]} color='#f3b98a' />
      <Bevel p={[0, 18.1, 0]} s={[7.6, 6.9, 6.8]} color={SKIN} radius={0.65} />
      {[-1, 1].map((side) => (
        <Bevel key={side} p={[side * 3.95, 18.1, 0]} s={[0.5, 1.6, 1.2]} color='#f3b98a' radius={0.2} />
      ))}
      {/* Cheveux */}
      <Bevel p={[0, 21.8, -0.35]} s={[8.2, 1.2, 7.5]} color={HAIR} radius={0.3} />
      <Bevel p={[-2.6, 20.95, 3.15]} s={[2.6, 1.6, 0.7]} color={HAIR} radius={0.2} />
      <Bevel p={[0.6, 21.15, 3.2]} s={[2.4, 1.1, 0.6]} color={HAIR} radius={0.2} />
      <Bevel p={[0, 19.4, -3.45]} s={[7.8, 4, 0.5]} color={HAIR} radius={0.2} />
      {/* Lunettes : deux fenêtres panoramiques */}
      {[-2, 2].map((x) => (
        <group key={x}>
          <Bevel p={[x, 18.8, 3.5]} s={[2.5, 1.55, 0.32]} color={C.ink} radius={0.2} />
          <Box p={[x, 18.8, 3.67]} s={[2.1, 1.12, 0.06]} color='#9fd8ec' finish={GLASS} />
          <Box p={[x - 0.45, 19.05, 3.71]} s={[0.5, 0.18, 0.02]} color={C.white} shadow={false} />
        </group>
      ))}
      <Box p={[0, 18.95, 3.62]} s={[1.6, 0.18, 0.15]} color={C.ink} />
      <Box p={[0, 20.1, 3.45]} s={[1.2, 0.16, 0.12]} r={[0, 0, 0.1]} color={HAIR} />
      <Bevel p={[0, 17.6, 3.55]} s={[0.8, 1.1, 0.9]} color='#f0a47a' radius={0.25} />
      <Bevel p={[0, 16.15, 3.45]} s={[2.6, 0.32, 0.16]} color='#c2493a' radius={0.1} />
      {/* Entrée */}
      <Awning p={[0, 4.3, 4.5]} w={4.2} d={1.3} color={C.orange} />
      <Sign text={place('profile').enseigne} p={[0, 5.3, 4.08]} s={[4, 0.8]} color={C.ink} bg={C.white} />
      <WallLamp p={[-2.25, 2.6, 4.25]} />
      <WallLamp p={[2.25, 2.6, 4.25]} />
      <Planter p={[-4.8, 0.9, 5.6]} w={1.8} />
      <Planter p={[4.8, 0.9, 5.6]} w={1.8} />
    </>
  );
}
