/* Page & language */

const pageEnd = performance.mark('pageEnd');

/* Page & language */

let path = location.pathname.substr(1);
window.l = path.split('/')[0];
window.page = path.split('/')[1] || 'index';
window.sect = new URLSearchParams(window.location.search).get('c') || null;
window.reload = window.sessionStorage.getItem('reload') || null;
window.msg = await (await fetch(`../assets/data/json/messages.${l}.json`, {signal: AbortSignal.timeout(5000)})).json();
window.qry = await (await fetch(`../assets/data/json/queries.json`, {signal: AbortSignal.timeout(5000)})).json();
path = undefined;

window.pagesize = document.getElementsByTagName('HTML')[0].outerHTML.length;
window.pagetime = pageEnd.startTime;
window.memory = !performance.memory ? null : 1 - (performance.memory.totalJSHeapSize / performance.memory.jsHeapSizeLimit);
window.host = window.location.host;
window.search = Object.fromEntries(new URLSearchParams(location.search));
window.semaphore = false;
window.primarycolor = getComputedStyle(document.documentElement).getPropertyValue('--pico-primary');
window.rulesinfo = {};

/* HTML injector */

if(!window.customElements || !window.FileReader) {
	document.body.innerHTML = '';
	alert('navegador no soportado / unsupported browser');
	window.location.replace('https://iarthislab.eu');
}

customElements.define('html-include', class extends HTMLElement {
	async connectedCallback() {
		const src = this.getAttribute('src');
		const doc = new DOMParser().parseFromString(await (await fetch(src, {signal: AbortSignal.timeout(5000)})).text(), 'text/html');
		const scripts = Array.from(doc.scripts);
		for (const script of scripts) {
			if (!script.src) {
				const inlineScript = document.createElement('script');
				inlineScript.setAttribute('type', 'text/javascript');
				inlineScript.innerHTML = script.innerHTML;
				document.body.appendChild(inlineScript);
			} else {
				const remoteScript = document.createElement('script');
				remoteScript.setAttribute('src', script.src);
				remoteScript.setAttribute('defer', 'defer');
				if(script.type) remoteScript.setAttribute('type', script.type);
				document.body.appendChild(remoteScript);
			}
			script.remove();
		}
		this.insertAdjacentHTML('beforebegin', doc.body.innerHTML);
		this.remove();
	}
});

/* Error handling */

window.onerror = function (exception, url, lineNo, columnNo, error) {
	const err = {};
	err.message = exception?.message || exception;
	err.file = url || ``;
	err.position = (lineNo || '--') + ' / ' + (columnNo || '--');
	err.stack = (error?.stack || ''); //.replaceAll('\n', ' ');
	err.error = error ? (error === Object(error) ? Object.keys(error).map(m => [k, error[k]].join(': ')).join('\n') : error) : '';
	if(debug) console.error('EXC: %s, URL: %s, POS: %s/%s, ERR: %s', exception, url, lineNo, columnNo, error);
	if(modal) {
		modal(
			`<span class="pico-color-red">${msg.error.toUpperCase()}</span>`,
			`<ul class="pico-color-grey"><li>${Object.keys(err).map(k => `${k}: ${err[k]}`).join('</li><li>')}</ul>`
		);
	} else {
		alert(`ERROR\n-----\n${Object.keys(err).map(k => `${k}: ${err[k]}`).join('\n')}`);
	}
	if(byId('overlay').open) byId('overlay').close();
	if(!opt.app.debug) return true; // comment for catch all in console; suppress error alerts in old IEs
};

window.onunhandledrejection = function (e) {
	if(debug) console.error(e);
	if(modal) {
		modal(
			`<span class="pico-color-red">UHR ${msg.error.toUpperCase()}</span>`,
			`<p>${e.reason.message}</p><p class="pico-color-grey">${e.reason.stack}</p>`
		);
	} else {
		alert(`ERROR\n-----\n${Object.keys(e).map(k => `${k}: ${e[k]}`).join('\n')}`);
	}
	if(byId('overlay').open) byId('overlay').close();
	if(!opt.app.debug) return true; // comment for catch all in console; suppress error alerts in old IEs
}

