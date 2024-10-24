import { AccessToken, SpotifyApi, Track } from '@spotify/web-api-ts-sdk';


const i: string = 'dd3af8424e834918ae856cf21023fc5b'
// const _: string = 'ee35c5de002743ec807c5c1583e03ff3'
const re: string = 'http://localhost:3000/'
const SCOPE: string[] = ['user-read-currently-playing', 'user-read-playback-state', 'user-modify-playback-state']



export interface CurrentSong {
    albumName: string,
    songName: string,
    artists: string[],
    images: any[],
    songLength: number,
    songPosition: number
}

export const defaultNoSong: CurrentSong = {
    albumName: '',
    songName: 'No Song Playing',
    artists: [],
    images: [{ url: '' }],
    songLength: -1,
    songPosition: -1
}


export class Spotify {

    private sdk: SpotifyApi;
    private token: AccessToken

    constructor() {
        this.build()
    }

    private async build() {
        this.token = (await SpotifyApi.performUserAuthorization(i, re, SCOPE, async (_) => { })).accessToken;
        this.sdk = SpotifyApi.withAccessToken(i, this.token)

    }


    public async getCurrentTrack(): Promise<CurrentSong> {
        if (!this.sdk) {
            return { ...defaultNoSong };
        }
        const currentTrack = await this.sdk.player.getCurrentlyPlayingTrack().catch(err => console.log(err));
        if (!currentTrack) {
            return { ...defaultNoSong };
        }

        const song: Track = currentTrack.item as Track;

        return {
            albumName: song.album.name,
            songName: song.name,
            artists: song.artists.map(a => a.name),
            images: song.album.images.length === 0 ? [{ url: '' }] : song.album.images,
            songLength: song.duration_ms,
            songPosition: currentTrack.progress_ms
        }





    }

    public async togglePlay() {
        if (this.sdk) {
            return;
        }

        const currentState = await this.sdk.player.getPlaybackState();
        if (currentState.is_playing) {
            await this.pause();
            return;
        }
        await this.play()
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


}