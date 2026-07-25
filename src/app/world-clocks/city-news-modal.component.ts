import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

interface RssItem {
    title: string;
    link: string;
    pubDate: string;
    author?: string;
}

interface RssResponse {
    status: string;
    message?: string;
    items?: RssItem[];
}

@Component({
    selector: 'app-city-news-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './city-news-modal.component.html',
    styleUrl: './city-news-modal.component.scss'
})
export class CityNewsModalComponent implements OnInit {
    private readonly http = inject(HttpClient);
    readonly activeModal = inject(NgbActiveModal);

    @Input({ required: true }) cityName = '';
    @Input({ required: true }) country = '';

    stories: RssItem[] = [];
    loading = true;
    errorMessage = '';

    ngOnInit(): void {
        this.loadNews();
    }

    loadNews(): void {
        this.loading = true;
        this.errorMessage = '';

        // Google News provides the location search as RSS. rss2json converts that
        // feed into browser-friendly JSON and avoids requiring a news API key.
        const search = `"${this.cityName}" ${this.country} when:7d`;
        const feedUrl =
            `https://news.google.com/rss/search?q=${encodeURIComponent(search)}` +
            '&hl=en-US&gl=US&ceid=US:en';
        const requestUrl =
            `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=10`;

        this.http.get<RssResponse>(requestUrl).subscribe({
            next: response => {
                if (response.status !== 'ok') {
                    this.showError(response.message);
                    return;
                }

                // Keep at most ten stories and decode entities such as "&amp;".
                this.stories = (response.items ?? []).slice(0, 10).map(story => ({
                    ...story,
                    title: this.decodeHtml(story.title)
                }));
                this.loading = false;
                if (this.stories.length === 0) {
                    this.errorMessage = 'No recent stories were found for this city.';
                }
            },
            error: () => this.showError()
        });
    }

    private showError(message?: string): void {
        this.loading = false;
        this.stories = [];
        this.errorMessage = message || 'News is temporarily unavailable. Please try again.';
    }

    private decodeHtml(value: string): string {
        if (typeof document === 'undefined') {
            return value;
        }

        const textArea = document.createElement('textarea');
        textArea.innerHTML = value;
        return textArea.value;
    }
}
