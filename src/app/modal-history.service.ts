import { Injectable } from '@angular/core';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

interface ModalHistoryEntry {
    id: number;
    modalRef: NgbModalRef;
    closingFromPopState: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ModalHistoryService {
    private modalStack: ModalHistoryEntry[] = [];
    private nextId = 1;
    private ignoreNextPopState = false;
    private pendingPopStateEntry: ModalHistoryEntry | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('popstate', this.onPopState.bind(this));
            window.addEventListener('beforeunload', this.onBeforeUnload.bind(this));
        }
    }

    isPopStateInProgress(): boolean {
        return !!this.pendingPopStateEntry;
    }

    private onBeforeUnload(event: BeforeUnloadEvent): void {
        if (this.hasAnyUnsavedChanges()) {
            event.preventDefault();
            event.returnValue = '';
        }
    }

    hasAnyUnsavedChanges(): boolean {
        return this.modalStack.some(entry => {
            const component = entry.modalRef.componentInstance;
            return component && typeof component.hasUnsavedChanges === 'function' && component.hasUnsavedChanges();
        });
    }

    registerModal(modalRef: NgbModalRef): void {
        const entry: ModalHistoryEntry = {
            id: this.nextId++,
            modalRef,
            closingFromPopState: false
        };

        this.modalStack.push(entry);

        if (typeof window !== 'undefined') {
            window.history.pushState({ modalHistoryId: entry.id }, '');
        }

        modalRef.result.finally(() => this.unregisterModal(entry));
    }

    private unregisterModal(entry: ModalHistoryEntry): void {
        const index = this.modalStack.findIndex(item => item.id === entry.id);
        if (index < 0) {
            return;
        }

        this.modalStack.splice(index, 1);

        if (this.pendingPopStateEntry === entry) {
            this.pendingPopStateEntry = null;
        }

        if (entry.closingFromPopState) {
            entry.closingFromPopState = false;
            return;
        }

        if (typeof window !== 'undefined') {
            this.ignoreNextPopState = true;
            window.history.back();
        }
    }

    restoreHistoryIfPending(): void {
        if (!this.pendingPopStateEntry || typeof window === 'undefined') {
            this.pendingPopStateEntry = null;
            return;
        }

        const entry = this.pendingPopStateEntry;
        this.pendingPopStateEntry = null;
        if (!this.modalStack.includes(entry)) {
            return;
        }

        entry.closingFromPopState = false;
        this.ignoreNextPopState = true;
        window.history.pushState({ modalHistoryId: entry.id }, '');
    }

    private onPopState(event: PopStateEvent): void {
        if (this.ignoreNextPopState) {
            this.ignoreNextPopState = false;
            return;
        }

        if (!this.modalStack.length) {
            return;
        }

        const top = this.modalStack[this.modalStack.length - 1];
        this.pendingPopStateEntry = top;
        top.closingFromPopState = true;
        top.modalRef.dismiss('cancel');
    }

    handleBeforeDismiss(modalRef: NgbModalRef): Promise<boolean> | boolean {
        const component = modalRef.componentInstance;
        if (component && typeof component.handleBeforeDismiss === 'function') {
            const result = component.handleBeforeDismiss();
            if (result instanceof Promise) {
                return result.then((shouldDismiss: boolean) => {
                    if (!shouldDismiss) {
                        this.restoreHistoryIfPending();
                    }
                    return shouldDismiss;
                });
            }
            if (!result) {
                this.restoreHistoryIfPending();
            }
            return result;
        }
        return true;
    }
}
