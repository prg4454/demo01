import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ModalHistoryService } from '../modal-history.service';
import { JokesEntryModalComponent, JokeRecord, JokesModalResult } from './jokes-entry-modal.component';

@Component({
    selector: 'app-jokes',
    standalone: true,
    imports: [CommonModule, NgbModalModule],
    templateUrl: './jokes.component.html',
    styleUrl: './jokes.component.scss'
})
export class JokesComponent {
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    readonly pageSize = 8;
    currentPage = 1;

    jokes: JokeRecord[] = [
        {
            id: 201,
            setup: 'Why did the tomato turn red?',
            punchline: 'Because it saw the salad dressing.',
            category: 'Food',
            comedian: 'A. Lewis',
            audience: 'Family Night',
            slotTime: '7:10 PM',
            status: 'Polished',
            rating: 8
        },
        {
            id: 202,
            setup: 'Why do programmers prefer dark mode?',
            punchline: 'Because light attracts bugs.',
            category: 'Tech',
            comedian: 'C. Patel',
            audience: 'Office Crowd',
            slotTime: '7:35 PM',
            status: 'Testing',
            rating: 9
        },
        {
            id: 203,
            setup: 'What do you call fake spaghetti?',
            punchline: 'An impasta.',
            category: 'Food',
            comedian: 'R. Gomez',
            audience: 'Open Mic',
            slotTime: '8:00 PM',
            status: 'Draft',
            rating: 6
        },
        {
            id: 204,
            setup: 'Why was the math book sad?',
            punchline: 'It had too many problems.',
            category: 'School',
            comedian: 'D. Kim',
            audience: 'Parents Group',
            slotTime: '8:20 PM',
            status: 'Polished',
            rating: 7
        },
        {
            id: 205,
            setup: 'Why do bees have sticky hair?',
            punchline: 'Because they use honeycombs.',
            category: 'Animals',
            comedian: 'S. Taylor',
            audience: 'Kids Show',
            slotTime: '8:45 PM',
            status: 'Testing',
            rating: 7
        }
    ];

    get totalJokes(): number {
        return this.jokes.length;
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.jokes.length / this.pageSize));
    }

    get pagedJokes(): JokeRecord[] {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.jokes.slice(start, start + this.pageSize);
    }

    previousPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
        }
    }

    openAddModal(): void {
        const modalRef = this.modalService.open(JokesEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: true,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => this.modalHistory.handleBeforeDismiss(modalRef)
        });
        this.modalHistory.registerModal(modalRef);

        modalRef.componentInstance.joke = {
            id: this.getNextId(),
            setup: '',
            punchline: '',
            category: '',
            comedian: '',
            audience: '',
            slotTime: '',
            status: 'Draft',
            rating: null
        };
        modalRef.componentInstance.allowDelete = false;

        void modalRef.result
            .then((result: JokesModalResult) => {
                if (!result || result.action !== 'save') {
                    return;
                }

                this.jokes = [result.joke, ...this.jokes];
                this.currentPage = 1;
            })
            .catch(() => undefined);
    }

    openEditModal(joke: JokeRecord): void {
        const modalRef = this.modalService.open(JokesEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: true,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => this.modalHistory.handleBeforeDismiss(modalRef)
        });
        this.modalHistory.registerModal(modalRef);

        modalRef.componentInstance.joke = structuredClone(joke);
        modalRef.componentInstance.allowDelete = true;

        void modalRef.result
            .then((result: JokesModalResult) => {
                if (!result) {
                    return;
                }

                const idx = this.jokes.findIndex(j => j.id === result.joke.id);
                if (idx < 0) {
                    return;
                }

                if (result.action === 'delete') {
                    this.jokes = this.jokes.filter(j => j.id !== result.joke.id);
                    if (this.currentPage > this.totalPages) {
                        this.currentPage = this.totalPages;
                    }
                    return;
                }

                this.jokes = this.jokes.map(j => j.id === result.joke.id ? result.joke : j);
            })
            .catch(() => undefined);
    }

    private getNextId(): number {
        if (!this.jokes.length) {
            return 1;
        }
        return Math.max(...this.jokes.map(j => j.id)) + 1;
    }
}
