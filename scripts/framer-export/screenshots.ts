// Full-page reference screenshots of the Framer site (spec 001, R7).
// Drives the locally installed Chrome over the DevTools protocol: no npm deps.
//
//   pnpm inventory:screenshots
//
// Set CHROME_PATH if Chrome isn't in the default Windows location.

import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const SITE = 'https://www.marinalabella.com';
const OUT_DIR = join('migration', 'screenshots');
const PORT = 9333;
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

/** One representative page per page type. */
const PAGES: [name: string, path: string][] = [
	['home', '/'],
	['illustration-index', '/illustration'],
	['illustration-project', '/illustration/flamenco-series'],
	['animation-index', '/animation'],
	['animation-project', '/animation/las-croquetas'],
	['services-index', '/services'],
	['service-landing', '/branding-packaging'],
	['case-study', '/services/novell-wine'],
	['about', '/about-contact'],
];

const VIEWPORTS = [
	{ name: 'desktop', width: 1440, height: 900, mobile: false },
	{ name: 'mobile', width: 390, height: 844, mobile: true },
] as const;

// --- Minimal CDP client ------------------------------------------------------

type Pending = { resolve: (v: any) => void; reject: (e: Error) => void };

class Cdp {
	#ws: WebSocket;
	#id = 0;
	#pending = new Map<number, Pending>();
	#listeners = new Map<string, (() => void)[]>();

	private constructor(ws: WebSocket) {
		this.#ws = ws;
		ws.addEventListener('message', (ev) => {
			const msg = JSON.parse(String(ev.data));
			if (msg.id && this.#pending.has(msg.id)) {
				const p = this.#pending.get(msg.id)!;
				this.#pending.delete(msg.id);
				if (msg.error) p.reject(new Error(msg.error.message));
				else p.resolve(msg.result);
			} else if (msg.method) {
				for (const fn of this.#listeners.get(msg.method) ?? []) fn();
				this.#listeners.delete(msg.method);
			}
		});
	}

	static connect(url: string): Promise<Cdp> {
		return new Promise((resolve, reject) => {
			const ws = new WebSocket(url);
			ws.addEventListener('open', () => resolve(new Cdp(ws)));
			ws.addEventListener('error', () => reject(new Error(`Cannot connect to ${url}`)));
		});
	}

	send(method: string, params: object = {}): Promise<any> {
		const id = ++this.#id;
		this.#ws.send(JSON.stringify({ id, method, params }));
		return new Promise((resolve, reject) => this.#pending.set(id, { resolve, reject }));
	}

	once(event: string, timeoutMs = 30_000): Promise<void> {
		return new Promise((resolve) => {
			const t = setTimeout(resolve, timeoutMs); // don't hang forever
			this.#listeners.set(event, [
				...(this.#listeners.get(event) ?? []),
				() => {
					clearTimeout(t);
					resolve();
				},
			]);
		});
	}

	close() {
		this.#ws.close();
	}
}

async function waitForDebugger(): Promise<void> {
	for (let i = 0; i < 50; i++) {
		try {
			const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
			if (res.ok) return;
		} catch {
			// not up yet
		}
		await sleep(200);
	}
	throw new Error('Chrome did not start its debugger');
}

// --- Capture -------------------------------------------------------------------

async function capture(cdp: Cdp, url: string, vp: (typeof VIEWPORTS)[number]): Promise<Buffer> {
	await cdp.send('Emulation.setDeviceMetricsOverride', {
		width: vp.width,
		height: vp.height,
		deviceScaleFactor: 1,
		mobile: vp.mobile,
	});
	const loaded = cdp.once('Page.loadEventFired');
	await cdp.send('Page.navigate', { url });
	await loaded;
	await sleep(1500);

	// Scroll through the page so Framer's "appear on scroll" effects run.
	await cdp.send('Runtime.evaluate', {
		awaitPromise: true,
		expression: `(async () => {
			for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) {
				scrollTo(0, y); await new Promise(r => setTimeout(r, 150));
			}
			scrollTo(0, 0); await new Promise(r => setTimeout(r, 500));
		})()`,
	});

	const { result } = await cdp.send('Runtime.evaluate', {
		expression: 'document.documentElement.scrollHeight',
		returnByValue: true,
	});
	const fullHeight = Math.min(Number(result.value) || vp.height, 16_000);

	// Make the viewport as tall as the content, so `min-height: 100vh` adds no gap.
	await cdp.send('Emulation.setDeviceMetricsOverride', {
		width: vp.width,
		height: fullHeight,
		deviceScaleFactor: 1,
		mobile: vp.mobile,
	});
	await sleep(1000);

	const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
	return Buffer.from(shot.data, 'base64');
}

async function main() {
	await mkdir(OUT_DIR, { recursive: true });
	const profile = await mkdtemp(join(tmpdir(), 'framer-shots-'));
	const chrome = spawn(
		CHROME,
		[
			'--headless=new',
			`--remote-debugging-port=${PORT}`,
			`--user-data-dir=${profile}`,
			'--hide-scrollbars',
			'--no-first-run',
			'about:blank',
		],
		{ stdio: 'ignore' },
	);

	try {
		await waitForDebugger();
		const targets = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()) as {
			type: string;
			webSocketDebuggerUrl: string;
		}[];
		const page = targets.find((t) => t.type === 'page');
		if (!page) throw new Error('No page target found');

		const cdp = await Cdp.connect(page.webSocketDebuggerUrl);
		await cdp.send('Page.enable');

		for (const [name, path] of PAGES) {
			for (const vp of VIEWPORTS) {
				const file = join(OUT_DIR, `${name}-${vp.name}.jpg`);
				await writeFile(file, await capture(cdp, SITE + path, vp));
				console.log(`✓ ${file}`);
			}
		}
		cdp.close();
	} finally {
		chrome.kill();
		await sleep(500);
		await rm(profile, { recursive: true, force: true }).catch(() => {});
	}
}

await main();
