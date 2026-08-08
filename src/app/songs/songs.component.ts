import { Component } from '@angular/core';

export interface SongRecord {
    title: string;
    artist: string;
    year: number;
    genre: string;
    comments: string;
    review: string;
    awards: string;
    numberOfSongs: number;
    length: string;
}

@Component({
    selector: 'app-songs',
    standalone: true,
    templateUrl: './songs.component.html',
    styleUrl: './songs.component.scss'
})
export class SongsComponent {
    activeTab: 'table' | 'grid' = 'table';

    songs: SongRecord[] = [
        {
            title: 'Abbey Road',
            artist: 'The Beatles',
            year: 1969,
            genre: 'Rock',
            comments: 'A polished and timeless final chapter.',
            review: 'Inventive, melodic, and beautifully sequenced.',
            awards: 'Grammy Hall of Fame',
            numberOfSongs: 17,
            length: '47:03'
        },
        {
            title: 'Blue',
            artist: 'Joni Mitchell',
            year: 1971,
            genre: 'Folk',
            comments: 'Intimate songwriting with remarkable detail.',
            review: 'Raw, honest, and deeply influential.',
            awards: 'Library of Congress Registry',
            numberOfSongs: 10,
            length: '35:39'
        },
        {
            title: 'Kind of Blue',
            artist: 'Miles Davis',
            year: 1959,
            genre: 'Jazz',
            comments: 'A landmark in modal jazz.',
            review: 'Relaxed, expressive, and endlessly rewarding.',
            awards: 'Grammy Hall of Fame',
            numberOfSongs: 5,
            length: '45:44'
        },
        {
            title: 'Lemonade',
            artist: 'Beyoncé',
            year: 2016,
            genre: 'Pop',
            comments: 'A visual and musical album experience.',
            review: 'Ambitious, personal, and sonically expansive.',
            awards: 'Peabody Award; 2 Grammys',
            numberOfSongs: 12,
            length: '45:49'
        },
        {
            title: 'OK Computer',
            artist: 'Radiohead',
            year: 1997,
            genre: 'Alternative',
            comments: 'Atmospheric production rewards repeat listens.',
            review: 'A tense, forward-looking modern classic.',
            awards: 'Grammy nomination',
            numberOfSongs: 12,
            length: '53:21'
        },
        {
            title: 'Rumours',
            artist: 'Fleetwood Mac',
            year: 1977,
            genre: 'Rock',
            comments: 'Interpersonal tension became great pop music.',
            review: 'Impeccable hooks and layered harmonies.',
            awards: 'Album of the Year Grammy',
            numberOfSongs: 11,
            length: '39:04'
        },
        {
            title: 'Songs in the Key of Life',
            artist: 'Stevie Wonder',
            year: 1976,
            genre: 'Soul',
            comments: 'Generous, joyful, and full of musical invention.',
            review: 'A dazzling and emotionally wide-ranging statement.',
            awards: 'Album of the Year Grammy',
            numberOfSongs: 21,
            length: '1:25:41'
        },
        {
            title: 'To Pimp a Butterfly',
            artist: 'Kendrick Lamar',
            year: 2015,
            genre: 'Hip-Hop',
            comments: 'Dense production and a powerful social perspective.',
            review: 'Complex, urgent, and richly rewarding.',
            awards: '5 Grammy Awards',
            numberOfSongs: 16,
            length: '54:12'
        },
        ...Array.from({ length: 42 }, (_, index): SongRecord => {
            const songNumber = index + 9;
            const genres = ['Pop', 'Rock', 'Jazz', 'Soul', 'Folk', 'Hip-Hop'];
            const artists = ['Adele', 'David Bowie', 'Nina Simone', 'Prince', 'Taylor Swift', 'Bob Dylan'];

            return {
                title: `Track ${String(songNumber).padStart(2, '0')}`,
                artist: artists[index % artists.length],
                year: 1980 + (index % 45),
                genre: genres[index % genres.length],
                comments: `Curated song entry ${songNumber}.`,
                review: 'A strong addition to the collection.',
                awards: index % 4 === 0 ? 'Critics Choice nominee' : '—',
                numberOfSongs: 8 + (index % 15),
                length: `${3 + (index % 3)}:${String(12 + (index * 7) % 48).padStart(2, '0')}`
            };
        })
    ];

    selectTab(tab: 'table' | 'grid'): void {
        this.activeTab = tab;
    }
}
