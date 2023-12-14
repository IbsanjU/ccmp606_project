import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Home from './Components/Home.js';
import NotFound from './Components/NotFound.js';

const App = () => {
	return (
		<Router basename="/">
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="*" element={<NotFound />} />
				<Route path="*" element={<Navigate to="/" replace={true} />} />
			</Routes>
		</Router>
	);
};

export default App;
