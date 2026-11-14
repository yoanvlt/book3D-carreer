import { useGame,setState,interact,guideExit,guideToStation } from '../state';
import { buildings } from '../world/config';
import { stationsFor } from '../world/narrative';
import Dialog from './Dialog';
export default function InteriorHUD(){
  const state=useGame();if(!state.interior)return null;
  const b=buildings.find(b=>b.id===state.interior)!,stations=stationsFor(b.id),active=stations.find(s=>s.id===state.station),reading=stations.find(s=>s.id===state.reading),busy=state.phase!=='explore';
  const count=stations.filter(s=>state.seen.includes(b.id+':'+s.id)).length;
  return <>
    <div className='interior-title'><span className='eyebrow'>{b.number} / VOUS ÊTES À L’INTÉRIEUR</span><strong>{b.subtitle}</strong><span>{count} / {stations.length} stations découvertes</span></div>
    <nav className='station-nav' aria-label='Parcours intérieur'>{stations.map((s,i)=><button key={s.id} disabled={busy} className={state.station===s.id?'active':''} onClick={()=>guideToStation(i)} title={s.title} aria-label={`Rejoindre la station ${i+1} : ${s.title}`}>{String(i+1).padStart(2,'0')}{state.seen.includes(b.id+':'+s.id)&&<i/>}</button>)}</nav>
    {!busy&&!state.reading&&!state.map&&!state.help&&active&&<button className='interaction' onClick={interact}><kbd>E</kbd><span>Lire la station<strong>{active.title}</strong></span><span>↗</span></button>}
    <button className='exit-interior' disabled={busy} onClick={guideExit}>Rejoindre la sortie</button>
    {reading&&<Dialog title={reading.title} eyebrow={reading.kicker} close={()=>setState({reading:null})} className='detail-dialog'><p className='detail-description'>{reading.body}</p>{reading.draft&&<p className='draft-note'>Station provisoire — contenu professionnel à intégrer.</p>}<button className='primary' onClick={()=>setState({reading:null})}>Reprendre l’exploration <span>→</span></button></Dialog>}
  </>;
}
