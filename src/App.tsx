import './App.css';
import { Route, Routes } from "react-router-dom";
import { CurrentTrack, defaults, Spotify } from './Spotify';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import infoSVG from './assets/info.svg';
import { SimplifiedArtist, Track } from '@spotify/web-api-ts-sdk';

/**
 * 	How often to poll the current track.
 */
const POLL_INTERVAL_MS: number = 1000;

/**
 * 	How long the controls/mouses stay visible before hiding.
 */
const HIDE_CONTROLS_AFTER_MS: number = 2000;

export default function App() {
	return (
		<Routes>
			<Route path="/" element={<Home />} />
		</Routes>
	);
}

const SVGControl = ({ id = '', src, onClick }: { id?: string, src: string, onClick: () => void }) => {
	return <img
		className='svg'
		id={id}
		src={src}
		onClick={onClick}
		alt=''
		draggable={false}
	></img>
}

const CreditsSection = ({ sectionTitle, children }: { sectionTitle: string, children?: ReactNode }) => {
	return <p style={{ marginBottom: '1rem' }}><span style={{ fontSize: '1.5rem' }}>{sectionTitle} </span> {children}</p>
}

const ExternalLink = ({ url, displayText = url, style }: { url: string, displayText: string, style?: React.CSSProperties }) =>
	<a href={url} target='_blank' rel="noreferrer" style={{ fontSize: '1.5em', ...style }}>{displayText}</a>

const VerticalSpacer = ({ size }: { size: string }) => <div style={{ marginBottom: size }}></div>

const Credits = ({ currentTrack }: { currentTrack: CurrentTrack }) => {
	return <>
		<div id='credits'>
			<div style={{ margin: '5rem', height: '100%', maxHeight: '352px' }}>
				<iframe style={{ borderRadius: "12px", }}
					src={`https://open.spotify.com/embed/track/${(currentTrack.sourcePlaybackState.item as Track).id}?utm_source=generator`}
					width="100%"
					height='352px'
					allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy">

				</iframe>

			</div>
		</div>
	</>
}



export const Home = () => {
	const [spotify] = useState(() => Spotify.getInstance());

	const [currentTrack, setCurrentTrack] = useState(defaults.defaultNoTrack);
	const getTrack = useCallback(async () => spotify.getCurrentTrack().then((track) => {
		if (track.trackLength !== -1) {
			setCurrentTrack(track)
		}
	}), [spotify]);

	const [showCredits, setShowCredits] = useState(false);

	useEffect(() => {
		getTrack();
		const interval = setInterval(getTrack, POLL_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [spotify, getTrack]);


	// Show mouse when moving, and hide mouse after 5 seconds of not moving it.
	const [mouseTimeout, setMouseTimeout] = useState(undefined as NodeJS.Timeout);
	const onMouseMove = useCallback(() => {
		const root: HTMLElement = document.querySelector(':root') as HTMLElement;
		if (mouseTimeout) {
			clearTimeout(mouseTimeout);
		}
		root.style.cursor = 'default';

		setMouseTimeout(setTimeout(() => {
			setMouseTimeout(undefined);
			root.style.cursor = 'none';
		}, HIDE_CONTROLS_AFTER_MS));
	}, [mouseTimeout]);

	// Show control panel when mouse is clicked, and hide after 5 seconds
	const [showControls, setShowControls] = useState(false);
	const [controlTimeout, setControlTimeout] = useState(undefined as NodeJS.Timeout);
	const onMouseDown = useCallback(() => {
		if (controlTimeout) {
			clearTimeout(controlTimeout);
		}
		setShowControls(true);

		setControlTimeout(setTimeout(() => {
			setControlTimeout(undefined);
			setShowControls(false);
		}, HIDE_CONTROLS_AFTER_MS));
	}, [controlTimeout]);


	return <div id='container' onMouseMove={onMouseMove} onMouseDown={onMouseDown}>
		{/* Render background image */}
		{currentTrack.image.url !== '' && <>
			<img
				id='album-art'
				src={currentTrack.image.url}
				alt='Background album art display.'
				draggable={false}
			></img>
		</>}

		{/* Conditionally show the credits screen */}
		{showCredits && <Credits currentTrack={currentTrack} />}

		{/* Conditionally show the controls panel */}
		{showControls && <>
			<SVGControl
				id='info-button'
				src={infoSVG}
				onClick={() => setShowCredits((old) => !old)}
			/>
		</>}

		{/* Render the details of the currently playing song */}
		<div id='details-container'>
			<div id='small-album-art'>
				{currentTrack.image.url !== '' && <>
					<img
						src={currentTrack.image.url}
						alt='Small album art display.'
						style={{ height: '100%' }}
						draggable={false}
					></img>
				</>}
			</div>

			<div id='text-container'>
				<p id='album-name'>{currentTrack.albumName}</p>
				<p id='song-name'>{currentTrack.trackName}</p>
				<p id='artists'>{currentTrack.artists.join(', ')}</p>
			</div>
		</div>

	</div>
}



