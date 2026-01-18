/**
 * React Mounting Utility for Parent Dashboard
 * Dynamically imports and mounts React components
 */

// Global variable to store the React root for unmounting
let parentDashboardRoot = null;

/**
 * Mounts the ParentDashboard React component into the container
 * @param {string} containerId - ID of the container element (default: 'parent-dashboard-container')
 * @returns {Promise<void>}
 */
export async function mountParentDashboard(containerId = 'parent-dashboard-container') {
    try {
        // Check if container exists
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Parent dashboard container not found: ${containerId}`);
            return;
        }

        // Clear any existing content
        container.innerHTML = '';

        // Dynamically import React and ReactDOM
        const [React, ReactDOM, ParentDashboard] = await Promise.all([
            import('react'),
            import('react-dom/client'),
            import('/src/client/components/ParentDashboard.tsx')
        ]);

        // Create root and render component
        parentDashboardRoot = ReactDOM.createRoot(container);
        parentDashboardRoot.render(React.createElement(ParentDashboard.default));

        console.log('ParentDashboard React component mounted successfully');
    } catch (error) {
        console.error('Failed to mount ParentDashboard React component:', error);

        // Fallback to a simple message if React fails to load
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h3>Unable to load Parent Dashboard</h3>
                    <p>Please refresh the page or try again later.</p>
                    <p><small>Error: ${error.message}</small></p>
                </div>
            `;
        }
    }
}

/**
 * Unmounts the React component from the container
 * @param {string} containerId - ID of the container element (default: 'parent-dashboard-container')
 * @returns {void}
 */
export function unmountParentDashboard(containerId = 'parent-dashboard-container') {
    try {
        if (parentDashboardRoot) {
            parentDashboardRoot.unmount();
            parentDashboardRoot = null;
            console.log('ParentDashboard React component unmounted successfully');
        }

        // Clear container content
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
        }
    } catch (error) {
        console.error('Failed to unmount ParentDashboard React component:', error);
    }
}