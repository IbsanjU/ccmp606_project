// Console.js

import React, { useState, useEffect, useRef } from 'react';
import './Console.css';

function Console(props) {
	const logListRef = useRef(null);

	useEffect(() => {
		const logListEl = logListRef.current;
		logListEl.scrollTop = logListEl.scrollHeight;
	}, [props.logList]);

	function handleAddToLog(newObj) {
		try {
			newObj = JSON.parse(newObj);
		} catch (error) {}
		if (typeof newObj === 'object') newObj = { ...newObj, date: new Date() };
		else newObj += ' date: ' + new Date();
		props.setLogList([...props.logList, newObj]);
	}

	return (
		<div className="console">
			<AddToLogForm onAddToLog={handleAddToLog} />
			<div className="console-header">Console</div>
			<div className="console-list" ref={logListRef}>
				{props.logList.map((obj, index) => (
					<pre className={`console-item ${obj.output && obj.output.error ? 'error' : ''}`} key={index}>
						{JSON.stringify(obj, null, 2)}
					</pre>
				))}
			</div>
		</div>
	);
}

function AddToLogForm(props) {
	const [inputValue, setInputValue] = useState('');

	function handleChange(event) {
		setInputValue(event.target.value);
	}

	function handleSubmit(event) {
		event.preventDefault();
		if(!inputValue) return;
		props.onAddToLog(inputValue);
		setInputValue('');
	}

	return (
		<form className="add-to-log-form" onSubmit={handleSubmit}>
			<input type="text" value={inputValue} onChange={handleChange} placeholder="Enter text or JSON object..." />
			<button type="submit">Add to log</button>
		</form>
	);
}

export default Console;
