import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ModalHistoryService } from '../modal-history.service';
import {
    PensAndPencilsEntryModalComponent,
    PensAndPencilsModalResult,
    PensAndPencilsRecord
} from './pens-and-pencils-entry-modal.component';

@Component({
    selector: 'app-pens-and-pencils',
    standalone: true,
    imports: [CommonModule, NgbModalModule],
    templateUrl: './pens-and-pencils.component.html',
    styleUrl: './pens-and-pencils.component.scss'
})
export class PensAndPencilsComponent {
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    private readonly recordTemplates: PensAndPencilsRecord[] = [
        { id: 1, brand: 'Pilot G2', type: 'Pen', color: 'Black', pointOrLead: '0.7 mm', count: 12, location: 'Desk drawer', comments: 'Smooth writer for daily notes.' },
        { id: 2, brand: 'Ticonderoga', type: 'Pencil', color: 'Yellow', pointOrLead: 'HB', count: 24, location: 'School supply bin', comments: 'Classic classroom pencil.' },
        { id: 3, brand: 'Uniball Jetstream', type: 'Pen', color: 'Blue', pointOrLead: '0.5 mm', count: 6, location: 'Office cup', comments: 'Quick-drying ink for forms.' },
        { id: 4, brand: 'Paper Mate Flair', type: 'Pen', color: 'Red', pointOrLead: 'Medium', count: 10, location: 'Notebook pouch', comments: 'Good for marking edits.' },
        { id: 5, brand: 'Pentel RSVP', type: 'Pen', color: 'Black', pointOrLead: '1.0 mm', count: 8, location: 'Kitchen junk drawer', comments: 'Reliable cheap backup pen.' },
        { id: 6, brand: 'BIC Cristal', type: 'Pen', color: 'Blue', pointOrLead: 'Medium', count: 20, location: 'Desk organizer', comments: 'Transparent body, classic look.' },
        { id: 7, brand: 'Moleskine Pencil', type: 'Pencil', color: 'Graphite', pointOrLead: '2B', count: 4, location: 'Sketch kit', comments: 'Used for rough drawing and notes.' },
        { id: 8, brand: 'Sharpie S-Gel', type: 'Pen', color: 'Black', pointOrLead: '0.7 mm', count: 14, location: 'Office shelf', comments: 'Bold ink with clean lines.' },
        { id: 9, brand: 'Staedtler Noris', type: 'Pencil', color: 'Yellow/Black', pointOrLead: 'HB', count: 18, location: 'Art bin', comments: 'Good balance for writing and sketching.' },
        { id: 10, brand: 'Lamy Safari', type: 'Pen', color: 'Blue', pointOrLead: 'Fine', count: 3, location: 'Display case', comments: 'Nicer pen reserved for signatures.' }
    ];

    records: PensAndPencilsRecord[] = Array.from({ length: 100 }, (_, index) => {
        const template = this.recordTemplates[index % this.recordTemplates.length];
        const copyNumber = Math.floor(index / this.recordTemplates.length);

        return {
            ...template,
            id: index + 1,
            brand: copyNumber === 0 ? template.brand : `${template.brand} ${copyNumber + 1}`
        };
    });

    editDraft: PensAndPencilsRecord | null = null;
    originalDraft: PensAndPencilsRecord | null = null;

    openAddModal(): void {
        const modalRef = this.modalService.open(PensAndPencilsEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: true,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => modalRef.componentInstance.handleBeforeDismiss()
        });
        this.modalHistory.registerModal(modalRef);

        modalRef.componentInstance.record = {
            id: this.getNextId(),
            brand: '',
            type: 'Pen',
            color: '',
            pointOrLead: '',
            count: 1,
            location: '',
            comments: ''
        };
        modalRef.componentInstance.allowDelete = false;

        void modalRef.result
            .then((result: PensAndPencilsModalResult) => {
                if (!result || result.action !== 'save') {
                    return;
                }

                this.saveRecord(result.record);
            })
            .catch(() => undefined);
    }

    openEditModal(record: PensAndPencilsRecord): void {
        const modalRef = this.modalService.open(PensAndPencilsEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: true,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => modalRef.componentInstance.handleBeforeDismiss()
        });
        this.modalHistory.registerModal(modalRef);

        modalRef.componentInstance.record = structuredClone(record);
        modalRef.componentInstance.allowDelete = true;

        void modalRef.result
            .then((result: PensAndPencilsModalResult) => {
                if (!result) {
                    return;
                }

                if (result.action === 'delete') {
                    this.deleteRecord(result.record);
                    return;
                }

                this.saveRecord(result.record);
            })
            .catch(() => undefined);
    }

    private getNextId(): number {
        if (!this.records.length) {
            return 1;
        }
        return Math.max(...this.records.map(record => record.id)) + 1;
    }

    private saveRecord(record: PensAndPencilsRecord): void {
        const existingIndex = this.records.findIndex(item => item.id === record.id);
        if (existingIndex >= 0) {
            this.records = this.records.map(item => item.id === record.id ? record : item);
        } else {
            this.records = [record, ...this.records];
        }
    }

    private deleteRecord(record: PensAndPencilsRecord): void {
        this.records = this.records.filter(item => item.id !== record.id);
    }
}
