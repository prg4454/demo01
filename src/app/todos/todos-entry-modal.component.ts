import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalHistoryService } from '../modal-history.service';
import { TodoCategory, TodoPriority, TodoRecord, TodoStatus, TodosModalResult } from './todo.model';

interface ChangedField {
  label: string;
  before: string;
  after: string;
}

type TrackedFieldKey = 'title' | 'category' | 'priority' | 'status' | 'dueDate' | 'assignedTo' | 'comments';

@Component({
  selector: 'app-todos-entry-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './todos-entry-modal.component.html',
  styleUrl: './todos-entry-modal.component.scss'
})
export class TodosEntryModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  private modalService = inject(NgbModal);
  private modalHistory = inject(ModalHistoryService);

  @ViewChild('deleteConfirmModal') private deleteConfirmModal?: TemplateRef<unknown>;
  @ViewChild('unsavedChangesModal') private unsavedChangesModal?: TemplateRef<unknown>;

  @Input({ required: true }) todo!: TodoRecord;
  @Input() allowDelete = false;

  editDraft: TodoRecord | null = null;
  originalDraft: TodoRecord | null = null;
  saveAttempted = false;

  readonly categories: TodoCategory[] = ['Work', 'Personal', 'Finance', 'Health', 'Home', 'Development', 'General'];
  readonly priorities: TodoPriority[] = ['Low', 'Medium', 'High', 'Critical'];
  readonly statuses: TodoStatus[] = ['Pending', 'In Progress', 'Completed', 'Deferred'];

  ngOnInit(): void {
    this.editDraft = structuredClone(this.todo);
    this.originalDraft = structuredClone(this.todo);
  }

  canSave(): boolean {
    if (!this.editDraft) {
      return false;
    }

    return (
      this.editDraft.title.trim().length > 0 &&
      this.editDraft.category.trim().length > 0 &&
      this.editDraft.priority.trim().length > 0 &&
      this.editDraft.status.trim().length > 0 &&
      this.editDraft.dueDate.trim().length > 0 &&
      this.editDraft.assignedTo.trim().length > 0
    );
  }

  save(): void {
    this.saveAttempted = true;
    if (!this.editDraft || !this.canSave()) {
      return;
    }

    const updated: TodoRecord = {
      ...this.editDraft,
      title: this.editDraft.title.trim(),
      category: this.editDraft.category,
      priority: this.editDraft.priority,
      status: this.editDraft.status,
      dueDate: this.editDraft.dueDate.trim(),
      assignedTo: this.editDraft.assignedTo.trim(),
      comments: this.editDraft.comments.trim()
    };

    this.activeModal.close({ action: 'save', todo: updated } satisfies TodosModalResult);
  }

  async requestDelete(): Promise<void> {
    if (!this.allowDelete || !this.editDraft) {
      return;
    }

    const shouldDelete = await this.confirmDeleteWithModal();
    if (!shouldDelete) {
      return;
    }

    this.activeModal.close({ action: 'delete', todo: this.editDraft } satisfies TodosModalResult);
  }

  private isBypassingGuard = false;

  hasUnsavedChanges(): boolean {
    if (this.isBypassingGuard) {
      return false;
    }
    if (!this.editDraft || !this.originalDraft) {
      return false;
    }

    return JSON.stringify(this.editDraft) !== JSON.stringify(this.originalDraft);
  }

  async handleBeforeDismiss(): Promise<boolean> {
    if (this.isBypassingGuard) {
      return true;
    }

    if (this.hasUnsavedChanges()) {
      const shouldDiscard = await this.confirmDiscardChangesWithModal();
      if (!shouldDiscard) {
        this.modalHistory.restoreHistoryIfPending();
        return false;
      }
      this.isBypassingGuard = true;
    }
    return true;
  }

  async requestCancel(): Promise<void> {
    if (this.isBypassingGuard) {
      this.activeModal.dismiss('cancel');
      return;
    }

    if (this.hasUnsavedChanges()) {
      const shouldDiscard = await this.confirmDiscardChangesWithModal();
      if (!shouldDiscard) {
        return;
      }
      this.isBypassingGuard = true;
    }

    this.activeModal.dismiss('cancel');
  }

  getUnsavedChanges(): ChangedField[] {
    if (!this.editDraft || !this.originalDraft) {
      return [];
    }

    const fields: Array<{ key: TrackedFieldKey; label: string }> = [
      { key: 'title', label: 'Title' },
      { key: 'category', label: 'Category' },
      { key: 'priority', label: 'Priority' },
      { key: 'status', label: 'Status' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'assignedTo', label: 'Assigned To' },
      { key: 'comments', label: 'Comments' }
    ];

    const result: ChangedField[] = [];

    for (const field of fields) {
      const beforeVal = (this.originalDraft[field.key] ?? '').toString().trim();
      const afterVal = (this.editDraft[field.key] ?? '').toString().trim();

      if (beforeVal !== afterVal) {
        result.push({
          label: field.label,
          before: this.formatChangedValue(beforeVal),
          after: this.formatChangedValue(afterVal)
        });
      }
    }

    return result;
  }

  private confirmDeleteWithModal(): Promise<boolean> {
    if (!this.deleteConfirmModal) {
      return Promise.resolve(false);
    }

    const dialogRef = this.modalService.open(this.deleteConfirmModal, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      scrollable: true,
      beforeDismiss: () => this.modalHistory.handleBeforeDismiss(dialogRef)
    });
    this.modalHistory.registerModal(dialogRef);

    return dialogRef.result
      .then((result) => result === 'delete')
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
      scrollable: true,
      beforeDismiss: () => this.modalHistory.handleBeforeDismiss(dialogRef)
    });
    this.modalHistory.registerModal(dialogRef);

    return dialogRef.result
      .then((result) => result === 'discard')
      .catch(() => false);
  }

  private formatChangedValue(value: string): string {
    const text = String(value).trim();
    return text.length ? text : '(blank)';
  }
}
