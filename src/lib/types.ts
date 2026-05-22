export interface BuildingData {
	key: string;
	zone: string;
	building: number;
	units: number[];
	maxFloor: number;
	count133: number;
	count87: number;
	count60: number;
}

export interface NumberInfo {
	'133': string;
	'87': string;
	'60': string;
}

export interface BuildingPosition {
	x: number;
	z: number;
	floors: number;
}

export interface ZoneRect {
	x: number;
	z: number;
	w: number;
	d: number;
}

export interface HouseData {
	total: number;
	buildings: BuildingData[];
	building133: Record<string, string[]>;
	building87: Record<string, string[]>;
	indexByNumber: Record<string, NumberInfo>;
	positions: Record<string, BuildingPosition>;
	[key: string]: unknown;
}

export interface PairedInfo {
	numbers: Set<string>;
	size133: boolean;
	size87: boolean;
}