/* Throttle & debounce */

// Limit the rate of execution
window.throttle = (func, delay) => {
	let timer;
	return function() {
		if (!timer) {
			timer = setTimeout(() => {
				func.apply(this, arguments);
				timer = null;
			}, delay);
		}
	};
};

// Execute after a certain delay
/*
window.debounce = (func, delay) => {
	let timer;
	return function() {
		clearTimeout(timer);
		timer = setTimeout(() => {
			func.apply(this, arguments);
		}, delay);
	};
};
*/
window.debounce = (callback, wait) => {
	let timerId;
	return (...args) => {
		clearTimeout(timerId);
		timerId = setTimeout(() => {
			callback(...args);
		}, wait);
	};
};

/* Alert & modals */

window.modal = (title = null, article = null) => {
	clearnode(byId('dialogtitle'));
	clearnode(byId('dialogarticle'));
	byId('dialogtitle').innerHTML = title || msg.untitled;
	byId('dialogarticle').innerHTML = article || '';
	att(qs('[role="ok"]'), 'disabled', false);
	att(qs('[role="cancel"]'), 'disabled', false);
	byId('dialog').showModal();
};

window.message = (model = 'alert', text = null) => {
	const dialog = qs('dialog.message');
	clearnode(dialog.querySelector('.prompt'));
	dialog.querySelector('.value').value = '';
	dialog.querySelector('.prompt').innerHTML = text || '';
	att(dialog.querySelector('.value'), 'hidden', model !== 'prompt');
	att(dialog.querySelector('[role="ok"]'), 'disabled', false);
	att(dialog.querySelector('[role="cancel"]'), 'hidden', model === 'alert');
	return new Promise(function(resolve, reject) {
		dialog.returnValue = undefined;
		dialog.showModal();
		dialog.onclose = e => {
			if(model === 'prompt') e.target.returnValue = dialog.querySelector('.value').value;
			resolve(e);
		}
	});
};

window.log = {
	info: m => console.info(`%c${opt.app.name} ▶ ${m}`, `color:#3C71F7`),
	warn: m => console.warn(`%c${opt.app.name} ▶ ${m}`, `color:#D24317`),
	success: m => console.log(`%c${opt.app.name} ▶ ${m}`, `color:#398712`),
	error: m => console.error(`%c${opt.app.name} ▶ ${m}`, `color:#D93526`),
};

/* Performance */

window.perf = {
	start: m => window.performance.mark(`start${m}`),
	end: (m, direct = false) => {
		window.performance.mark(`end${m}`);
		if(direct) {
			window.performance.measure(m, `start${m}`, `end${m}`);
			const duration = ~~(window.performance.getEntriesByName(m)[0].duration);
			performance.clearMarks(m);
			performance.clearMeasures(m);
			return duration;
		}
	},
	get: m => {
		window.performance.measure(m, `start${m}`, `end${m}`);
		const duration = ~~(window.performance.getEntriesByName(m)[0].duration);
		performance.clearMarks(m);
		performance.clearMeasures(m);
		return duration;
	},
};

/* Settings */

window.opt = await (await fetch(`../assets/data/json/settings.json`, {signal: AbortSignal.timeout(5000)})).json();
window.debug = opt.app.debug || String(sect).includes('debug');

/* DOM Locators */

window.byId = cid => document.getElementById(cid);
window.qs = cid => isDOM(cid) ? cid : document.querySelector(cid);
window.qsa = cid => document.querySelectorAll(cid);
window.create = model => document.createElement(model);
window.text = content => document.createTextNode(content);

/* Detectors */

