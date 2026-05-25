import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { DATA, ZONE_COLORS, HIGHLIGHT_COLOR, SECONDARY_COLOR } from '$lib/data/houseData';
import { buildingState, selectBuilding, clearSelection, selectSecondaryBuilding, searchByNumber, setFocusCallback } from '$lib/stores/buildingStore.svelte';
import type { BuildingData } from '$lib/types';

export class SceneManager {
	private scene!: THREE.Scene;
	private camera!: THREE.PerspectiveCamera;
	private renderer!: THREE.WebGLRenderer;
	private labelRenderer!: CSS2DRenderer;
	private controls!: OrbitControls;
	private container: HTMLElement;
	private animationId = 0;
	private clock = new THREE.Clock();

	private buildingMeshes = new Map<string, THREE.Group>();
	private buildingDataMap = new Map<string, BuildingData>();
	private raycaster = new THREE.Raycaster();
	private mouse = new THREE.Vector2();
	private tooltipEl: HTMLDivElement | null = null;
	private prevSelected: string | null = null;
	private prevSecondary: string | null = null;

	constructor(container: HTMLElement) {
		this.container = container;
		this.init();
	}

	private init() {
		const w = this.container.clientWidth;
		const h = this.container.clientHeight;

		// Scene
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color('#1a1a2e');
		this.scene.fog = new THREE.Fog('#1a1a2e', 40, 100);

		// Camera
		this.camera = new THREE.PerspectiveCamera(45, w / h, 1, 150);
		this.camera.position.set(0, 30, 25);

		// WebGL Renderer
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setSize(w, h);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		this.renderer.domElement.style.display = 'block';
		this.container.appendChild(this.renderer.domElement);

		// CSS2D Label Renderer
		this.labelRenderer = new CSS2DRenderer();
		this.labelRenderer.setSize(w, h);
		this.labelRenderer.domElement.style.position = 'fixed';
		this.labelRenderer.domElement.style.top = '0';
		this.labelRenderer.domElement.style.pointerEvents = 'none';
		this.labelRenderer.domElement.style.zIndex = '5';
		this.container.appendChild(this.labelRenderer.domElement);

		// Controls
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.08;
		this.controls.target.set(0, 0, 0);
		this.controls.minDistance = 8;
		this.controls.maxDistance = 60;
		this.controls.update();

		// Lights
		const ambient = new THREE.AmbientLight('#ffffff', 1.2);
		this.scene.add(ambient);

		const sun = new THREE.DirectionalLight('#ffffff', 3);
		sun.position.set(20, 30, 10);
		sun.castShadow = true;
		sun.shadow.mapSize.set(2048, 2048);
		sun.shadow.camera.near = 0.5;
		sun.shadow.camera.far = 120;
		sun.shadow.camera.left = -40;
		sun.shadow.camera.right = 40;
		sun.shadow.camera.top = 40;
		sun.shadow.camera.bottom = -40;
		this.scene.add(sun);

		const fill = new THREE.DirectionalLight('#8899cc', 0.8);
		fill.position.set(-10, 10, -5);
		this.scene.add(fill);

		// Ground
		const groundSize = 60;
		const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize);
		const groundMat = new THREE.MeshStandardMaterial({ color: '#2a3a2a', roughness: 0.9 });
		const ground = new THREE.Mesh(groundGeo, groundMat);
		ground.rotation.x = -Math.PI / 2;
		ground.receiveShadow = true;
		this.scene.add(ground);

		// Grid
		const gridHelper = new THREE.PolarGridHelper(groundSize / 2, 40, 30, 64, '#444444', '#333333');
		gridHelper.position.y = 0.01;
		this.scene.add(gridHelper);

		// Create buildings
		this.createBuildings();

		// Tooltip
		this.tooltipEl = document.getElementById('tooltip') as HTMLDivElement;
		if (!this.tooltipEl) {
			this.tooltipEl = document.createElement('div');
			this.tooltipEl.id = 'tooltip';
			this.tooltipEl.style.cssText =
				'position:fixed;pointer-events:none;z-index:20;background:rgba(0,0,0,.85);color:#fff;' +
				'font-size:12px;padding:6px 10px;border-radius:6px;opacity:0;transition:opacity .15s;white-space:nowrap;';
			document.body.appendChild(this.tooltipEl);
		}

		// Events
		this.renderer.domElement.addEventListener('click', this.onClick);
		this.renderer.domElement.addEventListener('mousemove', this.onMouseMove);
		window.addEventListener('resize', this.onResize);
		window.addEventListener('keydown', this.onKeyDown);

		// Register focus callback
		setFocusCallback(this.focusOnBuilding.bind(this));

