import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ModalHistoryService } from './modal-history.service';

/**
 * Guard that prevents navigation if there are unsaved changes in any open modal.
 * This covers internal Angular router navigation (e.g., clicking on menu links).
 */
export const pendingChangesGuard: CanDeactivateFn<any> = (component: any) => {
    const modalHistory = inject(ModalHistoryService);

    // 1. If the browser back button was pressed, ModalHistoryService is already handling
    // the dismissal of the open modal. We RETURN FALSE here to prevent the router 
    // from navigating to the previous route while closing the modal.
    if (modalHistory.isPopStateInProgress()) {
        return false;
    }

    // 2. Check if the active component implements custom deactivation logic (e.g., custom HTML dialog confirmation)
    if (component && typeof component.canDeactivate === 'function') {
        return component.canDeactivate();
    }

    // 3. Check if the active component reports unsaved changes (e.g., from CDK Dialogs)
    if (component && typeof component.hasUnsavedChanges === 'function' && component.hasUnsavedChanges()) {
        const confirmResult = confirm('You have unsaved changes. Are you sure you want to leave this page?');
        if (!confirmResult) {
            return false;
        }
    }

    // 4. Check NgbModal stack
    if (modalHistory.hasAnyUnsavedChanges()) {
        const confirmResult = confirm('You have unsaved changes in an open modal. Are you sure you want to leave this page?');
        if (!confirmResult) {
            return false;
        }
    }

    return true;
};
