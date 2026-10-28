import React, {useState} from 'react';
import {trackImageCandidates} from './track-imagery.js';
import './track-imagery.css';

export default function TrackCardImage({track}) {
  const [failed, setFailed] = useState([]);
  const image = trackImageCandidates(track).find(candidate => !failed.includes(candidate.url));
  return <div className="track-card-media">
    {image ? <>
      <img key={image.url} src={image.url} alt={image.alt || track.name + ' karting track'}
        width="640" height="360" loading="lazy" decoding="async"
        onError={() => setFailed(previous => [...previous, image.url])}/>
      <span className="track-card-image-label">{image.aerial ? 'Aerial venue view' : 'Track photo'}</span>
      {(image.credit || image.license) && <span className="track-card-image-credit">{[image.credit, image.license].filter(Boolean).join(' · ')}</span>}
    </> : <div className="track-card-image-unavailable"><span aria-hidden="true">⌖</span><span>Track image unavailable</span></div>}
  </div>;
}
