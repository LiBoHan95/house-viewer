import { DATA } from '$lib/data/houseData';
import type { PairedInfo } from '$lib/types';

// Reactive state
let _selectedBuilding = $state<string | null>(null);
let _secondaryBuilding = $state<string | null>(null);
let _pairedBuildings = $state<string[]>([]);
let _pulseKeys = $state<string[]>([]);
let _matchCount = $state(0);
let _infoPanelVisible = $state(false);
let _infoPanelMode = $state<'paired' | 'cross' | null>(null);
let _infoTitle = $state('');

// Public read-only access
export const buildingState = {
	get selectedBuilding() {
		return _selectedBuilding;
	},
	get secondaryBuilding() {
		return _secondaryBuilding;
	},
	get pairedBuildings() {
		return _pairedBuildings;
	},
	get pulseKeys() {
		return _pulseKeys;
	},
	get matchCount() {
		return _matchCount;
	},
	get infoPanelVisible() {
		return _infoPanelVisible;
	},
	get infoPanelMode() {
		return _infoPanelMode;
	},
	get infoTitle() {
		return _infoTitle;
	}
};

// Callback for Three.js camera focus
let focusCallback: ((key: string) => void) | null = null;

export function setFocusCallback(fn: (key: string) => void) {
	focusCallback = fn;
}

// Business logic
function findPairedBuildings(buildingKey: string): Map<string, PairedInfo> {
	const nums133 = DATA.building133[buildingKey] || [];
	const nums87 = DATA.building87[buildingKey] || [];
	const paired = new Map<string, PairedInfo>();

	if (nums133.length > 0) {
		for (const num of nums133) {
			const info = DATA.indexByNumber[num];
			if (!info) continue;
			for (const addr of [info['87'], info['60']]) {
				const m = addr.match(/^(.+?\d+)-\d+-\d+$/);
				if (m) {
					const dstKey = m[1];
					if (dstKey !== buildingKey) {
						if (!paired.has(dstKey)) {
							paired.set(dstKey, { numbers: new Set(), size133: false, size87: true });
						}
						paired.get(dstKey)!.numbers.add(num);
					}
				}
			}
		}
	} else if (nums87.length > 0) {
		for (const num of nums87) {
			const info = DATA.indexByNumber[num];
			if (!info) continue;
			const m = info['133'].match(/^(.+?\d+)-\d+-\d+$/);
			if (m) {
				const dstKey = m[1];
				if (!paired.has(dstKey)) {
					paired.set(dstKey, { numbers: new Set(), size133: true, size87: false });
				}
				paired.get(dstKey)!.numbers.add(num);
			}
		}
	}
	return paired;
}

export function selectBuilding(key: string) {
	_selectedBuilding = key;
	_secondaryBuilding = null;

	const paired = findPairedBuildings(key);
	_pairedBuildings = Array.from(paired.keys());
	_pulseKeys = [..._pairedBuildings];

	// Count total unique numbers
	const totalNums = new Set<string>();
	for (const [, info] of paired) {
		for (const n of info.numbers) totalNums.add(n);
	}
	_matchCount = totalNums.size;
	_infoPanelMode = null;
	_infoPanelVisible = false;

}

export function focusBuilding(key: string) {
	if (focusCallback) focusCallback(key);
}

export function selectSecondaryBuilding(key: string) {
	_secondaryBuilding = key;
	_pulseKeys = [];

	// Cross-filter numbers
	const nums133 = DATA.building133[_selectedBuilding!] || [];
	const nums87 = DATA.building87[_selectedBuilding!] || [];
	const nums: string[] = [];

	if (nums133.length > 0) {
		for (const num of nums133) {
			const info = DATA.indexByNumber[num];
			if (!info) continue;
			if (
				(info['87'] && info['87'].startsWith(key)) ||
				(info['60'] && info['60'].startsWith(key))
			) {
				nums.push(num);
			}
		}
	} else if (nums87.length > 0) {
		for (const num of nums87) {
			const info = DATA.indexByNumber[num];
			if (!info) continue;
			if (info['133'] && info['133'].startsWith(key)) {
				nums.push(num);
			}
		}
	}

	_matchCount = nums.length;
	_infoPanelMode = 'cross';
	_infoPanelVisible = false;

	return nums;
}

export function clearSelection() {
	_selectedBuilding = null;
	_secondaryBuilding = null;
	_pairedBuildings = [];
	_pulseKeys = [];
	_matchCount = 0;
	_infoPanelVisible = false;
	_infoPanelMode = null;
}

export function showResults() {
	_infoPanelVisible = true;
}

export function hideResults() {
	_infoPanelVisible = false;
}

export function getCrossReferenceNumbers(srcKey: string, secKey: string): string[] {
	const nums133 = DATA.building133[srcKey] || [];
	const nums87 = DATA.building87[srcKey] || [];
	const result: string[] = [];

	if (nums133.length > 0) {
		for (const num of nums133) {
			const info = DATA.indexByNumber[num];
			if (!info) continue;
			if (
				(info['87'] && info['87'].startsWith(secKey)) ||
				(info['60'] && info['60'].startsWith(secKey))
			) {
				result.push(num);
			}
		}
	} else if (nums87.length > 0) {
		for (const num of nums87) {
			const info = DATA.indexByNumber[num];
			if (!info) continue;
			if (info['133'] && info['133'].startsWith(secKey)) {
				result.push(num);
			}
		}
	}
	return result;
}

export function searchByNumber(numStr: string): string | null {
	const num = parseInt(numStr);
	if (isNaN(num) || !DATA.indexByNumber[num]) return null;

	const info = DATA.indexByNumber[num];
	const addr133 = info['133'];
	const m = addr133.match(/^(.+?\d+)-\d+-\d+$/);
	if (!m) return null;

	return m[1];
}
