let _message = $state('');
let _visible = $state(false);
let timer: ReturnType<typeof setTimeout> | null = null;

export const toast = {
	get message() {
		return _message;
	},
	get visible() {
		return _visible;
	},
	show(msg: string) {
		_message = msg;
		_visible = true;
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => {
			_visible = false;
		}, 1500);
	}
};
