import React, { useState, useCallback } from 'react';

// ─── Pain level config ────────────────────────────────────────────────────────
const P = {
  X: { label: 'Extreme',  color: '#ff3131', glow: 'rgba(255,49,49,.55)'   },
  H: { label: 'High',     color: '#ff914d', glow: 'rgba(255,145,77,.55)'  },
  M: { label: 'Moderate', color: '#ffde59', glow: 'rgba(255,222,89,.55)'  },
  L: { label: 'Low',      color: '#00bf63', glow: 'rgba(0,191,99,.55)'    },
};

// ─── Zone data ────────────────────────────────────────────────────────────────
const ZONES = {
  head:        { n: 'Head',               lv: 'H', tip: 'Cranial bone vibrates sharply. Temple, forehead and crown are especially intense — no fat buffer between skin and skull.' },
  ear:         { n: 'Ears',               lv: 'X', tip: 'Cartilage rings with painful resonance. The helix, tragus and earlobe each have distinct profiles — cartilage zones are brutal.' },
  nose:        { n: 'Nose',               lv: 'X', tip: 'Dense nerve endings in nasal cartilage. Eyes water involuntarily — the bridge causes full-face vibration. Very rare placement for good reason.' },
  neck_f:      { n: 'Neck (front)',        lv: 'X', tip: 'Major nerve trunks close to the surface. Thin skin, visible tendons, and psychological discomfort combine for maximum intensity.' },
  neck_b:      { n: 'Back of neck',        lv: 'X', tip: 'Cervical vertebrae protrude close to the surface. Thin skin, deep spine resonance — uniquely unpleasant.' },
  collarbone:  { n: 'Collarbone',          lv: 'H', tip: 'The clavicle sits just beneath with almost no padding. Sharp contact pain and bone resonance through the whole shoulder girdle.' },
  chest_m:     { n: 'Chest',              lv: 'M', tip: 'Pec muscle provides decent cushioning. The sternum center line spikes sharply. Outer chest is manageable.' },
  chest_f:     { n: 'Chest',              lv: 'H', tip: 'Less muscle mass means more bone contact. Sternum and collarbone proximity make this a high-pain zone on leaner frames.' },
  sternum:     { n: 'Sternum',            lv: 'X', tip: 'Pure bone millimetres beneath the skin. The needle vibrates against the breastbone — a deeply unpleasant grinding sensation with zero cushion.' },
  ribs:        { n: 'Ribs',               lv: 'X', tip: 'Universally dreaded. Thin intercostal skin over each rib. Every inhale shifts the canvas. Most artists consider this the most painful area.' },
  stomach:     { n: 'Stomach',            lv: 'H', tip: 'Soft tissue over organs is surprisingly sensitive. Tickle-pain mixes with sharp stabs, and the area cramps during long sessions.' },
  armpit:      { n: 'Armpit',             lv: 'X', tip: 'Lymph node clusters, hypersensitive skin, and awkward positioning. One of the most avoided spots on the entire body.' },
  shoulder:    { n: 'Shoulder',           lv: 'L', tip: 'Meaty deltoid absorbs vibration beautifully. A classic beginner placement with fast healing and reliable comfort.' },
  outer_arm:   { n: 'Outer arm',          lv: 'L', tip: 'Outer bicep and tricep are ideal starter zones. Good muscle padding, sparse nerve clusters, easy to work on.' },
  inner_arm:   { n: 'Inner arm',          lv: 'H', tip: 'The inner bicep has thin skin over the brachial artery and nerve trunk. Noticeably more sensitive than the outer arm.' },
  inner_elbow: { n: 'Inner elbow',        lv: 'X', tip: 'The ditch. Major nerve branches under thin, crease-folded skin. Artists consistently rank this in the top three most painful spots.' },
  outer_elbow: { n: 'Outer elbow',        lv: 'X', tip: 'Bone-on-skin, zero cushion. The olecranon is millimetres beneath — tooth-rattling vibration with every needle pass.' },
  forearm:     { n: 'Forearm',            lv: 'L', tip: 'The outer forearm is one of the best beginner placements. Flat, padded, easy to heal. Inner forearm more sensitive near the wrist.' },
  wrist:       { n: 'Wrist',              lv: 'H', tip: 'Thin skin over tendons and the median nerve. The underside produces a stinging, sometimes shooting sensation into the fingers.' },
  hand_back:   { n: 'Hand (back)',         lv: 'H', tip: 'Bony metacarpals under thin skin. High pain and high-maintenance — ink fades fast due to constant movement.' },
  hand_palm:   { n: 'Palm',               lv: 'X', tip: 'Extreme nerve density. The palm is one of the most sensitive surfaces on the human body. Ink retention is also poor.' },
  fingers:     { n: 'Fingers',            lv: 'X', tip: 'Four digital nerves per finger, plus bony knuckle joints with zero padding. Among the most painful spots — and the fastest to fade.' },
  hip:         { n: 'Hip / Pelvis',        lv: 'H', tip: 'The iliac crest is prominent and shallow. Hip dip areas have thin skin over bone. Beautiful placement that demands real pain tolerance.' },
  groin:       { n: 'Groin',              lv: 'X', tip: 'Dense inguinal nerve network, lymph nodes, and thin skin over femoral vessels. Extremely uncomfortable — experienced collectors only.' },
  thigh_out:   { n: 'Outer thigh',         lv: 'L', tip: 'One of the largest and most forgiving canvases. Thick muscle, few nerve clusters. Excellent for large elaborate pieces.' },
  thigh_in:    { n: 'Inner thigh',         lv: 'H', tip: 'Thin, sensitive skin with nerve trunks close to the surface. The inner thigh rubs during healing, adding to difficulty.' },
  knee_cap:    { n: 'Kneecap',            lv: 'X', tip: 'The patella with a thin connective tissue cover. Produces a nauseating grinding vibration — one of the most dreaded spots unanimously.' },
  knee_side:   { n: 'Side of knee',        lv: 'H', tip: 'Ligament and tendon areas with concentrated nerve endings. Less extreme than the cap, but still a notably intense experience.' },
  shin:        { n: 'Shin',               lv: 'H', tip: 'The tibia runs directly beneath the skin. Each needle pass sends vibration through the entire bone — jarring and persistent.' },
  calf:        { n: 'Calf',               lv: 'M', tip: 'Gastrocnemius muscle provides reasonable cushioning. Outer calf is comfortable; inner side sharpens toward the shin bone.' },
  ankle:       { n: 'Ankle',              lv: 'H', tip: 'Bony prominences with thin skin around the joint. The Achilles area and malleolus are especially sharp — bone close everywhere.' },
  foot_top:    { n: 'Top of foot',         lv: 'H', tip: 'Metatarsal bones just beneath thin skin. A persistent bone-vibration pain. Flexing during healing also slows recovery.' },
  foot_sole:   { n: 'Sole',               lv: 'X', tip: 'Extreme nerve density like the palm. Ink retention is also terrible — a painful placement that rarely lasts well.' },
  toes:        { n: 'Toes',               lv: 'X', tip: 'Digital nerves full-length, bony joints, zero padding, constant movement during healing. Arguably the most difficult foot placement.' },
  upper_back:  { n: 'Upper back',          lv: 'M', tip: 'Broad trapezius and rhomboid muscles create a generous cushion. A popular, forgiving canvas. One of the best zones on the body.' },
  spine:       { n: 'Spine',              lv: 'X', tip: 'Vertebrae protrude into the skin along the entire column. The needle vibrates on bone — buzzing deep pain, worst in the lumbar region.' },
  mid_back:    { n: 'Mid back',            lv: 'M', tip: 'Good muscle mass away from the spine. Reliable for large pieces — manageable pain with excellent ink retention.' },
  lower_back:  { n: 'Lower back',          lv: 'H', tip: 'Lumbar nerves fan close to the skin. Less muscle than mid back. Sacral dimples and tailbone area are noticeably sharper.' },
  sacrum:      { n: 'Sacrum / Tailbone',   lv: 'X', tip: 'A flat bone very close to the surface. Produces radiating pain through the lower body — one of the most complained-about back placements.' },
  glutes:      { n: 'Glutes',             lv: 'L', tip: 'Maximum muscle mass. The glutes are the single most cushioned zone on the human body — genuinely comfortable even for long sessions.' },
  hamstring:   { n: 'Hamstrings',         lv: 'L', tip: 'Dense posterior thigh muscle. A surprisingly comfortable and underused canvas. Heals well and holds ink beautifully.' },
  back_knee:   { n: 'Back of knee',        lv: 'X', tip: 'The popliteal fossa — thin, crease-folded skin over major blood vessels and the tibial nerve. Deep, radiating pain.' },
  heel:        { n: 'Heel',               lv: 'H', tip: 'The calcaneus heel bone beneath thick but nerve-rich skin. A heavy, thudding contact pain unlike anywhere else on the body.' },
};

