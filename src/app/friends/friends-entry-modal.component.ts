import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Input, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalHistoryService } from '../modal-history.service';

interface ChangedField {
    label: string;
    before: string;
    after: string;
}

export interface FriendActivity {
    id: number;
    title: string;
    when: string;
    location: string;
    notes: string;
}

export interface FriendRecord {
    id: number;
    name: string;
    city: string;
    hobby: string;
    status: 'Best Friend' | 'Close Friend' | 'Friend' | 'New Friend';
    birthday: string;
    yearsKnown: number;
    activities: FriendActivity[];
}

export interface FriendsModalResult {
    action: 'save' | 'delete';
    friend: FriendRecord;
}

type TrackedFieldKey = 'name' | 'city' | 'hobby' | 'status' | 'birthday' | 'yearsKnown' | 'activities';
type ActivityTrackedFieldKey = 'title' | 'when' | 'location' | 'notes';

@Component({
    selector: 'app-friends-entry-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './friends-entry-modal.component.html',
    styleUrl: './friends-entry-modal.component.scss'
})
export class FriendsEntryModalComponent implements OnInit, AfterViewInit {
    activeModal = inject(NgbActiveModal);
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    @ViewChild('deleteConfirmModal') private deleteConfirmModal?: TemplateRef<unknown>;
    @ViewChild('unsavedChangesModal') private unsavedChangesModal?: TemplateRef<unknown>;
    @ViewChild('activitiesGridModal') private activitiesGridModal?: TemplateRef<unknown>;
    @ViewChild('activityEditModal') private activityEditModal?: TemplateRef<unknown>;
    @ViewChild('activityUnsavedChangesModal') private activityUnsavedChangesModal?: TemplateRef<unknown>;
    @ViewChild('activityDeleteConfirmModal') private activityDeleteConfirmModal?: TemplateRef<unknown>;

    @Input({ required: true }) friend!: FriendRecord;
    @Input() allowDelete = false;
    @Input() openActivitiesOnInit = false;

    editDraft: FriendRecord | null = null;
    originalDraft: FriendRecord | null = null;
    activityEditDraft: FriendActivity | null = null;
    activityEditOriginalDraft: FriendActivity | null = null;
    activityEditOriginalId: number | null = null;
    activitySaveAttempted = false;
    readonly activityPageSize = 8;
    currentActivityPage = 1;
    private hasAutoOpenedActivities = false;
    saveAttempted = false;
    readonly statuses: FriendRecord['status'][] = ['Best Friend', 'Close Friend', 'Friend', 'New Friend'];

    ngOnInit(): void {
        const normalized = this.normalizeRecord(this.friend);
        this.editDraft = structuredClone(normalized);
        this.originalDraft = structuredClone(normalized);
    }

    ngAfterViewInit(): void {
        if (!this.openActivitiesOnInit || this.hasAutoOpenedActivities) {
            return;
        }

        this.hasAutoOpenedActivities = true;
        queueMicrotask(() => this.openActivitiesGrid());
    }

    canSave(): boolean {
        if (!this.editDraft) {
            return false;
        }

        return this.editDraft.name.trim().length > 0
            && this.editDraft.city.trim().length > 0
            && this.editDraft.hobby.trim().length > 0
            && this.editDraft.birthday.trim().length > 0
            && Number.isFinite(this.editDraft.yearsKnown)
            && this.editDraft.yearsKnown >= 0;
    }

    save(): void {
        this.saveAttempted = true;
        if (!this.editDraft || !this.canSave()) {
            return;
        }

        const updated: FriendRecord = {
            ...this.editDraft,
            name: this.editDraft.name.trim(),
            city: this.editDraft.city.trim(),
            hobby: this.editDraft.hobby.trim(),
            birthday: this.editDraft.birthday.trim(),
            yearsKnown: Number(this.editDraft.yearsKnown),
            activities: this.sanitizeActivities(this.editDraft.activities)
        };

        this.activeModal.close({ action: 'save', friend: updated } satisfies FriendsModalResult);
    }

    async requestDelete(): Promise<void> {
        const friendToDelete = this.editDraft;
        if (!this.allowDelete || !friendToDelete || friendToDelete.activities.length > 0) {
            return;
        }

        const shouldDelete = await this.confirmDeleteWithModal();
        if (!shouldDelete) {
            return;
        }

        this.activeModal.close({ action: 'delete', friend: friendToDelete } satisfies FriendsModalResult);
    }

    canDeleteFriend(): boolean {
        if (!this.allowDelete || !this.editDraft) {
            return false;
        }

        return this.editDraft.activities.length === 0;
    }

    hasUnsavedChanges(): boolean {
        if (!this.editDraft || !this.originalDraft) {
            return false;
        }

        return JSON.stringify(this.editDraft) !== JSON.stringify(this.originalDraft);
    }

    async handleBeforeDismiss(): Promise<boolean> {
        if (this.hasUnsavedChanges()) {
            const shouldDiscard = await this.confirmDiscardChangesWithModal();
            if (!shouldDiscard) {
                this.modalHistory.restoreHistoryIfPending();
                return false;
            }
        }
        return true;
    }

