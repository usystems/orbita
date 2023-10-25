let selectedDay = null;
let averagePeriodLength = 5;
let averageOvulationDay = 14;
let averageCycleLength = 28;

function getCycles() {
	return JSON.parse(localStorage.getItem('cycles') ? localStorage.getItem('cycles') : '[]');
}

function setCycles(cycles) {
	localStorage.setItem('cycles', JSON.stringify(cycles));
}

function sanetizeDate(day, month, year) {
	const date = new Date(year, month, day);
	return (date.getFullYear() * 100 + date.getMonth()) * 100 + date.getDate();
}

function saveAndRerender(cycles, year, month) {
	setCycles(cycles);
	selectedDay = null;
	const buttons = document.getElementById('buttons');
	buttons.innerHTML = '';
	renderMonth(year, month);
}

function setPeriodBegin(day, month, year, index) {
	let cycles = getCycles();
	if (index === -1) {
		cycles.push({
			begin: sanetizeDate(day, month, year),
			end: sanetizeDate(day + averagePeriodLength, month, year),
			ovolution: sanetizeDate(day + averageOvulationDay, month, year)
		});
		cycles.sort((a, b) => a.begin - b.begin);
	} else {
		cycles[index].begin = sanetizeDate(day, month, year);
	}
	saveAndRerender(cycles, year, month);
}

function setPeriodEnd(day, month, year, index) {
	let cycles = getCycles();
	cycles[index].end = sanetizeDate(day, month, year);
	saveAndRerender(cycles, year, month);
}

function setOvulation(day, month, year, index) {
	let cycles = getCycles();
	cycles[index].ovolution = sanetizeDate(day, month, year);
	saveAndRerender(cycles, year, month);
}

function selectDay(day, month, year) {
	selectedDay = day;


	let showPeriodBegin= false;
	let showPeriodEnd= false;
	let showOvolution= false;

	const cycles = getCycles();
	const date = sanetizeDate(day, month, year);

	// is the date between begin and end
	if (cycles.some(cycle => cycle.begin < date && cycle.end > date)) {
		showPeriodBegin = true;
		showPeriodEnd = true;

	// is the date between end and ovolution
	} else if (cycles.some(cycle => cycle.begin < date && cycle.ovolution > date)) {
		showPeriodEnd = true;
		showOvolution = true;

	// is the date between ovolution and begin
	} else if (cycles.some((cycle, index) => cycle.ovolution < date && index + 1 < cycles.length && cycles[index + 1].begin > date)) {
		showOvolution = true;
		showPeriodBegin = true;

	// if the date is outside of the cycles
	} else if (cycles.length === 0 || date < cycles[0].begin || cycles[cycles.length - 1].ovolution < date) {
		showPeriodBegin = true;
	}

	const buttons = document.getElementById('buttons');
	buttons.innerHTML = '';
	if (showPeriodBegin) {
		const activeIndex = cycles.findIndex((cycle, index) => (index === 0 ? cycle.begin : cycles[index - 1].ovolution) <= date && cycle.end >= date);
		buttons.innerHTML = `<div class="button-container__button">
			<button onclick="setPeriodBegin(${day}, ${month}, ${year}, ${activeIndex})">Periode beginnt</button>
		</div>`;
	}
	if (showPeriodEnd) {
		const activeIndex = cycles.findIndex((cycle, index) => cycle.begin <= date && cycle.ovolution >= date);
		buttons.innerHTML += `<div class="button-container__button">
			<button onclick="setPeriodEnd(${day}, ${month}, ${year}, ${activeIndex})">Periode endet</button>
		</div>`;
	}
	if (showOvolution) {
		const activeIndex = cycles.findIndex((cycle, index) => cycle.end <= date && (index + 1 === cycles.length ? cycle.ovolution : cycles[index + 1].begin) >= date);
		buttons.innerHTML += `<div class="button-container__button">
			<button onclick="setOvulation(${day}, ${month}, ${year}, ${activeIndex})">Eisprung</button>
		</div>`;
	}

	renderMonth(year, month);
}

function lastMonth(year, month) {
	selectedDay = null;
	renderMonth(year, month - 1);
}

function nextMonth(year, month) {
	selectedDay = null;
	renderMonth(year, month + 1);
}

function getDayClasses(cyclesVisible, day, month, year) {
	let dayClasses = 'calendar-table__col';
	const today = new Date();
	if (cyclesVisible.some(cycle => sanetizeDate(today.getDate(), today.getMonth(), today.getFullYear()) === sanetizeDate(day, month, year))) {
		dayClasses += ' calendar-table__event calendar-table__event--today';
	}

	if (cyclesVisible.some(cycle => cycle.ovolution === sanetizeDate(day, month, year))) {
		dayClasses += ' calendar-table__event calendar-table__event--yellow';
	}

	if (cyclesVisible.some(cycle => cycle.ovolution === sanetizeDate(day + 5, month, year))) {
		dayClasses += ' calendar-table__event calendar-table__event--lightyellow calendar-table__event--long calendar-table__event--start';
	} else if (cyclesVisible.some(cycle => cycle.ovolution === sanetizeDate(day - 2, month, year))) {
		dayClasses += ' calendar-table__event calendar-table__event--lightyellow calendar-table__event--long calendar-table__event--end';
	} else if (cyclesVisible.some(cycle => cycle.ovolution < sanetizeDate(day + 5, month, year) && cycle.ovolution > sanetizeDate(day - 2, month, year))) {
		dayClasses += ' calendar-table__event calendar-table__event--lightyellow calendar-table__event--long';
	}

	if (cyclesVisible.some(cycle => cycle.begin === sanetizeDate(day, month, year))) {
		dayClasses += ' calendar-table__event calendar-table__event--red calendar-table__event--long calendar-table__event--start';
	} else if (cyclesVisible.some(cycle => cycle.end === sanetizeDate(day, month, year))) {
		dayClasses += ' calendar-table__event calendar-table__event--red calendar-table__event--long calendar-table__event--end';
	} else if (cyclesVisible.some(cycle => cycle.begin < sanetizeDate(day, month, year) && cycle.end > sanetizeDate(day, month, year))) {
		dayClasses += ' calendar-table__event calendar-table__event--red calendar-table__event--long';
	}
	return dayClasses;
}