// ─── Glow SVG filter ─────────────────────────────────────────────────────────
const GlowFilter = ({ id }) => (
  <defs>
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3.5" result="b" />
      <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>
);

// ─── Primitives ───────────────────────────────────────────────────────────────
const BASE = '#1c1c1e';
const S = '#3a3a3e';

function Z({ zk, az, onEnter, onLeave, fid, children }) {
  const d = ZONES[zk];
  const on = az === zk;
  return (
    <g onMouseEnter={() => onEnter(zk)} onMouseLeave={onLeave} style={{ cursor: 'pointer' }}>
      {React.Children.map(children, c => React.cloneElement(c, {
        fill: on ? (d ? P[d.lv].color : BASE) : BASE,
        stroke: S, strokeWidth: 0.6,
        filter: on ? `url(#${fid})` : undefined,
        style: { transition: 'fill .3s, filter .3s' },
      }))}
    </g>
  );
}

function D({ t: Tag, ...p }) {
  return <Tag fill="none" stroke="#2a2a2e" strokeWidth={0.4} {...p} />;
}

// ─── Male Front ───────────────────────────────────────────────────────────────
function MaleFront(pr) {
  const z = (k, el) => <Z key={k + Math.random()} zk={k} az={pr.az} onEnter={pr.onEnter} onLeave={pr.onLeave} fid="gf">{el}</Z>;
  return <>
    {z('head',       <ellipse cx={100} cy={40} rx={27} ry={33} />)}
    <D t="ellipse" cx={73} cy={40} rx={5} ry={8} fill="#181818" stroke="#2e2e2e" />
    <D t="ellipse" cx={127} cy={40} rx={5} ry={8} fill="#181818" stroke="#2e2e2e" />
    {z('ear',        <path d="M68,34 Q62,40 68,48 Q65,44 66,40 Q65,36 68,34Z" />)}
    {z('ear',        <path d="M132,34 Q138,40 132,48 Q135,44 134,40 Q135,36 132,34Z" />)}
    <D t="ellipse" cx={92} cy={39} rx={3.5} ry={4.5} fill="#232325" stroke="#555" />
    <D t="ellipse" cx={108} cy={39} rx={3.5} ry={4.5} fill="#232325" stroke="#555" />
    {z('nose',       <path d="M100,42 Q97,50 95,53 Q98,55 100,55 Q102,55 105,53 Q103,50 100,42Z" />)}
    <D t="path" d="M96,56 Q100,60 104,56" stroke="#555" strokeWidth={0.7} />
    {z('neck_f',     <rect x={89} y={72} width={22} height={24} rx={5} />)}
    {z('shoulder',   <path d="M64,96 Q54,94 46,102 Q44,112 52,116 L67,112Z" />)}
    {z('shoulder',   <path d="M136,96 Q146,94 154,102 Q156,112 148,116 L133,112Z" />)}
    {z('collarbone', <path d="M80,92 Q100,88 120,92 L122,98 Q100,94 78,98Z" />)}
    {z('chest_m',    <path d="M78,98 L122,98 L126,138 L74,138Z" />)}
    <D t="line" x1={100} y1={100} x2={100} y2={137} stroke="#303034" />
    <D t="ellipse" cx={88} cy={114} rx={11} ry={10} />
    <D t="ellipse" cx={112} cy={114} rx={11} ry={10} />
    {z('sternum',    <rect x={95} y={100} width={10} height={38} rx={4} />)}
    {z('ribs',       <path d="M74,138 L126,138 L124,200 Q100,212 76,200Z" />)}
    <D t="line" x1={100} y1={140} x2={100} y2={200} />
    {[152,165,178,191].map(y => <D key={y} t="line" x1={77} y1={y} x2={123} y2={y} />)}
    {z('armpit',     <path d="M67,112 Q60,118 62,130 Q68,126 72,120Z" />)}
    {z('armpit',     <path d="M133,112 Q140,118 138,130 Q132,126 128,120Z" />)}
    {z('stomach',    <path d="M76,200 Q100,212 124,200 L122,240 Q100,250 78,240Z" />)}
    {z('hip',        <path d="M78,240 Q60,246 58,268 Q70,276 86,272 L100,252Z" />)}
    {z('hip',        <path d="M122,240 Q140,246 142,268 Q130,276 114,272 L100,252Z" />)}
    {z('groin',      <path d="M86,272 Q100,280 114,272 Q110,290 100,296 Q90,290 86,272Z" />)}
    {z('inner_arm',  <path d="M67,112 L55,108 L40,200 L54,204 L66,126Z" />)}
    {z('outer_arm',  <path d="M52,116 L40,116 L26,200 L40,204 L52,126Z" />)}
    {z('inner_arm',  <path d="M133,112 L145,108 L160,200 L146,204 L134,126Z" />)}
    {z('outer_arm',  <path d="M148,116 L160,116 L174,200 L160,204 L148,126Z" />)}
    {z('inner_elbow',<ellipse cx={47} cy={208} rx={10} ry={9} />)}
    {z('inner_elbow',<ellipse cx={153} cy={208} rx={10} ry={9} />)}
    {z('outer_elbow',<ellipse cx={34} cy={206} rx={8} ry={7} />)}
    {z('outer_elbow',<ellipse cx={166} cy={206} rx={8} ry={7} />)}
    {z('forearm',    <path d="M38,212 L56,214 L58,276 L40,280Z" />)}
    {z('forearm',    <path d="M162,212 L144,214 L142,276 L160,280Z" />)}
    {z('wrist',      <rect x={36} y={280} width={22} height={14} rx={4} />)}
    {z('wrist',      <rect x={142} y={280} width={22} height={14} rx={4} />)}
    {z('hand_back',  <path d="M36,294 L58,294 L58,322 Q47,328 36,322Z" />)}
    {z('hand_back',  <path d="M142,294 L164,294 L164,322 Q153,328 142,322Z" />)}
    {z('hand_palm',  <path d="M36,294 L38,320 Q47,328 58,322 L58,294Z" />)}
    {z('hand_palm',  <path d="M164,294 L162,320 Q153,328 142,322 L142,294Z" />)}
    {[{x:36,w:4},{x:41,w:4},{x:46,w:4},{x:51,w:4},{x:56,w:3}].map((f,i) =>
      z('fingers', <rect key={i} x={f.x} y={328} width={f.w} height={20} rx={2} />)
    )}
    {[{x:141,w:3},{x:145,w:4},{x:150,w:4},{x:155,w:4},{x:160,w:4}].map((f,i) =>
      z('fingers', <rect key={i} x={f.x} y={328} width={f.w} height={20} rx={2} />)
    )}
    {z('thigh_out',  <path d="M60,272 Q44,284 42,360 Q54,374 72,374 Q84,366 90,292 L86,272Z" />)}
    {z('thigh_out',  <path d="M140,272 Q156,284 158,360 Q146,374 128,374 Q116,366 110,292 L114,272Z" />)}
    {z('thigh_in',   <path d="M86,272 Q100,252 114,272 Q110,292 100,298 Q90,292 86,272Z" />)}
    {z('knee_cap',   <ellipse cx={57} cy={383} rx={16} ry={14} />)}
    {z('knee_cap',   <ellipse cx={143} cy={383} rx={16} ry={14} />)}
    {z('knee_side',  <path d="M42,375 Q40,390 44,400 L54,398 Q52,386 50,374Z" />)}
    {z('knee_side',  <path d="M158,375 Q160,390 156,400 L146,398 Q148,386 150,374Z" />)}
    {z('shin',       <path d="M44,400 L72,400 L70,490 L46,490Z" />)}
    {z('shin',       <path d="M156,400 L128,400 L130,490 L154,490Z" />)}
    {z('calf',       <path d="M72,400 L86,400 L84,480 L72,490Z" />)}
    {z('calf',       <path d="M128,400 L114,400 L116,480 L128,490Z" />)}
    {z('ankle',      <path d="M44,490 L86,490 L84,510 L46,510Z" />)}
    {z('ankle',      <path d="M156,490 L114,490 L116,510 L154,510Z" />)}
    {z('foot_top',   <path d="M46,510 Q57,526 70,528 L80,512 L84,510Z" />)}
    {z('foot_top',   <path d="M154,510 Q143,526 130,528 L120,512 L116,510Z" />)}
    {z('foot_sole',  <path d="M46,510 L46,518 Q57,534 72,532 L70,528 Q57,526 46,510Z" />)}
    {z('foot_sole',  <path d="M154,510 L154,518 Q143,534 128,532 L130,528 Q143,526 154,510Z" />)}
    {[{x:48},{x:54},{x:59},{x:64},{x:69}].map((t,i) =>
      z('toes', <rect key={i} x={t.x} y={528} width={4} height={14} rx={2} />)
    )}
    {[{x:131},{x:126},{x:121},{x:116},{x:111}].map((t,i) =>
      z('toes', <rect key={i} x={t.x} y={528} width={4} height={14} rx={2} />)
    )}
  </>;
}