    async requestCancel(): Promise<void> {
        if (this.hasUnsavedChanges()) {
            const shouldDiscard = await this.confirmDiscardChangesWithModal();
            if (!shouldDiscard) {
                return;
            }
        }

        this.activeModal.close('cancel');
    }

    openActivitiesGrid(): void {
        if (!this.activitiesGridModal) {
            return;
        }

        this.currentActivityPage = 1;

        const dialogRef = this.modalService.open(this.activitiesGridModal, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            size: 'lg',
            scrollable: true
        });
        this.modalHistory.registerModal(dialogRef);

        void dialogRef.result.catch(() => undefined);
    }

    async openAddActivityModal(): Promise<void> {
        await this.openActivityEditModal();
    }

    async openEditActivityModal(activity: FriendActivity): Promise<void> {
        await this.openActivityEditModal(activity);
    }

    canSaveActivity(): boolean {
        if (!this.activityEditDraft) {
            return false;
        }

        return this.activityEditDraft.title.trim().length > 0;
    }

    saveActivityEditor(modal: { close: (value?: unknown) => void }): void {
        this.activitySaveAttempted = true;
        if (!this.canSaveActivity()) {
            return;
        }

        modal.close('save');
    }

    async deleteActivityEditor(modal: { close: (value?: unknown) => void }): Promise<void> {
        if (this.activityEditOriginalId === null) {
            return;
        }

        const shouldDelete = await this.confirmDeleteActivityWithModal();
        if (!shouldDelete) {
            return;
        }

        modal.close('delete');
    }

    hasUnsavedActivityChanges(): boolean {
        if (!this.activityEditDraft || !this.activityEditOriginalDraft) {
            return false;
        }

        return JSON.stringify(this.activityEditDraft) !== JSON.stringify(this.activityEditOriginalDraft);
    }

    async requestCancelActivityEditor(modal: { close: (value?: unknown) => void }): Promise<void> {
        if (this.hasUnsavedActivityChanges()) {
            const shouldDiscard = await this.confirmDiscardActivityChangesWithModal();
            if (!shouldDiscard) {
                return;
            }
        }

        modal.close('cancel');
    }

    getActivityUnsavedChanges(): ChangedField[] {
        if (!this.activityEditDraft || !this.activityEditOriginalDraft) {
            return [];
        }

        const fields: Array<{ key: ActivityTrackedFieldKey; label: string }> = [
            { key: 'title', label: 'Title' },
            { key: 'when', label: 'When' },
            { key: 'location', label: 'Location' },
            { key: 'notes', label: 'Notes' }
        ];

        const changes: ChangedField[] = [];
        for (const field of fields) {
            const beforeVal = this.activityEditOriginalDraft[field.key];
            const afterVal = this.activityEditDraft[field.key];
            if (beforeVal !== afterVal) {
                changes.push({
                    label: field.label,
                    before: this.formatChangedValue(beforeVal),
                    after: this.formatChangedValue(afterVal)
                });
            }
        }

        return changes;
    }

    get totalActivityPages(): number {
        if (!this.editDraft) {
            return 1;
        }

        return Math.max(1, Math.ceil(this.editDraft.activities.length / this.activityPageSize));
    }

    get pagedActivities(): FriendActivity[] {
        if (!this.editDraft) {
            return [];
        }

        const start = (this.currentActivityPage - 1) * this.activityPageSize;
        return this.editDraft.activities.slice(start, start + this.activityPageSize);
    }

    previousActivityPage(): void {
        if (this.currentActivityPage > 1) {
            this.currentActivityPage--;
        }
    }

    nextActivityPage(): void {
        if (this.currentActivityPage < this.totalActivityPages) {
            this.currentActivityPage++;
        }
    }

    getUnsavedChanges(): ChangedField[] {
        if (!this.editDraft || !this.originalDraft) {
            return [];
        }

        const fields: Array<{ key: TrackedFieldKey; label: string }> = [
            { key: 'name', label: 'Name' },
            { key: 'city', label: 'City' },
            { key: 'hobby', label: 'Hobby' },
            { key: 'status', label: 'Status' },
            { key: 'birthday', label: 'Birthday' },
            { key: 'yearsKnown', label: 'Years Known' },
            { key: 'activities', label: 'Activities' }
        ];

        const changes: ChangedField[] = [];
        for (const field of fields) {
            const beforeVal = this.originalDraft[field.key];
            const afterVal = this.editDraft[field.key];
            if (beforeVal !== afterVal) {
                changes.push({
                    label: field.label,
                    before: this.formatChangedValue(beforeVal),
                    after: this.formatChangedValue(afterVal)
                });
            }
        }

        return changes;
    }

    private confirmDeleteWithModal(): Promise<boolean> {
        if (!this.deleteConfirmModal) {
            return Promise.resolve(false);
        }

        const dialogRef = this.modalService.open(this.deleteConfirmModal, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            scrollable: true
        });
        this.modalHistory.registerModal(dialogRef);

        return dialogRef.result
            .then(result => result === 'delete')
            .catch(() => false);
    }

    private confirmDiscardChangesWithModal(): Promise<boolean> {
        if (!this.unsavedChangesModal) {
            return Promise.resolve(false);
        }

        const dialogRef = this.modalService.open(this.unsavedChangesModal, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            scrollable: true
        });
        this.modalHistory.registerModal(dialogRef);

        return dialogRef.result
            .then(result => result === 'discard')
            .catch(() => false);
    }

    private async openActivityEditModal(activity?: FriendActivity): Promise<void> {
        if (!this.editDraft || !this.activityEditModal) {
            return;
        }

        this.activitySaveAttempted = false;
        this.activityEditOriginalId = activity ? activity.id : null;
        this.activityEditDraft = activity
            ? structuredClone(activity)
            : {
                id: this.getNextActivityId(),
                title: '',
                when: '',
                location: '',
                notes: ''
            };
        this.activityEditOriginalDraft = structuredClone(this.activityEditDraft);

        const dialogRef = this.modalService.open(this.activityEditModal, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => this.handleBeforeDismissActivityEditor()
        });
        this.modalHistory.registerModal(dialogRef);

        try {
            const result = await dialogRef.result;
            if (result === 'save' && this.activityEditDraft) {
                const cleaned: FriendActivity = {
                    id: this.activityEditDraft.id,
                    title: this.activityEditDraft.title.trim(),
                    when: this.activityEditDraft.when.trim(),
                    location: this.activityEditDraft.location.trim(),
                    notes: this.activityEditDraft.notes.trim()
                };

                this.upsertActivity(cleaned);
            }

            if (result === 'delete' && this.activityEditOriginalId !== null) {
                this.removeActivityById(this.activityEditOriginalId);
            }
        } catch {
            // User dismissed the nested activity modal.
        } finally {
            this.activityEditDraft = null;
            this.activityEditOriginalDraft = null;
            this.activityEditOriginalId = null;
        }
    }

    private async handleBeforeDismissActivityEditor(): Promise<boolean> {
        if (this.hasUnsavedActivityChanges()) {
            const shouldDiscard = await this.confirmDiscardActivityChangesWithModal();
            if (!shouldDiscard) {
                this.modalHistory.restoreHistoryIfPending();
                return false;
            }
        }

        return true;
    }

    private confirmDiscardActivityChangesWithModal(): Promise<boolean> {
        if (!this.activityUnsavedChangesModal) {
            return Promise.resolve(false);
        }

        const dialogRef = this.modalService.open(this.activityUnsavedChangesModal, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            scrollable: true
        });
        this.modalHistory.registerModal(dialogRef);

        return dialogRef.result
            .then(result => result === 'discard')
            .catch(() => false);
    }

    private confirmDeleteActivityWithModal(): Promise<boolean> {
        if (!this.activityDeleteConfirmModal) {
            return Promise.resolve(false);
        }

        const dialogRef = this.modalService.open(this.activityDeleteConfirmModal, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            scrollable: true
        });
        this.modalHistory.registerModal(dialogRef);

        return dialogRef.result
            .then(result => result === 'delete')
            .catch(() => false);
    }

    private upsertActivity(activity: FriendActivity): void {
        if (!this.editDraft) {
            return;
        }

        const index = this.editDraft.activities.findIndex((existing) => existing.id === activity.id);
        if (index >= 0) {
            this.editDraft.activities[index] = activity;
            return;
        }

        this.editDraft.activities = [activity, ...this.editDraft.activities];
        this.currentActivityPage = 1;
    }

    private removeActivityById(activityId: number): void {
        if (!this.editDraft) {
            return;
        }

        this.editDraft.activities = this.editDraft.activities.filter((activity) => activity.id !== activityId);
        if (this.currentActivityPage > this.totalActivityPages) {
            this.currentActivityPage = this.totalActivityPages;
        }
    }

    private getNextActivityId(): number {
        if (!this.editDraft || !this.editDraft.activities.length) {
            return 1;
        }

        return Math.max(...this.editDraft.activities.map((activity) => activity.id)) + 1;
    }

    private normalizeRecord(friend: FriendRecord): FriendRecord {
        return {
            ...friend,
            activities: this.normalizeActivities(friend.activities)
        };
    }

    private normalizeActivities(activities: FriendActivity[] | undefined): FriendActivity[] {
        if (!Array.isArray(activities)) {
            return [];
        }

        return activities.map((activity, index) => ({
            id: Number.isFinite(activity?.id) ? activity.id : index + 1,
            title: (activity?.title ?? '').trim(),
            when: (activity?.when ?? '').trim(),
            location: (activity?.location ?? '').trim(),
            notes: (activity?.notes ?? '').trim()
        }));
    }

    private sanitizeActivities(activities: FriendActivity[] | undefined): FriendActivity[] {
        return this.normalizeActivities(activities).filter((activity) => {
            return activity.title.length > 0
                || activity.when.length > 0
                || activity.location.length > 0
                || activity.notes.length > 0;
        });
    }

    private formatChangedValue(value: unknown): string {
        if (Array.isArray(value)) {
            return `${value.length} activities`;
        }

        const text = String(value ?? '').trim();
        return text.length ? text : '(blank)';
    }
}
