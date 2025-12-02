/**
 * Vue 3 Custom Directive: v-tooltip
 * Usage: <div v-tooltip="'Your tooltip text here'">...</div>
 */

// Global variable to hold the currently visible tooltip DOM element
let tooltipElement = null;

// --- Core Event Handlers ---

/**
 * Creates and shows the tooltip element.
 * @param {HTMLElement} el - The element the directive is bound to.
 * @param {string} text - The tooltip text.
 */
function showTooltip(el, text) {
    if (tooltipElement) {
        // Remove any previous tooltip just in case
        document.body.removeChild(tooltipElement);
    }

    // 1. Create the tooltip element
    tooltipElement = document.createElement('div');
    tooltipElement.className = 'v-tooltip-box';
    tooltipElement.textContent = text;
    
    // 2. Apply basic styling (for demonstration)
    // Object.assign(tooltipElement.style, {
    //     position: 'absolute',
    //     backgroundColor: '#0c0505ff',
    //     color: 'white',
    //     padding: '5px 10px',
    //     borderRadius: '4px',
    //     fontSize: '12px',
    //     zIndex: 10000,
    //     pointerEvents: 'none', // Prevents tooltip from blocking clicks on elements beneath it
    //     opacity: 0,
    //     transition: 'opacity 0.2s'
    // });

    // 3. Append to body
    document.body.appendChild(tooltipElement);

    // 4. Position the tooltip (Position it above the element)
    const rect = el.getBoundingClientRect();
    
    // Calculate tooltip position (e.g., center horizontally, slightly above the element)
    const top = rect.top + window.scrollY - 30; // 30px above the element
    const left = rect.left + window.scrollX + (rect.width / 2) - (tooltipElement.offsetWidth / 2);

    tooltipElement.style.top = `${top}px`;
    // We adjust left positioning after appending the element to body, 
    // but the following line is needed if we want to dynamically adjust position:
    // tooltipElement.style.left = `${left}px`; 
    // We'll recalculate left after the next line to ensure its width is known.
    
    // Final positioning to ensure it's centered:
    tooltipElement.style.left = `${rect.left + window.scrollX + (rect.width / 2) - (tooltipElement.offsetWidth / 2)}px`;

    // 5. Fade in
    setTimeout(() => {
        tooltipElement.style.opacity = 1;
    }, 10);
}

/**
 * Removes the tooltip element.
 */
function hideTooltip() {
    if (tooltipElement) {
        tooltipElement.style.opacity = 0;
        // Remove after transition
        setTimeout(() => {
            if (tooltipElement && tooltipElement.parentNode) {
                tooltipElement.parentNode.removeChild(tooltipElement);
            }
            tooltipElement = null;
        }, 200);
    }
}

// --- Directive Definition ---

const TooltipDirective = {
    // Called when the bound element's attributes or the component instance changes.
    // We use this to get the tooltip text (binding.value).
    mounted(el, binding) {
        // Ensure the value exists and is a string
        if (!binding.value) return; 

        // 1. Store the text and the handlers on the element itself
        el.__tooltipText = binding.value;
        el.__showTooltipHandler = () => showTooltip(el, el.__tooltipText);
        el.__hideTooltipHandler = hideTooltip;

        // 2. Attach listeners
        el.addEventListener('mouseenter', el.__showTooltipHandler);
        el.addEventListener('mouseleave', el.__hideTooltipHandler);
    },

    // Called when the element updates (e.g., if the tooltip text changes dynamically)
    updated(el, binding) {
         if (binding.value !== binding.oldValue) {
            el.__tooltipText = binding.value;
        }
    },

    // Called when the element is unmounted from the DOM. Crucial for cleanup.
    unmounted(el) {
        // 1. Remove listeners
        el.removeEventListener('mouseenter', el.__showTooltipHandler);
        el.removeEventListener('mouseleave', el.__hideTooltipHandler);

        // 2. Remove the currently displayed tooltip if the element is removed while the tooltip is active
        if (tooltipElement) {
             hideTooltip();
        }
        
        // 3. Clean up stored data
        delete el.__tooltipText;
        delete el.__showTooltipHandler;
        delete el.__hideTooltipHandler;
    }
};

export default TooltipDirective;