// ─── Female Front ─────────────────────────────────────────────────────────────
function FemaleFront(pr) {
  const z = (k, el) => <Z key={k + Math.random()} zk={k} az={pr.az} onEnter={pr.onEnter} onLeave={pr.onLeave} fid="gf">{el}</Z>;
  return <>
    {z('head',       <ellipse cx={100} cy={40} rx={25} ry={31} />)}
    <path d="M75,24 Q100,8 125,24 Q132,14 132,38 Q122,12 100,16 Q78,12 68,38 Q68,14 75,24Z" fill="#1e1e22" stroke="none" />
    <D t="ellipse" cx={73} cy={40} rx={4.5} ry={7} fill="#181818" stroke="#2e2e2e" />
    <D t="ellipse" cx={127} cy={40} rx={4.5} ry={7} fill="#181818" stroke="#2e2e2e" />
    {z('ear',        <path d="M69,34 Q63,40 69,47 Q66,44 67,40 Q66,36 69,34Z" />)}
    {z('ear',        <path d="M131,34 Q137,40 131,47 Q134,44 133,40 Q134,36 131,34Z" />)}
    <D t="ellipse" cx={92} cy={39} rx={3} ry={4} fill="#232325" stroke="#555" />
    <D t="ellipse" cx={108} cy={39} rx={3} ry={4} fill="#232325" stroke="#555" />
    {z('nose',       <path d="M100,42 Q97,50 95,53 Q98,55 100,55 Q102,55 105,53 Q103,50 100,42Z" />)}
    <D t="path" d="M96,57 Q100,61 104,57" stroke="#555" strokeWidth={0.7} />
    {z('neck_f',     <rect x={91} y={70} width={18} height={22} rx={5} />)}
    {z('shoulder',   <path d="M68,96 Q58,94 50,102 Q48,110 56,114 L70,110Z" />)}
    {z('shoulder',   <path d="M132,96 Q142,94 150,102 Q152,110 144,114 L130,110Z" />)}
    {z('collarbone', <path d="M82,90 Q100,86 118,90 L120,96 Q100,92 80,96Z" />)}
    {z('chest_f',    <path d="M80,96 L120,96 L124,132 L76,132Z" />)}
    <D t="ellipse" cx={88} cy={118} rx={14} ry={13} fill="#1e1e20" stroke="#2e2e30" strokeWidth={0.6} />
    <D t="ellipse" cx={112} cy={118} rx={14} ry={13} fill="#1e1e20" stroke="#2e2e30" strokeWidth={0.6} />
    {z('sternum',    <rect x={96} y={98} width={8} height={36} rx={4} />)}
    {z('ribs',       <path d="M76,132 L124,132 L120,188 Q100,198 80,188Z" />)}
    <D t="line" x1={100} y1={134} x2={100} y2={188} />
    {z('armpit',     <path d="M69,110 Q62,116 64,126 Q70,122 74,116Z" />)}
    {z('armpit',     <path d="M131,110 Q138,116 136,126 Q130,122 126,116Z" />)}
    {z('stomach',    <path d="M80,188 Q100,198 120,188 L118,226 Q100,236 82,226Z" />)}
    {z('hip',        <path d="M82,226 Q62,238 58,268 Q72,280 90,274 L104,248Z" />)}
    {z('hip',        <path d="M118,226 Q138,238 142,268 Q128,280 110,274 L96,248Z" />)}
    {z('groin',      <path d="M90,274 Q100,282 110,274 Q106,292 100,298 Q94,292 90,274Z" />)}
    {z('inner_arm',  <path d="M69,110 L57,106 L42,198 L56,202 L68,124Z" />)}
    {z('outer_arm',  <path d="M54,114 L42,114 L28,198 L42,202 L54,124Z" />)}
    {z('inner_arm',  <path d="M131,110 L143,106 L158,198 L144,202 L132,124Z" />)}
    {z('outer_arm',  <path d="M146,114 L158,114 L172,198 L158,202 L146,124Z" />)}
    {z('inner_elbow',<ellipse cx={49} cy={206} rx={10} ry={9} />)}
    {z('inner_elbow',<ellipse cx={151} cy={206} rx={10} ry={9} />)}
    {z('outer_elbow',<ellipse cx={36} cy={204} rx={8} ry={7} />)}
    {z('outer_elbow',<ellipse cx={164} cy={204} rx={8} ry={7} />)}
    {z('forearm',    <path d="M40,210 L58,212 L56,272 L38,276Z" />)}
    {z('forearm',    <path d="M160,210 L142,212 L144,272 L162,276Z" />)}
    {z('wrist',      <rect x={36} y={276} width={22} height={13} rx={4} />)}
    {z('wrist',      <rect x={142} y={276} width={22} height={13} rx={4} />)}
    {z('hand_back',  <path d="M36,289 L58,289 L57,316 Q47,322 36,316Z" />)}
    {z('hand_back',  <path d="M142,289 L164,289 L164,316 Q153,322 143,316Z" />)}
    {z('hand_palm',  <path d="M36,289 L38,315 Q47,322 57,316 L58,289Z" />)}
    {z('hand_palm',  <path d="M164,289 L162,315 Q153,322 143,316 L142,289Z" />)}
    {[{x:36,w:4},{x:41,w:4},{x:46,w:4},{x:51,w:4},{x:56,w:3}].map((f,i) =>
      z('fingers', <rect key={i} x={f.x} y={322} width={f.w} height={18} rx={2} />)
    )}
    {[{x:141,w:3},{x:145,w:4},{x:150,w:4},{x:155,w:4},{x:160,w:4}].map((f,i) =>
      z('fingers', <rect key={i} x={f.x} y={322} width={f.w} height={18} rx={2} />)
    )}
    {z('thigh_out',  <path d="M58,268 Q42,282 40,360 Q54,376 74,376 Q86,368 92,290 L90,274Z" />)}
    {z('thigh_out',  <path d="M142,268 Q158,282 160,360 Q146,376 126,376 Q114,368 108,290 L110,274Z" />)}
    {z('thigh_in',   <path d="M90,274 Q100,254 110,274 Q106,292 100,298 Q94,292 90,274Z" />)}
    {z('knee_cap',   <ellipse cx={57} cy={385} rx={16} ry={13} />)}
    {z('knee_cap',   <ellipse cx={143} cy={385} rx={16} ry={13} />)}
    {z('knee_side',  <path d="M42,377 Q40,392 44,402 L54,400 Q52,388 50,376Z" />)}
    {z('knee_side',  <path d="M158,377 Q160,392 156,402 L146,400 Q148,388 150,376Z" />)}
    {z('shin',       <path d="M44,402 L72,402 L70,488 L46,488Z" />)}
    {z('shin',       <path d="M156,402 L128,402 L130,488 L154,488Z" />)}
    {z('calf',       <path d="M72,402 L86,402 L84,478 L72,488Z" />)}
    {z('calf',       <path d="M128,402 L114,402 L116,478 L128,488Z" />)}
    {z('ankle',      <path d="M44,488 L86,488 L84,508 L46,508Z" />)}
    {z('ankle',      <path d="M156,488 L114,488 L116,508 L154,508Z" />)}
    {z('foot_top',   <path d="M46,508 Q57,524 70,526 L80,510 L84,508Z" />)}
    {z('foot_top',   <path d="M154,508 Q143,524 130,526 L120,510 L116,508Z" />)}
    {z('foot_sole',  <path d="M46,508 L46,516 Q57,532 70,530 L70,526 Q57,524 46,508Z" />)}
    {z('foot_sole',  <path d="M154,508 L154,516 Q143,532 130,530 L130,526 Q143,524 154,508Z" />)}
    {[{x:48},{x:54},{x:59},{x:64},{x:69}].map((t,i) =>
      z('toes', <rect key={i} x={t.x} y={526} width={4} height={13} rx={2} />)
    )}
    {[{x:131},{x:126},{x:121},{x:116},{x:111}].map((t,i) =>
      z('toes', <rect key={i} x={t.x} y={526} width={4} height={13} rx={2} />)
    )}
  </>;
}

