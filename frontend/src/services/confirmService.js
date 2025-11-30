import { reactive } from 'vue';


/**
 * The confirmState object holds the reactive state shared between
 * the confirm service functions and the modal component. 
 * 
 * - open: whether the confirm modal is visible
 * - title: the title text of the confirm modal
 * - message: the message text of the confirm modal
 * - confirmText: the text for the confirm button
 * - cancelText: the text for the cancel button
 * - resolve: the Promise resolve function to call with the user's choice
 * 
 * We use Vue's reactive() to make this state reactive so that
 * changes to it will automatically update any components that use it.
 */
export const confirmState = reactive({
    open: false,
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    resolve: null,

});

/**
 * Opens a confirmation modal with the given options.
 * Returns a Promise that resolves to true if confirmed, false if cancelled.
 * 
 * Usage: 
 * const ok = await confirm({ title: 'Delete item?', message: 'This action cannot be undone.' });
 * if (ok) { // user confirmed } else { // user cancelled }
 * 
 * @param {Object} options - Configuration options for the confirm modal
 *    - title: The title text of the confirm modal
 *    - message: The message text of the confirm modal
 *    - confirmText: The text for the confirm button
 *    - cancelText: The text for the cancel button
 * 
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
 * 
 * Implementation details: 
 * - Creates a new promise and stores its 'resolve' function in 'confirmState.resolve'
 * - Updates the rest of the state (title, message etc)
 * - The modal component, bound to confirmState, will display automatically. 
 * - When the user clicks Confirm or Cancel, one of the functions below is called
 * ('acceptConfirm' or 'cancelConfirm'), which calls the stored resolve function
 * with true or false, and closes the modal.
 */
export function confirm(options = {}) {
    return new Promise((resolve) => {
        Object.assign(confirmState, {
            open: true,                                         // show modal
            title: options.title ?? 'Are you sure?',    // set title
            message: options.message ?? '',                     // set message
            confirmText: options.confirmText ?? 'OK',          // set confirm button text
            cancelText: options.cancelText ?? 'Cancel',       // set cancel button text
            resolve,
        });
        console.log('[confirm] state after open:', JSON.stringify(confirmState));

    });
}


/**
 * Called when the user clicks the Confirm button in the modal
 * - Resolves the stored promise with 'true'
 * - Closes the modal
 */
export function acceptConfirm() {
    if (confirmState.resolve) confirmState.resolve(true);
    confirmState.open = false;
}

/**
 * Called when the user clicks the Cancel button in the modal
 * - Resolves the stored promise with 'false'
 * - Closes the modal
 */
export function cancelConfirm() {
    if (confirmState.resolve) confirmState.resolve(false);
    confirmState.open = false;
}