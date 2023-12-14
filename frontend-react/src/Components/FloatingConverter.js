// FloatingConverter.js

import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { Resizable } from 'react-resizable';
import { CopyToClipboard } from 'react-copy-to-clipboard'; // Import CopyToClipboard
import './FloatingConverter.css';
import web3 from 'web3';

const FloatingConverter = () => {
	const [inputValue, setInputValue] = useState('1');
	const [result, setResult] = useState('');
	const [width, setWidth] = useState(300);
	const [height, setHeight] = useState(200);
	const [copied, setCopied] = useState(false); // State to track whether the value is copied
	const dragRef = useRef(null);
	const resizeRef = useRef(null);

	const cadToEthExchangeRate = process.env.REACT_APP_CAD_TO_ETH_EXCHANGE_RATE || 0.00032;

	const convertToWei = (cad = 0) => {
		const ethAmount = parseFloat(cad) / parseFloat(cadToEthExchangeRate);
		const weiValue = ethAmount * Math.pow(10, 18);
		const formattedNumber = web3 ? web3.utils.toWei(ethAmount.toString(), 'ether') : parseFloat(weiValue).toLocaleString({});
		setResult(formattedNumber);
		setInputValue(cad);
		setCopied(false); // Reset the copied state when the value changes
	};

	useEffect(() => {
		const drag = dragRef.current;
		// drag.select();
		const resize = resizeRef.current;
		// resize.select();
	}, []);

	const onResize = (e, { size }) => {
		e.preventDefault();
		setWidth(size.width);
		setHeight(size.height);
	};

	return (
		<Draggable ref={dragRef}>
			<Resizable style={{ margin: '50px' }} ref={resizeRef} width={width} height={height} onResize={onResize} draggableOpts={{ grid: [25, 25] }}>
				<div className="floating-converter">
					<h3>Wei Converter</h3>
					<label>
						Enter Amount (CAD):
						<input type="number" min={0} value={inputValue} onChange={(e) => convertToWei(e.target.value)} />
					</label>
					{result && (
						<>
							<label>
								Wei: <span>{result}</span>
							</label>
							<CopyToClipboard text={result} onCopy={() => setCopied(true)}>
								<button>Copy</button>
							</CopyToClipboard>
							{copied && (
								<span s tyle={{ color: 'green' }}>
									Copied!
								</span>
							)}
						</>
					)}
				</div>
			</Resizable>
		</Draggable>
	);
};

export default FloatingConverter;
