import './modules/mod.globals.js';

window.dbinfo = {
	server: null,
	local: localStorage.getItem(`${opt.app.key}-cachedate`),
};

const navigation = _ => {
	const matchsrc = (url, part) => new URL(url).pathname.split('/').filter(Boolean).pop() === part;
	const matchsub = (link, part) => {
		if(!link.dataset) return false;
		if(!link.dataset.subpages) return false;
		return link.dataset.subpages.split(',').includes(part);
	};
	qsa('nav[role="sitenav"] ul').forEach(o => {
		o.querySelectorAll('li').forEach(s => {
			const a = s.querySelector('a');
			if(a) {
				if(matchsrc(a.href, page) || matchsub(a, page)) {
					a.setAttribute('aria-current', 'page');
				} else {
					a.removeAttribute('aria-current');
				}
			}
		});
	});
};

const pagedata = async _ => {
	return {
		name: opt.app.name,
		author: `<a href="${opt.app.author.url}" target="_blank" rel="external">${opt.app.author.name}</a>`,
		licenses: `<a href="${opt.app.licenses.code.url}" target="_blank" rel="external">${opt.app.licenses.code.name}</a>, <a href="${opt.app.licenses.content.url}" target="_blank" rel="external">${opt.app.licenses.content.name}</a>`,
		page: page,
		section: sect || '--',
		pagesize: `${locale(pagesize)} bytes`,
		pagetime: `${locale(pagetime < 0 ? 0 : pagetime)} ms`,
		pagespeed: `${locale((pagesize / (pagetime / 1000)))} bytes/sec`,
	};
};