window.isDOM = elm => elm instanceof Element;
window.isObject = obj => obj === Object(obj) && Object.prototype.toString.call(obj) !== '[object Array]';
window.isString = elm => Object.prototype.toString.call(elm) === '[object String]';
window.isBoolean = elm => typeof elm === 'boolean';
window.isFunction = elm => elm instanceof Function;
window.isAlpha = str => /^[a-z]+$/i.test(normalizer(fit(str)));
window.isNumeric = n => (typeof(n) === 'number' || typeof(n) === 'string' && n.trim() !== '') && !isNaN(n);
window.isNumber = n => n && typeof n === 'number' && isFinite(n);
window.isNumericArray = array => !array.some(isNaN);
window.isNode = v => v && v.nodeType === Node.ELEMENT_NODE;
window.isEmpty = val => !val || !String(val).trim().length;
window.isCoordinates = str => String(str).split(',').length >= 2 && isNumericArray(String(str).split(','));
window.isEmail = email => /\S+@\S+\.\S+/.test(email);
window.isValidDate = str => Symbol.for(new Date(str || '')) !== Symbol.for('Invalid Date');
window.isJSONString = str => {
	try {
		const o = JSON.parse(str);
		return !!o && (typeof o === 'object') && !Array.isArray(o);
	} catch {
		return false;
	}
};

/* Normalizers */

