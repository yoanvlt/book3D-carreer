import { buildings, type BuildingId } from '../world/config';
import { roads } from '../world/urban';
import { trees } from '../world/landscape';
import { player, setState, travel, useGame } from '../state';
import { color as C, placeColor, ui } from '../design/tokens';
import { isOpen, place } from '../content';

/** Contour de l'île, calculé comme le bord du terrain (voir scene/Terrain.tsx). */
const island = Array.from({ length: 96 }, (_, i) => {
  const a = (i / 96) * Math.PI * 2;
  const r = (66 + 4 * Math.sin(3 * a + 0.5) + 2 * Math.cos(5 * a)) * (60 / 66);
  return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
}).join(' ');

/** Plan de la ville : choisir un lieu y conduit le robot (ou ouvre sa fiche sur mobile). */
export default function Map() {
  const { visited, ready } = useGame();
  const mobile = window.matchMedia('(max-width: 760px)').matches;
  const select = (id: BuildingId) => {
    if (mobile || !ready) setState({ map: false, detail: id });
    else travel(id);
  };
  return (
    <div className='map-layout'>
      <svg
        className='map-drawing'
        viewBox='-64 -64 128 128'
        role='img'
        aria-label='Plan de la ville et des six lieux'
      >
        <rect x='-64' y='-64' width='128' height='128' fill={C.water} />
        <polygon points={island} fill={C.grass} stroke={C.earth} strokeWidth='1.2' />
        {roads.map((points, i) => (
          <path
            key={i}
            d={'M' + points.map((p) => p.join(',')).join(' L')}
            fill='none'
            stroke={C.path}
            strokeWidth='3.6'
            strokeLinejoin='round'
            strokeLinecap='round'
          />
        ))}
        <rect x='-8' y='-6' width='16' height='12' rx='1' fill={C.path} />
        {trees.map((t, i) => (
          <circle key={i} cx={t.p[0]} cy={t.p[1]} r={1.4 * t.s} fill={t.kind === 1 ? C.leafAutumn : C.leaf} />
        ))}
        {buildings.map((b) => (
          <g
            key={b.id}
            className='map-pin'
            role='button'
            tabIndex={0}
            aria-label={`Aller à ${place(b.id).titre}`}
            onClick={() => select(b.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                select(b.id);
              }
            }}
          >
            <rect
              x={-b.size[0] / 2}
              y={-b.size[1] / 2}
              width={b.size[0]}
              height={b.size[1]}
              rx={b.id === 'project-3' ? 5 : 1.2}
              fill={placeColor[b.id]}
              stroke={C.white}
              strokeWidth='0.8'
              transform={`translate(${b.position[0]},${b.position[1]}) rotate(${(-b.rotation * 180) / Math.PI})`}
            />
            <text
              x={b.position[0]}
              y={b.position[1] + b.size[1] / 2 + 5}
              textAnchor='middle'
              fontSize='4.2'
              fontWeight='700'
              fill={ui.ink}
              stroke={C.white}
              strokeWidth='1.1'
              paintOrder='stroke'
            >
              {place(b.id).titre}
            </text>
          </g>
        ))}
        <g transform={`translate(${player.x},${player.z})`}>
          <circle r='2.4' fill={ui.ink} stroke={C.white} strokeWidth='0.8' />
          <circle r='0.7' fill={C.white} />
        </g>
      </svg>
      <div className='destination-list'>
        {buildings.map((b) => (
          <button key={b.id} onClick={() => select(b.id)} className='destination'>
            <span className='destination-dot' style={{ background: placeColor[b.id] }} aria-hidden='true' />
            <span className='destination-text'>
              <strong>{place(b.id).titre}</strong>
              <small>{isOpen(b.id) ? place(b.id).sous_titre : 'Bientôt'}</small>
            </span>
            {visited.includes(b.id) && <span className='destination-visited'>Visité</span>}
          </button>
        ))}
        <p className='map-note'>
          {mobile
            ? 'Choisissez un lieu pour lire sa fiche.'
            : 'Choisissez un lieu : le robot vous y conduit.'}
        </p>
      </div>
    </div>
  );
}
