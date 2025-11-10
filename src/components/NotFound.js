// Import the core React library to be able to define a component.
import React from 'react';

// Import the Alert component from 'react-bootstrap' to display a styled message box.
import { Alert } from 'react-bootstrap';

// Import the Link component from 'react-router-dom' to handle client-side navigation.
// This allows users to navigate to other pages without a full page refresh.
import { Link } from 'react-router-dom';

/**
 * NotFound is a simple functional component that displays a "404 Page Not Found" message.
 * It's rendered by the catch-all route (path="*") in App.js when a user tries to
 * access a URL that doesn't match any other defined route.
 */
const NotFound = () => {
  return (
    // The Alert component provides a colored box to draw attention to the message.
    // 'variant="danger"' makes the box red, which is appropriate for an error/warning.
    <Alert variant="danger">
      <h4>Page Not Found!</h4>
      <p>
        The page you are looking for does not exist. Go back to the{' '}
        {/*
          This is a key integration pattern between react-bootstrap and react-router-dom.
          - <Alert.Link> is a bootstrap component for styling links within an Alert.
          - The 'as={Link}' prop tells the <Alert.Link> component to render itself AS a
            react-router 'Link' component instead of a standard HTML <a> tag.
          - The 'to="/"' prop is passed to the underlying 'Link' component, telling it to
            navigate to the homepage ('/').
          This creates a styled link that performs client-side navigation.
        */}
        <Alert.Link as={Link} to="/">Dashboard</Alert.Link>.
      </p>
    </Alert>
  );
};

// Export the component so it can be imported and used in App.js for routing.
export default NotFound;