import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ModalHistoryService } from './modal-history.service';

/**
 * Guard that prevents navigation if there are unsaved changes in any open modal.
 * This covers internal Angular router navigation (e.g., clicking on menu links).
 */
export const pendingChangesGuard: CanDeactivateFn<any> = (component: any) => {
    const modalHistory = inject(ModalHistoryService);

    // 1. Check if the active component implements custom deactivation logic (e.g., custom HTML dialog confirmation)
    if (component && typeof component.canDeactivate === 'function') {
        return component.canDeactivate();
    }

    // 2. Check if the active component reports unsaved changes (e.g., from CDK Dialogs)
    if (component && typeof component.hasUnsavedChanges === 'function' && component.hasUnsavedChanges()) {
        const confirmResult = confirm('You have unsaved changes. Are you sure you want to leave this page?');
        if (!confirmResult) {
            return false;
        }
    }

    // 2. Check NgbModal stack
    if (modalHistory.hasAnyUnsavedChanges()) {
        // If the browser back button was pressed, the ModalHistoryService
        // is already handling the dismissal and will show its own custom 
        // confirmation modal. We RETURN FALSE here to prevent the router 
        // from changing the page while the custom confirmation is visible.
        if (modalHistory.isPopStateInProgress()) {
            return false;
        }

        const confirmResult = confirm('You have unsaved changes in an open modal. Are you sure you want to leave this page?');
        if (!confirmResult) {
            return false;
        }
    }

    return true;
};
