const timers = {db: 0, query: 0};
const engine = {
	map: null,
	user: {
		lat: 36.72016,
		lon: -4.42034,
	},
};

const MAX_FILES = 5;
const MAX_SIZE = 5000000; // 5 MB

const timer = t => byId('timer').innerHTML = `${locale(timers[t])} ms`;
const location = async q => {
	const endpoint = `https://nominatim.openstreetmap.org/search?q=${q}&format=jsonv2&limit=5&layer=address,poi,railway,natural,manmade&accept-language=${l}`;
	return await (await fetch(endpoint, {signal: AbortSignal.timeout(5000)})).json();
}
const reverse = async (lat, lon) => {
	const endpoint = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&limit=5&layer=address,poi,railway,natural,manmade&accept-language=${l}`;
	return await (await fetch(endpoint, {signal: AbortSignal.timeout(5000)})).json();
}

/* Page load */
 
const pageload = async _ => {
	await until(() => window.maptalks);

	perf.start('db');
	byId('overlay').showModal();
	requestAnimationFrame(async () => {
		requestAnimationFrame(async () => {
			await render.map();
			
			timers.db = perf.end('db', true);
			timer('db');
			byId('overlay').close();
			removeuseless(document);
			listeners.init();
		})
	});
};

/* Helpers */

const helpers = {
	serverstatus: async _ => {
		const url = `${opt.paths.api}/ping`;
		return await (await fetch(url, {signal: AbortSignal.timeout(5000)})).json();
	},
	position: async _ => {
		att(byId('location'), 'disabled', true);
		const mapstatus = byId('mapstatus');
		if (navigator.geolocation) {
			await navigator.geolocation.getCurrentPosition(p => {
				engine.user.lat = p.coords.latitude;
				engine.user.lon = p.coords.longitude;
				engine.map.setView({center: [engine.user.lon, engine.user.lat], zoom: 17});
				mapstatus.textContent = '';
				att(byId('location'), 'disabled', false);
				listeners.mandatory({});
			});
		} else {
			await message('alert', msg._nogeolocation);
			mapstatus.textContent = '';
			att(byId('location'), 'disabled', false);
			listeners.mandatory({});
		}
	},
	location: async q => {
		if(q.length < 3) return false;
		const result = await location(q);
		byId('locationresult').innerHTML = '';
		att(qs('.locationcontainer'), 'hidden', true);
		byId('location').classList.remove('margin-bottom-zero');
		if(!Array.isArray(result) || (Array.isArray(result) && result.length < 1)) return false;
		byId('locationresult').innerHTML = `<ul class="places">${result.map(r => `<li data-lat="${r.lat}" data-lon="${r.lon}" data-name="${r.display_name}" data-extent="${r.boundingbox.join(',')}">${r.display_name} (<em>${r.addresstype}</em>)</li>`).join('')}</ul>`;
		att(qs('.locationcontainer'), 'hidden', false);
		byId('location').classList.add('margin-bottom-zero');
	},
};

/* Render */

const render = {
	map: async (reset = true) => {
		const map = byId('map');
		map.style.height = '50vh';
		map.classList.add('margin-bottom');
		
		engine.map = new maptalks.Map('map', {
			center: [engine.user.lon, engine.user.lat],
			zoom: 12,
			baseLayer: new maptalks.TileLayer('base', {
				urlTemplate: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
				subdomains: ["a","b","c","d"],
				attribution: '&copy; <a href="http://osm.org">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>'
			}),
			zoomControl: {
				position : 'top-left',
				slider : true,
				zoomLevel : false
			},
			scaleControl: {
				position : 'top-right',
			},
			centerCross: true,
			doubleClickZoom: false,
			scrollWheelZoom: false,
		});
		
		const bottomRightCompass = new maptalks.control.Compass({
			position: 'bottom-right',
		});
		engine.map.addControl(bottomRightCompass);
		engine.map.on('dblclick', e => {
			engine.map.config('scrollWheelZoom', !engine.map.config().scrollWheelZoom);
			const active = engine.map.config().scrollWheelZoom;
			att(byId('scrolloff'), 'hidden', active);
			att(byId('scrollon'), 'hidden', !active);
		});
		
		engine.map.on('zoomend moveend', async e => {
			const center = engine.map.getCenter();
			byId('coordinates').value = `${center.x},${center.y}`;
			const inverse = await reverse(center.y, center.x);
			byId('location').value = inverse.display_name;
		});
		
		if(reset) await helpers.position();
	},
};

/* Listeners */

const listeners = {
	init: _ => {
		qsa('[role="reload"]').forEach(o => listener(o, 'click', listeners.reload));
		qsa('.clear').forEach(o => listener(o, 'click', listeners.clear));
		qsa('.search').forEach(o => listener(o, 'click', listeners.search));
		qsa('.locationresult').forEach(o => listener(o, 'click', listeners.locationresult));
		qsa('.relocate').forEach(o => listener(o, 'click', listeners.relocate));
		qsa('.mandatory').forEach(o => listener(o, 'change', listeners.mandatory));
		qsa('.send').forEach(o => listener(o, 'click', listeners.send));
		qsa('input[type="email"]').forEach(o => listener(o, 'input', listeners.validateemail));
		qsa('input[type="file"]').forEach(o => listener(o, 'change', listeners.validatefiles));
		qsa('details.step').forEach(o => listener(o, 'toggle', listeners.step));
		qsa('.test').forEach(o => listener(o, 'change', listeners.test));
	},
	reload: async e => {
		e.preventDefault && e.preventDefault();
		const status = await helpers.serverstatus();
		const mess = msg._reload
			.replaceAll('${serverdate}', localdate(new Date(dbinfo.server.date), dateformat.time))
			.replaceAll('${speed}', locale(status.speed_download * 8 / 1024))
			.replaceAll('${time}', locale(status.total_time * 1000));
		const confirm = await message('confirm', mess);
		if(confirm.target.returnValue === 'ok') {
			['query', 'conditions'].forEach(o => localStorage.removeItem(`${opt.app.key}_${o}`));
			await DB.clear();
		}
	},
	clear: e => {
		e.preventDefault && e.preventDefault();
		byId('location').value = '';
	},
	search: async e => {
		e.preventDefault && e.preventDefault();
		if(byId('location').value.length < 3) {
			await message('alert', msg._nominimalsearchlength);
			return false;
		}
		perf.start('db');
		byId('overlay').showModal();
		requestAnimationFrame(async () => {
			requestAnimationFrame(async () => {
				await helpers.location(byId('location').value.trim());
				
				timers.db = perf.end('db', true);
				timer('db');
				byId('overlay').close();
				removeuseless(document);
			})
		});
	},
	locationresult: async e => {
		if(e.target.tagName !== 'LI') return false;
		if(!e.target.dataset) return false;
		if(!e.target.dataset?.lat || !e.target.dataset?.lon || !e.target.dataset?.name) return false;
		byId('location').value = e.target.dataset.name;
		byId('locationresult').innerHTML = '';
		att(qs('.locationcontainer'), 'hidden', true);
		byId('location').classList.add('margin-bottom-zero');
		engine.map.setCenter([parseFloat(e.target.dataset.lon), parseFloat(e.target.dataset.lat)]);
		const [ymin, ymax, xmin, xmax] = e.target.dataset.extent.split(',').map(d => parseFloat(d));
		engine.map.fitExtent({xmin: xmin, ymin: ymin, xmax: xmax, ymax: ymax}, 0);
	},
	relocate: async e => {
		e.preventDefault && e.preventDefault();
		await helpers.position();
	},
	mandatory: e => {
		const isok = !isEmpty(byId('description').value) && byId('coordinates').value !== '0,0' && byId('accept').checked;
		att(byId('send'), 'disabled', !isok);
		att(byId('description'), 'invalid', isEmpty(byId('description').value));
		att(byId('accept'), 'invalid', !byId('accept').checked);
		att(byId('location'), 'invalid', byId('coordinates').value === '0,0');
	},
	send: async e => {
		e.preventDefault && e.preventDefault();
		perf.start('db');
		byId('overlay').showModal();
		requestAnimationFrame(async () => {
			requestAnimationFrame(async () => {
				const body = new FormData(byId('complaint'));
				const response = await fetch(opt.paths.api + '/index.php', {
					method: 'POST',
					body: body,
				});
				const result = await response.json();
				try {
					const isok = result.status.some(o => o);
					if(isok) {
						await message('alert', `<blockquote class="pico-color-green">${msg._sendingreportok.replaceAll('_TICKET_', result.ticket)}</blockquote>`);
					} else {
						await message('alert', `<blockquote class="pico-color-red">${msg._sendingreporterror}</blockquote>`);
					}
				} catch(e) {
					throw new Error(msg._sendingreporterror);
				}
				timers.db = perf.end('db', true);
				timer('db');
				byId('overlay').close();
				removeuseless(document);
			})
		});
	},
	validateemail: e => {
		if(isEmpty(e.target.value.trim())) {
			byId('valid-helper').textContent = '';
			e.target.removeAttribute('aria-invalid');
			return false;
		}
		const pattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
		const isok = pattern.test(e.target.value);
		e.target.setAttribute('aria-invalid', !isok);
		byId('valid-helper').textContent = isok ? msg._validemail : msg._notvalidemail;
	},
	validatefiles: async e => {
		const errors = {
			size: 0,
			length: 0,
		};
		const fileslength = e.target.files.length;
		let files = new DataTransfer;
		Array.from(e.target.files).forEach(async f => {
			if(f.size <= MAX_SIZE) {
				files.items.add(f);
			} else {
				errors.size++;
			}
			
		});
		e.target.files = files.files;
		files = null;
		if(fileslength > MAX_FILES) {
			errors.length = fileslength - MAX_FILES;
			let list = new DataTransfer;
			for(let i =0; i < MAX_FILES; i++) {
				list.items.add(e.target.files[i]);
			}
			e.target.files = list.files;
			list = null;
		}
		if(errors.size > 0 || errors.length > 0) {
			await message(
				'alert', 
				msg._fileserror
					.replaceAll('_OVERSIZE_', `${errors.size} ${plural(errors.size, msg.file, msg.___file)}`)
					.replaceAll('_OVERLENGTH_', `${errors.length} ${plural(errors.length, msg.file, msg.___file)}`)
					.replaceAll('_MAXSIZE_', humansize(MAX_SIZE, false))
					.replaceAll('_MAXFILES_', MAX_FILES)
			);
		}
	},
	step: e => {
		const steppers = qsa('.stepper-item');
		const current = parseInt(e.target.dataset.step);
		const isopen = e.target.open;
		steppers.forEach((o, i) => {
			if(i < current) {
				o.classList.add('completed');
			} else if(i === current) {
				if(isopen) {
					o.classList.add('active');
				} else {
					o.classList.remove('completed', 'active');
				}
			} else {
				o.classList.remove('completed', 'active');
			}
		});
	},
	test: e => {
		const file = e.target.files[0]; // get the file
		const blobURL = URL.createObjectURL(file);
		const img = new Image();
		img.src = blobURL;
		img.onerror = function () {
			URL.revokeObjectURL(this.src);
			console.log("Cannot load image");
		};
		img.onload = function () {
			URL.revokeObjectURL(this.src);
			const [newWidth, newHeight] = calculateSize(img, MAX_WIDTH, MAX_HEIGHT);
			const canvas = document.createElement("canvas");
			canvas.width = newWidth;
			canvas.height = newHeight;
			const ctx = canvas.getContext("2d");
			ctx.drawImage(img, 0, 0, newWidth, newHeight);
			canvas.toBlob(
				(blob) => {
				// Handle the compressed image. es. upload or save in local state
				displayInfo('Original file', file);
				displayInfo('Compressed file', blob);
				},
				MIME_TYPE,
				QUALITY
			);
			qs("main").append(canvas);
		};
	},
};

(async () => {
	try {
		await pageload();
	} catch(err) {
		throw err;
	}
})();
