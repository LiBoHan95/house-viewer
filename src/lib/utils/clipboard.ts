export function copyText(text: string): Promise<void> {
	if (navigator.clipboard?.writeText) {
		return navigator.clipboard.writeText(text);
	}
	// Fallback for HTTP / non-secure context
	const ta = document.createElement('textarea');
	ta.value = text;
	ta.style.position = 'fixed';
	ta.style.left = '-9999px';
	ta.style.top = '-9999px';
	document.body.appendChild(ta);
	ta.focus();
	ta.select();
	try {
		document.execCommand('copy');
		return Promise.resolve();
	} catch (e) {
		return Promise.reject(e);
	} finally {
		document.body.removeChild(ta);
	}
}
