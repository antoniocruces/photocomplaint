// Alternative Unicode symbol for logo: &#43612; or ꩜

/* THROTTLE & DEBOUNCE */
	// Throttle function to limit the rate of execution
function throttle(func, delay) {
  let timer;
  return function() {
	if (!timer) {
	  timer = setTimeout(() => {
		func.apply(this, arguments);
		timer = null;
	  }, delay);
	}
  };
}

// Debounce function to execute after a certain delay
function debounce(func, delay) {
  let timer;
  return function() {
	clearTimeout(timer);
	timer = setTimeout(() => {
	  func.apply(this, arguments);
	}, delay);
  };
}

// Example usage of throttle and debounce
const searchInput = document.getElementById('searchInput');
const searchResult = document.getElementById('searchResult');

function handleSearch() {
  // Perform search operation here
  searchResult.textContent = `Searching for: ${searchInput.value}`;
}

searchInput.addEventListener('input', debounce(handleSearch, 500));

/* UTILITY */

// Serial execution of Promises

const requestAry = [() => api.request1(), () => api.request2(), () => api.request3()];
const finallyPromise = requestAry.reduce(
	 (currentPromise, nextRequest) => currentPromise.then(() => nextRequest()),
	 Promise.resolve() // Create an initial promise for linking promises in the array
);

// Merging arrays when using large arrays
Array.push.apply(arr1, arr2)

/* LAZY LOADING */

	// Lazy load a JavaScript module when needed
function loadModule() {
  import('./module.js')
	.then((module) => {
	  // Use the module here
	  module.someFunction();
	})
	.catch((error) => {
	  console.error('Error loading module:', error);
	});
}

// Add an event listener to trigger the lazy loading
const button = document.getElementById('lazyLoadButton');
button.addEventListener('click', loadModule);

/* OBJECTS LITERALS FOR CACHIN */

function heavyComputation(input) {
  if (!heavyComputation.cache) {
	heavyComputation.cache = {};
  }

  if (input in heavyComputation.cache) {
	console.log('Fetching from cache...');
	return heavyComputation.cache[input];
  }

  // Perform heavy computation here
  const result = input * 2;

  // Cache the result
  heavyComputation.cache[input] = result;
  return result;
}

console.log(heavyComputation(5)); // Output: 10 (not fetched from cache)
console.log(heavyComputation(5)); // Output: 10 (fetched from cache)

