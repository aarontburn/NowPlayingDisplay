import './App.css';
import { Route, Routes } from "react-router-dom";
import { defaultNoSong, Spotify } from './Spotify';
import { useCallback, useEffect, useState } from 'react';
import infoSVG from './assets/info.svg';
import { Track } from '@spotify/web-api-ts-sdk';

const POLL_INTERVAL_MS: number = 1000;
const HIDE_CONTROLS_AFTER_MS: number = 2000;

function App() {
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

	>
	</img>
}

const ExternalLink = ({ url, displayText = url, style }: { url: string, displayText: string, style?: React.CSSProperties }) =>
	<a href={url} target='_blank' rel="noreferrer" style={{ ...style }}>{displayText}</a>


const Home = () => {
	const [spotify] = useState(() => Spotify.getInstance());

	const [currentTrack, setCurrentTrack] = useState({ ...defaultNoSong });
	const getTrack = useCallback(async () => spotify.getCurrentTrack().then((track) => {
		if (track.songLength !== -1) {
			setCurrentTrack(track)
		}
	}), [spotify]);

	const [showCredits, setShowCredits] = useState(false);

	useEffect(() => {
		getTrack();
		const interval = setInterval(getTrack, POLL_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [spotify, getTrack]);

	const [showControls, setShowControls] = useState(false);
	const [controlTimeout, setControlTimeout] = useState(undefined as NodeJS.Timeout);

	const onMouseMove = useCallback(() => {
		const root: HTMLElement = document.querySelector(':root') as HTMLElement;

		if (controlTimeout) {
			clearTimeout(controlTimeout);
		}
		root.style.cursor = 'unset';
		setShowControls(true);

		setControlTimeout(
			setTimeout(() => {
				setControlTimeout(null);
				root.style.cursor = 'none';
				setShowControls(false);
			}, HIDE_CONTROLS_AFTER_MS));
	}, [controlTimeout]);


	return <div id='container' onMouseMove={onMouseMove}>
		{
			currentTrack.image.url !== '' &&
			<img
				id='album-art'
				src={currentTrack.image.url}
				alt='Background album art display.'
				draggable={false}
			>
			</img>
		}

		{
			showCredits &&
			<>
				<div id='credits'>
					<div style={{ marginTop: '5rem', marginLeft: '5rem' }}>
						<p><span style={{ marginRight: "1em" }}>Artists:</span> {
							(currentTrack.sourcePlaybackState?.item as Track).artists
								.map(a => <a style={{ marginRight: '1em' }} href={a.external_urls.spotify} target='_blank' rel="noreferrer">{a.name}</a>)
							?? ''
						}</p>
						<p>External Link: <a href={currentTrack.songURL} target='_blank' rel="noreferrer" >{currentTrack.songURL}</a></p>
					</div>
				</div>
			</>
		}


		{
			showControls &&
			<>

				<SVGControl
					id='info-button'
					src={infoSVG}
					onClick={() => setShowCredits((old) => !old)}
				/>
			</>


		}




		<div id='details-container'>
			<div id='small-album-art'>
				{
					currentTrack.image.url !== '' &&
					<img
						src={currentTrack.image.url}
						alt='Small album art display.'
						style={{ height: '100%' }}
						draggable={false}

					>
					</img>
				}

			</div>


			<div id='text-container'>
				<p id='album-name'>{currentTrack.albumName}</p>
				<p id='song-name'>{currentTrack.songName}</p>
				<p id='artists'>{currentTrack.artists.join(', ')}</p>

			</div>

		</div>

	</div>
}



export default App;