window.normalizer = str => String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, "");
window.fit = str => String(str).trim().toLowerCase();
window.standard = str => normalizer(fit(str)).replaceAll(' ', '_');
window.locale = n => isNaN(n) ? n : n.toLocaleString(l === 'es' ? 'es-CL' : l, {maximumFractionDigits: 2, minimumFractionDigits: 0});
window.localdate = (d, f) => d instanceof Date ? d.toLocaleDateString(l, f) : d;
window.escapequotes = str => str.replace(/"/g, '\\"');
window.randomstring = (ln = 7) => (Math.random() + 1).toString(36).substring(ln);
window.hash = s => s.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0) + 2147483647 + 1;
window.humansize = (bytes, si = true) => {
	try {
		let u;
		let b = bytes;
		const t = si ? 1000 : 1024;
		['', si ? 'k' : 'K', ...'MGTPEZY'].find(x => (u = x, b /= t, b ** 2 < 1));
		return `${u ? locale((t * b)) : locale(bytes)} ${u}${!si && u ? 'i' : ''}B`;
	} catch(err) {
		throw err;
	}
};
window.nofalsy = array => array.filter(Boolean);
window.objectsize = obj => (new TextEncoder().encode(JSON.stringify(obj))).length;
window.ifempty = (a, b) => isEmpty(a) ? b : a;
window.dateformat = {
	long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' },
	short: { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' },
	micro: { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' },
	time: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
};
window.timelapses = {
	day: 1000 * 60 * 60 * 24,
	hour: 1000 * 60 * 60,
};
window.plural = (n, s, p) => n === 1 ? s : p;
window.shorten = (t, m = 10) => t && t.length > m ? `${t.slice(0, m).split(' ').slice(0, -1).join(' ')}...` : t;
window.roundtonearest = (nearest, number) => Math.round(number/nearest) * nearest;
window.hex2rgb = hex => {
	const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
	return [r, g, b];
};

/* Array & objects utilities */

window.intersection = (...arrays) => {
	const data = [...arrays]; 
	if(!data.length) return [];
	const result = data.reduce((a, b) => a.filter((c) => b.includes(c)));
	return [...new Set(result)];
};
window.uniqueobjects = (objects, uniqueby, keepfirst = true) => {
	return Array.from(
		objects.reduce((map, e) => {
			const keydata = uniqueby.map((key) => [e[key], typeof e[key]]).flat().join('-');
			if (keepfirst && map.has(keydata)) return map;
			return map.set(keydata, e);
		}, new Map()).values()
	);
};

/* Tokens & similarity */

window.tokenize = input => {
	// Inspired by https://github.com/tatsuya/search-text-tokenizer
	// Valid tokens: single & double quotes, [field]:, [not-field]!, +, -, ?, #, @
	// If full alternative [field]! = NOT[field]; must to be included in switch
	input = input.trim();
	
	const blacklist = '\|¡!·@$%&/()[]{}=¿?+*-_;,.:<>'.split('');
	const pattern = /(\w+[:|!]|-|\+|\*|\#|\?|@)?("[^"]*"|'[^']*'|[^\s]+)/g;
	const results = [];
	let matched;
	
	while(matched = pattern.exec(input)) {
		const result = {};
		let prefix = matched[1];
		let term = matched[2];

		// Remove quotes
		if(/^".+"$/.test(term)) {
			term = term.replace(/(^"|"$)/g, '').trim();
			result.literal = true;
		}
		if(/^'.+'$/.test(term)) {
			term = term.replace(/(^'|'$)/g, "").trim();
			result.literal = true;
		}
		
		result.term = term;
		if(prefix) result[prefix.endsWith('!') ? 'notfield' : 'field'] = prefix.slice(0, -1);
		if(isEmpty(result.field)) delete result.field;
		if(!blacklist.includes(result.term.trim())) results.push(result);
		prefix = preventleaks(prefix);
		term = preventleaks(term);
		prefix = term = null;
	}
	
	return results;
};

window.similarity = (a, b) => {
	const _stringSimilarity = (a, b) => {
		const bg1 = bigrams(a);
		const bg2 = bigrams(b);
		const c1 = count(bg1);
		const c2 = count(bg2);
		const combined = uniq([... bg1, ... bg2]).reduce ((t, k) => t + (Math .min (c1 [k] || 0, c2 [k] || 0)), 0);
		return 2 * combined / (Math .max (bg1 .length + bg2 .length, 1));
	}
	const prep = str => normalizer(fit(str)).toLowerCase().replace(/[^\w\s]/g, ' ').replace (/\s+/g, ' ');
	const bigrams = str => [...str].slice (0, -1).map((c, i) => c + str [i + 1]);
	const count = xs => xs.reduce((a, x) => ((a [x] = (a [x] || 0) + 1), a), {});
	const uniq = xs => [...new Set(xs)];

	return _stringSimilarity (prep(a), prep(b));
};

/* Full screen */

window.fullscreen = {
	open: elem => {
		if (elem.requestFullscreen) {
			elem.requestFullscreen();
		} else if (elem.mozRequestFullScreen) { /* Firefox */
			elem.mozRequestFullScreen();
		} else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
			elem.webkitRequestFullscreen();
		} else if (elem.msRequestFullscreen) { /* IE/Edge */
			elem.msRequestFullscreen();
		}
	},
	close: _ => {
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.mozCancelFullScreen) { /* Firefox */
			document.mozCancelFullScreen();
		} else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
			document.webkitExitFullscreen();
		} else if (document.msExitFullscreen) { /* IE/Edge */
			document.msExitFullscreen();
		}
	},
};

/* File exists in server */

window.fileexists = async url => {
	try {
		const response = await fetch(url, {
			method: 'HEAD',
			cache: 'no-cache'
		});
	
		return response.status === 200;
	} catch(error) {
		console.error(error);
		return false;
	}
};

/* Attributes changer */

window.att = function (obj, attribute = 'hidden', condition = true) {
	if(condition) {
		obj.setAttribute(['busy', 'invalid', 'current'].includes(attribute) ? `aria-${attribute}` : attribute, true);
	} else {
		obj.removeAttribute(['busy', 'invalid', 'current'].includes(attribute) ? `aria-${attribute}` : attribute);
	}
};

/* Listeners & events delegation handler */

window.delay = m => new Promise(resolve => setTimeout(resolve, m));

window.until = predfn => {
	const poll = done => (predfn() ? done() : setTimeout(() => poll(done), 50));
	return new Promise(poll);
};

