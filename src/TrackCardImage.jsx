import React, {useEffect, useState} from 'react';
import './track-imagery.css';

// Load the audit only when track cards are displayed, once per page session.
let imageryPromise;
const loadImagery = () => imageryPromise ||= import('./track-imagery.js');

export default function TrackCardImage({track}) {
  const [failed, setFailed] = useState([]);
  const [candidates, setCandidates] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setCandidates(null);
    setLoadFailed(false);
    loadImagery().then(module => {
      if (active) setCandidates(module.trackImageCandidates(track));
    }).catch(() => {
      if (active) {setCandidates([]); setLoadFailed(true);}
    });
    return () => {active = false;};
  }, [track]);
  const image = candidates?.find(candidate => !failed.includes(candidate.url));
  return <div className="track-card-media">
    {image ? <>
      <img key={image.url} src={image.url} alt={image.alt || track.name + ' karting track'}
        width="640" height="360" loading="lazy" decoding="async"
        onError={() => setFailed(previous => [...previous, image.url])}/>
      <span className="track-card-image-label">{image.aerial ? 'Aerial venue view' : 'Track photo'}</span>
      {(image.credit || image.license) && <span className="track-card-image-credit">{[image.credit, image.license].filter(Boolean).join(' · ')}</span>}
    </> : <div className="track-card-image-unavailable"><span aria-hidden="true">⌖</span><span>{candidates === null ? 'Loading track image…' : loadFailed || candidates.length ? 'Track image unavailable' : 'Image awaiting verification'}</span></div>}
  </div>;
}
