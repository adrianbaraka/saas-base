// place files you want to import through the `$lib` alias in this folder.

import { authClient } from './auth-client';
export type BetterAuthUser = typeof authClient.$Infer.Session.user;
export type UserSessionFull = typeof authClient.$Infer.Session.session;

// export type UserSession = {
// 	id: string;
// 	expiresAt: Date;
// 	createdAt: Date;
// 	updatedAt: Date;
// 	userId: string;
// 	impersonatedBy?: string | null | undefined;
// 	ipAddress?: string | null | undefined;
// 	userAgent?: string | null | undefined;
// };
export type BetterAuthSession = {
	session: UserSessionFull;
	user: BetterAuthUser;
};

export interface UserSessionResponseFull {
	sessions: UserSessionFull[];
}

// export interface UserSessionResponse {
// 	sessions: UserSession[];
// }

export interface AuthError {
	code?: string | undefined | undefined;
	message?: string | undefined | undefined;
	status: number;
	statusText: string;
}

export interface Role {
	name: string;
	description: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IconComponent = new (...args: any[]) => any;

export type ToastType = 'error' | 'warning' | 'success';
