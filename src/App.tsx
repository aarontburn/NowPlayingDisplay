import './App.css';
import { Route, Routes } from "react-router-dom";
import { defaultNoSong, Spotify } from './Spotify';
import { ImgHTMLAttributes, useCallback, useEffect, useState } from 'react';
import fullscreenSVG from './assets/fullscreen.svg';
import pauseSVG from './assets/pause.svg';
import playSVG from './assets/play.svg';
import rewindSVG from './assets/rewind.svg';
import skipSVG from './assets/skip.svg';

const RERENDER_INTERVAL: number = 1000

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

const Home = () => {
	const [spotify] = useState(() => new Spotify());

	const [currentTrack, setCurrentTrack] = useState({ ...defaultNoSong });
	const getTrack = useCallback(async () => spotify.getCurrentTrack().then(setCurrentTrack), [spotify]);

	const [controlsHidden, setControlsHidden] = useState(false);


	useEffect(() => {
		getTrack();
		const interval = setInterval(getTrack, RERENDER_INTERVAL);
		return () => clearInterval(interval);
	}, [spotify, getTrack]);


	return <div id='container'>
		{
			currentTrack.images[0].url !== '' &&
			<img
				id='album-art'
				src={currentTrack.images[0].url}
				alt='Background album art display.'
			>
			</img>

		}

		<SVGControl
			id='fullscreen-button'
			src={fullscreenSVG}
			onClick={() => { document.exitFullscreen().catch(() => { document.getElementById('container').requestFullscreen() }) }}
		/>

		{
			currentTrack.songPosition !== -1 &&
			<div id='controls'>
				<div style={{ display: 'flex', alignItems: 'center' }}>
					<SVGControl
						src={rewindSVG}
						onClick={() => spotify && spotify.rewind().then(() => getTrack())} />

					{/* <p id='timestamp'>{msToTime(currentTrack.songPosition)} / {msToTime(currentTrack.songLength)}</p> */}

					<SVGControl
						src={playSVG}
						onClick={() => spotify && spotify.togglePlay()} />

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
		}




		<div id='details-container'>
			<div id='small-album-art'>
				{
					currentTrack.images[0].url !== '' &&
					<img
						src={currentTrack.images[0].url}
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
