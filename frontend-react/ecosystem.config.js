module.exports = {
	script: 'serve',
	name: 'smartcontract',
	env: {
		PM2_SERVE_PATH: './build',
		PM2_SERVE_PORT: 8086,
		PM2_SERVE_SPA: 'true',
		PM2_SERVE_HOMEPAGE: '/index.html'
	}
}
