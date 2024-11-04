import { AccessToken, Image, SpotifyApi, Track } from '@spotify/web-api-ts-sdk';
import { log } from './Global';



const i: string = 'dd3af8424e834918ae856cf21023fc5b'
const re: string = 'http://localhost:3000/'
const SCOPE: string[] = ['user-read-currently-playing', 'user-read-playback-state', 'user-modify-playback-state'];
const PAGE_REFRESH_ERR: string = `No verifier found in cache - can't validate query string callback parameters.`;
const REFRESH_OFFSET_MS: number = 10000;

export interface CurrentSong {
    albumName: string,
    songName: string,
    artists: string[],
    image: Image,
    songLength: number,
    songPosition: number,
    isPlaying: boolean
    songId: string
}

const noImage: Image = { url: '', width: -1, height: -1 }

export const defaultNoSong: CurrentSong = {
    albumName: ' ',
    songName: 'No Song Playing',
    artists: [' '],
    image: { url: '', width: -1, height: -1 },
    songLength: -1,
    songPosition: -1,
    isPlaying: false,
    songId: ''
}


export class Spotify {

    private sdk: SpotifyApi;
    private token: AccessToken
    private currentlyRefreshing: boolean = false;
    private refreshTimeout: NodeJS.Timer;


    private static instance: Spotify;

    public static getInstance(): Spotify {
        if (!this.instance) {
            this.instance = new Spotify()
        }
        return this.instance;
    }



    private constructor() {
        this.build();

    }

    private async cleanup() {
        log("Cleaning Spotify Instance.")
        this.token = undefined;
        this.sdk = undefined;
        clearInterval(this.refreshTimeout);
    }

    private async build() {
        log("Creating a new instance of Spotify.");

        try {
            
            this.token = (await SpotifyApi.performUserAuthorization(i, re, SCOPE, async (_) => { })).accessToken;
            this.sdk = SpotifyApi.withAccessToken(i, this.token);

            log("Successfully authenticated with Spotify");
            log(`Token refresh occurs at ${new Date(this.token.expires).toLocaleTimeString()}, or in ${this.calculateRefreshTime(this.token) / 1000} seconds`);

            log(`Original Token:`);
            console.log(this.token);

            this.setRefreshTimeout();

        } catch (err) {
            log(err);
            if ((err as Error).message.includes(PAGE_REFRESH_ERR)) {
                setTimeout(() => window.location.reload(), 500);
            }
        }

    }


    public async getCurrentTrack(): Promise<CurrentSong> {
        if (!this.sdk || this.currentlyRefreshing) {
            return { ...defaultNoSong };
        }
        const currentTrack = await this.sdk.player.getCurrentlyPlayingTrack().catch(err => {
            log(err)
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
            isPlaying: currentTrack.is_playing,
            songId: song.id
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
        if (this.currentlyRefreshing) {
            return;
        }
        this.currentlyRefreshing = true;

        log("Refreshing token...");
        log("Old Token:");
        console.log(this.token)


        const url: string = "https://accounts.spotify.com/api/token";

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
        const response: any = (await body.json());
        log("New Token:");
        console.log(response);

        if (response.error !== undefined || response.expires === undefined) {
            this.rebuild();
            return;
        }
        this.token = response;


        log(`Token refresh occurs at ${new Date(this.token.expires).toLocaleTimeString()}, or in ${this.calculateRefreshTime(this.token) / 1000} seconds`);
        // Note: refresh token might not have this field. check for it

        if (!this.setRefreshTimeout()) {
            log("Could not calculate refresh time. Rebuilding...")
            this.rebuild();
            return;
        }

        this.currentlyRefreshing = false;
    }

    private setRefreshTimeout(): boolean {
        clearTimeout(this.refreshTimeout);
        const refreshTime: number = this.calculateRefreshTime(this.token);
        if (refreshTime < 0) {
            return false;
        }

        this.refreshTimeout = setTimeout(this.refreshToken.bind(this), refreshTime - REFRESH_OFFSET_MS);
        return true;
    }

    private rebuild(): void {
        this.cleanup();
        this.build();
    }
    
    private calculateRefreshTime(token: AccessToken): number {
        const currentMS: number = new Date().getTime();
        const tokenExpires: number | undefined = token.expires;

        if (tokenExpires === undefined) {
            return -1;
        }

        return tokenExpires - currentMS;
    }

}
