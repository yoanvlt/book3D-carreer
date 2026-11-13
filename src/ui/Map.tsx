import { buildings, type BuildingId } from '../world/config';
import { ring } from '../world/terrain';
import { trees } from '../world/landscape';
import { player, useGame, travel, openBuilding } from '../state';

export default function Map(){const {visited}=useGame();const mobile=window.matchMedia('(max-width: 760px)').matches;
  const select=(id:BuildingId)=>{travel(id);if(mobile)openBuilding(id);};
  return <div className='map-layout'>
    <div className='map-drawing'><svg viewBox='-58 -58 116 116' aria-label='Plan illustré du campus, six destinations' role='img'>
      <defs><pattern id='paper' width='4' height='4' patternUnits='userSpaceOnUse'><circle cx='1' cy='1' r='.12' fill='#bba98b'/></pattern></defs>
      <rect x='-58' y='-58' width='116' height='116' fill='url(#paper)'/>
      <path d='M-48-29Q-20-53 12-46Q45-39 48-9Q58 27 26 43Q-9 54-39 30Q-55 7-48-29' fill='#e9d6b2' stroke='#c6b18a' strokeWidth='.35'/>
      <path d={'M'+ring.map(p=>p.join(',')).join(' L')} fill='none' stroke='#fff7e7' strokeWidth='3.8' strokeLinejoin='round'/>
      {buildings.map(b=><path key={b.id} d={`M0 0L${b.position.join(' ')}`} stroke='#fff7e7' strokeWidth='2.5'/>)}
      <circle r='9' fill='#fff7e7'/><circle r='3' fill='#e99b6b'/><circle r='1.8' fill='#f9ead4'/>
      {trees.map((t,i)=><g key={i}><ellipse cx={t.p[0]+.5} cy={t.p[1]+.9} rx={1.6*t.s} ry={1.4*t.s} fill='#c0b384'/><circle cx={t.p[0]} cy={t.p[1]} r={1.45*t.s} fill={t.kind===1?'#d3a264':'#8d9d68'}/></g>)}
      {buildings.map(b=><g key={b.id} className='map-pin' role='button' aria-label={`Rejoindre ${b.name}`} tabIndex={0} onClick={()=>select(b.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(b.id);}}} transform={`translate(${b.position[0]},${b.position[1]})`}>
        <rect x={-b.size[0]/2+1} y={-b.size[1]/2+1.2} width={b.size[0]} height={b.size[1]} fill='#9f8c70'/>
        <rect x={-b.size[0]/2} y={-b.size[1]/2} width={b.size[0]} height={b.size[1]} rx={b.id==='project-3'?4:.5} fill={b.color} stroke='#fffaeb' strokeWidth='.5'/>
        <text textAnchor='middle' dominantBaseline='central' fontSize='3.2' fill='#fffaf0' fontWeight='700'>{b.number}</text>
        <circle r='9' fill='transparent'/>
      </g>)}
      <g transform={`translate(${player.x},${player.z})`}><circle r='2.1' fill='#243f47' stroke='#fff7e7' strokeWidth='.7'/><circle r='.5' fill='#fff7e7'/></g>
      <g transform='translate(46,-46)'><path d='M0 5V-3M-1.5-1L0-3 1.5-1' fill='none' stroke='#34454a' strokeWidth='.45'/><text y='-5' textAnchor='middle' fontSize='2.8' fill='#34454a'>N</text></g>
    </svg><span className='map-caption'><i/> Vous êtes ici <span>Un lieu. Une histoire.</span></span></div>
    <div className='destination-list'>{buildings.map(b=><button key={b.id} onClick={()=>select(b.id)} className='destination'>
      <span className='dest-number' style={{color:b.color}}>{b.number}</span><span><strong>{b.name}</strong><small>{b.subtitle}</small></span><span className='dest-arrow'>{visited.includes(b.id)?'✓':'↗'}</span>
    </button>)}<p className='map-note'>{mobile?'Sélectionnez un lieu pour découvrir sa présentation.':'Choisissez une destination : le robot vous attendra devant l’entrée.'}</p></div>
  </div>;
}