window.removeuseless = node => {
	const children = node.childNodes.length;
	for(let n = 0; n < children; n ++) {
		let child = node.childNodes[n];
		if(child?.nodeType === 8 || (child?.nodeType === 3 && !/\S/.test(child?.nodeValue))) {
			node.removeChild(child);
			n --;
		} else if(child?.nodeType === 1) {
			removeuseless(child);
		}
		child = null;
	}
};

window.clear = n => {
	let x;
	while (n.lastChild) {
		x = n.removeChild(n.lastChild);
		x = null;
	}
	x = undefined;
	return n;
};

window.clearnode = (obj, reset = false) => {
	try {
		if(!isDOM(obj)) return false;
		const parent = obj.parentNode;
		const newchild = obj.cloneNode(true);
		if(parent) parent.replaceChild(newchild, obj);
		if(reset) newchild.replaceChildren();
		return newchild;
	} catch(err) {
		throw err;
	}
};

window.listener = (obj, act, fn, clear = true) => {
	try {
		if(!isDOM(obj)) return false;
		const passive = new Set([
			'scroll', 'wheel',
			'touchstart', 'touchmove', 'touchenter', 'touchend', 'touchleave',
			'mouseout', 'mouseleave', 'mouseup', 'mousedown', 'mousemove', 
			'mouseenter', 'mousewheel', 'mouseover'
		]);
		let newchild = clear ? clearnode(obj) : obj;
		let options;
		if(Array.isArray(act)) {
			act.forEach(a => {
				options = { passive: passive.has(a), capture: false };
				newchild.removeEventListener(a, fn, options);
				newchild.addEventListener(a, fn, options);
			});
		} else {
			options = { passive: passive.has(act), capture: false };
			newchild.removeEventListener(act, fn, options);
			newchild.addEventListener(act, fn, options);
		}
		newchild = options = null;
	} catch(err) {
		throw err;
	}
};

window.preventleaks = v => {
	if(v instanceof Object) {
		for(let property in v) {
			if(Array.isArray(property)) property.length = 0;
			property = null;
		}
	} else if(v instanceof Function) {
		v = undefined;
	} else if(Array.isArray(v)) {
		v.length = 0;
		v = null;
	} else {
		v = null;
	}
	return v;
};

/* Database */

