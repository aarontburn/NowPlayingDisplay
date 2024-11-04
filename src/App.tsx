import './App.css';
import { Route, Routes } from "react-router-dom";
import { defaultNoSong, Spotify } from './Spotify';
import { useCallback, useEffect, useState } from 'react';
import fullscreenSVG from './assets/fullscreen.svg';
import pauseSVG from './assets/pause.svg';
import playSVG from './assets/play.svg';
import rewindSVG from './assets/rewind.svg';
import skipSVG from './assets/skip.svg';

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
	>
	</img>
}

const Spacer = ({ spacing = 'auto' }: { spacing: string }) => <div style={{ marginRight: spacing }}></div>


const Home = () => {
	const [spotify] = useState(() => Spotify.getInstance());

	const [currentTrack, setCurrentTrack] = useState({ ...defaultNoSong });
	const getTrack = useCallback(async () => spotify.getCurrentTrack().then((track) => {
		if (track.songLength !== -1) {
			setCurrentTrack(track)
		}
	}), [spotify]);

	const [showControls, setControlsHidden] = useState(false);
	const [controlTimeout, setControlTimeout] = useState(undefined as NodeJS.Timeout)



	useEffect(() => {
		getTrack();
		const interval = setInterval(getTrack, POLL_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [spotify, getTrack]);

	const onMouseDown = useCallback(() => {
		const root: HTMLElement = document.querySelector(':root') as HTMLElement
		setControlsHidden(true);

		if (controlTimeout !== undefined) {
			clearTimeout(controlTimeout);
		}
		root.style.setProperty("cursor", 'unset');

		setControlTimeout(setTimeout(() => {
			root.style.setProperty("cursor", 'none');
			setControlsHidden(false);
		}, HIDE_CONTROLS_AFTER_MS))
	}, [controlTimeout]);


	return <div id='container' onMouseDown={onMouseDown}>
		{
			currentTrack.image.url !== '' &&
			<img
				id='album-art'
				src={currentTrack.image.url}
				alt='Background album art display.'
			>
			</img>

		}



		{
			showControls &&
			<>
				<SVGControl
					id='fullscreen-button'
					src={fullscreenSVG}
					onClick={() => { document.exitFullscreen().catch(() => { document.getElementById('container').requestFullscreen() }) }}
				/>

				<div id='controls'>
					<div style={{ display: 'flex', alignItems: 'center' }}>
						<SVGControl
							src={rewindSVG}
							onClick={() => spotify && spotify.rewind().then(() => getTrack())} />

						{/* <p id='timestamp'>{msToTime(currentTrack.songPosition)} / {msToTime(currentTrack.songLength)}</p> */}
						<Spacer spacing='1em' />
						<SVGControl
							src={currentTrack.isPlaying ? pauseSVG : playSVG}
							onClick={() => spotify && spotify.togglePlay()} />
						<Spacer spacing='1em' />
						<SVGControl
							src={skipSVG}
							onClick={() => spotify && spotify.skip().then(() => getTrack())} />


						{/* <p onClick={() => {
						if (spotify) {
							spotify.rewind().then(() => getTrack());
						}
					}}>⟻</p>

					<p id='timestamp'>{msToTime(currentTrack.songPosition)} / {msToTime(currentTrack.songLength)}</p>

					<p onClick={() => {
						if (spotify) {
							spotify.skip().then(() => getTrack());
						}
					}}>⟼</p> */}
					</div>
				</div>
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

const msToTime = (ms: number): string => {
	if (ms === -1) {
		return '0:00';
	}

	const minutes: number = Math.floor(ms / 1000 / 60);
	const seconds: number = Math.floor((ms / 1000) - (60 * minutes));
	return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
}



export default App;
