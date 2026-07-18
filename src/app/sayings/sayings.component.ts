import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalHistoryService } from '../modal-history.service';

interface ChangedField {
    label: string;
    before: string;
    after: string;
}

interface SillySaying {
    id: number;
    text: string;
    category: string;
    vibe: string;
    wordCount: number | null;
    laughLevel: number | null;
    origin: string;
    lastHeard: string;
}

interface SayingEditModalResult {
    action: 'save' | 'delete';
    saying: SillySaying;
}

@Component({
    selector: 'app-saying-discard-changes-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="modal-header">
            <h5 class="modal-title">Unsaved Changes</h5>
        </div>
        <div class="modal-body">
            <p class="mb-3">You have unsaved changes. Review them below before closing this editor.</p>
            <div class="list-group">
                <div *ngFor="let field of changes" class="list-group-item">
                    <div class="fw-bold">{{ field.label }}</div>
                    <div class="small text-muted">Before: {{ field.before }}</div>
                    <div class="small">After: {{ field.after }}</div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" type="button" (click)="activeModal.dismiss('keep-editing')">Keep Editing</button>
            <button class="btn btn-warning" type="button" (click)="activeModal.close('discard')">Discard Changes</button>
        </div>
    `
})
class SayingDiscardChangesModalComponent {
    activeModal = inject(NgbActiveModal);
    changes: ChangedField[] = [];
}

@Component({
    selector: 'app-saying-edit-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="modal-header">
            <h5 class="modal-title" id="edit-saying-title">{{ title }}</h5>
            <button type="button" class="btn-close" (click)="onDismiss()"></button>
        </div>
        <div class="modal-body" *ngIf="editCopy">
            <form id="editSayingForm" autocomplete="off" (ngSubmit)="save()">
                <div class="row g-3">
                    <div class="col-12">
                        <label class="form-label fw-bold">Saying</label>
                        <textarea class="form-control" rows="3" [(ngModel)]="editCopy.text" name="text"></textarea>
                    </div>
                    <div class="col-12 col-sm-6">
                        <label class="form-label fw-bold">Category</label>
                        <input class="form-control" [(ngModel)]="editCopy.category" name="category" autocomplete="off">
                    </div>
                    <div class="col-12 col-sm-6">
                        <label class="form-label fw-bold">Vibe</label>
                        <input class="form-control" [(ngModel)]="editCopy.vibe" name="vibe" autocomplete="off">
                    </div>
                    <div class="col-12 col-sm-6">
                        <label class="form-label fw-bold">Word Count</label>
                        <input class="form-control" type="number" [(ngModel)]="editCopy.wordCount" name="wordCount" autocomplete="off">
                    </div>
                    <div class="col-12 col-sm-6">
                        <label class="form-label fw-bold">Laugh Level</label>
                        <input class="form-control" type="number" min="1" max="10" [(ngModel)]="editCopy.laughLevel" name="laughLevel" autocomplete="off">
                    </div>
                    <div class="col-12 col-sm-6">
                        <label class="form-label fw-bold">Origin</label>
                        <input class="form-control" [(ngModel)]="editCopy.origin" name="origin" autocomplete="off">
                    </div>
                    <div class="col-12 col-sm-6">
                        <label class="form-label fw-bold">Last Heard</label>
                        <input class="form-control" type="date" [(ngModel)]="editCopy.lastHeard" name="lastHeard" autocomplete="off">
                    </div>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button *ngIf="mode === 'edit'" class="btn btn-outline-danger me-auto" type="button" (click)="requestDelete()">Delete</button>
            <button class="btn btn-secondary" type="button" (click)="onDismiss()">Cancel</button>
            <button class="btn btn-primary" type="submit" form="editSayingForm">{{ mode === 'add' ? 'Add' : 'Save' }}</button>
        </div>
    `
})
class SayingEditModalComponent implements OnInit {
    activeModal = inject(NgbActiveModal);
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    @Input({ required: true }) editCopy!: SillySaying;
    @Input() mode: 'add' | 'edit' = 'edit';

    private initialEditState: SillySaying | null = null;
    private discardPrompt: Promise<boolean> | null = null;

    ngOnInit(): void {
        this.initialEditState = structuredClone(this.editCopy);
    }

