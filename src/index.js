// Import the core React library, which is necessary for creating and managing components.
import React from 'react';

// Import 'createRoot' from 'react-dom/client'. This is the standard (as of React 18)
// method for creating the root of a React application, which is where the entire component tree is rendered.
import { createRoot } from 'react-dom/client';

// Import BrowserRouter from 'react-router-dom'. This component provides routing capabilities
// to the entire application by wrapping the root component. It uses the browser's history API.
import { BrowserRouter } from 'react-router-dom';

// Import CSS files. The order matters due to the cascading nature of CSS.
// 1. Bootstrap CSS provides a foundational style framework.
import 'bootstrap/dist/css/bootstrap.min.css';
// 2. index.css contains custom global styles that can override or add to Bootstrap.
import './index.css';
// 3. App.css contains styles specific to the App component.
import './App.css';

// Import the root component of our application. All other components are children of App.
import App from './App';

/**
 * This is the main entry point of the application.
 * The logic here finds the root HTML element and tells React to render our <App /> component inside it.
 */

// 1. Find the DOM node with the id 'root'. This element is located in the `public/index.html` file
// and serves as the container for the entire React application.
const container = document.getElementById('root');

// 2. Create a React root for the container. This is the starting point for rendering the app.
const root = createRoot(container);

// 3. Render the application. The root.render() method tells React to display the components in the browser.
root.render(
  // <React.StrictMode> is a wrapper component that helps identify potential problems in an application.
  // It activates additional checks and warnings for its descendants. It only runs in development mode
  // and does not affect the production build.
  <React.StrictMode>
    {/*
      To enable client-side routing, the entire <App /> component is wrapped in <BrowserRouter>.
      This makes routing context available to all components within App, allowing them to use
      features like <Route>, <Link>, and <NavLink>.
    */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);