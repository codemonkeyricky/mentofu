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

        // Try to use global React if available, otherwise import dynamically
        let React, ReactDOM;
        if (window.React && window.ReactDOM) {
            console.log('Using global React from window');
            React = window.React;
            ReactDOM = window.ReactDOM;
        } else {
            // Dynamically import React and ReactDOM first
            console.log('Loading React modules via import map...');
            React = await import('react');
            ReactDOM = await import('react-dom/client');
            // Store globally for consistency
            window.React = React;
            window.ReactDOM = ReactDOM;
            console.log('Stored React on window, version:', React.version);
            console.log('React exports:', Object.keys(React));
            console.log('React.useState is function?', typeof React.useState);
        }
        console.log('React version:', React.version);
        console.log('ReactDOM version:', ReactDOM.version);

        // Then import the component
        const ParentDashboardModule = await import('../components/ParentDashboard');
        const ParentDashboard = ParentDashboardModule.default;
        console.log('ParentDashboard module:', ParentDashboardModule);
        console.log('ParentDashboard.default:', ParentDashboard);
        console.log('Is function?', typeof ParentDashboard);
        console.log('Is React component?', ParentDashboard && ParentDashboard.prototype && ParentDashboard.prototype.isReactComponent);

        // Validate component
        if (typeof ParentDashboard !== 'function') {
            throw new Error(`ParentDashboard is not a function. Type: ${typeof ParentDashboard}`);
        }

        // Create root and render component
        parentDashboardRoot = ReactDOM.createRoot(container);
        parentDashboardRoot.render(React.createElement(ParentDashboard));

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

        // Get container reference (kept for potential future use)
        const container = document.getElementById(containerId);
    } catch (error) {
        console.error('Failed to unmount ParentDashboard React component:', error);
    }
}