    get title(): string {
        if (this.mode === 'add') {
            return 'Add New Saying';
        }
        return 'Edit Saying';
    }

    @HostListener('document:keydown.escape', ['$event'])
    handleEscape(event: Event): void {
        // NgbModal handles escape by default and calls beforeDismiss
    }

    confirmDiscardChanges(): Promise<boolean> {
        if (this.discardPrompt) {
            return this.discardPrompt;
        }

        const changes = this.getChangedFields();
        if (!changes.length) {
            return Promise.resolve(true);
        }

        const modalRef = this.modalService.open(SayingDiscardChangesModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            scrollable: true
        });
        this.modalHistory.registerModal(modalRef);
        modalRef.componentInstance.changes = changes;

        this.discardPrompt = modalRef.result
            .then(result => result === 'discard')
            .catch(() => false)
            .finally(() => {
                this.discardPrompt = null;
            });

        return this.discardPrompt;
    }

    async onDismiss(): Promise<void> {
        this.activeModal.dismiss('dismiss');
    }

    hasUnsavedChanges(): boolean {
        return this.getChangedFields().length > 0;
    }

    handleBeforeDismiss(): Promise<boolean> | boolean {
        if (this.hasUnsavedChanges()) {
            return this.confirmDiscardChanges();
        }
        return true;
    }

    save(): void {
        this.activeModal.close({ action: 'save', saying: this.editCopy } satisfies SayingEditModalResult);
    }

    requestDelete(): void {
        if (this.mode !== 'edit') {
            return;
        }

        const shouldDelete = window.confirm('Delete this saying?');
        if (!shouldDelete) {
            return;
        }

        this.confirmDelete();
    }

    confirmDelete(): void {
        this.activeModal.close({ action: 'delete', saying: this.editCopy } satisfies SayingEditModalResult);
    }

    private getChangedFields(): ChangedField[] {
        if (!this.initialEditState) {
            return [];
        }

        const fieldLabels: Array<[keyof SillySaying, string]> = [
            ['text', 'Saying'],
            ['category', 'Category'],
            ['vibe', 'Vibe'],
            ['wordCount', 'Word Count'],
            ['laughLevel', 'Laugh Level'],
            ['origin', 'Origin'],
            ['lastHeard', 'Last Heard']
        ];

        return fieldLabels
            .filter(([key]) => this.initialEditState?.[key] !== this.editCopy?.[key])
            .map(([key, label]) => ({
                label,
                before: this.formatValue(this.initialEditState?.[key]),
                after: this.formatValue(this.editCopy?.[key])
            }));
    }

    private formatValue(value: SillySaying[keyof SillySaying] | undefined): string {
        if (value === undefined || value === null || value === '') {
            return '(empty)';
        }
        return String(value);
    }
}

@Component({
    selector: 'app-sayings',
    standalone: true,
    imports: [CommonModule],
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
        { id: 5, text: 'This meeting could have been an aggressively worded sticky note.', category: 'Work Life', vibe: 'Snarky', wordCount: 10, laughLevel: 8, origin: 'Team Chat', lastHeard: '2026-07-05' },
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

    openAddNew(): void {
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

        const modalRef = this.modalService.open(SayingEditModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: true,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => this.modalHistory.handleBeforeDismiss(modalRef)
        });
        this.modalHistory.registerModal(modalRef);
        modalRef.componentInstance.editCopy = structuredClone(newSaying);
        modalRef.componentInstance.mode = 'add';

        void modalRef.result
            .then((result: SayingEditModalResult) => {
                if (result.action !== 'save') {
                    return;
                }

                this.sayings = [result.saying, ...this.sayings];
                this.selectedSayingId = result.saying.id;
                this.page = 1;
            })
            .catch(() => undefined);
    }

    openEdit(saying: SillySaying): void {
        this.selectedSayingId = saying.id;

        const modalRef = this.modalService.open(SayingEditModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: true,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => this.modalHistory.handleBeforeDismiss(modalRef)
        });
        this.modalHistory.registerModal(modalRef);
        modalRef.componentInstance.editCopy = structuredClone(saying);
        modalRef.componentInstance.mode = 'edit';

        void modalRef.result
            .then((result: SayingEditModalResult) => {
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