function renderMonth(year, month) {
	const monthName = new Date(year, month).toLocaleString('de-DE', { month: 'long' });
	const monthDays = new Date(year, month + 1, 0).getDate();
	const monthStart = new Date(year, month, 1).getDay();
	const monthEnd = new Date(year, month, monthDays).getDay();

	const calendar = document.getElementById('calendar');
	calendar.innerHTML = '';

	const header = document.createElement('div');
	header.classList.add('calendar-container__header');
	header.innerHTML = `
		<button class="calendar-container__btn calendar-container__btn--left" title="Zurück" onclick="lastMonth(${year}, ${month})">
			<i class="icon ion-ios-arrow-back"></i>
		</button>
		<h2 class="calendar-container__title">${monthName} ${year}</h2>
		<button class="calendar-container__btn calendar-container__btn--right" title="Nächster" onclick="nextMonth(${year}, ${month})">
			<i class="icon ion-ios-arrow-forward"></i>
		</button>
	`;

	calendar.appendChild(header);

	const body = document.createElement('div');
	body.classList.add('calendar-container__body');
	calendar.appendChild(body);

	const rangeBegin = sanetizeDate(1 - monthStart, month, year);
	const rangeEnd = sanetizeDate(6 - monthEnd, month + 1, year);
	const cyclesVisible = getCycles().filter(cycle => cycle.ovolution >= rangeBegin && cycle.begin <= rangeEnd);

	let bodyHTML = '<div class="calendar-table"><div class="calendar-table__header"><div class="calendar-table__row">';

	// add the days of the week
	bodyHTML += ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
		.map(name => `<div class="calendar-table__col">${name}</div>`).join('');

	bodyHTML += '</div></div><div class="calendar-table__body"><div class="calendar-table__row">';

	for (let i = -monthStart; i < 0; i++) {
		const prevDay = new Date(year, month, i + 1).getDate();
		bodyHTML += `<div class="${getDayClasses(cyclesVisible, prevDay, month - 1, year)} calendar-table__inactive"><div class="calendar-table__item">${prevDay}</div></div>`;
	}

	for (let i = 1, day = 1; i <= monthDays; i++, day++) {
		if ((i + monthStart - 1) % 7 === 0) {
			bodyHTML += '</div><div class="calendar-table__row">';
		}
		if (day === selectedDay) {
			bodyHTML += `<div class="calendar-table__selected ${getDayClasses(cyclesVisible, day, month, year)}"><div class="calendar-table__item"><div class="calendar-table__circle">${day}</div></div></div>`;
		} else {
			bodyHTML += `<div class="${getDayClasses(cyclesVisible, day, month, year)}" onclick="selectDay(${day}, ${month}, ${year})"><div class="calendar-table__item"><div class="calendar-table__circle">${day}</div></div></div>`;
		}
	}

	for (let day = 1; day <= 6 - monthEnd; day++) {
		bodyHTML += `<div class="${getDayClasses(cyclesVisible, day, month + 1, year)} calendar-table__inactive"><div class="calendar-table__item">${day}</div></div>`;
	}

	bodyHTML += '</div></div></div>';
	body.innerHTML = bodyHTML;
}

function removeDisplayNone(className) {
	for (let i = 0; i < document.styleSheets.length; i++) {
		if (document.styleSheets[i].href.endsWith("app.css")) {
			for (let j = 0; j < document.styleSheets[i].cssRules.length; j++) {
				if (document.styleSheets[i].cssRules[j].selectorText === `.${className}`) {
					document.styleSheets[i].cssRules[j].style.removeProperty('display');
					break;
				}
			}
			break;
		}
	}
}

function onAppInstalled() {
	location.reload(true);
}

function onBeforeInstallPrompt(event) {
	event.preventDefault();
	removeDisplayNone('app-install-button');

	const elements = document.getElementsByClassName("app-install-button");
	for (let i = 0; i < elements.length; i++) {
		const newElement = elements[i].cloneNode(true);
		newElement.addEventListener('click', () => event.prompt());
		elements[i].replaceWith(newElement);
	}
}

function onDOMContentLoaded() {
	const className = window.matchMedia("(display-mode: standalone)").matches ? 'app-main' : 'page-main';
	removeDisplayNone(className);

	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.register('service-worker.js')
	}

	let currentDate = new Date();
	renderMonth(currentDate.getFullYear(), currentDate.getMonth());
}

window.addEventListener('appinstalled', onAppInstalled);
document.addEventListener('DOMContentLoaded', onDOMContentLoaded);
window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);