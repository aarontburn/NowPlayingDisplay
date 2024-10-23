import { AccessToken, Device, SpotifyApi, Track } from '@spotify/web-api-ts-sdk';


const i: string = 'dd3af8424e834918ae856cf21023fc5b'
const s: string = 'ee35c5de002743ec807c5c1583e03ff3'
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

        const currentTrack = await this.sdk.player.getCurrentlyPlayingTrack();

        const song: Track = currentTrack.item as Track;

        return {
            albumName: song.album.name,
            songName: song.name,
            artists: song.artists.map(a => a.name),
            images: song.album.images,
            songLength: song.duration_ms,
            songPosition: currentTrack.progress_ms
        }

    }

    public async togglePlay() {
        const currentState = await this.sdk.player.getPlaybackState();
        if (currentState.is_playing) {
            this.pause();
            return;
        }
        this.play()
    }

    public async play() {
        this.sdk.player.startResumePlayback(undefined).catch(err => { })
    }

    public async pause() {
        this.sdk.player.pausePlayback(undefined).catch(err => { })
    }

    public async getCurrentDevice(): Promise<Device> {
        return (await this.sdk.player.getPlaybackState()).device
    }

    public async setVolume(volumePercent: number) {
        if (volumePercent < 0) {
            volumePercent = 0
        }
        if (volumePercent > 100) {
            volumePercent = 100;
        }

        this.sdk.player.setPlaybackVolume(volumePercent)
    }


}