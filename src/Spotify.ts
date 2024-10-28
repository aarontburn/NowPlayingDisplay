import { AccessToken, Image, SpotifyApi, Track } from '@spotify/web-api-ts-sdk';


const i: string = 'dd3af8424e834918ae856cf21023fc5b'
// const _: string = 'ee35c5de002743ec807c5c1583e03ff3'
const re: string = 'http://localhost:3000/'
const SCOPE: string[] = ['user-read-currently-playing', 'user-read-playback-state', 'user-modify-playback-state']
const PAGE_REFRESH_ERR: string = `No verifier found in cache - can't validate query string callback parameters.`


export interface CurrentSong {
    albumName: string,
    songName: string,
    artists: string[],
    image: Image,
    songLength: number,
    songPosition: number,
    isPlaying: boolean
}

const noImage: Image = { url: '', width: -1, height: -1 }

export const defaultNoSong: CurrentSong = {
    albumName: ' ',
    songName: 'No Song Playing',
    artists: [' '],
    image: { url: '', width: -1, height: -1 },
    songLength: -1,
    songPosition: -1,
    isPlaying: false
}


export class Spotify {

    private sdk: SpotifyApi;
    private token: AccessToken

    constructor() {
        this.build()
    }

    private async build() {
        try {
            this.token = (await SpotifyApi.performUserAuthorization(i, re, SCOPE, async (_) => { })).accessToken;
            this.sdk = SpotifyApi.withAccessToken(i, this.token);

            setInterval(this.refreshToken.bind(this), this.token.expires_in * 1000);
            console.log("Successfully authenticated with Spotify")
        } catch (err) {
            console.log(err)
            if ((err as Error).message.includes(PAGE_REFRESH_ERR)) {
                setTimeout(() => window.location.reload(), 500);
            }
        }

    }


    public async getCurrentTrack(): Promise<CurrentSong> {
        if (!this.sdk) {
            return { ...defaultNoSong };
        }
        const currentTrack = await this.sdk.player.getCurrentlyPlayingTrack().catch(err => {
            console.log(err)
            if ((err.description as string)?.includes('refresh_token')) {
                this.refreshToken();
            } 
        });
        if (!currentTrack) {
            return { ...defaultNoSong };
        }

        const song: Track = currentTrack.item as Track;

        return {
            albumName: song.album.name,
            songName: song.name,
            artists: song.artists.map(a => a.name),
            image: song.album.images.length === 0 ? { ...noImage } : song.album.images[0],
            songLength: song.duration_ms,
            songPosition: currentTrack.progress_ms,
            isPlaying: currentTrack.is_playing
        }
    }

    public async togglePlay() {
        if (!this.sdk) {
            return;
        }

        const currentState = await this.sdk.player.getPlaybackState();
        if (!currentState || !currentState.is_playing) {
            await this.play();
            return;
        }

        await this.pause();
    }

    public async play() {
        if (!this.sdk) {
            return;
        }
        await this.sdk.player.startResumePlayback(undefined).catch(_ => { });
    }

    public async pause() {
        if (!this.sdk) {
            return;
        }
        await this.sdk.player.pausePlayback(undefined).catch(_ => { });
    }

    public async setVolume(volumePercent: number) {
        if (volumePercent < 0) {
            volumePercent = 0;
        }
        if (volumePercent > 100) {
            volumePercent = 100;
        }

        await this.sdk.player.setPlaybackVolume(volumePercent);
    }

    public async skip() {
        if (!this.sdk) {
            return;
        }
        await this.sdk.player.skipToNext(undefined).catch(_ => { });
    }

    public async rewind() {
        if (!this.sdk) {
            return;
        }
        await this.sdk.player.skipToPrevious(undefined).catch(_ => { });
    }

    public async refreshToken() {
        console.log("Refreshing token...")
        console.log("Old Token:")
        console.log(this.token)
        const url = "https://accounts.spotify.com/api/token";

        const payload: RequestInit = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: this.token.refresh_token,
                client_id: i
            }),
        }
        const body: Response = await fetch(url, payload);
        const response: AccessToken = (await body.json()) as AccessToken;
        console.log("New Token:")
        console.log(response)
        this.token = response;

    }


}