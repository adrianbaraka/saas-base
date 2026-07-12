let mobileOpen = $state(false);

export function toggleSidebar() {
	mobileOpen = !mobileOpen;
}

export function openSidebar() {
	mobileOpen = true;
}

export function closeSidebar() {
	mobileOpen = false;
}

export function isSidebarOpen() {
	return mobileOpen;
}
