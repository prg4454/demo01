import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ExportDropdownComponent } from '../export-dropdown/export-dropdown.component';
import { ModalHistoryService } from '../modal-history.service';
import { NotebookRecord, NotebookEntryModalComponent, NotebookModalResult } from './notebook-entry-modal.component';

@Component({
    selector: 'app-notebooks',
    standalone: true,
    imports: [CommonModule, NgbModalModule, ExportDropdownComponent],
    templateUrl: './notebooks.component.html',
    styleUrl: './notebooks.component.scss'
})
export class NotebooksComponent {
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    readonly pageSize = 10;
    currentPage = 1;
    exportMessage = '';

    notebooks: NotebookRecord[] = [];

    constructor() {
        this.generateSampleData();
    }

    private generateSampleData(): void {
        const brands = ['Moleskine', 'Leuchtturm1917', 'Rhodia', 'Field Notes', 'Midori', 'Paperblanks', 'Clairfontaine', 'Dingbats'];
        const types = ['Spiral', 'Hardcover', 'Journal', 'Memo'];
        const sizes = ['A4', 'A5', 'B5', 'Legal'];
        const colors = ['Black', 'Navy', 'Red', 'Hunter Green', 'Orange', 'Turquoise', 'Yellow', 'Grey'];
        const statuses: NotebookRecord['status'][] = ['In Stock', 'Ordered', 'Discontinued'];

        for (let i = 1; i <= 50; i++) {
            this.notebooks.push({
                id: 5000 + i,
                brand: brands[Math.floor(Math.random() * brands.length)],
                type: types[Math.floor(Math.random() * types.length)],
                pages: (Math.floor(Math.random() * 10) + 4) * 20, // 80 to 260 pages
                size: sizes[Math.floor(Math.random() * sizes.length)],
                color: colors[Math.floor(Math.random() * colors.length)],
                notes: 'Sample note for notebook ' + i,
                status: statuses[Math.floor(Math.random() * statuses.length)]
            });
        }
    }

    get totalNotebooks(): number {
        return this.notebooks.length;
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.notebooks.length / this.pageSize));
    }

    get pagedNotebooks(): NotebookRecord[] {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.notebooks.slice(start, start + this.pageSize);
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
        const modalRef = this.modalService.open(NotebookEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: true,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => this.modalHistory.handleBeforeDismiss(modalRef)
        });
        this.modalHistory.registerModal(modalRef);

        modalRef.componentInstance.record = {
            id: this.getNextId(),
            brand: '',
            type: 'Journal',
            pages: 120,
            size: 'A5',
            color: '',
            notes: '',
            status: 'In Stock'
        };
        modalRef.componentInstance.allowDelete = false;

        void modalRef.result.then((result: NotebookModalResult) => {
            if (result.action === 'save') {
                this.notebooks.unshift(result.record);
            }
        }).catch(() => { });
    }

    openEditModal(record: NotebookRecord): void {
        const modalRef = this.modalService.open(NotebookEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: true,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => this.modalHistory.handleBeforeDismiss(modalRef)
        });
        this.modalHistory.registerModal(modalRef);

        modalRef.componentInstance.record = record;
        modalRef.componentInstance.allowDelete = true;

        void modalRef.result.then((result: NotebookModalResult) => {
            if (result.action === 'save') {
                const idx = this.notebooks.findIndex(n => n.id === record.id);
                if (idx !== -1) {
                    this.notebooks[idx] = result.record;
                }
            } else if (result.action === 'delete') {
                this.notebooks = this.notebooks.filter(n => n.id !== record.id);
                if (this.currentPage > this.totalPages) {
                    this.currentPage = this.totalPages;
                }
            }
        }).catch(() => { });
    }

    private getNextId(): number {
        return this.notebooks.length > 0 ? Math.max(...this.notebooks.map(n => n.id)) + 1 : 5001;
    }
}