const listeners = {
	init: _ => {
		qsa('[role="pagedata"]').forEach(o => listener(o, 'click', listeners.pagedata));
		qsa('[role="citation"]').forEach(o => listener(o, 'click', listeners.citation));
		qsa('[role="reload"]').forEach(o => listener(o, 'click', listeners.reload));
		qsa('[role="tab"]').forEach(o => listener(o, 'click', listeners.tabs));
		qsa('[role="help"]').forEach(o => listener(o, 'click', listeners.help));
		qsa('[role="rangenumber"]').forEach(o => listener(o, ['input'], listeners.rangenumber));
		qsa('.theme').forEach(o => listener(o, 'click', listeners.theme));
		qsa('.boundaries').forEach(o => listener(o, 'click', listeners.boundaries));
		qsa('.copy').forEach(o => listener(o, 'click', listeners.copy));
	},
	pagedata: async e => {
		e.preventDefault && e.preventDefault();
		const pdat = await pagedata();
		modal(
			`${opt.app.name}`,
			`<table><tbody>${Object.entries(pdat).map(m => `<tr><td>${m[0]}</td><td>${m[1]}</td></tr>`).join('')}</tbody></table>`
		);
	},
	citation: e => {
		e.preventDefault && e.preventDefault();
		modal(
			`${msg.page}; ${msg.citation}`,
			byId('tpl-citation').innerHTML
				.replaceAll('${title}', qs('title').textContent)
				.replaceAll('${location}', window.location.href)
				.replaceAll('${datetime}', localdate(new Date(), dateformat.time))
		);
	},
	reload: async e => {
		e.preventDefault && e.preventDefault();
		const mess = msg._reload.replaceAll('${serverdate}', localdate(new Date(dbinfo.server.date), dateformat.time));
		const confirm = await message('confirm', mess);
		if(confirm.target.returnValue === 'ok') {
			await DB.clear();
		}
	},
	tabs: e => {
		e.preventDefault && e.preventDefault();
		if(!e.target?.dataset?.tab) return false;
		qsa('[role="tabpanel"]').forEach(o => att(o, 'hidden', o.id !== e.target.dataset.tab));
		qsa('[role="tab"]').forEach(o => att(o, 'current', false));
		qsa(`[data-tab="${e.target.dataset.tab}"]`).forEach(o => att(o, 'current', true));
		window.dispatchEvent(new Event('resize'));
	},
	rangenumber: e => {
		const cursorposition = e.target.selectionStart - 1;
		const hasinvalidchars = e.target.value.match(/[^0-9/]/);
		if (!hasinvalidchars) return;
		e.target.value = e.target.value.replace(/[^0-9/]/g, '');
		e.target.setSelectionRange(cursorposition, cursorposition);
	},
	help: async e => {
		e.preventDefault && e.preventDefault();
		try {
			const title = e.target.dataset?.title || msg.untitled;
			const content = e.target.dataset?.content || 'notfound';
			const html = await (await fetch(`../${l}/templates/help/${content}.html`, {signal: AbortSignal.timeout(5000)})).text();
			modal(title, html);

			const dom = new DOMParser().parseFromString(html, 'text/html');
			const scripts = dom.getElementsByTagName('script');
			[...scripts].filter(s => s.type !== 'application/ld+json').forEach(s => {
				new Function(s.textContent)();
			});
			
			byId('dialogarticle').scrollTop = 0;
		} catch(err) {
			throw err;
		}
	},
	theme: e => {
		e.preventDefault && e.preventDefault();
		const html = document.documentElement;
		const change = !isEmpty(e.target);
		let stored = localStorage.getItem(`${opt.app.key}_theme`) || 'auto';
		if(change) stored = stored === 'auto' ? 'light' : stored === 'light' ? 'dark' : 'auto';

		const icons = {
			auto: '&#9680;',
			dark: '&#9790;',
			light: '&#9788;',
		};
		
		if(stored === 'auto') {
			html.removeAttribute('data-theme');
		} else {
			html.setAttribute('data-theme', stored);
		}
		localStorage.setItem(`${opt.app.key}_theme`, stored);
		qsa('.theme').forEach(o => o.innerHTML = icons[stored]);
		stored = preventleaks(stored);
		stored = null;
	},
	boundaries: async e => {
		e.preventDefault && e.preventDefault();
		if(!DB?.db) return false;
		const boundaries = await DB.getasobject(qry._query.counts);
		const conditions = await localStorage.getItem(`${opt.app.key}_conditions`);
		let mess = msg._activeboundaries;
		const text = [];
		if(conditions) {
			let conds = JSON.parse(conditions);
			conds.forEach(cnd => {
				cnd.forEach(c => {
					text.push(`${c.key}${isEmpty(c.relation) ? `` : ` ${msg.as} ${c.relation}`}: ${msg[c.field] || c.field} = "${c.value}"`);
				});
			});
		}
		mess = mess.replace('_conditions_', text.join(' AND '));
		text.length = 0;
		boundaries.forEach(b => mess = mess.replace(`_${b.tablename}_`, locale(b.count)));
		await message('alert', mess);
		mess = null;
		boundaries.length = 0;
	},
	copy: e => {
		e.preventDefault && e.preventDefault();
		const range = document.createRange();
		const originaltext = e.target.innerHTML;
		range.selectNode(qs(`${e.target.dataset?.target ? `#${e.target.dataset.target}` : `main`}`)); 
		window.getSelection().removeAllRanges(); 
		window.getSelection().addRange(range); 
		document.execCommand('copy');
		window.getSelection().removeAllRanges();
		e.target.innerHTML = `<svg style="height:1rem;width:1rem;margin-right:1rem"><use href="#symclipboard"></use></svg>${msg.copied}`;
		e.target.classList.add('secondary');
		setTimeout(() => {
			e.target.innerHTML = originaltext;
			e.target.classList.remove('secondary');
		}, 2000);
	},
};

const runner = async _ => {
	try {
		perf.start('page');
		await until(() => Array.from(qsa('html-include')).length < 1);
		navigation();
		listeners.theme({});
		if(opt.app.pageoverlay) byId('overlay').showModal();
		// Void
		if(opt.app.pageoverlay) byId('overlay').close();
		log.info(`${locale(perf.end('page', true))} ms / ${page}${sect ? ' / ' + sect : ''}`);
		listeners.init();
		if(debug) console.table(pagedata());
	} catch(err) {
		listeners.init();
		throw err;
	}
};

if (document.readyState !== 'loading') await runner();
