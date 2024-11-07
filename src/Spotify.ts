import { AccessToken, Image, PlaybackState, SpotifyApi, Track } from '@spotify/web-api-ts-sdk';
import { log } from './Global';


/**
 *  Page refresh error. This error is thrown after the user authorizes this application.
 *  @see getCurrentlyPlayingTrack
 */
const PAGE_REFRESH_ERR: string = `No verifier found in cache - can't validate query string callback parameters.`;

/**
 *  Relevant Information about the currently playing track.
 */
export interface CurrentTrack {
    albumName: string,
    trackName: string,
    artists: string[],
    image: Image,
    trackLength: number,
    trackPosition: number,
    isPlaying: boolean
    trackId: string,
    trackUrl: string,
    sourcePlaybackState?: PlaybackState
}

/**
 *  Object containing getters for default objects. Returns copies of the objects.
 */
export const defaults: { readonly defaultNoImage: Image, readonly defaultNoTrack: CurrentTrack } = {
    get defaultNoImage(): Image {
        return { ...{ url: '', width: -1, height: -1 } }
    },
    get defaultNoTrack(): CurrentTrack {
        return {
            ...{
                albumName: ' ',
                trackName: 'No Song Playing',
                artists: [' '],
                image: defaults.defaultNoImage,
                trackLength: -1,
                trackPosition: -1,
                isPlaying: false,
                trackId: '',
                trackUrl: ''
            }
        }
    }
}


/**
 *  Class encapsulating all used Spotify behavior.
 */
export class Spotify {

    /**
     *  Singleton instance. For some reason, if not using a singleton, two classes would be made.
     *  Probably my fault.
     *  @see getInstance
     */
    private static instance: Spotify;

    /**
     *  Lazy singleton accessor.
     *  @returns The instance.
     *  @see instance
     */
    public static getInstance(): Spotify {
        return this.instance ?? (this.instance = new Spotify());
    }

    /**
     *  Private constructor. Should not be called anywhere outside of the lazy singleton accessor.
     *  @see getInstance
     */
    private constructor() {
        this.build();
    }

    /**
     *  The application ID.
     */
    private static CLIENT_ID: string = 'dd3af8424e834918ae856cf21023fc5b';

    /**
     *  The scope(s) of what info is read from the user. Currently, this only
     *      uses a single scope to read playback state.
     */
    private static SCOPE: readonly string[] = ['user-read-playback-state'];

    /**
     *  The redirect URL. Note that if this changes, it must be changed in the
     *      Spotify developer dashboard.
     */
    private static REDIRECT_URL: string = 'http://localhost:3000/';


    /**
     *  The Spotify SDK.
     */
    private sdk: SpotifyApi;

    /**
     *  The entry point.
     */
    private async build(): Promise<void> {
        log("Creating a new instance of Spotify.");

        try {
            const token: AccessToken = (await SpotifyApi.performUserAuthorization(Spotify.CLIENT_ID, Spotify.REDIRECT_URL, [...Spotify.SCOPE], async (_) => { })).accessToken;
            this.sdk = SpotifyApi.withAccessToken(Spotify.CLIENT_ID, token);

            log("Successfully authenticated with Spotify");

        } catch (err) {
            console.log(err);

            //  For some reason, an error after authentication and goes away after refreshing.
            //  However, refreshing right away creates a refreshing loop, so we refresh
            //      after 0.5 seconds. This could potentially be tweaked to be shorter. 
            if ((err as Error).message.includes(PAGE_REFRESH_ERR)) {
                setTimeout(() => window.location.reload(), 500);
            }
        }

    }


    /**
     *  Retrieves the current track.
     * 
     *  If there is an error with retrieving the track, it will return a default object.
     * 
     *  Currently, the used SDK doesn't seem to support podcast episodes (although the 
     *      API suggests otherwise). If the user is playing a podcast, it will return 
     *      the default object instead.
     *  @returns An object containing information about the current track.
     *  @see CurrentTrack
     *  @see defaults.defaultNoTrack
     */
    public async getCurrentTrack(): Promise<CurrentTrack> {
        if (!this.sdk) {
            return defaults.defaultNoTrack;
        }

        //  Wait until the authentication finished.
        //  If this function is called during the built-in token refresh process,
        //      I THINK this halts this Promise until the process finishes.
        await this.sdk.getAccessToken();

        let currentTrack: PlaybackState = undefined;
        try {
            currentTrack = await this.sdk.player.getPlaybackState();
        } catch (err) {
            log("Error when attempting to get current track:");
            console.log(err);
        }

        if (!currentTrack) {
            return defaults.defaultNoTrack;
        }


        // If the currently playing item is an episode, return the default object.
        if (currentTrack.currently_playing_type === 'episode') {
            return defaults.defaultNoTrack;
        }

        const song: Track = currentTrack.item as Track;

        return {
            albumName: song.album.name,
            trackName: song.name,
            artists: song.artists.map(a => a.name),
            image: song.album.images.length === 0 ? defaults.defaultNoImage : song.album.images[0],
            trackLength: song.duration_ms,
            trackPosition: currentTrack.progress_ms,
            isPlaying: currentTrack.is_playing,
            trackId: song.id,
            trackUrl: song.external_urls.spotify,
            sourcePlaybackState: currentTrack
        }
    }

}
