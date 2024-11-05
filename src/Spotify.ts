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
        this.sdk = undefined;
        clearInterval(this.refreshTimeout);
    }

    private async build() {
        log("Creating a new instance of Spotify.");

        try {

            const token: AccessToken = (await SpotifyApi.performUserAuthorization(i, re, SCOPE, async (_) => { })).accessToken;
            this.sdk = SpotifyApi.withAccessToken(i, token);

            log("Successfully authenticated with Spotify");
            log(`Token refresh occurs at ${new Date(token.expires).toLocaleTimeString()}, or in ${this.calculateRefreshTime(token) / 1000} seconds`);

            log(`Original Token:`);
            console.log(token);


        } catch (err) {
            log(err);
            if ((err as Error).message.includes(PAGE_REFRESH_ERR)) {
                setTimeout(() => window.location.reload(), 500);
            }
        }

    }


    public async getCurrentTrack(): Promise<CurrentSong> {
        if (this.currentlyRefreshing) {
            return { ...defaultNoSong };
        }
        console.log(JSON.stringify(await this.sdk.getAccessToken(), undefined, 4))
        const currentTrack = await this.sdk.player.getCurrentlyPlayingTrack().catch(err => {
            log("Error when attempting to get current track:")
            console.log(err)
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
        const currentState = await this.sdk.player.getPlaybackState();
        if (!currentState || !currentState.is_playing) {
            await this.play();
            return;
        }

        await this.pause();
    }

    public async play() {
        await this.sdk.player.startResumePlayback(undefined).catch(_ => { });
    }

    public async pause() {
        await this.sdk.player.pausePlayback(undefined).catch(_ => { });
    }

    public async skip() {
        await this.sdk.player.skipToNext(undefined).catch(_ => { });
    }

    public async rewind() {
        await this.sdk.player.skipToPrevious(undefined).catch(_ => { });
    }


    private calculateRefreshTime(token: AccessToken): number {
        const currentMS: number = new Date().getTime();
        const tokenExpires: number | undefined = token.expires;

        if (tokenExpires === undefined) {
            return -1;
        }

        const time: number = tokenExpires - currentMS;

        return time > REFRESH_OFFSET_MS ? time - REFRESH_OFFSET_MS : time;
    }

}
