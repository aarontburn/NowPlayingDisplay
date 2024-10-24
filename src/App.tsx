import './App.css';
import { Route, Routes } from "react-router-dom";
import { CurrentSong, Spotify } from './Spotify';
import { useEffect, useState } from 'react';

const RERENDER_INTERVAL: number = 2500

function App() {
	return (
		<Routes>
			<Route path="/" element={<Home />} />
		</Routes>
	);
}

const Home = () => {
	const [spotify] = useState(() => new Spotify())

	const [currentTrack, setCurrentTrack] = useState(undefined as CurrentSong)

	useEffect(() => {
		const getTrack = async () => spotify.getCurrentTrack().then(setCurrentTrack);
		getTrack()
		setInterval(getTrack, RERENDER_INTERVAL);
	}, [spotify])


	return <div id='container'>
		<img id='album-art' src={currentTrack ? currentTrack.images[0].url : ''}></img>

		<div id='details-container'>
			<img id='small-album-art' src={currentTrack ? currentTrack.images[0].url : ''}></img>

			<div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'left', width: '100%' }}>
				<p onClick={() => {
					document.exitFullscreen().catch(() => { document.getElementById('container').requestFullscreen() })
				}} id='song-name'>{currentTrack ? currentTrack.songName : ''}</p>
				<p id='artists'>{currentTrack ? currentTrack.artists.join(', ') : ''}</p>

			</div>

		</div>

	</div>
}



export default App;
