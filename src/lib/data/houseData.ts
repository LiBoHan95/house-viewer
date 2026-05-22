import type { HouseData, BuildingData } from '$lib/types';

declare global {
	interface Window {
		HOUSE_DATA: HouseData;
	}
}

const EMPTY_DATA: HouseData = {
	total: 0,
	buildings: [],
	building133: {},
	building87: {},
	indexByNumber: {},
	positions: {}
} as HouseData;

let _data: HouseData | null = null;

function getRawData(): HouseData {
	if (_data) return _data;
	if (typeof window === 'undefined') return EMPTY_DATA;
	_data = window.HOUSE_DATA;
	return _data;
}

/** Proxy that lazily accesses window.HOUSE_DATA only when first needed (browser-side) */
export const DATA: HouseData = new Proxy<HouseData>(EMPTY_DATA, {
	get(_target, prop: string | symbol) {
		return getRawData()[prop as keyof HouseData];
	}
});

export function getBuildingByKey(key: string): BuildingData | undefined {
	return getRawData().buildings.find((b: BuildingData) => b.key === key);
}

export const ZONE_COLORS: Record<string, string> = {
	A区: '#4A90D9',
	B区: '#5C9E5A',
	C区: '#E8833A',
	南区: '#D94A4A',
	北区: '#8E6BBF'
};

export const HIGHLIGHT_COLOR = '#f0c040';
export const SECONDARY_COLOR = '#4ecdc4';
