import { stationsFor } from './world/narrative';
import InteriorHUD from './ui/InteriorHUD';
import { Component, lazy, Suspense, type ReactNode } from 'react';
import { useGame, setState, enter, openBuilding, resetPlayer, travel, skipJourney, goHome } from './state';
import { buildings } from './world/config';
import Map from './ui/Map';
import Dialog from './ui/Dialog';

const World=lazy(()=>import('./scene/World'));
class SceneBoundary extends Component<{children:ReactNode},{failed:boolean}>{
  state={failed:false};static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<div className='webgl-fallback'><strong>Le campus fait une petite pause.</strong><p>La 3D n’a pas pu démarrer sur ce navigateur. Les six lieux restent accessibles depuis le plan.</p><button onClick={()=>setState({map:true})}>Ouvrir le plan ↗</button></div>:this.props.children;}
}
function Brand(){return <span className='brand'><svg viewBox='0 0 34 34' aria-hidden='true'><path d='M24 7a13 13 0 1 0 0 20M12 13v8m7-8v8' fill='none' stroke='currentColor' strokeWidth='3.4' strokeLinecap='round'/></svg><span>careerverse<span className='brand-dot'>.</span></span></span>;}
function Arrow(){return <span className='button-arrow' aria-hidden='true'>↗</span>;}
export default function App(){
  const state=useGame(),home=state.phase==='home',busy=state.phase!=='home'&&state.phase!=='explore';
  const nearby=buildings.find(b=>b.id===state.nearby),detail=buildings.find(b=>b.id===state.detail);
  const start=()=>{(document.activeElement as HTMLElement)?.blur();enter();};
  return <main className={`app ${home?'is-home':'is-exploring'} ${busy?'is-transitioning':''}`}>
    <div className='world' aria-label='Campus 3D interactif'><SceneBoundary><Suspense fallback={null}><World/></Suspense></SceneBoundary></div>
    <header className='topbar'><button className='brand-button' aria-label='Revenir à la vue aérienne' onClick={goHome}><Brand/></button><span className='header-caption'>LE PORTFOLIO À EXPLORER</span><div className='header-actions'><button className='text-button' aria-label='Ouvrir le plan' onClick={()=>setState({map:true})}><svg viewBox='0 0 24 24' aria-hidden='true'><path d='m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16'/></svg><span>Le plan</span><kbd>M</kbd></button><button className='help-button' aria-label='Commandes et réglages' onClick={()=>setState({help:true})}>?</button></div></header>
    <section className={`hero ${!home?'hero-hidden':''}`} aria-hidden={!home} inert={!home}>
      <div className='eyebrow hero-eyebrow'><span className='tiny-sun'>✳</span> BIENVENUE DANS MON UNIVERS</div>
      <h1>Un parcours.<br/>Tout un <em>monde.</em></h1>
      <div className='hero-rule'/><p className='intro-name'>Yoan Viollet<span>DATA · IA · PROJETS</span></p>
      <p className='hero-description'>Les idées prennent vie, les projets prennent place.<br className='wide-only'/> Découvrez mon parcours, à votre rythme.</p>
      <div className='hero-buttons'><button className='primary desktop-only' onClick={start} disabled={!state.ready}>Entrer dans la ville <Arrow/></button><button className='primary mobile-only' onClick={()=>setState({map:true})}>Explorer les lieux <Arrow/></button><button className='secondary' onClick={()=>setState({map:true})}>Voir le plan <span>↗</span></button></div>
      <p className='hero-hint desktop-only'><span className='keyboard-icon'>⌘</span> Une visite libre, au clavier et à la souris.</p>
    </section>
    {home&&<><div className='world-note'><span className='note-line'/><span>LE CAMPUS DES POSSIBLES<small>Six lieux, autant d’histoires.</small></span></div><footer className='home-footer'><span>UN PETIT MONDE, DE GRANDES IDÉES.</span><span className='footer-center'><i/> OUVERT À LA CURIOSITÉ</span><span>ÉDITION 02 <span className='footer-slash'>/</span> 2026</span></footer></>}
    {!home&&!state.interior&&<>
      <div className='location-label'><span className='eyebrow'>VOUS EXPLOREZ</span><strong>{nearby?nearby.subtitle:'La place des possibles'}</strong></div>
      <nav className='quick-nav' aria-label='Navigation rapide'><span className='quick-title'>LES LIEUX</span>{buildings.map(b=><button key={b.id} title={b.name} aria-label={`Rejoindre ${b.name}`} className={state.nearby===b.id?'active':''} onClick={()=>travel(b.id)} style={{'--place-color':b.color} as React.CSSProperties}><span>{b.number}</span><i/>{state.visited.includes(b.id)&&<sup>✓</sup>}</button>)}</nav>
      <div className='explore-footer'><button className='map-pill' onClick={()=>setState({map:true})}><span>⌖</span> Plan du campus <kbd>M</kbd></button><span className='controls-hint desktop-only'><kbd>ZQSD</kbd> / <kbd>WASD</kbd> se déplacer <span>·</span> glisser pour regarder <span>·</span> <kbd>E</kbd> découvrir</span><span className='visited-count'>{String(state.visited.length).padStart(2,'0')} <span>/ 06 LIEUX DÉCOUVERTS</span></span></div>
      {nearby&&!busy&&!state.map&&!state.detail&&!state.help&&<button className='interaction' onClick={()=>openBuilding(nearby.id)}><kbd>E</kbd><span>Entrer dans <strong>{nearby.name}</strong></span><span>↗</span></button>}
      {state.phase==='entering'&&<div className='transition-caption' role='status'><i/> {state.nearby?'En route vers votre destination…':'Bienvenue dans la ville.'}</div>}
    </>}
    <InteriorHUD/><div id='scene-curtain' aria-hidden='true'/>
    {state.phase==='travel'&&<div className='journey-caption' role='status'><span>En route · suivez le robot</span><button onClick={skipJourney}>Passer le trajet ↗</button></div>}
    {state.notice&&<button className='notice' onClick={()=>setState({notice:''})}>{state.notice} ×</button>}
    {!state.ready&&<div className='loading' role='status'><span className='loading-orbit'/><span>Le campus prend vie…</span></div>}
    {state.map&&<Dialog title='À chaque lieu, son histoire.' eyebrow='LE PLAN DU CAMPUS' close={()=>setState({map:false})} className='map-dialog'><Map/></Dialog>}
    {detail&&<Dialog title={detail.name} eyebrow={`${detail.number} / ${detail.subtitle.toUpperCase()}`} close={()=>setState({detail:null})} className='detail-dialog'>
      <div className='detail-art' style={{'--place-color':detail.color} as React.CSSProperties}><span className='detail-number'>{detail.number}</span><div className={`building-illustration illustration-${detail.id}`}><i/><i/><i/><i/></div><span>CAREERVERSE / LES LIEUX</span></div>
      <p className='detail-description'>{detail.description}</p><div className='tags'>{detail.tags.map(tag=><span key={tag}>{tag}</span>)}</div>
      <div className='coming-next'><span>LE PARCOURS INTÉRIEUR</span><p>Les stations sont accessibles dans l’espace 3D. Les contenus des projets restent à documenter.</p></div>
      <div className='compact-reading'>{stationsFor(detail.id).map(st=><details key={st.id}><summary>{st.title}</summary><p>{st.body}</p></details>)}</div>
      <button className='primary' onClick={()=>setState({detail:null})}>Continuer la visite <Arrow/></button>
    </Dialog>}
    {state.help&&<Dialog title='À vous d’explorer.' eyebrow='COMMANDES & CONFORT' close={()=>setState({help:false})} className='help-dialog'>
      <dl className='controls-list'><div><dt>Marcher</dt><dd><kbd>ZQSD</kbd> <kbd>WASD</kbd> ou <kbd>↑ ← ↓ →</kbd></dd></div><div><dt>Accélérer</dt><dd><kbd>Maj</kbd></dd></div><div><dt>Regarder autour de soi</dt><dd>Cliquer et glisser</dd></div><div><dt>Ajuster la distance</dt><dd>Molette</dd></div><div><dt>Découvrir un lieu</dt><dd><kbd>E</kbd> à proximité</dd></div><div><dt>Ouvrir le plan</dt><dd><kbd>M</kbd></dd></div><div><dt>Recentrer la caméra</dt><dd><kbd>C</kbd></dd></div><div><dt>Retourner sur la place</dt><dd><kbd>R</kbd></dd></div></dl>
      <div className='settings-row'><label htmlFor='quality'>Qualité graphique</label><select id='quality' value={state.quality} onChange={e=>setState({quality:e.target.value as 'high'|'low'})}><option value='high'>Soignée · ombres activées</option><option value='low'>Légère · sans ombres</option></select></div>
      <label className='motion-setting'><input type='checkbox' checked={state.reducedMotion} onChange={e=>setState({reducedMotion:e.target.checked})}/> Réduire les mouvements de caméra</label>
      <div className='performance'><span>{state.fps||'—'} FPS</span> mesure instantanée sur cet appareil</div>
      <button className='secondary' onClick={resetPlayer}>Revenir sur la place centrale ↗</button>
    </Dialog>}
    {new URLSearchParams(window.location.search).has('debug')&&<output id='diagnostics' className='diagnostics' aria-label='Diagnostic de rendu'/>}
    <div className='sr-only' aria-live='polite'>{nearby&&!home?`À proximité : ${nearby.name}. Appuyez sur E pour découvrir ce lieu.`:''}</div>
  </main>;
}

