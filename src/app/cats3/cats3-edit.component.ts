import { Component, OnInit, HostListener, ViewChild, ElementRef, Output, EventEmitter, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CatRecord {
    id: number;
    name: string;
    breed: string;
    owner: string;
    reason: string;
    checkIn: string;
    status: 'Waiting' | 'Exam' | 'Treatment' | 'Ready';
    vet: string;
    nextAppointment: string;
}

export interface ChangedField {
    label: string;
    before: string;
    after: string;
}

@Component({
    selector: 'app-cats3-edit',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './cats3-edit.component.html',
    styleUrl: './cats3-edit.component.scss'
})
export class Cats3EditComponent implements OnInit {
    // Outputs to communicate changes back to the parent list component
    @Output() saved = new EventEmitter<CatRecord>();
    @Output() deleted = new EventEmitter<CatRecord>();

    private cdr = inject(ChangeDetectorRef);

    // 1. References to the native HTML5 <dialog> elements in the template
    @ViewChild('editDialog') editDialogEl!: ElementRef<HTMLDialogElement>;
    @ViewChild('unsavedDialog') unsavedDialogEl!: ElementRef<HTMLDialogElement>;
    @ViewChild('deleteConfirmDialog') deleteConfirmDialogEl!: ElementRef<HTMLDialogElement>;

    private unsavedResolver: ((discard: boolean) => void) | null = null;
    private deleteResolver: ((confirm: boolean) => void) | null = null;

    cat!: CatRecord;
    editDraft!: CatRecord;
    originalDraft!: CatRecord;
    allowDelete = false;
    readonly statuses: CatRecord['status'][] = ['Waiting', 'Exam', 'Treatment', 'Ready'];

    ngOnInit(): void { }

    open(cat: CatRecord, allowDelete = true): void {
        this.cat = cat;
        this.editDraft = {
            ...structuredClone(cat),
            nextAppointment: cat.nextAppointment || ''
        };
        this.originalDraft = structuredClone(this.editDraft);
        this.allowDelete = allowDelete;

        // Prevent body/backdrop scroll when dialog is active
        document.body.style.overflow = 'hidden';

        // Force Angular to evaluate bindings and populate input controls in the template
        this.cdr.detectChanges();

        // Show the native HTML dialog modal
        const dialog = this.editDialogEl.nativeElement;
        dialog.showModal();
    }

    // 3. Close the main dialog programmatically (used during destruction or deactivation)
    close(): void {
        const dialog = this.editDialogEl.nativeElement;
        if (dialog && dialog.open) {
            dialog.close();
        }

        // Restore body/backdrop scroll
        document.body.style.overflow = '';

        this.closeUnsavedDialog(true);
        this.closeDeleteDialog(false);
    }

    onDialogClose(): void {
        // Safe check to restore scrolling in case dialog closed natively (e.g. Esc button)
        document.body.style.overflow = '';
    }

    isOpen(): boolean {
        return this.editDialogEl?.nativeElement?.open ?? false;
    }

    @HostListener('window:beforeunload', ['$event'])
    onBeforeUnload(event: BeforeUnloadEvent): void {
        if (this.isOpen() && this.hasUnsavedChanges()) {
            event.preventDefault();
            event.returnValue = ''; // Standard browser refresh interception prompt
        }
    }

    hasUnsavedChanges(): boolean {
        if (!this.isOpen() || !this.editDraft || !this.originalDraft) {
            return false;
        }
        return JSON.stringify(this.editDraft) !== JSON.stringify(this.originalDraft);
    }

    // Compare properties to identify what changed
    getUnsavedChanges(): ChangedField[] {
        const changes: ChangedField[] = [];
        const before = this.originalDraft;
        const after = this.editDraft;
        if (!before || !after) return [];

        if (before.name !== after.name) {
            changes.push({ label: 'Name', before: before.name, after: after.name });
        }
        if (before.breed !== after.breed) {
            changes.push({ label: 'Breed', before: before.breed, after: after.breed });
        }
        if (before.reason !== after.reason) {
            changes.push({ label: 'Reason', before: before.reason, after: after.reason });
        }
        if (before.vet !== after.vet) {
            changes.push({ label: 'Vet', before: before.vet, after: after.vet });
        }
        if (before.status !== after.status) {
            changes.push({ label: 'Status', before: before.status, after: after.status });
        }
        if (before.owner !== after.owner) {
            changes.push({ label: 'Owner', before: before.owner, after: after.owner });
        }
        if (before.checkIn !== after.checkIn) {
            changes.push({ label: 'Check-In', before: before.checkIn, after: after.checkIn });
        }
        if (before.nextAppointment !== after.nextAppointment) {
            changes.push({ label: 'Next Appointment', before: before.nextAppointment, after: after.nextAppointment });
        }
        return changes;
    }

    // 4. Open the native HTML <dialog> for unsaved changes warning using native promises
    confirmDiscardWithHtmlDialog(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.unsavedResolver = resolve;
            const dialog = this.unsavedDialogEl.nativeElement;
            dialog.showModal();
        });
    }

    closeUnsavedDialog(discard: boolean): void {
        const dialog = this.unsavedDialogEl.nativeElement;
        if (dialog && dialog.open) {
            dialog.close();
        }
        if (this.unsavedResolver) {
            this.unsavedResolver(discard);
            this.unsavedResolver = null;
        }
    }

    // 5. Open the native HTML <dialog> for delete confirmation
    confirmDeleteWithHtmlDialog(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.deleteResolver = resolve;
            const dialog = this.deleteConfirmDialogEl.nativeElement;
            dialog.showModal();
        });
    }

    closeDeleteDialog(confirm: boolean): void {
        const dialog = this.deleteConfirmDialogEl.nativeElement;
        if (dialog && dialog.open) {
            dialog.close();
        }
        if (this.deleteResolver) {
            this.deleteResolver(confirm);
            this.deleteResolver = null;
        }
    }

    canSave(): boolean {
        if (!this.editDraft) return false;
        return (this.editDraft.name?.trim() ?? '').length > 0
            && (this.editDraft.breed?.trim() ?? '').length > 0
            && (this.editDraft.owner?.trim() ?? '').length > 0
            && (this.editDraft.reason?.trim() ?? '').length > 0
            && (this.editDraft.checkIn?.trim() ?? '').length > 0
            && (this.editDraft.vet?.trim() ?? '').length > 0
            && (this.editDraft.nextAppointment?.trim() ?? '').length > 0;
    }

    save(): void {
        if (!this.canSave()) {
            return;
        }
        const updated = {
            ...this.editDraft,
            name: (this.editDraft.name ?? '').trim(),
            breed: (this.editDraft.breed ?? '').trim(),
            owner: (this.editDraft.owner ?? '').trim(),
            reason: (this.editDraft.reason ?? '').trim(),
            checkIn: (this.editDraft.checkIn ?? '').trim(),
            vet: (this.editDraft.vet ?? '').trim(),
            nextAppointment: (this.editDraft.nextAppointment ?? '').trim()
        };
        // Close native dialog
        this.editDialogEl.nativeElement.close();
        // Emit saved event back to parent
        this.saved.emit(updated);
    }

    delete(): void {
        this.confirmDeleteWithHtmlDialog().then((isConfirmed) => {
            if (isConfirmed) {
                // Close native dialogs
                this.editDialogEl.nativeElement.close();
                // Emit deleted event back to parent
                this.deleted.emit(this.editDraft);
            }
        });
    }

    cancel(): void {
        // If there are unsaved changes, prompt the user with the native HTML dialog first.
        if (this.hasUnsavedChanges()) {
            this.confirmDiscardWithHtmlDialog().then(discard => {
                if (discard) {
                    this.editDialogEl.nativeElement.close();
                }
            });
            return;
        }
        this.editDialogEl.nativeElement.close();
    }
}

