import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ModalHistoryService } from '../modal-history.service';
import { SayingsEntryModalComponent, SayingsModalResult, SillySaying } from './sayings-entry-modal.component';

@Component({
    selector: 'app-sayings',
    standalone: true,
    imports: [CommonModule, NgbModalModule],
    templateUrl: './sayings.component.html',
    styleUrl: './sayings.component.scss'
})
export class SayingsComponent {
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    page = 1;
    readonly pageSize = 5;
    selectedSayingId: number | null = null;

    sayings: SillySaying[] = [
        { id: 1, text: 'If toast lands butter-side down, call it floor seasoning.', category: 'Kitchen Chaos', vibe: 'Goofy', wordCount: 9, laughLevel: 7, origin: 'Aunt Nelly', lastHeard: '2026-05-10' },
        { id: 2, text: 'My brain has too many tabs and one is playing kazoo music.', category: 'Brain Fog', vibe: 'Absurd', wordCount: 12, laughLevel: 9, origin: 'Office Slack', lastHeard: '2026-06-18' },
        { id: 3, text: 'I run on iced coffee and unreasonable confidence.', category: 'Work Life', vibe: 'Spicy', wordCount: 8, laughLevel: 8, origin: 'Break Room', lastHeard: '2026-06-27' },
        { id: 4, text: 'Do not disturb, I am negotiating with my houseplants.', category: 'Home', vibe: 'Whimsical', wordCount: 9, laughLevel: 6, origin: 'Neighbor Joe', lastHeard: '2026-04-03' },
        { id: 5, text: 'This meeting could have been an aggressively worded sticky note.', category: 'Work Life', vibe: 'Snarky', wordCount: 10, laughLevel: 8, origin: 'Team Chat', lastHeard: '2027-07-15' },
        { id: 6, text: 'I am not late, I am on side-quest time.', category: 'Daily Excuses', vibe: 'Playful', wordCount: 9, laughLevel: 7, origin: 'Gym Lobby', lastHeard: '2026-03-29' },
        { id: 7, text: 'My wallet is on a diet and thriving.', category: 'Money', vibe: 'Dry', wordCount: 7, laughLevel: 7, origin: 'Family Group Text', lastHeard: '2026-05-19' },
        { id: 8, text: 'I clean my room by rotating clutter clockwise.', category: 'Home', vibe: 'Messy', wordCount: 8, laughLevel: 6, origin: 'Roommate', lastHeard: '2026-07-01' },
        { id: 9, text: 'If plan A fails, remember there are 25 other letters.', category: 'Motivation', vibe: 'Cheery', wordCount: 10, laughLevel: 5, origin: 'Coach Pam', lastHeard: '2026-02-14' },
        { id: 10, text: 'I am fluent in typo and mild panic.', category: 'Brain Fog', vibe: 'Chaotic', wordCount: 8, laughLevel: 8, origin: 'Late Night Email', lastHeard: '2026-06-01' },
        { id: 11, text: 'My to-do list and I are in a situationship.', category: 'Work Life', vibe: 'Relatable', wordCount: 9, laughLevel: 8, origin: 'Project Standup', lastHeard: '2026-07-12' },
        { id: 12, text: 'I brought enough snacks to survive emotional weather.', category: 'Mood', vibe: 'Comfort', wordCount: 9, laughLevel: 7, origin: 'Road Trip', lastHeard: '2026-01-21' }
    ];

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.sayings.length / this.pageSize));
    }

    get pagedSayings(): SillySaying[] {
        const start = (this.page - 1) * this.pageSize;
        return this.sayings.slice(start, start + this.pageSize);
    }

    previousPage(): void {
        if (this.page > 1) {
            this.page--;
        }
    }

    nextPage(): void {
        if (this.page < this.totalPages) {
            this.page++;
        }
    }

    openAddModal(): void {
        const newSaying: SillySaying = {
            id: this.getNextId(),
            text: '',
            category: '',
            vibe: '',
            wordCount: null,
            laughLevel: null,
            origin: '',
            lastHeard: ''
        };

        const modalRef = this.modalService.open(SayingsEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: true,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => modalRef.componentInstance.handleBeforeDismiss()
        });
        this.modalHistory.registerModal(modalRef);
        modalRef.componentInstance.saying = newSaying;
        modalRef.componentInstance.allowDelete = false;

        void modalRef.result
            .then((result: SayingsModalResult) => {
                if (result.action !== 'save') {
                    return;
                }

                this.sayings = [result.saying, ...this.sayings];
                this.selectedSayingId = result.saying.id;
                this.page = 1;
            })
            .catch(() => undefined);
    }

    openEditModal(saying: SillySaying): void {
        this.selectedSayingId = saying.id;

        const modalRef = this.modalService.open(SayingsEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: true,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => modalRef.componentInstance.handleBeforeDismiss()
        });
        this.modalHistory.registerModal(modalRef);
        modalRef.componentInstance.saying = structuredClone(saying);
        modalRef.componentInstance.allowDelete = true;

        void modalRef.result
            .then((result: SayingsModalResult) => {
                if (result.action === 'save') {
                    this.sayings = this.sayings.map(existing => existing.id === result.saying.id ? result.saying : existing);
                    return;
                }

                if (result.action === 'delete') {
                    this.sayings = this.sayings.filter(existing => existing.id !== result.saying.id);
                    if (this.page > this.totalPages) {
                        this.page = this.totalPages;
                    }
                    if (this.selectedSayingId === result.saying.id) {
                        this.selectedSayingId = null;
                    }
                }
            })
            .catch(() => undefined);
    }

    private getNextId(): number {
        if (!this.sayings.length) {
            return 1;
        }
        return Math.max(...this.sayings.map(s => s.id)) + 1;
    }
}