// Generate numeric range
const range = (start, end) => {
	return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

// Generate QR code for URL

`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrValue}`

// Boolean logic with Set
const setA = new Set(['🌞', '🌝', '🌎']);
const setB = new Set(['🌎', '🚀', '👩‍🚀']);

const union = new Set([...setA, ...setB]);
console.log(union); // Set(5) { '🌞', '🌝', '🌎', '🚀', '👩‍🚀' }

const intersection = new Set([...setA].filter((x) => setB.has(x)));
console.log(intersection); // Set(1) { '🌎' }

const difference = new Set([...setA].filter((x) => !setB.has(x)));
console.log(difference); // Set(2) { '🌞', '🌝' }


/* Highlighter */

window.highlight = (node, string = '', selector = '*:not(script)') => {
	// Usage: Call the function with the search term you want to highlight
	// highlight(document, 'JavaScript', '*:not(script)');
	if(!isNode(node)) return false;
	
	const elements = node.querySelectorAll(selector);
	elements.forEach(element => {
		const text = element.innerText;
		const regex = new RegExp(`(${string})`, 'gi');
		if (text.match(regex)) {
			const parts = text.split(regex);
			const highlightedtext = parts.map((part) => part.match(regex) ? `<mark>${part}</mark>` : part).join('');
			element.innerHTML = highlightedtext;
		}
	});
};

/**
 * Creates a virtually-rendered scrollable list.
 * @param {object} config
 * @constructor
 */
function VirtualList(config) {
  var width = (config && config.w + 'px') || '100%';
  var height = (config && config.h + 'px') || '100%';
  var itemHeight = this.itemHeight = config.itemHeight;

  this.items = config.items;
  this.columns=config.columns;
  this.generatorFn = config.generatorFn;
  this.totalRows = config.totalRows || (config.items && config.items.length);

  var scroller = VirtualList.createScroller(itemHeight * this.totalRows);
  this.container = VirtualList.createContainer(width, height);
  this.container.appendChild(scroller);

  var screenItemsLen = Math.ceil(config.h / itemHeight);
  // Cache 4 times the number of items that fit in the container viewport
  this.cachedItemsLen = screenItemsLen * 3;
  this._renderChunk(this.container, 0);

  var self = this;
  var lastRepaintY;
  var maxBuffer = screenItemsLen * itemHeight;
  var lastScrolled = 0;

  // As soon as scrolling has stopped, this interval asynchronously removes all
  // the nodes that are not used anymore
  this.rmNodeInterval = setInterval(function() {
	if (Date.now() - lastScrolled > 100) {
	  var badNodes = document.querySelectorAll('[data-rm="1"]');
	  for (var i = 0, l = badNodes.length; i < l; i++) {
		self.container.removeChild(badNodes[i]);
	  }
	}
  }, 300);

  function onScroll(e) {
	  e = e || window.event; //ie
	  var te = e.target || e.srcElement; //ie
	var scrollTop = te.scrollTop; // Triggers reflow
	if (!lastRepaintY || Math.abs(scrollTop - lastRepaintY) > maxBuffer) {
	  var first = parseInt(scrollTop / itemHeight) - screenItemsLen;
	  self._renderChunk(self.container, first < 0 ? 0 : first);
	  lastRepaintY = scrollTop;
	}

	lastScrolled = Date.now();
	e.preventDefault && e.preventDefault();
  }

  if(this.container.attachEvent)
	  this.container.attachEvent('onscroll', onScroll);
  else
	  this.container.addEventListener('scroll', onScroll);
}

VirtualList.prototype.createRow = function(i) {
  var item;
  if (this.generatorFn)
	item = this.generatorFn(i,this.items);
  else if (this.items) {
	if (typeof this.items[i] === 'string') {
	  var itemText = document.createTextNode(this.items[i]);
	  item = document.createElement('div');
	  item.style.height = this.itemHeight + 'px';
	  item.appendChild(itemText);
	} else { //Object
	  item = document.createElement('div');
	  item.style.height = this.itemHeight + 'px';
	  item.classList.add('fila');
	  var left=0;
	  for( var j=0;j<this.columns.length;j++){//this.items[i]){
		var column=this.columns[j];
		  var celdaText = document.createTextNode(this.items[i][column.field]);
		  celda = document.createElement('div');
		celda.appendChild(celdaText);
		celda.style.left=left+"px";
		celda.style.right=(this.container.clientWidth -left-column.width)+"px";
		left+=column.width;
		celda.classList.add('celda');
		celda.classList.add('noselect');
		item.appendChild(celda);
	  }
	}
  }

  item.classname='vrow';
  item.style.position = 'absolute';
  item.style.top = (i * this.itemHeight) + 'px';
  return item;
};

/**
 * Renders a particular, consecutive chunk of the total rows in the list. To
 * keep acceleration while scrolling, we mark the nodes that are candidate for
 * deletion instead of deleting them right away, which would suddenly stop the
 * acceleration. We delete them once scrolling has finished.
 *
 * @param {Node} node Parent node where we want to append the children chunk.
 * @param {Number} from Starting position, i.e. first children index.
 * @return {void}
 */
VirtualList.prototype._renderChunk = function(node, from) {
  var finalItem = from + this.cachedItemsLen;
  if (finalItem > this.totalRows)
	finalItem = this.totalRows;

  // Append all the new rows in a document fragment that we will later append to
  // the parent node
  var fragment = document.createDocumentFragment();
  for (var i = from; i < finalItem; i++) {
	fragment.appendChild(this.createRow(i,this.items));
  }

  // Hide and mark obsolete nodes for deletion.
  for (var j = 1, l = node.childNodes.length; j < l; j++) {
	node.childNodes[j].style.display = 'none';
	node.childNodes[j].setAttribute('data-rm', '1');
  }
  node.appendChild(fragment);
};

VirtualList.createContainer = function(w, h) {
  var c = document.createElement('div');
  c.style.width = w;
  c.style.height = h;
  c.style.overflow = 'auto';
  c.style.position = 'relative';
  c.style.padding = 0;
  c.style.border = '1px solid black';
  return c;
};

VirtualList.createScroller = function(h) {
  var scroller = document.createElement('div');
  scroller.style.opacity = 0;
  scroller.style.position = 'absolute';
  scroller.style.top = 0;
  scroller.style.left = 0;
  scroller.style.width = '1px';
  scroller.style.height = h + 'px';
  return scroller;
};

items=[];
for(var i=0;i<100000;i++)
	items[items.length]={a:'a'+i, b:'b'+i, c:'c'+i}

var columns=[
{id : 'id1', field :'a', name : 'Attr1', width :50},
{id : 'id2', field :'c', name : 'Attr3', width :70},
{id : 'id3', field :'b', name : 'Attr2', width :70}
];

var list = new VirtualList({
		 w: 300,
		 h: 100,
		  itemHeight: 24,
		  //totalRows: 1000,
	  items: items,
	  columns: columns
		});
	
document.getElementById("container").appendChild(list.container);

	  
		var onClickFunct= function(e) {
		  e = e || window.event;
		  var te = e.target || e.srcElement;
	  if(te.classList.contains("celda"))
		  te=te.parentNode;
		  if(this.old)
			  this.old.classList.remove("green_bg");
		  this.old=te;	  
			if (te.tagName.toLowerCase() == "div") { 
				te.classList.add("green_bg");
			}
		};
		
		document.getElementById("container").onclick =onClickFunct;
		
		
// Find in page
find(string, matchcase, searchBackward)


/* Garbage collection */

window.registry = new FinalizationRegistry(message => console.log(message));
registry.register(x, 'path has been collected');


/* Memoization */
function memoize(fn) {
  const cache = {};
  return function(...args) {
	const key = args.toString();
	if (key in cache) return cache[key];
	else return (cache[key] = fn(...args));
  };
}

/* Tokens & similarity */

window.tokenize = input => {
	// Inspired by https://github.com/tatsuya/search-text-tokenizer
	// Valid tokens: single & double quotes, [field]:, [not-field]!, +, -, ?, #, @
	// If full alternative [field]! = NOT[field]; must to be included in switch
	input = input.trim();
	
	const blacklist = '\|¡!·@$%&/()[]{}=¿?+*-_;,.:<>'.split('');
	const pattern = /(\w+[:|!]|-|\+|\*|\#|\?|@)?("[^"]*"|'[^']*'|[^\s]+)/g;
	// reduced alternative: /(\w+:)?("[^"]*"|'[^']*'|[^\s]+)/gm;
	// full alternative: /(\w+[:|!]|-|\+|\*|\#|\?)?("[^"]*"|'[^']*'|[^\s]+)/g
	const results = [];
	let matched;
	
	while(matched = pattern.exec(input)) {
		const result = {};
		let prefix = matched[1];
		let term = matched[2];

		/*
		switch(prefix) {
			case '+':
				result.musthave = true;
				break;
			case '-':
				result.musthavenot = true;
				break;
			case '?':
				result.year = true;
				break
			case '#':
				result.agedays = true;
				break;
			case '@':
				result.ageyears = true;
				break;
			default:
		}
		*/
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

// BY https://lokesh-prajapati.medium.com/mastering-javascript-10-advanced-techniques-to-elevate-your-coding-skills-9b2d9953f15c

// Currying
const curry = (func) => (...args) =>
  args.length >= func.length ? func(...args) : curry(func.bind(null, ...args));

const add = (a, b, c) => a + b + c;
const curriedAdd = curry(add);

console.log(curriedAdd(1)(2)(3)); // 6

// Proxies

const handler = {
  get: (obj, prop) => prop in obj ? obj[prop] : `Property ${prop} not found.`,
};

const p = new Proxy({}, handler);
p.a = 1;

console.log(p.a, p.b); // 1, Property b not found.

// Generators

function* idGenerator() {
  let id = 1;
  while (true) {
	yield id++;
  }
}

const gen = idGenerator();
console.log(gen.next().value); // 1
console.log(gen.next().value); // 2


// Symbols 

const symbol1 = Symbol('identifier');
const symbol2 = Symbol('identifier');

console.log(symbol1 === symbol2); // false

const obj = {
  [symbol1]: 'value1',
  [symbol2]: 'value2',
};

console.log(obj[symbol1]); // value1
console.log(obj[symbol2]); // value2

// Reflect

const obj = { a: 1 };
Reflect.defineProperty(obj, 'b', { value: 2 });

console.log(obj.b); // 2

// WeakMap

let obj = {};
const weakmap = new WeakMap();
weakmap.set(obj, { key: 'value' });

console.log(weakmap.get(obj)); // { key: 'value' }
obj = null; // Now `obj` and its associated data can be garbage collected

// Currying

function curry(fn) {
  return function curried(...args) {
	if (args.length >= fn.length) {
	  return fn.apply(this, args);
	} else {
	  return function(...args2) {
		return curried.apply(this, args.concat(args2));
	  }
	}
  };
}

// This keyword

function show() {
  console.log(this.name);
}
const obj = { name: 'JavaScript', show: show };
obj.show(); // 'JavaScript'

// Proxy Objects
// Proxy objects are used to define custom behavior for fundamental operations (e.g., property lookup, assignment, enumeration, function invocation).

const handler = {
  get: function(obj, prop) {
	return prop in obj ? obj[prop] : 37;
  }
};
const p = new Proxy({}, handler);
p.a = 1;
p.b = undefined;
console.log(p.a, p.b); // 1, undefined
console.log('c' in p, p.c); // false, 37


// READ FILE

function readFile(file) {
  return new Promise((resolve, reject) => {
	let fr = new FileReader();
	fr.onload = x=> resolve(fr.result);
	fr.readAsText(file);
})}

async function read(input) {
  msg.innerText = await readFile(input.files[0]);
}
<input type="file" onchange="read(this)"/>
<h3>Content:</h3><pre id="msg"></pre>

// Destructure

const obj = {name: 'Maria', age: 28, phone: '98765xxxxx', gender: 'F'}
const {name, age, ...rest} = obj; //don't forget the ... operator

console.log(rest);
//{phone: '98765xxxxx', gender: 'F'}

const obj = {name: 'Maria', age: 28, phone: '98765xxxxx', gender: 'F'}

function print({name, ...rest}) {
  console.log(name);
}

print(obj);
//Maria

const obj = {name: 'Maria', age: 28, phone: '98765xxxxx', gender: 'F'}
const {name: firstName, ...rest} = obj;

console.log(firstName);
//Maria

const arr = ['Car', 'Bike', 'Truck'];
const obj = Object.assign({}, arr);

//{0:'Car', 1:'Bike', 2:'Bike'}

// Resumable intervals

// Constructor function for creating a ResumableInterval object
function ResumableInterval(callback, delay) {
  // Private variables to store the interval ID and pause state
  let intervalId;
  let paused = false;

  // Private function to start the interval
  const start = () => {
	// Check if the interval is not paused
	if (!paused) {
	  // Set the interval to execute the callback function with the specified delay
	  intervalId = setInterval(callback, delay);
	}
  };

  // Private function to pause the interval
  const pause = () => {
	// Clear the interval to stop further executions
	clearInterval(intervalId);
	// Update the pause state
	paused = true;
  };

  // Private function to resume the interval
  const resume = () => {
	// Check if the interval is paused
	if (paused) {
	  // Set the interval to resume execution with the specified delay
	  intervalId = setInterval(callback, delay);
	  // Update the pause state
	  paused = false;
	}
  };

  // Private function to stop the interval
  const stop = () => {
	// Clear the interval to stop further executions
	clearInterval(intervalId);
  };

  // Return an object with public methods
  return { start, pause, resume, stop };
}

// Create a new ResumableInterval instance with a callback and delay
const exampleInterval = new ResumableInterval(() => {
  console.log("Interval callback executed");
}, 1000);

// Start the interval immediately
exampleInterval.start();

// Pause the interval after 5 seconds
setTimeout(() => {
  exampleInterval.pause();
}, 5000);

// Resume the interval after 8 seconds
setTimeout(() => {
  exampleInterval.resume();
}, 8000);

// Stop the interval after 12 seconds
setTimeout(() => {
  exampleInterval.stop();
}, 12000);