// ─── Male Back ────────────────────────────────────────────────────────────────
function MaleBack(pr) {
  const z = (k, el) => <Z key={k + Math.random()} zk={k} az={pr.az} onEnter={pr.onEnter} onLeave={pr.onLeave} fid="gb">{el}</Z>;
  return <>
    {z('head',       <ellipse cx={100} cy={40} rx={27} ry={33} />)}
    {z('ear',        <path d="M68,34 Q62,40 68,48 Q65,44 66,40 Q65,36 68,34Z" />)}
    {z('ear',        <path d="M132,34 Q138,40 132,48 Q135,44 134,40 Q135,36 132,34Z" />)}
    {z('neck_b',     <rect x={89} y={72} width={22} height={24} rx={5} />)}
    {z('upper_back', <path d="M70,96 Q100,100 130,96 L138,110 Q100,122 62,110Z" />)}
    {z('spine',      <rect x={97} y={100} width={6} height={180} rx={3} />)}
    {z('mid_back',   <path d="M62,110 Q100,122 138,110 L134,196 Q100,204 66,196Z" />)}
    <D t="ellipse" cx={83} cy={146} rx={14} ry={18} />
    <D t="ellipse" cx={117} cy={146} rx={14} ry={18} />
    {z('lower_back', <path d="M66,196 Q100,204 134,196 L130,240 Q100,250 70,240Z" />)}
    {z('sacrum',     <path d="M70,240 Q100,250 130,240 L126,272 Q100,282 74,272Z" />)}
    {z('glutes',     <path d="M74,272 Q100,282 126,272 L122,318 Q100,330 78,318Z" />)}
    <D t="ellipse" cx={86} cy={296} rx={16} ry={15} />
    <D t="ellipse" cx={114} cy={296} rx={16} ry={15} />
    {z('shoulder',   <path d="M62,110 Q50,106 44,114 Q44,124 54,128 L68,124Z" />)}
    {z('shoulder',   <path d="M138,110 Q150,106 156,114 Q156,124 146,128 L132,124Z" />)}
    {z('outer_arm',  <path d="M46,118 L34,118 L20,204 L34,208 L48,132Z" />)}
    {z('inner_arm',  <path d="M62,114 L50,110 L36,202 L50,206 L62,128Z" />)}
    {z('outer_arm',  <path d="M154,118 L166,118 L180,204 L166,208 L152,132Z" />)}
    {z('inner_arm',  <path d="M138,114 L150,110 L164,202 L150,206 L138,128Z" />)}
    {z('outer_elbow',<ellipse cx={28} cy={210} rx={8} ry={7} />)}
    {z('outer_elbow',<ellipse cx={172} cy={210} rx={8} ry={7} />)}
    {z('inner_elbow',<ellipse cx={40} cy={212} rx={10} ry={9} />)}
    {z('inner_elbow',<ellipse cx={160} cy={212} rx={10} ry={9} />)}
    {z('forearm',    <path d="M22,216 L42,218 L40,282 L22,286Z" />)}
    {z('forearm',    <path d="M178,216 L158,218 L160,282 L178,286Z" />)}
    {z('wrist',      <rect x={20} y={286} width={22} height={13} rx={4} />)}
    {z('wrist',      <rect x={158} y={286} width={22} height={13} rx={4} />)}
    {z('hand_back',  <path d="M20,299 L42,299 L41,328 Q31,334 20,328Z" />)}
    {z('hand_back',  <path d="M158,299 L180,299 L180,328 Q170,334 159,328Z" />)}
    {[{x:20,w:4},{x:25,w:4},{x:30,w:4},{x:35,w:4},{x:40,w:3}].map((f,i) =>
      z('fingers', <rect key={i} x={f.x} y={334} width={f.w} height={20} rx={2} />)
    )}
    {[{x:157,w:3},{x:161,w:4},{x:166,w:4},{x:171,w:4},{x:176,w:4}].map((f,i) =>
      z('fingers', <rect key={i} x={f.x} y={334} width={f.w} height={20} rx={2} />)
    )}
    {z('hamstring',  <path d="M78,318 Q62,330 60,410 Q74,424 92,420 Q104,412 108,332Z" />)}
    {z('hamstring',  <path d="M122,318 Q138,330 140,410 Q126,424 108,420 Q96,412 92,332Z" />)}
    {z('back_knee',  <ellipse cx={76} cy={430} rx={16} ry={13} />)}
    {z('back_knee',  <ellipse cx={124} cy={430} rx={16} ry={13} />)}
    {z('calf',       <path d="M62,442 L92,442 L90,510 L64,510Z" />)}
    {z('calf',       <path d="M138,442 L108,442 L110,510 L136,510Z" />)}
    {z('shin',       <path d="M92,442 L102,442 L100,510 L90,510Z" />)}
    {z('shin',       <path d="M108,442 L98,442 L100,510 L110,510Z" />)}
    {z('ankle',      <path d="M62,510 L102,510 L100,530 L64,530Z" />)}
    {z('ankle',      <path d="M138,510 L98,510 L100,530 L136,530Z" />)}
    {z('heel',       <path d="M64,530 Q76,548 88,546 L88,530Z" />)}
    {z('heel',       <path d="M136,530 Q124,548 112,546 L112,530Z" />)}
    {z('foot_sole',  <path d="M64,530 L64,540 Q76,556 92,554 L88,546 Q76,548 64,530Z" />)}
    {z('foot_sole',  <path d="M136,530 L136,540 Q124,556 108,554 L112,546 Q124,548 136,530Z" />)}
    {[{x:66},{x:72},{x:77},{x:82},{x:87}].map((t,i) =>
      z('toes', <rect key={i} x={t.x} y={550} width={4} height={13} rx={2} />)
    )}
    {[{x:113},{x:108},{x:103},{x:98},{x:93}].map((t,i) =>
      z('toes', <rect key={i} x={t.x} y={550} width={4} height={13} rx={2} />)
    )}
  </>;
}

