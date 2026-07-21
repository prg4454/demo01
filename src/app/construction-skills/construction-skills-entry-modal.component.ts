import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalHistoryService } from '../modal-history.service';

interface ChangedField {
    label: string;
    before: string;
    after: string;
}

export interface ConstructionSkillRecord {
    id: number;
    skill: string;
    category: string;
    level: 'Apprentice' | 'Journeyman' | 'Expert' | 'Master';
    certifiedBy: string;
    expiresOn: string;
    notes: string;
}

export interface ConstructionSkillsModalResult {
    action: 'save' | 'delete';
    skillRecord: ConstructionSkillRecord;
}

type TrackedFieldKey = 'skill' | 'category' | 'level' | 'certifiedBy' | 'expiresOn' | 'notes';

@Component({
    selector: 'app-construction-skills-entry-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './construction-skills-entry-modal.component.html',
    styleUrl: './construction-skills-entry-modal.component.scss'
})
export class ConstructionSkillsEntryModalComponent implements OnInit {
    activeModal = inject(NgbActiveModal);
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    @ViewChild('deleteConfirmModal') private deleteConfirmModal?: TemplateRef<unknown>;
    @ViewChild('unsavedChangesModal') private unsavedChangesModal?: TemplateRef<unknown>;

    @Input({ required: true }) skillRecord!: ConstructionSkillRecord;
    @Input() allowDelete = false;

    editDraft: ConstructionSkillRecord | null = null;
    originalDraft: ConstructionSkillRecord | null = null;
    saveAttempted = false;
    readonly levels: ConstructionSkillRecord['level'][] = ['Apprentice', 'Journeyman', 'Expert', 'Master'];

    ngOnInit(): void {
        this.editDraft = structuredClone(this.skillRecord);
        this.originalDraft = structuredClone(this.skillRecord);
    }

    canSave(): boolean {
        if (!this.editDraft) {
            return false;
        }

        return this.editDraft.skill.trim().length > 0
            && this.editDraft.category.trim().length > 0
            && this.editDraft.certifiedBy.trim().length > 0
            && this.editDraft.expiresOn.trim().length > 0;
    }

    save(): void {
        this.saveAttempted = true;
        if (!this.editDraft || !this.canSave()) {
            return;
        }

        const updated: ConstructionSkillRecord = {
            ...this.editDraft,
            skill: this.editDraft.skill.trim(),
            category: this.editDraft.category.trim(),
            certifiedBy: this.editDraft.certifiedBy.trim(),
            expiresOn: this.editDraft.expiresOn.trim(),
            notes: this.editDraft.notes.trim()
        };

        this.activeModal.close({ action: 'save', skillRecord: updated } satisfies ConstructionSkillsModalResult);
    }

    async requestDelete(): Promise<void> {
        if (!this.allowDelete || !this.editDraft) {
            return;
        }

        const shouldDelete = await this.confirmDeleteWithModal();
        if (!shouldDelete) {
            return;
        }

        this.activeModal.close({ action: 'delete', skillRecord: this.editDraft } satisfies ConstructionSkillsModalResult);
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

    getUnsavedChanges(): ChangedField[] {
        if (!this.editDraft || !this.originalDraft) {
            return [];
        }

        const fields: Array<{ key: TrackedFieldKey; label: string }> = [
            { key: 'skill', label: 'Skill' },
            { key: 'category', label: 'Category' },
            { key: 'level', label: 'Level' },
            { key: 'certifiedBy', label: 'Certified By' },
            { key: 'expiresOn', label: 'Expires On' },
            { key: 'notes', label: 'Notes' }
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

    private formatChangedValue(value: string): string {
        const text = String(value).trim();
        return text.length ? text : '(blank)';
    }
}
