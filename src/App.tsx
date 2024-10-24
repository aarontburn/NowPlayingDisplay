import './App.css';
import { Route, Routes } from "react-router-dom";
import { defaultNoSong, Spotify } from './Spotify';
import { useCallback, useEffect, useState } from 'react';

const RERENDER_INTERVAL: number = 1000

function App() {
	return (
		<Routes>
			<Route path="/" element={<Home />} />
		</Routes>
	);
}

const Home = () => {
	const [spotify] = useState(() => new Spotify());

	const [currentTrack, setCurrentTrack] = useState({ ...defaultNoSong });
	const getTrack = useCallback(async () => spotify.getCurrentTrack().then(setCurrentTrack), [spotify]);

	useEffect(() => {
		getTrack();
		const interval = setInterval(getTrack, RERENDER_INTERVAL);
		return () => clearInterval(interval);
	}, [spotify, getTrack]);


	return <div id='container'>
		<img
			id='album-art'
			src={currentTrack.images[0].url}
			alt='Background album art display.'
		>
		</img>

		<p id='fullscreen-button' onClick={() => {
			document.exitFullscreen().catch(() => { document.getElementById('container').requestFullscreen() });
		}}>⛶</p>

		{currentTrack.songPosition !== -1 &&
			<div id='controls'>
				<div style={{ display: 'flex' }}>
					<p onClick={() => {
						if (spotify) {
							spotify.rewind().then(() => getTrack());
						}
					}}>⟻</p>

					<p id='timestamp'>{msToTime(currentTrack.songPosition)} / {msToTime(currentTrack.songLength)}</p>

					<p onClick={() => {
						if (spotify) {
							spotify.skip().then(() => getTrack());
						}
					}}>⟼</p>
				</div>
			</div>
		}




		<div id='details-container'>
			<img
				id='small-album-art'
				src={currentTrack.images[0].url}
				alt='Small album art display.'
			>
			</img>

			<div id='text-container'>
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