// ─── Female Back ──────────────────────────────────────────────────────────────
function FemaleBack(pr) {
  const z = (k, el) => <Z key={k + Math.random()} zk={k} az={pr.az} onEnter={pr.onEnter} onLeave={pr.onLeave} fid="gb">{el}</Z>;
  return <>
    {z('head',       <ellipse cx={100} cy={40} rx={25} ry={31} />)}
    <path d="M75,24 Q100,8 125,24 Q132,14 132,38 Q122,12 100,16 Q78,12 68,38 Q68,14 75,24Z" fill="#1e1e22" stroke="none" />
    {z('ear',        <path d="M70,34 Q64,40 70,47 Q67,44 68,40 Q67,36 70,34Z" />)}
    {z('ear',        <path d="M130,34 Q136,40 130,47 Q133,44 132,40 Q133,36 130,34Z" />)}
    {z('neck_b',     <rect x={91} y={70} width={18} height={22} rx={5} />)}
    {z('upper_back', <path d="M72,92 Q100,96 128,92 L134,106 Q100,118 66,106Z" />)}
    {z('spine',      <rect x={97} y={96} width={6} height={174} rx={3} />)}
    {z('mid_back',   <path d="M66,106 Q100,118 134,106 L130,190 Q100,198 70,190Z" />)}
    <D t="ellipse" cx={85} cy={140} rx={12} ry={16} />
    <D t="ellipse" cx={115} cy={140} rx={12} ry={16} />
    {z('lower_back', <path d="M70,190 Q100,198 130,190 L126,232 Q100,242 74,232Z" />)}
    {z('sacrum',     <path d="M74,232 Q100,242 126,232 L122,266 Q100,276 78,266Z" />)}
    {z('glutes',     <path d="M78,266 Q100,276 122,266 L130,316 Q100,334 70,316Z" />)}
    <D t="ellipse" cx={86} cy={294} rx={18} ry={16} />
    <D t="ellipse" cx={114} cy={294} rx={18} ry={16} />
    {z('shoulder',   <path d="M66,106 Q54,102 48,110 Q48,120 58,124 L72,120Z" />)}
    {z('shoulder',   <path d="M134,106 Q146,102 152,110 Q152,120 142,124 L128,120Z" />)}
    {z('outer_arm',  <path d="M50,114 L38,114 L24,198 L38,202 L52,128Z" />)}
    {z('inner_arm',  <path d="M64,110 L52,106 L38,198 L52,202 L64,124Z" />)}
    {z('outer_arm',  <path d="M150,114 L162,114 L176,198 L162,202 L148,128Z" />)}
    {z('inner_arm',  <path d="M136,110 L148,106 L162,198 L148,202 L136,124Z" />)}
    {z('outer_elbow',<ellipse cx={32} cy={206} rx={8} ry={7} />)}
    {z('outer_elbow',<ellipse cx={168} cy={206} rx={8} ry={7} />)}
    {z('inner_elbow',<ellipse cx={44} cy={208} rx={10} ry={9} />)}
    {z('inner_elbow',<ellipse cx={156} cy={208} rx={10} ry={9} />)}
    {z('forearm',    <path d="M26,212 L46,214 L44,276 L26,280Z" />)}
    {z('forearm',    <path d="M174,212 L154,214 L156,276 L174,280Z" />)}
    {z('wrist',      <rect x={24} y={280} width={22} height={13} rx={4} />)}
    {z('wrist',      <rect x={154} y={280} width={22} height={13} rx={4} />)}
    {z('hand_back',  <path d="M24,293 L46,293 L45,320 Q35,326 24,320Z" />)}
    {z('hand_back',  <path d="M154,293 L176,293 L176,320 Q166,326 155,320Z" />)}
    {[{x:24,w:4},{x:29,w:4},{x:34,w:4},{x:39,w:4},{x:44,w:3}].map((f,i) =>
      z('fingers', <rect key={i} x={f.x} y={326} width={f.w} height={18} rx={2} />)
    )}
    {[{x:153,w:3},{x:157,w:4},{x:162,w:4},{x:167,w:4},{x:172,w:4}].map((f,i) =>
      z('fingers', <rect key={i} x={f.x} y={326} width={f.w} height={18} rx={2} />)
    )}
    {z('hamstring',  <path d="M70,316 Q54,328 52,408 Q66,422 86,418 Q98,410 100,330Z" />)}
    {z('hamstring',  <path d="M130,316 Q146,328 148,408 Q134,422 114,418 Q102,410 100,330Z" />)}
    {z('back_knee',  <ellipse cx={69} cy={428} rx={17} ry={13} />)}
    {z('back_knee',  <ellipse cx={131} cy={428} rx={17} ry={13} />)}
    {z('calf',       <path d="M54,440 L84,440 L82,508 L56,508Z" />)}
    {z('calf',       <path d="M146,440 L116,440 L118,508 L144,508Z" />)}
    {z('shin',       <path d="M84,440 L94,440 L92,508 L82,508Z" />)}
    {z('shin',       <path d="M116,440 L106,440 L108,508 L118,508Z" />)}
    {z('ankle',      <path d="M54,508 L96,508 L94,528 L56,528Z" />)}
    {z('ankle',      <path d="M146,508 L104,508 L106,528 L144,528Z" />)}
    {z('heel',       <path d="M56,528 Q68,546 82,544 L82,528Z" />)}
    {z('heel',       <path d="M144,528 Q132,546 118,544 L118,528Z" />)}
    {z('foot_sole',  <path d="M56,528 L56,538 Q68,554 84,552 L82,544 Q68,546 56,528Z" />)}
    {z('foot_sole',  <path d="M144,528 L144,538 Q132,554 116,552 L118,544 Q132,546 144,528Z" />)}
    {[{x:58},{x:64},{x:69},{x:74},{x:79}].map((t,i) =>
      z('toes', <rect key={i} x={t.x} y={548} width={4} height={13} rx={2} />)
    )}
    {[{x:119},{x:114},{x:109},{x:104},{x:99}].map((t,i) =>
      z('toes', <rect key={i} x={t.x} y={548} width={4} height={13} rx={2} />)
    )}
  </>;
}

