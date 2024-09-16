import { init, mdToHtml, mdToJSON, mdToReadableHtml } from 'https://esm.sh/md4w';
await init();

const timers = {db: 0, query: 0};

const timer = t => byId('timer').innerHTML = `${locale(timers[t])} ms`;
const helptext = async name => await (await fetch(`../assets/data/help/${l}/${name}.md`, {signal: AbortSignal.timeout(5000)})).text();

const pageload = async _ => {
	perf.start('db');
	byId('overlay').showModal();
	requestAnimationFrame(async () => {
		requestAnimationFrame(async () => {
			await render.help();

			timers.db = perf.end('db', true);
			timer('db');
			byId('overlay').close();
			removeuseless(document);
		})
	});
};

const render = {
	help: async _ => {
		const mds = Array.from(qsa('[data-md]')).map(o => o.dataset.md);
		for await (const name of mds) {
			const text = await helptext(name);
			const html = await mdToHtml(text, {
				parseFlags: [
					'DEFAULT',
					'TABLES',
					'PERMISSIVE_URL_AUTO_LINKS',
					'PERMISSIVE_EMAIL_AUTO_LINKS',
					'COLLAPSE_WHITESPACE',
					'PERMISSIVE_WWW_AUTO_LINKS',
				],
			});
			qs(`[data-md="${name}"]`).innerHTML = html;
		}
		listeners.init();
		att(qs('.partners'), 'hidden', false);
	},
};

const listeners = {
	init: _ => {
		qsa('.showcontact').forEach(o => listener(o, 'click', listeners.showcontact));
		qsa('input[type="email"]').forEach(o => listener(o, 'input', listeners.validateemail));
		qsa('input[type="file"]').forEach(o => listener(o, 'change', listeners.validatefiles));
		qsa('.mandatory').forEach(o => listener(o, 'change', listeners.mandatory, false));
		qsa('.send').forEach(o => listener(o, 'click', listeners.send));
	},
	
	showcontact: e => {
		e.preventDefault && e.preventDefault();
		if(!e.target?.dataset?.tab) return false;
		qsa('[role="tabpanel"]').forEach(o => att(o, 'hidden', o.id !== e.target.dataset.tab));
		qsa('[role="tab"]').forEach(o => att(o, 'current', false));
		qsa(`[data-tab="${e.target.dataset.tab}"]`).forEach(o => att(o, 'current', true));
		window.dispatchEvent(new Event('resize'));
	},
	validateemail: e => {
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
			console.log('debesalir')
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
	mandatory: e => {
		const isok = !isEmpty(byId('description').value) && 
			!isEmpty(byId('id').value) && 
			!isEmpty(byId('email').value) && 
			byId('accept').checked;
		att(byId('send'), 'disabled', !isok);
		att(byId('description'), 'invalid', isEmpty(byId('description').value));
		att(byId('accept'), 'invalid', !byId('accept').checked);
		att(byId('id'), 'invalid', isEmpty(byId('id').value));
		att(byId('email'), 'invalid', isEmpty(byId('email').value));
	},
	send: async e => {
		e.preventDefault && e.preventDefault();
		perf.start('db');
		byId('overlay').showModal();
		requestAnimationFrame(async () => {
			requestAnimationFrame(async () => {
				const body = new FormData(byId('complaint'));
				const response = await fetch(opt.paths.api + '/contact.php', {
					method: 'POST',
					body: body,
				});
				const result = await response.json();

				try {
					const isok = result.status.some(o => o);
					if(isok) {
						await message('alert', `<blockquote class="pico-color-green">${msg._sendingcontactok.replaceAll('_TICKET_', result.ticket)}</blockquote>`);
					} else {
						await message('alert', `<blockquote class="pico-color-red">${msg._sendingcontacterror}</blockquote>`);
					}
				} catch(e) {
					throw new Error(msg._sendingcontacterror);
				}

				timers.db = perf.end('db', true);
				timer('db');
				byId('overlay').close();
				removeuseless(document);
			})
		});
	},
};

(async () => {
	try {
		await pageload();
	} catch(err) {
		throw err;
	}
})();
