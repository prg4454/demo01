import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

export interface EmployeeRecord {
    id: string;
    name: string;
    department: string;
    role: string;
    email: string;
    phone: string;
    hireDate: string;
    salary: number;
    status: 'Active' | 'On Leave' | 'Terminated';
}

export interface EmployeeModalResult {
    action: 'save' | 'delete';
    record: EmployeeRecord;
}

@Component({
    selector: 'app-employee-entry-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './employee-entry-modal.component.html',
    styleUrl: './employee-entry-modal.component.scss'
})
export class EmployeeEntryModalComponent implements OnInit {
    activeModal = inject(NgbActiveModal);

    @Input({ required: true }) record!: EmployeeRecord;
    @Input() allowDelete = false;

    editDraft: EmployeeRecord | null = null;
    saveAttempted = false;

    readonly departments = ['Engineering', 'Marketing', 'Sales', 'Finance', 'Human Resources', 'Operations'];
    readonly statuses: EmployeeRecord['status'][] = ['Active', 'On Leave', 'Terminated'];

    ngOnInit(): void {
        this.editDraft = structuredClone(this.record);
    }

    canSave(): boolean {
        if (!this.editDraft) return false;
        return !!(this.editDraft.name.trim() && this.editDraft.role.trim() && this.editDraft.email.trim());
    }

    save(): void {
        this.saveAttempted = true;
        if (!this.canSave() || !this.editDraft) return;

        this.activeModal.close({
            action: 'save',
            record: this.editDraft
        } as EmployeeModalResult);
    }

    delete(): void {
        if (!this.editDraft) return;
        this.activeModal.close({
            action: 'delete',
            record: this.editDraft
        } as EmployeeModalResult);
    }

    cancel(): void {
        this.activeModal.dismiss('cancel');
    }
}

