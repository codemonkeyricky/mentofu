/**
 * React Mounting Utility for Parent Dashboard
 * Dynamically imports and mounts React components
 */

// Global variable to store the React root for unmounting
let reactRoot = null;

/**
 * Mounts the ParentDashboard React component into the container
 * @returns {Promise<void>}
 */
export async function mountParentDashboard() {
    try {
        // Check if container exists
        const container = document.getElementById('parent-dashboard-container');
        if (!container) {
            console.error('Parent dashboard container not found');
            return;
        }

        // Clear any existing content
        container.innerHTML = '';

        // Dynamically import React and ReactDOM
        const [React, ReactDOM, ParentDashboard] = await Promise.all([
            import('https://esm.sh/react@18'),
            import('https://esm.sh/react-dom@18/client'),
            import('/src/client/components/ParentDashboard.tsx')
        ]);

        // Create root and render component
        reactRoot = ReactDOM.createRoot(container);
        reactRoot.render(React.createElement(ParentDashboard.default));

        console.log('ParentDashboard React component mounted successfully');
    } catch (error) {
        console.error('Failed to mount ParentDashboard React component:', error);

        // Fallback to a simple message if React fails to load
        const container = document.getElementById('parent-dashboard-container');
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
 * @returns {void}
 */
export function unmountParentDashboard() {
    try {
        if (reactRoot) {
            reactRoot.unmount();
            reactRoot = null;
            console.log('ParentDashboard React component unmounted successfully');
        }

        // Clear container content
        const container = document.getElementById('parent-dashboard-container');
        if (container) {
            container.innerHTML = '';
        }
    } catch (error) {
        console.error('Failed to unmount ParentDashboard React component:', error);
    }
}