window.DB = {
	db: null, // database object
	cache: null, // storage cache object
	cname: 'SQLDB', // cache storage name
	dbname: "/ariadna.db", // database storage name
	SQL: null, // SQLite engine
	init: async _ => {
		// Storage cache + SQLJS
		DB.cache = await caches.open(DB.cname);
		DB.SQL = await initSqlJs({
			locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${filename}`
		});
	
		// Attempt to load database from storage cache or notify about
		DB.cache.match(DB.dbname).then(async r => {
			if (r == undefined) {
				await message('alert', msg._nocachedb.replaceAll('${serverdate}', localdate(new Date(dbinfo.server.date), dateformat.time)));
				await DB.openremotedb();
				r = null;
			} else {
				// Database present in cache; load it
				let buf = await r.arrayBuffer();
				DB.db = new DB.SQL.Database(new Uint8Array(buf));
				DB.db.create_function('CONTAINS', (a, b) => normalizer(fit(a)).includes(normalizer(fit(b))));
				DB.db.create_function('EQUALS', (a, b) => normalizer(fit(a)) === normalizer(fit(b)));
				DB.db.create_function('NORMAL', a => normalizer(fit(a)));
				buf = r = null;
			}
			semaphore = true;
		});
	},

	close: async _ => await DB.db.close(),
	
	clear: async _ => {
		caches.open(DB.cname).then((cache) => {
			cache.delete(DB.dbname).then((response) => {
				window.location.reload();
			});
		});
	},
	
	cdateset: _ => localStorage.setItem(`${opt.app.key}_cachedate`, new Date()),

	cdateget: _ => localStorage.getItem(`${opt.app.key}_cachedate`),
	
	print: (r, title = null, threshold = {}, band = {}, marks = {}) => {
		const mark = (v, i) => {
			if(!Object.keys(threshold).length) return '';
			const thr = threshold[i];
			const bnd = band[i];
			const mrk = marks[i];
			if(!thr || !bnd || !mrk) return '';
			return `class="pico-color-${v < thr ? mrk[0] : v > thr + bnd ? mrk[2] : mrk[1]}"`;
		};
		const formatrow = vals => vals.map((m, i) => `<td${isNaN(m) ? '' : ' dir="rtl"'}${mark(m, i)}>${isNaN(m) ? m : (!m ? '' : locale(m))}</td>`).join('');
		const formatcol = vals => vals.map(m => `<th${!opt.db.rtlcolumnames.includes(m) ? '' : ' dir="rtl"'}>${msg[m] || m}</th>`).join('');
		const columns = r['columns'];
		const colsHtml = `<tr>${formatcol(columns)}</tr>`;
		const valsHTML = [];
		const values = r['values'];
		for(const v in values) {
			const valHTML = `<tr>${formatrow(values[v])}</tr>`;
			valsHTML.push(valHTML);
		}
		return `<table>${title ? `<caption><h6>${title}</h6></caption>`: ``}<thead>${colsHtml}</thead><tbody>${valsHTML.join('')}</tbody></table>`;
	},
	
	exec: stmt => DB.db.exec(stmt),

	getasobject: (stmt, pars = {}) => {
		const result = [];
		const query = DB.db.prepare(stmt);
		if(Object.keys(pars).length) query.bind(pars);
		while(query.step()) { 
			result.push(query.getAsObject());
		}
		query.freemem();
		query.free();
		return result;
	},

	opendb: async event => {
		semaphore = false;
		const input = event.target;
		const fileredr = new FileReader();
		fileredr.onload = async fle => {
			const arrayBuffer = fle.target.result;
			if(arrayBuffer) {
				const uInt8Array = new Uint8Array(arrayBuffer);
				DB.db = new DB.SQL.Database(uInt8Array);
				await DB.export();
				DB.cdateset();
				semaphore = true;
			}
		};
		if(input.files.length) {
			fileredr.readAsArrayBuffer(input.files[0]);
		} else {
			semaphore = true;
		}
	},

	openremotedb: async event => {
		semaphore = false;
		const status = await (await fetch(`${opt.paths.api}/dbstatus`, {signal: AbortSignal.timeout(5000)})).json();
		fetch(opt.paths.api, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/octet-stream',
			},
			responseType: 'arraybuffer'
		}).then(response => {
			const contentLength = status.size || 1;
			let loaded = 0;
			return new Response(
				new ReadableStream({
					start(controller) {
						const reader = response.body.getReader();
						read();
						function read() {
							reader.read().then((progressEvent) => {
								if (progressEvent.done) {
									controller.close();
									return; 
								}
								loaded += progressEvent.value.byteLength;
								if(byId('downloaded')) {
									byId('downloaded').textContent = `${Math.round(loaded / contentLength * 100)}%`;
								}
								controller.enqueue(progressEvent.value);
								read();
							});
						}
					}
				})
			);
		})
		.then(response => response.arrayBuffer()) // Read new readable stream to arrayBuffer
		.then(async buffer => {
			if(buffer) {
				const uInt8Array = new Uint8Array(buffer);
				DB.db = new DB.SQL.Database(uInt8Array);
				await DB.export();
				DB.cdateset();
				semaphore = true;
				window.location.reload();
			}
		}).catch(err => {
			throw new Error(err);
		});
	},
	
	// Export database to storage cache
	export: async () => await DB.cache.put(
		DB.dbname, new Response(DB.db.export())
	),
};

export default {};