// ─── Body SVG ─────────────────────────────────────────────────────────────────
function BodySVG({ gender, view, az, onEnter, onLeave }) {
  const pr = { az, onEnter, onLeave };
  return (
    <svg viewBox="0 0 200 580" style={{ width: '100%', maxHeight: 600 }}>
      <GlowFilter id="gf" />
      <GlowFilter id="gb" />
      {gender === 'male'   && view === 'front' && <MaleFront   {...pr} />}
      {gender === 'female' && view === 'front' && <FemaleFront {...pr} />}
      {gender === 'male'   && view === 'back'  && <MaleBack    {...pr} />}
      {gender === 'female' && view === 'back'  && <FemaleBack  {...pr} />}
    </svg>
  );
}

// ─── Toggle button ────────────────────────────────────────────────────────────
function Btn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 20px', borderRadius: 20,
      border: `1px solid ${active ? '#D4AF37' : 'rgba(212,175,55,0.25)'}`,
      background: active ? 'rgba(212,175,55,0.13)' : 'transparent',
      color: active ? '#D4AF37' : '#888',
      fontSize: 12, cursor: 'pointer', letterSpacing: '0.5px', transition: 'all .2s',
    }}>{label}</button>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function PainMap() {
  const [gender, setGender] = useState('male');
  const [view,   setView]   = useState('front');
  const [az,     setAz]     = useState(null);

  const onEnter = useCallback((k) => setAz(k), []);
  const onLeave = useCallback(()  => setAz(null), []);

  const zd     = az ? ZONES[az] : null;
  const lvd    = zd ? P[zd.lv] : null;
  const accent = lvd ? lvd.color : '#D4AF37';
  const glowC  = lvd ? lvd.glow  : 'rgba(212,175,55,.5)';

  return (
    <div style={{
      background: 'radial-gradient(circle at 20% 0%, #1e1a2e 0%, #0d0d10 60%, #0a0a0b 100%)',
      color: '#e5e5e7', minHeight: '100vh', padding: '36px 16px',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>

        <header style={{ textAlign: 'center', marginBottom: 20 }}>
          <h1 style={{ fontFamily: 'Georgia,serif', color: '#D4AF37', fontSize: 32, marginBottom: 4, letterSpacing: 1 }}>
            Anatomical Pain Map
          </h1>
          <p style={{ color: '#666', fontSize: 13 }}>
            Detailed guide to nerve density, bone proximity &amp; pain sensitivity
          </p>
        </header>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
          <Btn label="Male"   active={gender === 'male'}   onClick={() => { setGender('male');   setAz(null); }} />
          <Btn label="Female" active={gender === 'female'} onClick={() => { setGender('female'); setAz(null); }} />
          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />
          <Btn label="Front" active={view === 'front'} onClick={() => { setView('front'); setAz(null); }} />
          <Btn label="Back"  active={view === 'back'}  onClick={() => { setView('back');  setAz(null); }} />
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20, alignItems: 'start',
        }}>
          {/* Body */}
          <div style={{
            background: 'rgba(18,18,20,0.7)', border: '1px solid rgba(212,175,55,0.08)',
            borderRadius: 18, padding: '14px 8px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: '#444', textTransform: 'uppercase', marginBottom: 8 }}>
              {view} view
            </div>
            <BodySVG gender={gender} view={view} az={az} onEnter={onEnter} onLeave={onLeave} />
          </div>

          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              background: 'rgba(212,175,55,0.03)', borderRadius: 18,
              borderLeft: `4px solid ${accent}`,
              padding: '22px 20px', transition: 'border-color .35s', minHeight: 160,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ fontSize: 22, fontWeight: 300 }}>{zd ? zd.n : 'Hover an area'}</div>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={accent} stroke={accent} strokeWidth="1">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span style={{ fontSize: 10, letterSpacing: 3, fontWeight: 700, color: accent }}>
                  {zd ? `${P[zd.lv].label.toUpperCase()} INTENSITY` : 'READY'}
                </span>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', background: accent,
                  boxShadow: `0 0 9px ${glowC}`, display: 'inline-block', marginLeft: 4,
                }} />
              </div>
              <p style={{ color: '#888', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                {zd ? zd.tip : 'Hover over any body region to see its tattoo pain rating and anatomy notes.'}
              </p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: 18, padding: 16,
            }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: '#444', textTransform: 'uppercase', marginBottom: 12 }}>
                Pain thresholds
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {Object.entries(P).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#aaa' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.color, boxShadow: `0 0 7px ${v.glow}`, flexShrink: 0 }} />
                    {v.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