		// Start animation
		this.animate();
	}

	private createBuildings() {
		for (const building of DATA.buildings) {
			this.createBuildingMesh(building);
		}
	}

	private createBuildingMesh(building: BuildingData) {
		const key = building.key;
		const pos = DATA.positions[key] || { x: 0, z: 0, floors: 14 };
		const zone = building.zone;
		const color = ZONE_COLORS[zone] || '#888888';
		const floors = pos.floors || building.maxFloor || 14;
		const height = Math.max(floors * 0.22, 0.5);
		const w = building.units.length > 1 ? 2.0 : 1.2;
		const d = 0.9;

		const group = new THREE.Group();
		group.position.set(pos.x, height / 2, pos.z);
		group.userData = {
			buildingKey: key,
			zone,
			building: building.building,
			floors,
			count133: building.count133,
			count87: building.count87,
			count60: building.count60,
			baseY: height / 2
		};

		// Body
		const bodyGeo = new THREE.BoxGeometry(w, height, d);
		const bodyMat = new THREE.MeshStandardMaterial({
			color: new THREE.Color(color),
			roughness: 0.35,
			metalness: 0.1
		});
		const body = new THREE.Mesh(bodyGeo, bodyMat);
		body.position.y = 0;
		body.castShadow = true;
		body.receiveShadow = true;
		body.name = 'body';
		group.add(body);

		// Top trim
		const topGeo = new THREE.BoxGeometry(w + 0.15, 0.15, d + 0.15);
		const topMat = new THREE.MeshStandardMaterial({
			color: new THREE.Color(color).multiplyScalar(0.7),
			roughness: 0.3,
			metalness: 0.3
		});
		const top = new THREE.Mesh(topGeo, topMat);
		top.position.y = height / 2 + 0.07;
		top.castShadow = true;
		top.name = 'top';
		group.add(top);

		// Label
		const labelDiv = document.createElement('div');
		labelDiv.textContent = key.replace(/^(A区|B区|C区|南区|北区)/, '');
		labelDiv.style.cssText =
			'color:#fff;font-size:11px;font-weight:600;background:rgba(0,0,0,.7);' +
			'padding:2px 6px;border-radius:4px;pointer-events:none;';
		const label = new CSS2DObject(labelDiv);
		label.position.y = height + 0.8;
		label.name = 'label';
		group.add(label);

		this.scene.add(group);
		this.buildingMeshes.set(key, group);
		this.buildingDataMap.set(key, building);
	}

	resetHighlights() {
		for (const [, group] of this.buildingMeshes) {
			const body = group.getObjectByName('body') as THREE.Mesh;
			if (body?.material) {
				const mat = body.material as THREE.MeshStandardMaterial;
				if (mat.emissive) {
					mat.emissive.setHex(0x000000);
					mat.emissiveIntensity = 0;
				}
			}
			const top = group.getObjectByName('top') as THREE.Mesh;
			if (top?.material) {
				const mat = top.material as THREE.MeshStandardMaterial;
				if (mat.emissive) {
					mat.emissive.setHex(0x000000);
					mat.emissiveIntensity = 0;
				}
			}
		}
	}

	highlightBuilding(key: string, color: string, intensity = 0.6) {
		const group = this.buildingMeshes.get(key);
		if (!group) return;
		const body = group.getObjectByName('body') as THREE.Mesh;
		if (body) {
			const mat = body.material as THREE.MeshStandardMaterial;
			mat.emissive = new THREE.Color(color);
			mat.emissiveIntensity = intensity;
		}
		const top = group.getObjectByName('top') as THREE.Mesh;
		if (top) {
			const mat = top.material as THREE.MeshStandardMaterial;
			mat.emissive = new THREE.Color(color);
			mat.emissiveIntensity = intensity;
		}
	}

	focusOnBuilding(key: string) {
		const group = this.buildingMeshes.get(key);
		if (!group) return;
		this.controls.target.copy(group.position);
		this.camera.position.set(
			group.position.x + 8,
			group.position.y + 10,
			group.position.z + 8
		);
		this.controls.update();
	}

	private getBuildingFromIntersect(intersects: THREE.Intersection[]): THREE.Object3D | null {
		for (const intersect of intersects) {
			let obj: THREE.Object3D | null = intersect.object;
			while (obj) {
				if (obj.userData?.buildingKey) return obj;
				obj = obj.parent;
			}
		}
		return null;
	}

	private onClick = (e: MouseEvent) => {
		if (
			(e.target as HTMLElement).closest('#toolbar') ||
			(e.target as HTMLElement).closest('#info-panel') ||
			(e.target as HTMLElement).closest('#tooltip')
		) return;

		this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
		this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

		this.raycaster.setFromCamera(this.mouse, this.camera);
		const meshes: THREE.Object3D[] = [];
		this.buildingMeshes.forEach((g) => meshes.push(g));
		const intersects = this.raycaster.intersectObjects(meshes, true);

		if (intersects.length === 0) {
			clearSelection();
			return;
		}

		const obj = this.getBuildingFromIntersect(intersects);
		if (!obj) {
			clearSelection();
			return;
		}

		const key = obj.userData.buildingKey;

		// If already selected and this is a paired building → cross-filter
		if (buildingState.selectedBuilding && buildingState.pairedBuildings.includes(key)) {
			if (buildingState.secondaryBuilding === key) {
				// Un-cross-filter
				selectBuilding(buildingState.selectedBuilding);
			} else {
				selectSecondaryBuilding(key);
			}
		} else if (buildingState.selectedBuilding === key) {
			clearSelection();
		} else {
			selectBuilding(key);
		}
	};

	private onMouseMove = (e: MouseEvent) => {
		this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
		this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

		this.raycaster.setFromCamera(this.mouse, this.camera);
		const meshes: THREE.Object3D[] = [];
		this.buildingMeshes.forEach((g) => meshes.push(g));
		const intersects = this.raycaster.intersectObjects(meshes, true);
		const obj = this.getBuildingFromIntersect(intersects);

		if (obj && this.tooltipEl) {
			const key = obj.userData.buildingKey;
			const bld = this.buildingDataMap.get(key);
			if (bld) {
				const sizes: string[] = [];
				if (bld.count133) sizes.push(`133㎡×${bld.count133}`);
				if (bld.count87) sizes.push(`87㎡×${bld.count87}`);
				if (bld.count60) sizes.push(`60㎡×${bld.count60}`);
				this.tooltipEl.textContent = `${key} | ${bld.maxFloor || '?'}层 | ${sizes.join(', ')}`;
				this.tooltipEl.style.opacity = '1';
				this.tooltipEl.style.left = `${e.clientX + 15}px`;
				this.tooltipEl.style.top = `${e.clientY - 30}px`;
			}
		} else if (this.tooltipEl) {
			this.tooltipEl.style.opacity = '0';
		}
	};

	private onResize = () => {
		const w = this.container.clientWidth;
		const h = this.container.clientHeight;
		this.camera.aspect = w / h;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(w, h);
		this.labelRenderer.setSize(w, h);
	};

	private onKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			clearSelection();
		}
		if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
			this.controls.target.set(0, 0, 0);
			this.camera.position.set(0, 30, 25);
			this.controls.update();
		}
	};

	private animate = () => {
		this.animationId = requestAnimationFrame(this.animate);
		const time = this.clock.getElapsedTime();

		// Track selection changes and update highlights
		const sel = buildingState.selectedBuilding;
		const sec = buildingState.secondaryBuilding;
		if (sel !== this.prevSelected || sec !== this.prevSecondary) {
			this.resetHighlights();
			this.prevSelected = sel;
			this.prevSecondary = sec;
			if (sel) {
				this.highlightBuilding(sel, HIGHLIGHT_COLOR, 0.7);
				if (sec) {
					this.highlightBuilding(sec, SECONDARY_COLOR, 0.7);
				}
				for (const pk of buildingState.pairedBuildings) {
					if (pk === sec) continue;
					const bld = this.buildingDataMap.get(pk);
					const zoneColor = bld ? (ZONE_COLORS[bld.zone] || '#ffffff') : '#ffffff';
					this.highlightBuilding(pk, zoneColor, sec ? 0.2 : 0.4);
				}
			}
		}

		// Pulse animation
		const pulseKeys = buildingState.pulseKeys;
		for (const key of pulseKeys) {
			const group = this.buildingMeshes.get(key);
			if (!group) continue;
			const body = group.getObjectByName('body') as THREE.Mesh;
			if (body) {
				const mat = body.material as THREE.MeshStandardMaterial;
				mat.emissiveIntensity = 0.1 + (Math.sin(time * 5) + 1) * 0.45;
			}
			const top = group.getObjectByName('top') as THREE.Mesh;
			if (top) {
				const mat = top.material as THREE.MeshStandardMaterial;
				mat.emissiveIntensity = 0.2 + (Math.sin(time * 5) + 1) * 0.4;
			}
		}

		this.controls.update();
		this.renderer.render(this.scene, this.camera);
		this.labelRenderer.render(this.scene, this.camera);
	};

	dispose() {
		cancelAnimationFrame(this.animationId);
		this.renderer.domElement.removeEventListener('click', this.onClick);
		this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
		window.removeEventListener('resize', this.onResize);
		window.removeEventListener('keydown', this.onKeyDown);
		this.renderer.dispose();
		this.labelRenderer.domElement.remove();
		if (this.tooltipEl) this.tooltipEl.remove();
	}
}
