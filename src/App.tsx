import './App.css';
import { Route, Routes } from "react-router-dom";
import { CurrentSong, Spotify } from './Spotify';
import { useEffect, useState } from 'react';

const RERENDER_INTERVAL: number = 5000

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
		setInterval(async () => {
			spotify.getCurrentTrack().then(setCurrentTrack);
		}, RERENDER_INTERVAL)
	}, [])

	useEffect(() => {
		(async () => {
			spotify.getCurrentTrack().then(setCurrentTrack);
		})()
	}, [spotify])

	
	return <div id='container'>
		<img id='album-art' src={currentTrack ? currentTrack.images[0].url : ''}></img>
		<div id='details-container'>
			<img id='small-album-art' src={currentTrack ? currentTrack.images[0].url : ''}></img>
			<div>
				<p id='song-name'>{currentTrack ? currentTrack.songName : ''}</p>
				<p id='artists'>{currentTrack ? currentTrack.artists.join(', ') : ''}</p>
			</div>

		</div>

	</div>
}



export default App;
