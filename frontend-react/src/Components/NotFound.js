import React from 'react';
import { useLocation } from 'react-router-dom';

const NotFound = () => {
	const location = useLocation();
	console.log(location.pathname);
	return <h1>404 - Page Not Found</h1>;
};

export default NotFound;
